import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Topbar } from "@/components/admin/Topbar";
import {
  LocalPropertyImage,
  PropertyImageUploader,
} from "@/components/admin/PropertyImageUploader";
import { supabase } from "@/lib/supabase";
import {
  buildPropertyPayload,
  createPropertySlug,
  readPropertyForm,
  validatePropertyForm,
  type PropertyStatus,
} from "@/lib/properties";
import { localImageKey, setPropertyCover, uploadPropertyImages } from "@/lib/property-images";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/imoveis/novo")({
  component: NovoImovel,
});

function NovoImovel() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [newImages, setNewImages] = React.useState<LocalPropertyImage[]>([]);
  const [coverKey, setCoverKey] = React.useState<string | null>(null);
  const newImagesRef = React.useRef<LocalPropertyImage[]>([]);

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
    setErrorMessage("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status: PropertyStatus = submitter?.value === "rascunho" ? "rascunho" : "publicado";
    const values = readPropertyForm(formData, status);
    const validationMessage = validatePropertyForm(values);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (status === "publicado" && newImages.length < 6) {
      setErrorMessage("Para publicar, selecione pelo menos 6 fotos do imóvel.");
      return;
    }

    setIsSaving(true);

    try {
      const publishedAt = status === "publicado" ? new Date().toISOString() : null;
      const { data, error } = await supabase
        .from("properties")
        .insert({
          ...buildPropertyPayload(values, status),
          slug: createPropertySlug(values.title),
          published_at: publishedAt,
        })
        .select("id")
        .single();

      if (error) throw error;

      const propertyId = data.id as string;

      if (newImages.length > 0) {
        const uploadedImages = await uploadPropertyImages(
          propertyId,
          newImages.map((image, index) => ({
            file: image.file,
            sortOrder: index,
            isCover: false,
          })),
        );

        const selectedCoverIndex = newImages.findIndex(
          (image) => localImageKey(image) === coverKey,
        );
        const coverImage = uploadedImages[selectedCoverIndex >= 0 ? selectedCoverIndex : 0];
        await setPropertyCover(propertyId, coverImage?.id ?? null);
      }

      toast.success(
        status === "publicado" ? "Imóvel publicado com sucesso!" : "Rascunho salvo com sucesso!",
      );
      navigate({ to: "/imoveis" });
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao salvar imóvel. Verifique os dados e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Topbar
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
            {errorMessage && (
              <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <FormCard title="Informações principais" eyebrow="Etapa 01">
              <Field label="Título do anúncio">
                <input
                  name="title"
                  className={inputCls}
                  placeholder="Ex: Casa alto padrão na Aldeia"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo">
                  <select name="type" className={inputCls} defaultValue="Casa">
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </Field>

                <Field label="Finalidade">
                  <select name="purpose" className={inputCls} defaultValue="venda">
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
                  placeholder="Descrição completa do imóvel..."
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
                    defaultValue={0}
                  />
                </Field>

                <Field label="Suítes">
                  <input
                    name="suites"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={0}
                  />
                </Field>

                <Field label="Banheiros">
                  <input
                    name="bathrooms"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={0}
                  />
                </Field>

                <Field label="Vagas">
                  <input
                    name="parking_spaces"
                    type="number"
                    min={0}
                    className={inputCls}
                    defaultValue={0}
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
                    defaultValue={0}
                  />
                </Field>

                <Field label="Área construída (m²)">
                  <input
                    name="built_area"
                    type="text"
                    inputMode="decimal"
                    min={0}
                    className={inputCls}
                    defaultValue={0}
                  />
                </Field>

                <Field label="Preço (R$)">
                  <input
                    name="price"
                    type="text"
                    inputMode="decimal"
                    min={0}
                    className={inputCls}
                    placeholder="0,00"
                  />
                </Field>
              </div>
            </FormCard>

            <FormCard title="Localização" eyebrow="Etapa 03">
              <Field label="Endereço">
                <input
                  name="location_text"
                  className={inputCls}
                  placeholder="Rua, número ou localização aproximada"
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Bairro">
                  <input name="neighborhood" className={inputCls} placeholder="Aldeia" />
                </Field>

                <Field label="Cidade">
                  <input name="city" className={inputCls} defaultValue="Santarém" />
                </Field>

                <Field label="Estado">
                  <input name="state" className={inputCls} defaultValue="PA" />
                </Field>
              </div>
            </FormCard>
          </div>

          <div className="space-y-6">
            <FormCard title="Fotos" eyebrow="Mídia">
              <PropertyImageUploader
                existingImages={[]}
                newImages={newImages}
                coverKey={coverKey}
                disabled={isSaving}
                onExistingImagesChange={() => undefined}
                onNewImagesChange={setNewImages}
                onCoverKeyChange={setCoverKey}
              />
            </FormCard>

            <FormCard title="Publicação" eyebrow="Configurações">
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input name="featured" type="checkbox" className="w-4 h-4 accent-gold" />
                <span className="text-sm text-navy">Marcar como destaque</span>
              </label>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  name="status"
                  value="rascunho"
                  disabled={isSaving}
                  className="h-11 px-5 border border-border text-xs tracking-[0.1em] uppercase hover:border-navy disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar rascunho"}
                </button>

                <button
                  type="submit"
                  name="status"
                  value="publicado"
                  disabled={isSaving}
                  className="h-11 px-5 bg-gold text-navy text-xs tracking-[0.1em] uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Publicando..." : "Publicar"}
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
