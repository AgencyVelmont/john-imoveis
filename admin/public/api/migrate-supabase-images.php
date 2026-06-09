<?php

require_once __DIR__ . '/_imovel-image-utils.php';

const MIGRATION_BATCH_SIZE = 500;
const SUPABASE_STORAGE_BUCKET = 'property-images';

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(405, ['ok' => false, 'message' => 'Method not allowed']);
}

require_migration_token();

$dryRun = read_bool_param('dry_run', true);
$limit = max(1, min(2000, (int) ($_GET['limit'] ?? $_POST['limit'] ?? MIGRATION_BATCH_SIZE)));
$offset = max(0, (int) ($_GET['offset'] ?? $_POST['offset'] ?? 0));
$supabaseUrl = rtrim(required_env('SUPABASE_URL'), '/');
$supabaseKey = required_env('SERVICE_ROLE_KEY');
$publicBaseUrl = public_base_url();
$startedAt = date(DATE_ATOM);

$rows = fetch_property_images($supabaseUrl, $supabaseKey, $limit, $offset);
$log = [];
$summary = [
  'found' => count($rows),
  'candidates' => 0,
  'skippedAlreadyMigrated' => 0,
  'skippedNotSupabaseStorage' => 0,
  'downloaded' => 0,
  'written' => 0,
  'updated' => 0,
  'failed' => 0,
];

foreach ($rows as $row) {
  $entry = build_log_entry($row, $supabaseUrl, $publicBaseUrl);

  if ($entry['alreadyMigrated']) {
    $entry['status'] = 'skipped';
    $entry['reason'] = 'already_migrated';
    $summary['skippedAlreadyMigrated']++;
    $log[] = $entry;
    continue;
  }

  if (!$entry['isSupabaseStorage']) {
    $entry['status'] = 'skipped';
    $entry['reason'] = 'not_supabase_storage';
    $summary['skippedNotSupabaseStorage']++;
    $log[] = $entry;
    continue;
  }

  $summary['candidates']++;

  if ($dryRun) {
    $entry['status'] = 'dry_run';
    $entry['downloadStatus'] = 'not_run';
    $entry['writeStatus'] = 'not_run';
    $entry['databaseUpdateStatus'] = 'not_run';
    $log[] = $entry;
    continue;
  }

  try {
    $downloaded = download_image($entry['oldUrl']);
    $entry['downloadStatus'] = 'ok';
    $entry['downloadBytes'] = strlen($downloaded['body']);
    $summary['downloaded']++;

    if (!accepted_download_mime($downloaded['mime'])) {
      throw new RuntimeException('MIME type baixado não permitido: ' . ($downloaded['mime'] ?: 'desconhecido'));
    }

    $absolutePath = absolute_upload_path($entry['newPath']);
    if (file_put_contents($absolutePath, $downloaded['body'], LOCK_EX) === false) {
      throw new RuntimeException('Não foi possível gravar o arquivo');
    }
    chmod($absolutePath, 0644);

    $entry['writeStatus'] = 'ok';
    $summary['written']++;

    update_property_image($supabaseUrl, $supabaseKey, $entry['id'], [
      'url' => $entry['newUrl'],
      'storage_path' => $entry['newPath'],
    ]);

    $entry['databaseUpdateStatus'] = 'ok';
    $entry['status'] = 'migrated';
    $entry['publicUrlStatus'] = check_public_url($entry['newUrl']);
    $summary['updated']++;
  } catch (Throwable $error) {
    $entry['status'] = 'failed';
    $entry['error'] = $error->getMessage();
    $entry['downloadStatus'] = $entry['downloadStatus'] ?? 'failed';
    $entry['writeStatus'] = $entry['writeStatus'] ?? 'not_run';
    $entry['databaseUpdateStatus'] = $entry['databaseUpdateStatus'] ?? 'not_run';
    $summary['failed']++;
  }

  $log[] = $entry;
}

json_response(200, [
  'ok' => true,
  'dryRun' => $dryRun,
  'startedAt' => $startedAt,
  'finishedAt' => date(DATE_ATOM),
  'limit' => $limit,
  'offset' => $offset,
  'nextOffset' => count($rows) === $limit ? $offset + $limit : null,
  'summary' => $summary,
  'log' => $log,
]);

function require_migration_token(): void {
  $expected = trim((string) getenv('MIGRATE_IMAGES_TOKEN'));
  $provided = trim((string) ($_GET['token'] ?? $_POST['token'] ?? ''));

  if ($provided === '') {
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
      $provided = trim($matches[1]);
    }
  }

  if ($expected === '' || !hash_equals($expected, $provided)) {
    json_response(401, ['ok' => false, 'message' => 'Unauthorized']);
  }
}

function required_env(string $name): string {
  $value = trim((string) getenv($name));

  if ($value === '') {
    json_response(500, ['ok' => false, 'message' => $name . ' is not configured']);
  }

  return $value;
}

function read_bool_param(string $name, bool $default): bool {
  $value = $_GET[$name] ?? $_POST[$name] ?? null;

  if ($value === null || $value === '') {
    return $default;
  }

  return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
}

function fetch_property_images(string $supabaseUrl, string $supabaseKey, int $limit, int $offset): array {
  $select = 'id,property_id,url,storage_path,sort_order,is_cover,created_at';
  $query = http_build_query([
    'select' => $select,
    'order' => 'created_at.asc',
    'limit' => $limit,
    'offset' => $offset,
  ]);
  $response = supabase_request('GET', $supabaseUrl . '/rest/v1/property_images?' . $query, $supabaseKey);

  if ($response['status'] < 200 || $response['status'] >= 300) {
    json_response(500, [
      'ok' => false,
      'message' => 'Erro ao buscar property_images',
      'status' => $response['status'],
      'body' => $response['body'],
    ]);
  }

  $rows = json_decode($response['body'], true);
  return is_array($rows) ? $rows : [];
}

function build_log_entry(array $row, string $supabaseUrl, string $publicBaseUrl): array {
  $id = (string) ($row['id'] ?? '');
  $propertyId = sanitize_migration_property_id((string) ($row['property_id'] ?? ''));
  $oldUrl = resolve_old_image_url($row, $supabaseUrl);
  $extension = choose_extension($row, $oldUrl);
  $fileName = sanitize_migration_file_name($id, $oldUrl, $extension);
  $newPath = relative_upload_path($propertyId, $fileName);
  $newUrl = rtrim($publicBaseUrl, '/') . '/' . $newPath;
  $url = (string) ($row['url'] ?? '');
  $storagePath = (string) ($row['storage_path'] ?? '');

  return [
    'id' => $id,
    'propertyId' => $propertyId,
    'isCover' => (bool) ($row['is_cover'] ?? false),
    'sortOrder' => $row['sort_order'] ?? null,
    'oldUrl' => $oldUrl,
    'oldStoragePath' => $storagePath,
    'newPath' => $newPath,
    'newUrl' => $newUrl,
    'alreadyMigrated' => is_hostinger_image_value($url) || is_hostinger_image_value($storagePath),
    'isSupabaseStorage' => is_supabase_storage_value($oldUrl) || is_supabase_storage_value($storagePath),
    'downloadStatus' => 'pending',
    'writeStatus' => 'pending',
    'databaseUpdateStatus' => 'pending',
  ];
}

function sanitize_migration_property_id(string $propertyId): string {
  $propertyId = trim($propertyId);

  if (preg_match('/^[a-zA-Z0-9_-]{6,80}$/', $propertyId)) {
    return $propertyId;
  }

  return 'migradas';
}

function resolve_old_image_url(array $row, string $supabaseUrl): string {
  $url = (string) ($row['url'] ?? '');

  if (is_supabase_storage_value($url)) {
    return $url;
  }

  $storagePath = trim((string) ($row['storage_path'] ?? ''));

  if ($storagePath !== '') {
    $path = preg_replace('#^' . preg_quote(SUPABASE_STORAGE_BUCKET, '#') . '/#', '', $storagePath);
    return $supabaseUrl . '/storage/v1/object/public/' . SUPABASE_STORAGE_BUCKET . '/' . encode_storage_path($path);
  }

  return $url;
}

function encode_storage_path(string $path): string {
  $parts = array_map('rawurlencode', explode('/', ltrim($path, '/')));
  return implode('/', $parts);
}

function choose_extension(array $row, string $url): string {
  $candidates = [
    parse_url($url, PHP_URL_PATH),
    (string) ($row['storage_path'] ?? ''),
    (string) ($row['url'] ?? ''),
  ];
  $accepted = accepted_image_types();

  foreach ($candidates as $candidate) {
    if (!is_string($candidate) || $candidate === '') {
      continue;
    }

    $extension = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
    if (array_key_exists($extension, $accepted)) {
      return $extension === 'jpeg' ? 'jpg' : $extension;
    }
  }

  return 'jpg';
}

function sanitize_migration_file_name(string $id, string $oldUrl, string $extension): string {
  $path = parse_url($oldUrl, PHP_URL_PATH);
  $baseName = is_string($path) ? sanitize_base_name(basename($path)) : 'imagem';
  $safeId = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $id);

  return ($safeId ?: bin2hex(random_bytes(8))) . '-' . $baseName . '.' . $extension;
}

function is_hostinger_image_value(string $value): bool {
  return strpos($value, 'uploads/imoveis/') !== false ||
    strpos($value, 'felipecorretor.com.br/uploads/imoveis/') !== false;
}

function is_supabase_storage_value(string $value): bool {
  return strpos($value, '/storage/v1/object/') !== false ||
    strpos($value, '.supabase.co/storage/v1/object/') !== false ||
    (strpos($value, 'uploads/imoveis/') === false && preg_match('#^[a-zA-Z0-9_-]+/.+\.[a-zA-Z0-9]+$#', $value));
}

function download_image(string $url): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_USERAGENT => 'felipe-corretor-image-migration/1.0',
  ]);

  $body = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $mime = strtolower((string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE));
  $error = curl_error($ch);
  curl_close($ch);

  if (!is_string($body) || $status < 200 || $status >= 300) {
    throw new RuntimeException('Download falhou: HTTP ' . $status . ($error ? ' - ' . $error : ''));
  }

  if (strpos($mime, ';') !== false) {
    $mime = trim(explode(';', $mime)[0]);
  }

  return ['body' => $body, 'mime' => $mime, 'status' => $status];
}

function accepted_download_mime(string $mime): bool {
  if ($mime === '' || $mime === 'application/octet-stream') {
    return true;
  }

  $allowed = array_unique(array_values(accepted_image_types()));
  $allowed[] = 'image/pjpeg';

  return in_array($mime, $allowed, true);
}

function update_property_image(string $supabaseUrl, string $supabaseKey, string $id, array $payload): void {
  $url = $supabaseUrl . '/rest/v1/property_images?id=eq.' . rawurlencode($id);
  $response = supabase_request('PATCH', $url, $supabaseKey, $payload);

  if ($response['status'] < 200 || $response['status'] >= 300) {
    throw new RuntimeException('Atualização no banco falhou: HTTP ' . $response['status'] . ' ' . $response['body']);
  }
}

function check_public_url(string $url): string {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_NOBODY => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
  ]);

  curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  return $status >= 200 && $status < 400 ? 'ok' : 'http_' . $status;
}

function supabase_request(string $method, string $url, string $supabaseKey, ?array $payload = null): array {
  $headers = [
    'Content-Type: application/json',
    'apikey: ' . $supabaseKey,
    'Authorization: Bearer ' . $supabaseKey,
  ];

  if ($method === 'PATCH') {
    $headers[] = 'Prefer: return=minimal';
  }

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 30,
  ]);

  if ($payload !== null) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
  }

  $body = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  curl_close($ch);

  return [
    'status' => $status,
    'body' => is_string($body) ? $body : '',
    'error' => $error,
  ];
}
