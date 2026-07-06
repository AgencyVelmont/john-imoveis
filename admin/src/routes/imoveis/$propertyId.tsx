import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import {
  buildPropertyPayload,
  formatBRL,
  readPropertyForm,
  validatePropertyForm,
  type Property,
  type PropertyStatus,
} from "../../lib/properties";
import { propertySaveErrorMessage } from "../../lib/supabase-errors";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const UPLOAD_ENDPOINT = "https://johnandradecorretor.com.br/api/upload-imovel.php";
const DELETE_ENDPOINT = "https://johnandradecorretor.com.br/api/delete-imovel-image.php";
const MAX_IMAGES = 15;

type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  storage_path: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string | null;
};

type NewImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export const Route = createFileRoute("/imoveis/$propertyId")({
  component: PropertyRoute,
});

function PropertyRoute() {
  const { propertyId } = Route.useParams();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthenticated(!!data.session));
  }, []);

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return authenticated ? <EditarImovel /> : <PublicProperty propertyId={propertyId} />;
}

function PublicProperty({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      setError("");
      try {
        const [{ data, error: propertyError }, propertyImages] = await Promise.all([
          supabase
            .from("properties")
            .select("*")
            .eq("id", propertyId)
            .eq("status", "publicado")
            .single(),
          listPropertyImages(propertyId),
        ]);
        if (propertyError) throw propertyError;
        setProperty(data as Property);
        setImages(propertyImages);
      } catch (caughtError) {
        console.error(caughtError);
        setError("Imóvel não encontrado ou indisponível.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  if (loading)
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  if (!property) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="mb-6 text-sm text-destructive">{error}</p>
        <Link
          to="/imoveis"
          className="premium-button inline-flex h-11 items-center bg-navy px-5 text-xs uppercase tracking-[0.14em] text-white"
        >
          Ver imóveis
        </Link>
      </div>
    );
  }

  const cover = images.find((image) => image.is_cover) ?? images[0] ?? null;

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {cover ? (
            <img src={cover.url} alt={property.title} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Imóvel sem imagem
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {images.slice(0, 6).map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={property.title}
                className="aspect-square w-full bg-muted object-contain"
              />
            ))}
          </div>
        )}
        {property.full_description && (
          <p className="text-sm leading-8 text-muted-foreground">{property.full_description}</p>
        )}
      </div>
      <aside className="premium-panel h-fit border border-border bg-card p-6">
        <p className="eyebrow mb-3">Detalhes</p>
        <p className="text-3xl font-display text-navy">{formatBRL(property.price)}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <Detail label="Quartos" value={property.bedrooms ?? 0} />
          <Detail label="Suítes" value={property.suites ?? 0} />
          <Detail label="Banheiros" value={property.bathrooms ?? 0} />
          <Detail label="Área" value={property.total_area ? `${property.total_area} m²` : "-"} />
        </div>
      </aside>
    </section>
  );
}

export function EditarImovel() {
  const { propertyId } = useParams({ strict: false }) as { propertyId: string };
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<PropertyImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const newImagesRef = useRef<NewImage[]>([]);

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      setError("");
      try {
        const [{ data, error: propertyError }, propertyImages] = await Promise.all([
          supabase.from("properties").select("*").eq("id", propertyId).single(),
          listPropertyImages(propertyId),
        ]);
        if (propertyError) throw propertyError;
        setProperty(data as Property);
        setExistingImages(propertyImages);
        const cover = propertyImages.find((image) => image.is_cover) ?? propertyImages[0] ?? null;
        setCoverKey(cover ? existingImageKey(cover) : null);
      } catch (caughtError) {
        console.error(caughtError);
        setError("Não foi possível carregar este imóvel.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const values = readPropertyForm(formData, property.status);
    const status = (
      submitter?.value === "publicado" ? "publicado" : values.status
    ) as PropertyStatus;
    const validationError = validatePropertyForm(values);
    const now = new Date().toISOString();
    const payload: Partial<ReturnType<typeof buildPropertyPayload>> & {
      published_at?: string | null;
    } = {
      ...buildPropertyPayload(values, status),
      published_at: status === "publicado" ? (property.published_at ?? now) : null,
    };
    if (status === property.status) {
      delete payload.status;
      delete payload.published_at;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    if (
      status === "publicado" &&
      property.status !== "publicado" &&
      existingImages.length + newImages.length < 3
    ) {
      setError("Adicione pelo menos 3 fotos antes de publicar o imóvel.");
      return;
    }

    setSaving(true);
    try {
      if (imagesToDelete.length > 0) await deletePropertyImages(imagesToDelete);

      await reorderPropertyImages(existingImages);
      const uploadedImages = await uploadPropertyImages(
        propertyId,
        newImages.map((image, index) => ({
          file: image.file,
          sortOrder: existingImages.length + index,
          isCover: false,
        })),
      );
      const existingCover = existingImages.find((image) => existingImageKey(image) === coverKey);
      const newCoverIndex = newImages.findIndex((image) => newImageKey(image) === coverKey);
      const newCover = uploadedImages[newCoverIndex];
      const fallbackCover =
        existingCover ?? newCover ?? uploadedImages[0] ?? existingImages[0] ?? null;
      await setPropertyCover(
        propertyId,
        existingCover?.id ?? newCover?.id ?? fallbackCover?.id ?? null,
      );

      const { error: updateError } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", propertyId);
      if (updateError) throw updateError;

      toast.success("Imóvel atualizado com sucesso!");
      navigate({ to: "/imoveis" });
    } catch (caughtError) {
      logSupabaseSubmitError("Erro ao atualizar imóvel", caughtError, payload);
      setError(propertySaveErrorMessage(caughtError, "atualizar"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProperty() {
    if (
      !property ||
      !window.confirm(
        `Deseja excluir o imóvel "${property.title}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const images = await listPropertyImages(property.id);
      if (images.length > 0) await deletePropertyImages(images);
      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id);
      if (deleteError) throw deleteError;
      navigate({ to: "/imoveis" });
    } catch (caughtError) {
      console.error(caughtError);
      setError("Erro ao excluir imóvel.");
    } finally {
      setDeleting(false);
    }
  }

  function addImages(files: FileList | null) {
    if (!files) return;

    const availableSlots = Math.max(0, MAX_IMAGES - existingImages.length - newImages.length);
    if (availableSlots === 0) {
      setError(`O limite é de ${MAX_IMAGES} fotos por imóvel.`);
      return;
    }

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (selected.length === 0) return;
    setNewImages((current) => [...current, ...selected]);
    setCoverKey((current) => current ?? newImageKey(selected[0]));
  }

  function removeExistingImage(image: PropertyImage) {
    const nextImages = existingImages.filter((item) => item.id !== image.id);
    setExistingImages(nextImages);
    setImagesToDelete((current) => [...current, image]);
    if (coverKey === existingImageKey(image)) {
      setCoverKey(
        nextImages[0]
          ? existingImageKey(nextImages[0])
          : newImages[0]
            ? newImageKey(newImages[0])
            : null,
      );
    }
  }

  function removeNewImage(image: NewImage) {
    URL.revokeObjectURL(image.previewUrl);
    const nextImages = newImages.filter((item) => item.id !== image.id);
    setNewImages(nextImages);
    if (coverKey === newImageKey(image)) {
      setCoverKey(
        existingImages[0]
          ? existingImageKey(existingImages[0])
          : nextImages[0]
            ? newImageKey(nextImages[0])
            : null,
      );
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Editar imóvel" subtitle="Carregando cadastro" />
        <div className="p-8 text-sm text-muted-foreground">Carregando imóvel...</div>
      </>
    );
  }

  if (error && !property) {
    return (
      <>
        <PageHeader
          title="Editar imóvel"
          subtitle="Cadastro não encontrado"
          action={
            <Link
              to="/imoveis"
              className="h-10 px-5 border border-border text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:border-navy transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar
            </Link>
          }
        />
        <div className="p-8 text-sm text-destructive">{error}</div>
      </>
    );
  }

  if (!property) return null;

  return (
    <>
      <PageHeader
        title="Editar imóvel"
        subtitle={property.title}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteProperty}
              disabled={deleting || saving}
              className="h-10 px-4 border border-destructive/40 text-destructive text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:border-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
            <Link
              to="/imoveis"
              className="h-10 px-5 border border-border text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:border-navy transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar
            </Link>
          </div>
        }
      />
      <div className="p-8">
        <form
          className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1400px]"
          onSubmit={handleSubmit}
        >
          <div className="xl:col-span-2 space-y-6">
            {error && (
              <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <PropertyFields property={property} />
          </div>

          <div className="space-y-6">
            <Panel title="Fotos" eyebrow="Mídia">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif"
                multiple
                disabled={saving || deleting}
                className="hidden"
                onChange={(event) => {
                  addImages(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={
                  saving || deleting || existingImages.length + newImages.length >= MAX_IMAGES
                }
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed bg-muted/30 aspect-video flex flex-col items-center justify-center text-center p-6 transition-colors border-border hover:border-gold disabled:opacity-60"
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2" strokeWidth={1.5} />
                <span className="text-sm text-navy">Clique para selecionar fotos</span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Máximo de {MAX_IMAGES} fotos por imóvel.
                </span>
              </button>

              {existingImages.length + newImages.length === 0 ? (
                <div className="border border-border bg-background/60 p-5 text-center">
                  <ImageIcon className="w-5 h-5 mx-auto text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground mt-2">Nenhuma foto selecionada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingImages.map((image) => (
                    <ImageTile
                      key={image.id}
                      src={image.url}
                      label={coverKey === existingImageKey(image) ? "Capa" : "Definir capa"}
                      disabled={saving || deleting}
                      onCover={() => setCoverKey(existingImageKey(image))}
                      onRemove={() => removeExistingImage(image)}
                    />
                  ))}
                  {newImages.map((image) => (
                    <ImageTile
                      key={image.id}
                      src={image.previewUrl}
                      label={coverKey === newImageKey(image) ? "Capa" : "Definir capa"}
                      disabled={saving || deleting}
                      onCover={() => setCoverKey(newImageKey(image))}
                      onRemove={() => removeNewImage(image)}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Publicação" eyebrow="Configurações">
              <Field label="Status atual">
                <select name="status" className={inputClassName} defaultValue={property.status}>
                  <option value="rascunho">Rascunho</option>
                  <option value="publicado">Publicado</option>
                  <option value="vendido">Vendido</option>
                  <option value="alugado">Alugado</option>
                  <option value="indisponivel">Indisponível</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input
                  name="featured"
                  type="checkbox"
                  className="w-4 h-4 accent-gold"
                  defaultChecked={!!property.featured}
                />
                <span className="text-sm text-navy">Marcar como destaque</span>
              </label>
              <Field label="Observações internas">
                <textarea
                  name="internal_notes"
                  rows={4}
                  className={textareaClassName}
                  defaultValue={property.internal_notes ?? ""}
                />
              </Field>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="h-11 px-5 border border-border text-xs tracking-[0.1em] uppercase hover:border-navy disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                <button
                  type="submit"
                  name="statusOverride"
                  value="publicado"
                  disabled={saving || deleting}
                  className="h-11 px-5 bg-gold text-navy text-xs tracking-[0.1em] uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar e publicar"}
                </button>
              </div>
            </Panel>
          </div>
        </form>
      </div>
    </>
  );
}

function PropertyFields({ property }: { property: Property }) {
  return (
    <>
      <Panel title="Informações principais" eyebrow="Etapa 01">
        <Field label="Título do anúncio">
          <input name="title" className={inputClassName} defaultValue={property.title} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo">
            <select name="type" className={inputClassName} defaultValue={property.type}>
              <option value="Casa">Casa</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Terreno">Terreno</option>
              <option value="Comercial">Comercial</option>
            </select>
          </Field>
          <Field label="Finalidade">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex h-11 items-center gap-3 border border-input bg-background px-3 text-sm text-navy">
                <input
                  name="purpose"
                  type="checkbox"
                  value="venda"
                  defaultChecked={
                    property.purpose === "venda" || property.purpose === "venda_locacao"
                  }
                  className="h-4 w-4 accent-gold"
                />
                Venda
              </label>
              <label className="flex h-11 items-center gap-3 border border-input bg-background px-3 text-sm text-navy">
                <input
                  name="purpose"
                  type="checkbox"
                  value="locacao"
                  defaultChecked={
                    property.purpose === "locacao" || property.purpose === "venda_locacao"
                  }
                  className="h-4 w-4 accent-gold"
                />
                Locação
              </label>
            </div>
          </Field>
        </div>
        <Field label="Descrição">
          <textarea
            name="full_description"
            rows={5}
            className={textareaClassName}
            defaultValue={property.full_description ?? ""}
          />
        </Field>
      </Panel>

      <Panel title="Especificações" eyebrow="Etapa 02">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Quartos">
            <input
              name="bedrooms"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={property.bedrooms ?? 0}
            />
          </Field>
          <Field label="Suítes">
            <input
              name="suites"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={property.suites ?? 0}
            />
          </Field>
          <Field label="Banheiros">
            <input
              name="bathrooms"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={property.bathrooms ?? 0}
            />
          </Field>
          <Field label="Vagas">
            <input
              name="parking_spaces"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={property.parking_spaces ?? 0}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Área total (m²)">
            <input
              name="total_area"
              type="text"
              inputMode="decimal"
              className={inputClassName}
              defaultValue={property.total_area ?? 0}
            />
          </Field>
          <Field label="Área construída (m²)">
            <input
              name="built_area"
              type="text"
              inputMode="decimal"
              className={inputClassName}
              defaultValue={property.built_area ?? 0}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Valor de venda (R$)">
            <input
              name="sale_price"
              type="text"
              inputMode="decimal"
              className={inputClassName}
              defaultValue={
                property.sale_price ?? (property.purpose !== "locacao" ? property.price : 0)
              }
            />
          </Field>
          <Field label="Valor de locação (R$)">
            <input
              name="rental_price"
              type="text"
              inputMode="decimal"
              className={inputClassName}
              defaultValue={
                property.rental_price ?? (property.purpose === "locacao" ? property.price : 0)
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Localização" eyebrow="Etapa 03">
        <Field label="Endereço">
          <input
            name="location_text"
            className={inputClassName}
            defaultValue={property.location_text ?? ""}
          />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Bairro">
            <input
              name="neighborhood"
              className={inputClassName}
              defaultValue={property.neighborhood ?? ""}
            />
          </Field>
          <Field label="Cidade">
            <input
              name="city"
              className={inputClassName}
              defaultValue={property.city ?? "Santarém"}
            />
          </Field>
          <Field label="Estado">
            <input name="state" className={inputClassName} defaultValue={property.state ?? "PA"} />
          </Field>
        </div>
      </Panel>
    </>
  );
}

function ImageTile({
  src,
  label,
  disabled,
  onCover,
  onRemove,
}: {
  src: string;
  label: string;
  disabled: boolean;
  onCover: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border bg-background">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={src} alt="Foto do imóvel" className="w-full h-full object-contain" />
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="absolute top-2 right-2 w-7 h-7 bg-black/65 text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onCover}
          className="w-full h-8 border border-border text-[10px] uppercase tracking-[0.12em] hover:border-gold disabled:opacity-50"
        >
          {label}
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-navy">{value}</p>
    </div>
  );
}

async function listPropertyImages(propertyId: string) {
  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PropertyImage[];
}

async function uploadPropertyImages(
  propertyId: string,
  images: Array<{ file: File; sortOrder: number; isCover: boolean }>,
) {
  const uploaded: PropertyImage[] = [];
  for (const image of images) {
    const uploadedImage = await uploadImage(propertyId, image.file);
    const { data, error } = await supabase
      .from("property_images")
      .insert({
        property_id: propertyId,
        url: uploadedImage.url,
        storage_path: uploadedImage.path,
        sort_order: image.sortOrder,
        is_cover: image.isCover,
      })
      .select("*")
      .single();
    if (error) throw error;
    uploaded.push(data as PropertyImage);
  }
  return uploaded;
}

async function deletePropertyImages(images: PropertyImage[]) {
  for (const image of images.filter(shouldDeletePhysicalFile)) await deletePhysicalImage(image);
  const { error } = await supabase
    .from("property_images")
    .delete()
    .in(
      "id",
      images.map((image) => image.id),
    );
  if (error) throw error;
}

async function reorderPropertyImages(images: PropertyImage[]) {
  for (const [index, image] of images.entries()) {
    const { error } = await supabase
      .from("property_images")
      .update({ sort_order: index })
      .eq("id", image.id);
    if (error) throw error;
  }
}

async function setPropertyCover(propertyId: string, imageId: string | null) {
  const { error: clearError } = await supabase
    .from("property_images")
    .update({ is_cover: false })
    .eq("property_id", propertyId);
  if (clearError) throw clearError;
  if (!imageId) return;
  const { error } = await supabase
    .from("property_images")
    .update({ is_cover: true })
    .eq("id", imageId);
  if (error) throw error;
}

async function uploadImage(propertyId: string, file: File) {
  const formData = new FormData();
  formData.append("propertyId", propertyId);
  formData.append("image", file);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
    body: formData,
  });
  const body = await response.json().catch(() => null);
  const image = body?.images?.[0] ?? body;
  if (!response.ok || !body?.ok || !image?.publicUrl || !image.storagePath) {
    throw new Error(body?.message || "Erro ao enviar imagem.");
  }
  return { url: image.publicUrl as string, path: image.storagePath as string };
}

async function deletePhysicalImage(image: PropertyImage) {
  const response = await fetch(DELETE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: image.storage_path, url: image.url }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) throw new Error(body?.message || "Erro ao excluir imagem.");
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token)
    throw new Error("Sessão expirada. Faça login novamente.");
  return data.session.access_token;
}

function shouldDeletePhysicalFile(image: PropertyImage) {
  if (image.storage_path.startsWith("uploads/imoveis/")) return true;
  try {
    return new URL(image.url, window.location.origin).pathname.startsWith("/uploads/imoveis/");
  } catch {
    return false;
  }
}

function logSupabaseSubmitError(label: string, error: unknown, payload: unknown) {
  const supabaseError = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  console.error(label, {
    message: supabaseError?.message,
    code: supabaseError?.code,
    details: supabaseError?.details,
    hint: supabaseError?.hint,
    payload,
    error,
  });
}

function existingImageKey(image: PropertyImage) {
  return `existing:${image.id}`;
}

function newImageKey(image: NewImage) {
  return `new:${image.id}`;
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-8 py-6">
      <div>
        <p className="eyebrow mb-1">{subtitle}</p>
        <h1 className="text-2xl text-navy">{title}</h1>
      </div>
      {action}
    </header>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-card border border-border">
      <header className="px-6 py-5 border-b border-border">
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h2 className="text-lg text-navy">{title}</h2>
      </header>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full h-11 px-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans";
const textareaClassName =
  "w-full px-3 py-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans resize-none";
