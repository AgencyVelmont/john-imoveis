import { supabase } from "@/lib/supabase";

const HOSTINGER_API_BASE_URL = "https://felipecorretor.com.br/api";
const HOSTINGER_UPLOAD_ENDPOINT = `${HOSTINGER_API_BASE_URL}/upload-imovel.php`;
const HOSTINGER_DELETE_ENDPOINT = `${HOSTINGER_API_BASE_URL}/delete-imovel-image.php`;

export const MAX_PROPERTY_IMAGES = 3;
export const PROPERTY_IMAGE_LIMIT_MESSAGE = "O limite é de 3 fotos por imóvel.";

const MAX_IMAGE_DIMENSION = 1920;
const TARGET_IMAGE_BYTES = 900 * 1024;
const IMAGE_QUALITIES = [0.84, 0.78, 0.72];
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);
const ACCEPTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"]);
export type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  storage_path: string;
  sort_order: number | null;
  is_cover: boolean | null;
  created_at: string | null;
};

export type PendingPropertyImageUpload = {
  file: File;
  sortOrder: number;
  isCover: boolean;
};

export const PROPERTY_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif";

export function existingImageKey(image: PropertyImage) {
  return `existing:${image.id}`;
}

export function localImageKey(image: { id: string }) {
  return `new:${image.id}`;
}

export async function loadPropertyImages(propertyId: string) {
  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as PropertyImage[];
}

export async function uploadPropertyImages(
  propertyId: string,
  images: PendingPropertyImageUpload[],
) {
  const uploadedImages: PropertyImage[] = [];

  for (const image of images) {
    const uploadFile = await optimizePropertyImage(image.file);
    const hostedImage = await uploadImageToHostinger(propertyId, uploadFile);

    const { data, error: insertError } = await supabase
      .from("property_images")
      .insert({
        property_id: propertyId,
        url: hostedImage.url,
        storage_path: hostedImage.path,
        sort_order: image.sortOrder,
        is_cover: image.isCover,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    uploadedImages.push(data as PropertyImage);
  }

  return uploadedImages;
}

export function isAcceptedPropertyImageFile(file: File) {
  const extension = getFileExtension(file.name);
  const hasAcceptedExtension = Boolean(extension && ACCEPTED_IMAGE_EXTENSIONS.has(extension));
  const hasMimeType = Boolean(file.type);
  const hasAcceptedMimeType = hasMimeType && ACCEPTED_IMAGE_TYPES.has(file.type.toLowerCase());

  if (hasMimeType && !hasAcceptedMimeType) return false;

  return hasAcceptedExtension || hasAcceptedMimeType;
}

export async function optimizePropertyImage(file: File) {
  if (!file.type.startsWith("image/")) return file;

  const dimensions = await readImageDimensions(file).catch(() => null);
  const sourceWidth = dimensions?.width ?? 0;
  const sourceHeight = dimensions?.height ?? 0;
  const scale =
    sourceWidth > 0 && sourceHeight > 0
      ? Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight))
      : 1;
  const width = sourceWidth > 0 ? Math.max(1, Math.round(sourceWidth * scale)) : undefined;
  const height = sourceHeight > 0 ? Math.max(1, Math.round(sourceHeight * scale)) : undefined;

  const bitmap = await createOptimizedBitmap(file, width, height);

  if (!bitmap) return file;

  try {
    const outputWidth = width ?? bitmap.width;
    const outputHeight = height ?? bitmap.height;

    if (scale === 1 && file.size <= TARGET_IMAGE_BYTES && file.type === "image/webp") {
      return file;
    }

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(outputWidth, outputHeight)
        : document.createElement("canvas");

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d", {
      alpha: file.type === "image/png" || file.type === "image/webp",
    }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (!context) return file;

    context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);

    for (const quality of IMAGE_QUALITIES) {
      const blob = await canvasToBlob(canvas, "image/webp", quality);

      if (!blob) continue;

      if (blob.size <= TARGET_IMAGE_BYTES || quality === IMAGE_QUALITIES.at(-1)) {
        return new File([blob], replaceImageExtension(file.name, "webp"), {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }
    }

    return file;
  } finally {
    bitmap.close();
  }
}

export async function deletePropertyImages(images: PropertyImage[]) {
  if (images.length === 0) return;

  const imageIds = images.map((image) => image.id);
  const hostedImages = images.filter(isHostingerImage);

  for (const image of hostedImages) {
    await deleteImageFromHostinger(image);
  }

  const { error: deleteError } = await supabase.from("property_images").delete().in("id", imageIds);

  if (deleteError) throw deleteError;
}

export async function updatePropertyImageOrder(images: PropertyImage[]) {
  for (const [index, image] of images.entries()) {
    const { error } = await supabase
      .from("property_images")
      .update({ sort_order: index })
      .eq("id", image.id);

    if (error) throw error;
  }
}

export async function setPropertyCover(propertyId: string, imageId: string | null) {
  const { error: resetError } = await supabase
    .from("property_images")
    .update({ is_cover: false })
    .eq("property_id", propertyId);

  if (resetError) throw resetError;

  if (!imageId) return;

  const { error } = await supabase
    .from("property_images")
    .update({ is_cover: true })
    .eq("id", imageId);

  if (error) throw error;
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

async function uploadImageToHostinger(propertyId: string, file: File) {
  const formData = new FormData();
  formData.append("propertyId", propertyId);
  formData.append("image", file);

  const response = await fetch(HOSTINGER_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getSupabaseAccessToken()}`,
    },
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    publicUrl?: string;
    storagePath?: string;
    images?: Array<{
      publicUrl?: string;
      storagePath?: string;
      watermark?: {
        applied?: boolean;
        processor?: string | null;
        warning?: string | null;
      };
    }>;
    message?: string;
    warnings?: string[];
  } | null;
  const uploadedImage = payload?.images?.[0] ?? payload;

  if (!response.ok || !payload?.ok || !uploadedImage?.publicUrl || !uploadedImage.storagePath) {
    throw new Error(payload?.message || "Erro ao enviar imagem.");
  }

  return {
    url: uploadedImage.publicUrl,
    path: uploadedImage.storagePath,
  };
}

async function deleteImageFromHostinger(image: PropertyImage) {
  const response = await fetch(HOSTINGER_DELETE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getSupabaseAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: image.storage_path,
      url: image.url,
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    message?: string;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Erro ao excluir imagem.");
  }
}

async function getSupabaseAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return session.access_token;
}

function isHostingerImage(image: PropertyImage) {
  if (image.storage_path.startsWith("uploads/imoveis/")) return true;

  try {
    return new URL(image.url, window.location.origin).pathname.startsWith("/uploads/imoveis/");
  } catch {
    return false;
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality: number,
) {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality }).catch(() => null);
  }

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function replaceImageExtension(fileName: string, extension: string) {
  const cleanName = fileName.replace(/\.[^/.]+$/, "");
  return `${cleanName || "imagem"}.${extension}`;
}

async function readImageDimensions(file: File) {
  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      image.src = url;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function createOptimizedBitmap(file: File, width?: number, height?: number) {
  const shouldResizeAtDecode = Boolean(width && height);

  if (shouldResizeAtDecode) {
    const resizedBitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "high",
    }).catch(() => null);

    if (resizedBitmap) return resizedBitmap;
  }

  return createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
}
