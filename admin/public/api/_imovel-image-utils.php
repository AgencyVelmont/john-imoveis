<?php

const IMOVEL_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

function json_response(int $status, array $payload): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload);
  exit;
}

function require_post(): void {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'message' => 'Method not allowed']);
  }
}

function require_authenticated_user(): void {
  $supabaseUrl = getenv('SUPABASE_URL') ?: getenv('VITE_SUPABASE_URL') ?: '';
  $supabaseAnonKey = getenv('SUPABASE_ANON_KEY') ?: getenv('VITE_SUPABASE_ANON_KEY') ?: '';
  $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

  if ($supabaseUrl === '' || $supabaseAnonKey === '') {
    json_response(500, ['ok' => false, 'message' => 'Supabase environment is not configured']);
  }

  if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
    json_response(401, ['ok' => false, 'message' => 'Unauthorized']);
  }

  $token = trim($matches[1]);
  $ch = curl_init(rtrim($supabaseUrl, '/') . '/auth/v1/user');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET => true,
    CURLOPT_HTTPHEADER => [
      'apikey: ' . $supabaseAnonKey,
      'Authorization: Bearer ' . $token,
    ],
    CURLOPT_TIMEOUT => 10,
  ]);

  curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($status < 200 || $status >= 300) {
    json_response(401, ['ok' => false, 'message' => 'Unauthorized']);
  }
}

function accepted_image_types(): array {
  return [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'avif' => 'image/avif',
    'heic' => 'image/heic',
    'heif' => 'image/heif',
  ];
}

function sanitize_property_id(string $propertyId): string {
  $propertyId = trim($propertyId);

  if (!preg_match('/^[a-zA-Z0-9_-]{6,80}$/', $propertyId)) {
    json_response(422, ['ok' => false, 'message' => 'ID do imóvel inválido']);
  }

  return $propertyId;
}

function sanitize_base_name(string $fileName): string {
  $baseName = preg_replace('/\.[^\.]+$/', '', $fileName);
  if (function_exists('iconv')) {
    $baseName = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $baseName);
  }
  $baseName = strtolower((string) $baseName);
  $baseName = preg_replace('/[^a-z0-9]+/', '-', $baseName);
  $baseName = trim((string) $baseName, '-');

  return $baseName !== '' ? $baseName : 'imagem';
}

function file_extension(string $fileName): string {
  return strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
}

function detect_file_mime(string $tmpPath): string {
  if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
      $mime = finfo_file($finfo, $tmpPath);
      finfo_close($finfo);

      if (is_string($mime) && $mime !== '') {
        return strtolower($mime);
      }
    }
  }

  return '';
}

function validate_uploaded_image(array $file): array {
  if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_response(422, ['ok' => false, 'message' => 'Arquivo de imagem inválido']);
  }

  $size = (int) ($file['size'] ?? 0);
  if ($size <= 0 || $size > IMOVEL_IMAGE_MAX_BYTES) {
    json_response(422, ['ok' => false, 'message' => 'A imagem deve ter no máximo 12 MB']);
  }

  $originalName = (string) ($file['name'] ?? '');
  $extension = file_extension($originalName);
  $acceptedTypes = accepted_image_types();

  if (!array_key_exists($extension, $acceptedTypes)) {
    json_response(422, ['ok' => false, 'message' => 'Use apenas imagens JPG, PNG, WebP, AVIF, HEIC ou HEIF']);
  }

  $browserMime = strtolower((string) ($file['type'] ?? ''));
  $detectedMime = detect_file_mime((string) $file['tmp_name']);
  $allowedMimes = array_unique(array_values($acceptedTypes));
  $allowedMimes[] = 'image/pjpeg';

  foreach ([$browserMime, $detectedMime] as $mime) {
    if ($mime === '' || $mime === 'application/octet-stream') {
      continue;
    }

    if (!in_array($mime, $allowedMimes, true)) {
      json_response(422, ['ok' => false, 'message' => 'Tipo de imagem inválido']);
    }
  }

  return [
    'extension' => $extension === 'jpeg' ? 'jpg' : $extension,
    'baseName' => sanitize_base_name($originalName),
  ];
}

function uploads_root(): string {
  return dirname(__DIR__) . '/uploads/imoveis';
}

function public_base_url(): string {
  $configuredUrl = trim((string) (getenv('UPLOAD_PUBLIC_BASE_URL') ?: ''));

  if ($configuredUrl !== '') {
    return rtrim($configuredUrl, '/');
  }

  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $scheme = $https ? 'https' : 'http';
  $host = $_SERVER['HTTP_HOST'] ?? 'felipecorretor.com.br';

  return $scheme . '://' . $host;
}

function relative_upload_path(string $propertyId, string $fileName): string {
  return 'uploads/imoveis/' . $propertyId . '/' . $fileName;
}

function resolve_upload_path_from_input(string $path, string $url): string {
  $candidate = trim($path);

  if ($candidate === '' && $url !== '') {
    $parsedPath = parse_url($url, PHP_URL_PATH);
    $candidate = is_string($parsedPath) ? ltrim($parsedPath, '/') : '';
  }

  $candidate = ltrim($candidate, '/');
  $candidate = preg_replace('#/+#', '/', $candidate);

  if (!is_string($candidate) || !preg_match('#^uploads/imoveis/[a-zA-Z0-9_-]{6,80}/[a-zA-Z0-9._-]+$#', $candidate)) {
    json_response(422, ['ok' => false, 'message' => 'Caminho da imagem inválido']);
  }

  return $candidate;
}

function absolute_upload_path(string $relativePath): string {
  if (!is_dir(uploads_root())) {
    mkdir(uploads_root(), 0755, true);
  }

  $root = realpath(uploads_root());
  $target = uploads_root() . '/' . preg_replace('#^uploads/imoveis/#', '', $relativePath);
  $directory = dirname($target);

  if (!is_dir($directory)) {
    mkdir($directory, 0755, true);
  }

  $realDirectory = realpath($directory);

  if (!$root || !$realDirectory || strpos($realDirectory, $root) !== 0) {
    json_response(422, ['ok' => false, 'message' => 'Caminho da imagem inválido']);
  }

  return $target;
}
