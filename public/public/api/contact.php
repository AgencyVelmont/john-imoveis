<?php

load_production_env();
send_cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(405, ['ok' => false, 'message' => 'Method not allowed']);
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
  json_response(400, ['ok' => false, 'message' => 'Invalid payload']);
}

$honeypot = trim((string)($input['website'] ?? $input['company'] ?? ''));
$name = trim((string)($input['name'] ?? ''));
$phone = trim((string)($input['phone'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$interest = trim((string)($input['interest'] ?? 'Contato pelo site'));
$message = trim((string)($input['message'] ?? ''));
$propertyId = trim((string)($input['propertyId'] ?? ''));
$propertyTitle = trim((string)($input['propertyTitle'] ?? ''));

if ($honeypot !== '') {
  json_response(200, ['ok' => true, 'mailSent' => true, 'leadSaved' => true]);
}

if (strlen($name) < 2 || strlen($phone) < 10 || strlen($message) < 5) {
  json_response(422, ['ok' => false, 'message' => 'Campos obrigatórios inválidos']);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_response(422, ['ok' => false, 'message' => 'E-mail inválido']);
}

$to = getenv('CONTACT_TO_EMAIL') ?: 'contato@johnandrade.com.br';
$subject = 'Novo lead pelo site - ' . $interest;
$bodyLines = [
  'Novo contato recebido pelo site.',
  '',
  'Nome: ' . $name,
  'WhatsApp/Telefone: ' . $phone,
  'E-mail: ' . ($email !== '' ? $email : 'Não informado'),
  'Interesse: ' . $interest,
];

if ($propertyTitle !== '') {
  $bodyLines[] = 'Imóvel: ' . $propertyTitle;
}

if ($propertyId !== '') {
  $bodyLines[] = 'ID do imóvel: ' . $propertyId;
}

$bodyLines[] = '';
$bodyLines[] = 'Mensagem:';
$bodyLines[] = $message;

$body = implode("\n", $bodyLines);
$headers = [
  'From: Site John Andrade <' . (getenv('MAIL_FROM_ADDRESS') ?: 'noreply@johnandrade.com.br') . '>',
  'Reply-To: ' . ($email !== '' ? $email : $to),
  'Content-Type: text/plain; charset=UTF-8',
];

$mailSent = mail($to, $subject, $body, implode("\n", $headers));

$supabaseUrl = getenv('SUPABASE_URL') ?: getenv('VITE_SUPABASE_URL') ?: '';
$supabaseAnonKey = getenv('SUPABASE_ANON_KEY') ?: getenv('VITE_SUPABASE_ANON_KEY') ?: '';
$leadPayload = [
  'nome' => $name,
  'telefone' => $phone,
  'email' => $email,
  'mensagem' => "Interesse: {$interest}\n\n{$message}",
  'origem' => 'website',
  'status' => 'novo',
];

if ($propertyId !== '') {
  $leadPayload['property_id'] = $propertyId;
}

$leadSaved = false;

if ($supabaseUrl !== '' && $supabaseAnonKey !== '') {
  $supabaseStatus = postLead($supabaseUrl, $supabaseAnonKey, $leadPayload);
  $leadSaved = $supabaseStatus >= 200 && $supabaseStatus < 300;

  if (!$leadSaved) {
    $fallbackPayload = [
      'name' => $name,
      'phone' => $phone,
      'email' => $email,
      'message' => "Interesse: {$interest}\n\n{$message}",
      'source' => 'website',
      'status' => 'novo',
    ];

    if ($propertyId !== '') {
      $fallbackPayload['property_id'] = $propertyId;
    }

    $fallbackStatus = postLead($supabaseUrl, $supabaseAnonKey, $fallbackPayload);
    $leadSaved = $fallbackStatus >= 200 && $fallbackStatus < 300;
  }
}

if (!$mailSent || !$leadSaved) {
  json_response(500, [
    'ok' => false,
    'mailSent' => $mailSent,
    'leadSaved' => $leadSaved,
  ]);
}

json_response(200, [
  'ok' => true,
  'mailSent' => true,
  'leadSaved' => true,
]);

function send_cors_headers() {
  $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
  $configured = array_filter(array_map('trim', explode(',', (string)getenv('ALLOWED_ORIGINS'))));
  $fallbacks = array_filter([
    getenv('VITE_SITE_URL') ?: '',
    getenv('VITE_PUBLIC_SITE_URL') ?: '',
    getenv('PUBLIC_SITE_URL') ?: '',
    'https://johnandradecorretor.com.br',
    'https://www.johnandradecorretor.com.br',
  ]);
  $allowedOrigins = array_values(array_unique(array_merge($configured, $fallbacks)));

  if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
  }

  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Max-Age: 86400');
}

function load_production_env() {
  $envFile = getenv('JOHN_PRODUCTION_ENV_FILE') ?: '/home/u429221902/.johnandrade-env.php';

  if (is_string($envFile) && is_readable($envFile)) {
    require_once $envFile;
  }
}

function json_response($status, $payload) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload);
  exit;
}

function postLead($supabaseUrl, $supabaseAnonKey, $payload) {
  $ch = curl_init(rtrim($supabaseUrl, '/') . '/rest/v1/leads');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'apikey: ' . $supabaseAnonKey,
      'Authorization: Bearer ' . $supabaseAnonKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 10,
  ]);

  curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  return $status;
}
