import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Image as ImageIcon, Upload, X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import {
  buildPropertyPayload,
  createPropertySlug,
  readPropertyForm,
  validatePropertyForm,
  type PropertyStatus,
} from "../../lib/properties";
import { propertySaveErrorMessage } from "../../lib/supabase-errors";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const UPLOAD_ENDPOINT = "https://johnandradecorretor.com.br/api/upload-imovel.php";
const MAX_IMAGES = 15;

type NewImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  storage_path: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string | null;
};

export const Route = createFileRoute("/imoveis/novo")({
  component: NovoImovel,
});

export function NovoImovel() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imagesRef = useRef<NewImage[]>([]);

  useEffect(() => {
    imagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = (submitter?.value === "rascunho" ? "rascunho" : "publicado") as PropertyStatus;
    const values = readPropertyForm(formData, status);
    const validationError = validatePropertyForm(values);
    const insertPayload = {
      ...buildPropertyPayload(values, status === "publicado" ? "rascunho" : status),
      slug: createPropertySlug(values.title),
      published_at: null,
    };
    const publishPayload = {
      ...buildPropertyPayload(values, status),
      published_at: status === "publicado" ? new Date().toISOString() : null,
    };

    if (validationError) {
      setError(validationError);
      return;
    }

    if (status === "publicado" && newImages.length < 3) {
      setError("Adicione pelo menos 3 fotos antes de publicar o imóvel.");
      return;
    }

    setSaving(true);
    try {
      const { data, error: insertError } = await supabase
        .from("properties")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      const propertyId = data.id as string;
      const uploadedImages =
        newImages.length > 0
          ? await uploadPropertyImages(
              propertyId,
              newImages.map((image, index) => ({
                file: image.file,
                sortOrder: index,
                isCover: false,
              })),
            )
          : [];

      const coverIndex = newImages.findIndex((image) => newImageKey(image) === coverKey);
      const coverImage = uploadedImages[coverIndex >= 0 ? coverIndex : 0] ?? null;
      await setPropertyCover(propertyId, coverImage?.id ?? null);

      if (status === "publicado") {
        const { error: publishError } = await supabase
          .from("properties")
          .update(publishPayload)
          .eq("id", propertyId);
        if (publishError) throw publishError;
      }

      toast.success(
        status === "publicado" ? "Imóvel publicado com sucesso!" : "Rascunho salvo com sucesso!",
      );
      navigate({ to: "/imoveis" });
    } catch (caughtError) {
      logSupabaseSubmitError("Erro ao salvar imóvel", caughtError, {
        insertPayload,
        publishPayload,
      });
      setError(propertySaveErrorMessage(caughtError, "salvar"));
    } finally {
      setSaving(false);
    }
  }

  function addImages(files: FileList | null) {
    if (!files) return;

    const availableSlots = Math.max(0, MAX_IMAGES - newImages.length);
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

  function removeImage(imageId: string) {
    const image = newImages.find((item) => item.id === imageId);
    if (image) URL.revokeObjectURL(image.previewUrl);

    const nextImages = newImages.filter((item) => item.id !== imageId);
    setNewImages(nextImages);
    if (coverKey === `new:${imageId}`)
      setCoverKey(nextImages[0] ? newImageKey(nextImages[0]) : null);
  }

  return (
    <>
      <PageHeader
        title="Novo imóvel"
        subtitle="Cadastre um novo anúncio no portfólio"
        action={
          <Link
            to="/imoveis"
            className="h-10 px-5 border border-border text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:border-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar
          </Link>
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
            <PropertyFields />
          </div>

          <div className="space-y-6">
            <Panel title="Fotos" eyebrow="Mídia">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif"
                multiple
                disabled={saving}
                className="hidden"
                onChange={(event) => {
                  addImages(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={saving || newImages.length >= MAX_IMAGES}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed bg-muted/30 aspect-video flex flex-col items-center justify-center text-center p-6 transition-colors border-border hover:border-gold disabled:opacity-60"
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2" strokeWidth={1.5} />
                <span className="text-sm text-navy">Clique para selecionar fotos</span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Máximo de {MAX_IMAGES} fotos por imóvel.
                </span>
              </button>

              {newImages.length === 0 ? (
                <div className="border border-border bg-background/60 p-5 text-center">
                  <ImageIcon className="w-5 h-5 mx-auto text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground mt-2">Nenhuma foto selecionada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {newImages.map((image) => (
                    <div key={image.id} className="border border-border bg-background">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                          src={image.previewUrl}
                          alt="Nova foto"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/65 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setCoverKey(newImageKey(image))}
                          className="w-full h-8 border border-border text-[10px] uppercase tracking-[0.12em] hover:border-gold disabled:opacity-50"
                        >
                          {coverKey === newImageKey(image) ? "Capa" : "Definir capa"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Publicação" eyebrow="Configurações">
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input name="featured" type="checkbox" className="w-4 h-4 accent-gold" />
                <span className="text-sm text-navy">Marcar como destaque</span>
              </label>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  name="status"
                  value="rascunho"
                  disabled={saving}
                  className="h-11 px-5 border border-border text-xs tracking-[0.1em] uppercase hover:border-navy disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar rascunho"}
                </button>
                <button
                  type="submit"
                  name="status"
                  value="publicado"
                  disabled={saving}
                  className="h-11 px-5 bg-gold text-navy text-xs tracking-[0.1em] uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </Panel>
          </div>
        </form>
      </div>
    </>
  );
}

function PropertyFields() {
  return (
    <>
      <Panel title="Informações principais" eyebrow="Etapa 01">
        <Field label="Título do anúncio">
          <input
            name="title"
            className={inputClassName}
            placeholder="Ex: Casa alto padrão na Aldeia"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo">
            <select name="type" className={inputClassName} defaultValue="Casa">
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
                  defaultChecked
                  className="h-4 w-4 accent-gold"
                />
                Venda
              </label>
              <label className="flex h-11 items-center gap-3 border border-input bg-background px-3 text-sm text-navy">
                <input
                  name="purpose"
                  type="checkbox"
                  value="locacao"
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
            placeholder="Descrição completa do imóvel..."
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
              defaultValue={0}
            />
          </Field>
          <Field label="Suítes">
            <input
              name="suites"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={0}
            />
          </Field>
          <Field label="Banheiros">
            <input
              name="bathrooms"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={0}
            />
          </Field>
          <Field label="Vagas">
            <input
              name="parking_spaces"
              type="number"
              min={0}
              className={inputClassName}
              defaultValue={0}
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
              defaultValue={0}
            />
          </Field>
          <Field label="Área construída (m²)">
            <input
              name="built_area"
              type="text"
              inputMode="decimal"
              className={inputClassName}
              defaultValue={0}
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
              placeholder="0,00"
            />
          </Field>
          <Field label="Valor de locação (R$)">
            <input
              name="rental_price"
              type="text"
              inputMode="decimal"
              className={inputClassName}
              placeholder="0,00"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Localização" eyebrow="Etapa 03">
        <Field label="Endereço">
          <input
            name="location_text"
            className={inputClassName}
            placeholder="Rua, número ou localização aproximada"
          />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Bairro">
            <input name="neighborhood" className={inputClassName} placeholder="Aldeia" />
          </Field>
          <Field label="Cidade">
            <input name="city" className={inputClassName} defaultValue="Santarém" />
          </Field>
          <Field label="Estado">
            <input name="state" className={inputClassName} defaultValue="PA" />
          </Field>
        </div>
      </Panel>
    </>
  );
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

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token)
    throw new Error("Sessão expirada. Faça login novamente.");
  return data.session.access_token;
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
