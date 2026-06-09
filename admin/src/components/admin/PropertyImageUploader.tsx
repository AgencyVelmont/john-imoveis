import React from "react";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import {
  existingImageKey,
  isAcceptedPropertyImageFile,
  localImageKey,
  optimizePropertyImage,
  PROPERTY_IMAGE_ACCEPT,
  type PropertyImage,
} from "@/lib/property-images";

export type LocalPropertyImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type PropertyImageUploaderProps = {
  existingImages: PropertyImage[];
  newImages: LocalPropertyImage[];
  coverKey: string | null;
  disabled?: boolean;
  onExistingImagesChange: (images: PropertyImage[]) => void;
  onNewImagesChange: (images: LocalPropertyImage[]) => void;
  onCoverKeyChange: (coverKey: string | null) => void;
  onRemoveExistingImage?: (image: PropertyImage) => void;
};

export function PropertyImageUploader({
  existingImages,
  newImages,
  coverKey,
  disabled,
  onExistingImagesChange,
  onNewImagesChange,
  onCoverKeyChange,
  onRemoveExistingImage,
}: PropertyImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const allImages = React.useMemo(
    () => [
      ...existingImages.map((image) => ({
        key: existingImageKey(image),
        src: image.url,
        label: image.is_cover ? "Capa atual" : "Foto salva",
      })),
      ...newImages.map((image) => ({
        key: localImageKey(image),
        src: image.previewUrl,
        label: "Nova foto",
      })),
    ],
    [existingImages, newImages],
  );

  React.useEffect(() => {
    if (allImages.length === 0) {
      if (coverKey) onCoverKeyChange(null);
      return;
    }

    const hasCover = allImages.some((image) => image.key === coverKey);

    if (!coverKey || !hasCover) {
      onCoverKeyChange(allImages[0].key);
    }
  }, [allImages, coverKey, onCoverKeyChange]);

  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles = files.filter(isAcceptedPropertyImageFile);

    if (validFiles.length !== files.length) {
      setMessage("Use apenas imagens JPG, PNG, WebP, AVIF, HEIC ou HEIF.");
    } else {
      setMessage("");
    }

    if (validFiles.length === 0) return;

    setIsOptimizing(true);

    try {
      const optimizedFiles: File[] = [];

      for (const file of validFiles) {
        optimizedFiles.push(await optimizePropertyImage(file));
      }

      const selectedImages = optimizedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      const nextImages = [...newImages, ...selectedImages];
      onNewImagesChange(nextImages);

      if (!coverKey && existingImages.length === 0) {
        onCoverKeyChange(localImageKey(selectedImages[0]));
      }

      const originalBytes = validFiles.reduce((sum, file) => sum + file.size, 0);
      const optimizedBytes = optimizedFiles.reduce((sum, file) => sum + file.size, 0);

      if (optimizedBytes < originalBytes) {
        setMessage(
          `${selectedImages.length} foto(s) otimizadas de ${formatBytes(
            originalBytes,
          )} para ${formatBytes(optimizedBytes)}.`,
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Não foi possível otimizar as imagens selecionadas.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (key: string) => {
    const localImage = newImages.find((image) => localImageKey(image) === key);

    if (localImage) {
      URL.revokeObjectURL(localImage.previewUrl);
      onNewImagesChange(newImages.filter((image) => image.id !== localImage.id));
    }

    const existingImage = existingImages.find((image) => existingImageKey(image) === key);

    if (existingImage) {
      onExistingImagesChange(existingImages.filter((image) => image.id !== existingImage.id));
      onRemoveExistingImage?.(existingImage);
    }

    if (coverKey === key) {
      const nextImage = allImages.find((image) => image.key !== key);
      onCoverKeyChange(nextImage?.key ?? null);
    }
  };

  const moveImage = (key: string, direction: -1 | 1) => {
    const index = existingImages.findIndex((image) => existingImageKey(image) === key);

    if (index >= 0) {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= existingImages.length) return;

      const nextImages = [...existingImages];
      const [image] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, image);
      onExistingImagesChange(nextImages);
      return;
    }

    const localIndex = newImages.findIndex((image) => localImageKey(image) === key);
    const targetIndex = localIndex + direction;

    if (localIndex < 0 || targetIndex < 0 || targetIndex >= newImages.length) return;

    const nextImages = [...newImages];
    const [image] = nextImages.splice(localIndex, 1);
    nextImages.splice(targetIndex, 0, image);
    onNewImagesChange(nextImages);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={PROPERTY_IMAGE_ACCEPT}
        multiple
        disabled={disabled || isOptimizing}
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || isOptimizing}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={`w-full border border-dashed bg-muted/30 aspect-video flex flex-col items-center justify-center text-center p-6 transition-colors ${
          isDragging ? "border-gold bg-gold/10" : "border-border hover:border-gold"
        } disabled:opacity-60`}
      >
        <Upload className="w-6 h-6 text-muted-foreground mb-2" strokeWidth={1.5} />
        <span className="text-sm text-navy">
          {isOptimizing ? "Otimizando fotos..." : "Arraste fotos ou clique para selecionar"}
        </span>
        <span className="text-[11px] text-muted-foreground mt-1">
          JPG, PNG, WebP, AVIF, HEIC ou HEIF. As imagens compatíveis são reduzidas antes do upload.
        </span>
      </button>

      {message && <p className="text-xs text-destructive">{message}</p>}

      {allImages.length === 0 ? (
        <div className="border border-border bg-background/60 p-5 text-center">
          <ImagePlus className="w-5 h-5 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground mt-2">Nenhuma foto selecionada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allImages.map((image, index) => (
            <div key={image.key} className="group border border-border bg-background">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img src={image.src} alt={image.label} className="w-full h-full object-cover" />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeImage(image.key)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                  aria-label="Remover imagem"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                {coverKey === image.key && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-gold text-navy px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
                    <Star className="w-3 h-3 fill-navy" strokeWidth={1.5} />
                    Capa
                  </span>
                )}
              </div>

              <div className="p-2 space-y-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onCoverKeyChange(image.key)}
                  className="w-full h-8 border border-border text-[10px] uppercase tracking-[0.12em] hover:border-gold disabled:opacity-50"
                >
                  Definir capa
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    onClick={() => moveImage(image.key, -1)}
                    className="h-7 border border-border text-[10px] uppercase tracking-[0.12em] disabled:opacity-40"
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === allImages.length - 1}
                    onClick={() => moveImage(image.key, 1)}
                    className="h-7 border border-border text-[10px] uppercase tracking-[0.12em] disabled:opacity-40"
                  >
                    Descer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
