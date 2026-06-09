<?php

require_once __DIR__ . '/_imovel-image-utils.php';

handle_cors_preflight();
require_post();
require_authenticated_user();

$propertyId = sanitize_property_id((string) ($_POST['propertyId'] ?? ''));

$files = uploaded_image_files();

if (count($files) === 0) {
  json_response(422, ['ok' => false, 'message' => 'Envie ao menos uma imagem']);
}

$savedFiles = [];

foreach ($files as $file) {
  $validated = validate_uploaded_image($file);
  $uniqueName = unique_image_file_name($validated);
  $relativePath = relative_upload_path($propertyId, $uniqueName);
  $targetPath = absolute_upload_path($relativePath);

  if (!move_uploaded_file((string) $file['tmp_name'], $targetPath)) {
    json_response(500, ['ok' => false, 'message' => 'Não foi possível salvar a imagem']);
  }

  chmod($targetPath, 0644);

  $savedFiles[] = [
    'publicUrl' => public_base_url() . '/' . $relativePath,
    'storagePath' => $relativePath,
    'originalName' => $validated['originalName'],
    'filename' => $uniqueName,
    'size' => $validated['size'],
  ];
}

$firstFile = $savedFiles[0];

json_response(200, [
  'ok' => true,
  'publicUrl' => $firstFile['publicUrl'],
  'storagePath' => $firstFile['storagePath'],
  'originalName' => $firstFile['originalName'],
  'filename' => $firstFile['filename'],
  'size' => $firstFile['size'],
  'images' => $savedFiles,
]);

function uploaded_image_files(): array {
  if (isset($_FILES['images']) && is_array($_FILES['images'])) {
    return normalize_uploaded_files($_FILES['images']);
  }

  if (isset($_FILES['image']) && is_array($_FILES['image'])) {
    return normalize_uploaded_files($_FILES['image']);
  }

  return [];
}

function normalize_uploaded_files(array $input): array {
  if (is_array($input['name'] ?? null)) {
    $files = [];
    $count = count($input['name']);

    for ($index = 0; $index < $count; $index++) {
      $files[] = [
        'name' => $input['name'][$index] ?? '',
        'type' => $input['type'][$index] ?? '',
        'tmp_name' => $input['tmp_name'][$index] ?? '',
        'error' => $input['error'][$index] ?? UPLOAD_ERR_NO_FILE,
        'size' => $input['size'][$index] ?? 0,
      ];
    }

    return $files;
  }

  return [$input];
}
