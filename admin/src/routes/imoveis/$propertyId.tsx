import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import { PublicLayout } from "@/components/public/PublicLayout";
import {
  LocalPropertyImage,
  PropertyImageUploader,
} from "@/components/admin/PropertyImageUploader";
import { createLead } from "@/lib/leads";
import { supabase } from "@/lib/supabase";
import {
  buildPropertyPayload,
  formatBRL,
  readPropertyForm,
  validatePropertyForm,
  type Property,
  type PropertyStatus,
} from "@/lib/properties";
import {
  deletePropertyImages,
  existingImageKey,
  loadPropertyImages,
  localImageKey,
  setPropertyCover,
  updatePropertyImageOrder,
  uploadPropertyImages,
  type PropertyImage,
} from "@/lib/property-images";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/imoveis/$propertyId")({
  component: ImovelRoutePage,
});

function ImovelRoutePage() {
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, []);

  if (hasSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return hasSession ? <EditarImovel /> : <PublicImovelDetalhe />;
}

function PublicImovelDetalhe() {
  const { propertyId } = Route.useParams();
  const [property, setProperty] = React.useState<Property | null>(null);
  const [images, setImages] = React.useState<PropertyImage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  React.useEffect(() => {
    const loadProperty = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [{ data, error }, propertyImages] = await Promise.all([
          supabase
            .from("properties")
            .select("*")
            .eq("id", propertyId)
            .eq("status", "publicado")
            .single(),
          loadPropertyImages(propertyId),
        ]);

        if (error) throw error;

        setProperty(data as Property);
        setImages(propertyImages);
      } catch (error) {
        console.error(error);
        setErrorMessage("Imóvel não encontrado ou indisponível.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [propertyId]);

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!property) return;

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    try {
      await createLead({
        propertyId: property.id,
        name,
        phone,
        email,
        message: `Interesse no imóvel: ${property.title}\n\n${message}`,
        source: "site",
      });

      event.currentTarget.reset();
      setSuccessMessage("Interesse enviado para o CRM. Felipe entrará em contato em breve.");
      toast.success("Lead enviado para o CRM.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Não foi possível enviar seu interesse. Tente novamente.");
      toast.error("Erro ao enviar interesse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout title="Carregando imóvel">
        <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-muted-foreground">
          Carregando...
        </div>
      </PublicLayout>
    );
  }

  if (!property) {
    return (
      <PublicLayout title="Imóvel indisponível" description={errorMessage}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Link
            to="/imoveis"
            className="premium-button inline-flex h-11 items-center bg-navy px-5 text-xs uppercase tracking-[0.14em] text-white"
          >
            Ver imóveis
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const cover = images.find((image) => image.is_cover) ?? images[0] ?? null;

  return (
    <PublicLayout
      eyebrow={property.type}
      title={property.title}
      description={property.short_description ?? property.full_description ?? undefined}
    >
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            {cover ? (
              <img src={cover.url} alt={property.title} className="h-full w-full object-cover" />
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
                  className="aspect-square w-full object-cover"
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
            <InfoItem label="Quartos" value={property.bedrooms ?? 0} />
            <InfoItem label="Suítes" value={property.suites ?? 0} />
            <InfoItem label="Banheiros" value={property.bathrooms ?? 0} />
            <InfoItem
              label="Área"
              value={property.total_area ? `${property.total_area} m²` : "-"}
            />
          </div>

          <form onSubmit={handleLeadSubmit} className="mt-8 space-y-3">
            <input name="name" className={inputCls} placeholder="Seu nome" required />
            <input name="phone" className={inputCls} placeholder="WhatsApp" required />
            <input name="email" type="email" className={inputCls} placeholder="E-mail" />
            <textarea
              name="message"
              rows={4}
              className={textareaCls}
              placeholder="Quero mais informações sobre este imóvel."
              required
            />
            {successMessage && (
              <div className="border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-navy">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="premium-button h-11 w-full bg-navy px-5 text-xs uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {isSubmitting ? "Enviando..." : "Tenho interesse"}
            </button>
          </form>
        </aside>
      </section>
    </PublicLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-navy">{value}</p>
    </div>
  );
}

function EditarImovel() {
  const { propertyId } = Route.useParams();
  const navigate = useNavigate();
  const [property, setProperty] = React.useState<Property | null>(null);
  const [existingImages, setExistingImages] = React.useState<PropertyImage[]>([]);
  const [removedImages, setRemovedImages] = React.useState<PropertyImage[]>([]);
  const [newImages, setNewImages] = React.useState<LocalPropertyImage[]>([]);
  const [coverKey, setCoverKey] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const newImagesRef = React.useRef<LocalPropertyImage[]>([]);

  React.useEffect(() => {
    const loadProperty = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [{ data, error }, images] = await Promise.all([
          supabase.from("properties").select("*").eq("id", propertyId).single(),
          loadPropertyImages(propertyId),
        ]);

        if (error) throw error;

        setProperty(data as Property);
        setExistingImages(images);
        const coverImage = images.find((image) => image.is_cover) ?? images[0] ?? null;
        setCoverKey(coverImage ? existingImageKey(coverImage) : null);
      } catch (error) {
        console.error(error);
        setErrorMessage("Não foi possível carregar este imóvel.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [propertyId]);

  React.useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  React.useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!property) return;

    setErrorMessage("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const values = readPropertyForm(formData, property.status);
    const status: PropertyStatus = submitter?.value === "publicado" ? "publicado" : values.status;
    const validationMessage = validatePropertyForm(values);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const totalImagesAfterSave = existingImages.length + newImages.length;

    if (status === "publicado" && totalImagesAfterSave < 6) {
      setErrorMessage("Para publicar, mantenha ou selecione pelo menos 6 fotos do imóvel.");
      return;
    }

    setIsSaving(true);

    try {
      if (removedImages.length > 0) {
        await deletePropertyImages(removedImages);
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("properties")
        .update({
          ...buildPropertyPayload(values, status),
          published_at: status === "publicado" ? (property.published_at ?? now) : null,
        })
        .eq("id", propertyId);

      if (error) throw error;

      await updatePropertyImageOrder(existingImages);

      const uploadedImages = await uploadPropertyImages(
        propertyId,
        newImages.map((image, index) => ({
          file: image.file,
          sortOrder: existingImages.length + index,
          isCover: false,
        })),
      );

      const selectedExistingImage = existingImages.find(
        (image) => existingImageKey(image) === coverKey,
      );
      const selectedNewIndex = newImages.findIndex((image) => localImageKey(image) === coverKey);
      const selectedNewImage = uploadedImages[selectedNewIndex];
      const fallbackImage = selectedExistingImage ?? uploadedImages[0] ?? existingImages[0] ?? null;

      await setPropertyCover(
        propertyId,
        selectedExistingImage?.id ?? selectedNewImage?.id ?? fallbackImage?.id ?? null,
      );

      toast.success("Imóvel atualizado com sucesso!");
      navigate({ to: "/imoveis" });
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao atualizar imóvel. Verifique os dados e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;

    const confirmed = window.confirm(
      `Deseja excluir o imóvel "${property.title}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const images = await loadPropertyImages(property.id);

      if (images.length > 0) {
        await deletePropertyImages(images);
      }

      const { error } = await supabase.from("properties").delete().eq("id", property.id);

      if (error) throw error;

      navigate({ to: "/imoveis" });
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao excluir imóvel.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Topbar title="Editar imóvel" subtitle="Carregando cadastro" />
        <div className="p-8 text-sm text-muted-foreground">Carregando imóvel...</div>
      </>
    );
  }

  if (errorMessage && !property) {
    return (
      <>
        <Topbar
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
        <div className="p-8 text-sm text-destructive">{errorMessage}</div>
      </>
    );
  }

  if (!property) return null;

  return (
    <>
      <Topbar
        title="Editar imóvel"
        subtitle={property.title}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="h-10 px-4 border border-destructive/40 text-destructive text-xs tracking-[0.1em] uppercase flex items-center gap-2 hover:border-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              {isDeleting ? "Excluindo..." : "Excluir"}
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
            {errorMessage && (
              <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <FormCard title="Informações principais" eyebrow="Etapa 01">
              <Field label="Título do anúncio">
                <input name="title" className={inputCls} defaultValue={property.title} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo">
                  <select name="type" className={inputCls} defaultValue={property.type}>
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </Field>

                <Field label="Finalidade">
                  <select name="purpose" className={inputCls} defaultValue={property.purpose}>
                    <option value="venda">Venda</option>
                    <option value="locacao">Locação</option>
                  </select>
                </Field>
              </div>

              <Field label="Descrição">
                <textarea
                  name="full_description"
                  rows={5}
                  className={textareaCls}
                  defaultValue={property.full_description ?? ""}
                />
              </Field>
            </FormCard>

            <FormCard title="Especificações" eyebrow="Etapa 02">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Quartos">
                  <input
                    name="bedrooms"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={property.bedrooms ?? 0}
                  />
                </Field>

                <Field label="Suítes">
                  <input
                    name="suites"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={property.suites ?? 0}
                  />
                </Field>

                <Field label="Banheiros">
                  <input
                    name="bathrooms"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={property.bathrooms ?? 0}
                  />
                </Field>

                <Field label="Vagas">
                  <input
                    name="parking_spaces"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={property.parking_spaces ?? 0}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Área total (m²)">
                  <input
                    name="total_area"
                    type="text"
                    inputMode="decimal"
                    min={0}
                    className={inputCls}
                    defaultValue={property.total_area ?? 0}
                  />
                </Field>

                <Field label="Área construída (m²)">
                  <input
                    name="built_area"
                    type="text"
                    inputMode="decimal"
                    min={0}
                    className={inputCls}
                    defaultValue={property.built_area ?? 0}
                  />
                </Field>

                <Field label="Preço (R$)">
                  <input
                    name="price"
                    type="text"
                    inputMode="decimal"
                    min={0}
                    className={inputCls}
                    defaultValue={property.price ?? 0}
                  />
                </Field>
              </div>
            </FormCard>

            <FormCard title="Localização" eyebrow="Etapa 03">
              <Field label="Endereço">
                <input
                  name="location_text"
                  className={inputCls}
                  defaultValue={property.location_text ?? ""}
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Bairro">
                  <input
                    name="neighborhood"
                    className={inputCls}
                    defaultValue={property.neighborhood ?? ""}
                  />
                </Field>

                <Field label="Cidade">
                  <input
                    name="city"
                    className={inputCls}
                    defaultValue={property.city ?? "Santarém"}
                  />
                </Field>

                <Field label="Estado">
                  <input name="state" className={inputCls} defaultValue={property.state ?? "PA"} />
                </Field>
              </div>
            </FormCard>
          </div>

          <div className="space-y-6">
            <FormCard title="Fotos" eyebrow="Mídia">
              <PropertyImageUploader
                existingImages={existingImages}
                newImages={newImages}
                coverKey={coverKey}
                disabled={isSaving || isDeleting}
                onExistingImagesChange={setExistingImages}
                onNewImagesChange={setNewImages}
                onCoverKeyChange={setCoverKey}
                onRemoveExistingImage={(image) =>
                  setRemovedImages((current) => [...current, image])
                }
              />
            </FormCard>

            <FormCard title="Publicação" eyebrow="Configurações">
              <Field label="Status atual">
                <select name="status" className={inputCls} defaultValue={property.status}>
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
                  defaultChecked={Boolean(property.featured)}
                />
                <span className="text-sm text-navy">Marcar como destaque</span>
              </label>

              <Field label="Observações internas">
                <textarea
                  name="internal_notes"
                  rows={4}
                  className={textareaCls}
                  defaultValue={property.internal_notes ?? ""}
                />
              </Field>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="h-11 px-5 border border-border text-xs tracking-[0.1em] uppercase hover:border-navy disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </button>

                <button
                  type="submit"
                  name="statusOverride"
                  value="publicado"
                  disabled={isSaving || isDeleting}
                  className="h-11 px-5 bg-gold text-navy text-xs tracking-[0.1em] uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar e publicar"}
                </button>
              </div>
            </FormCard>
          </div>
        </form>
      </div>
    </>
  );
}

const inputCls =
  "w-full h-11 px-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans";

const textareaCls =
  "w-full px-3 py-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans resize-none";

function FormCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
