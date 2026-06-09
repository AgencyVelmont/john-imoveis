<?php

require_once __DIR__ . '/_imovel-image-utils.php';

handle_cors_preflight();
require_post();
require_authenticated_user();

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
  json_response(400, ['ok' => false, 'message' => 'Payload inválido']);
}

$relativePath = resolve_upload_path_from_input(
  (string) ($input['path'] ?? ''),
  (string) ($input['url'] ?? ''),
);
$targetPath = absolute_upload_path($relativePath);

if (is_file($targetPath) && !unlink($targetPath)) {
  json_response(500, ['ok' => false, 'message' => 'Não foi possível excluir a imagem']);
}

json_response(200, [
  'ok' => true,
  'storagePath' => $relativePath,
]);
