<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Invalid payload']);
  exit;
}

$name = trim((string)($input['name'] ?? ''));
$phone = trim((string)($input['phone'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$interest = trim((string)($input['interest'] ?? 'Contato pelo site'));
$message = trim((string)($input['message'] ?? ''));
$propertyId = trim((string)($input['propertyId'] ?? ''));
$propertyTitle = trim((string)($input['propertyTitle'] ?? ''));

if (strlen($name) < 2 || strlen($phone) < 10 || strlen($message) < 5) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'message' => 'Campos obrigatórios inválidos']);
  exit;
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'message' => 'E-mail inválido']);
  exit;
}

$to = getenv('CONTACT_TO_EMAIL') ?: 'contato@felipecorretor.com.br';
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
  'From: Site Felipe Vasconcelos <noreply@felipecorretor.com.br>',
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
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'mailSent' => $mailSent,
    'leadSaved' => $leadSaved,
  ]);
  exit;
}

echo json_encode([
  'ok' => true,
  'mailSent' => true,
  'leadSaved' => true,
]);

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
