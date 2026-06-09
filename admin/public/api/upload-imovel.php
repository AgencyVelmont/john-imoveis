<?php

require_once __DIR__ . '/_imovel-image-utils.php';

require_post();
require_authenticated_user();

$propertyId = sanitize_property_id((string) ($_POST['propertyId'] ?? ''));

if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
  json_response(422, ['ok' => false, 'message' => 'Envie uma imagem']);
}

$file = $_FILES['image'];
$validated = validate_uploaded_image($file);
$uniqueName = bin2hex(random_bytes(16)) . '-' . $validated['baseName'] . '.' . $validated['extension'];
$relativePath = relative_upload_path($propertyId, $uniqueName);
$targetPath = absolute_upload_path($relativePath);

if (!move_uploaded_file((string) $file['tmp_name'], $targetPath)) {
  json_response(500, ['ok' => false, 'message' => 'Não foi possível salvar a imagem']);
}

chmod($targetPath, 0644);

json_response(200, [
  'ok' => true,
  'url' => public_base_url() . '/' . $relativePath,
  'path' => $relativePath,
  'fileName' => $uniqueName,
]);
