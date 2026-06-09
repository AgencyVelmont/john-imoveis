import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, RefreshCw, Send, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/admin/Topbar";
import {
  defaultSiteSettings,
  loadSiteSettings,
  saveSiteSettings,
  type SiteSettingsInput,
} from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import {
  enablePushNotifications,
  getPushStatus,
  isPushSupported,
  testPushNotification,
  type PushSupportStatus,
} from "@/lib/push-notifications";

export const Route = createFileRoute("/configuracoes")({ component: Configuracoes });

type AdminUser = {
  id: string;
  email: string;
  name: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  role: string;
  confirmed_at: string | null;
};

function Configuracoes() {
  const [settings, setSettings] = React.useState<SiteSettingsInput>(defaultSiteSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [creatingAdmin, setCreatingAdmin] = React.useState(false);
  const [loadingAdmins, setLoadingAdmins] = React.useState(true);
  const [deletingAdminId, setDeletingAdminId] = React.useState<string | null>(null);
  const [admins, setAdmins] = React.useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [adminSuccessMessage, setAdminSuccessMessage] = React.useState("");
  const [adminErrorMessage, setAdminErrorMessage] = React.useState("");
  const [pushStatus, setPushStatus] = React.useState<PushSupportStatus>("inactive");
  const [pushMessage, setPushMessage] = React.useState("");
  const [pushLoading, setPushLoading] = React.useState(false);
  const [testingPush, setTestingPush] = React.useState(false);
  const [resettingDashboard, setResettingDashboard] = React.useState(false);

  const loadAdmins = React.useCallback(async () => {
    setLoadingAdmins(true);
    setAdminErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        message?: string;
        admins?: AdminUser[];
      }>("list-admins");

      if (error) throw await functionInvokeError(error, "Não foi possível listar os admins.");
      if (!data?.ok) throw new Error(data?.message || "Não foi possível listar os admins.");

      setAdmins(data.admins ?? []);
    } catch (error) {
      console.error(error);
      setAdminErrorMessage(authErrorMessage(error, "Não foi possível listar os admins."));
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const refreshPushStatus = React.useCallback(async () => {
    setPushMessage("");

    if (!isPushSupported()) {
      setPushStatus("unsupported");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPushStatus("inactive");
        return;
      }

      setPushStatus(await getPushStatus(user.id));
    } catch (error) {
      console.error(error);
      setPushStatus("inactive");
      setPushMessage(
        "Não foi possível verificar as notificações. Confira a migration no Supabase.",
      );
    }
  }, []);

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        setSettings(await loadSiteSettings());
      } catch (error) {
        console.error(error);
        setErrorMessage("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  React.useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  React.useEffect(() => {
    refreshPushStatus();
  }, [refreshPushStatus]);

  const handleSettingsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const values: SiteSettingsInput = {
      name: text(formData.get("name")),
      creci: text(formData.get("creci")),
      email: text(formData.get("email")),
      phone: text(formData.get("phone")),
      instagram_url: text(formData.get("instagram_url")),
      site_url: text(formData.get("site_url")),
      bio: text(formData.get("bio")),
      whatsapp_message: text(formData.get("whatsapp_message")),
      address: text(formData.get("address")),
      city: text(formData.get("city")),
      state: text(formData.get("state")),
      experience_years: toNonNegativeInt(formData.get("experience_years"), 8),
      properties_count: toNonNegativeInt(formData.get("properties_count"), 200),
      clients_count: toNonNegativeInt(formData.get("clients_count"), 0),
      neighborhoods_count: toNonNegativeInt(formData.get("neighborhoods_count"), 0),
    };

    try {
      await saveSiteSettings(values);
      setSettings(values);
      toast.success("Configurações salvas.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao salvar configurações. Confira as permissões no Supabase.");
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setCreatingAdmin(true);
    setErrorMessage("");
    setAdminSuccessMessage("");
    setAdminErrorMessage("");

    const formData = new FormData(form);
    const email = text(formData.get("admin_email"));
    const password = text(formData.get("admin_password"));
    const name = text(formData.get("admin_name"));

    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        message?: string;
      }>("create-admin", {
        body: { name, email, password },
      });

      if (error) throw await functionInvokeError(error, "Não foi possível criar o admin.");
      if (!data?.ok) throw new Error(data?.message || "Não foi possível criar o admin.");

      form.reset();
      setAdminSuccessMessage("Admin criado com sucesso. O e-mail já fica confirmado para login.");
      toast.success("Admin criado com sucesso.");
      await loadAdmins();
    } catch (error) {
      console.error(error);
      const message = authErrorMessage(error, "Não foi possível criar o admin.");
      setAdminErrorMessage(message);
      toast.error(message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.id === currentUserId) {
      setAdminErrorMessage("Você não pode excluir o próprio usuário.");
      return;
    }

    const confirmed = window.confirm(
      `Deseja excluir o admin ${admin.email}? Esta ação remove o usuário do Supabase Auth.`,
    );

    if (!confirmed) return;

    setDeletingAdminId(admin.id);
    setAdminSuccessMessage("");
    setAdminErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        message?: string;
      }>("delete-admin", {
        body: { userId: admin.id },
      });

      if (error) throw await functionInvokeError(error, "Não foi possível excluir o admin.");
      if (!data?.ok) throw new Error(data?.message || "Não foi possível excluir o admin.");

      setAdminSuccessMessage("Admin excluído com sucesso.");
      toast.success("Admin excluído com sucesso.");
      await loadAdmins();
    } catch (error) {
      console.error(error);
      const message = authErrorMessage(error, "Não foi possível excluir o admin.");
      setAdminErrorMessage(message);
      toast.error(message);
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Faça login novamente para ativar notificações.");

      await enablePushNotifications(user.id);
      await refreshPushStatus();
      setPushMessage("Notificações ativadas neste dispositivo.");
      toast.success("Notificações ativadas.");
    } catch (error) {
      console.error(error);
      const message = pushErrorMessage(error);
      setPushMessage(message);
      toast.error(message);
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    setPushMessage("");

    try {
      await testPushNotification();
      setPushMessage("Notificação de teste enviada para este dispositivo.");
      toast.success("Notificação de teste enviada.");
    } catch (error) {
      console.error(error);
      const message = pushErrorMessage(error);
      setPushMessage(message);
      toast.error(message);
    } finally {
      setTestingPush(false);
    }
  };

  const handleResetDashboard = async () => {
    const confirmation = window.prompt(
      "Digite RESETAR para zerar os dados do dashboard. Esta ação remove analytics e leads, mas não remove imóveis, admins ou configurações.",
    );

    if (confirmation !== "RESETAR") return;

    setResettingDashboard(true);

    try {
      const data = await resetDashboardData(confirmation);
      toast.success(
        `Dados resetados: ${data.deleted?.property_events ?? 0} eventos e ${
          data.deleted?.leads ?? 0
        } leads apagados.`,
      );
    } catch (error) {
      console.error(error);
      toast.error(
        String((error as { message?: string }).message || "Não foi possível resetar o dashboard."),
      );
    } finally {
      setResettingDashboard(false);
    }
  };

  return (
    <>
      <Topbar title="Configurações" subtitle="Perfil público, integração do site e admins" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6">
        {errorMessage && (
          <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSettingsSubmit}>
          <Card title="Perfil público" eyebrow="Site">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando configurações...</p>
            ) : (
              <>
                <Row label="Nome">
                  <input name="name" className={inp} defaultValue={settings.name} required />
                </Row>
                <Row label="CRECI">
                  <input name="creci" className={inp} defaultValue={settings.creci} />
                </Row>
                <Row label="E-mail">
                  <input name="email" type="email" className={inp} defaultValue={settings.email} />
                </Row>
                <Row label="WhatsApp">
                  <input name="phone" className={inp} defaultValue={settings.phone} />
                </Row>
                <Row label="Mensagem WhatsApp">
                  <input
                    name="whatsapp_message"
                    className={inp}
                    defaultValue={settings.whatsapp_message}
                  />
                </Row>
                <Row label="Instagram">
                  <input
                    name="instagram_url"
                    type="url"
                    className={inp}
                    defaultValue={settings.instagram_url}
                  />
                </Row>
                <Row label="URL do site">
                  <input
                    name="site_url"
                    type="url"
                    className={inp}
                    defaultValue={settings.site_url}
                  />
                </Row>
                <Row label="Endereço">
                  <input name="address" className={inp} defaultValue={settings.address} />
                </Row>
                <Row label="Cidade">
                  <input name="city" className={inp} defaultValue={settings.city} />
                </Row>
                <Row label="Estado">
                  <input name="state" className={inp} defaultValue={settings.state} />
                </Row>
                <Row label="Bio">
                  <textarea
                    name="bio"
                    rows={4}
                    className={textareaCls}
                    defaultValue={settings.bio}
                  />
                </Row>
              </>
            )}
          </Card>

          <div className="mt-6">
            <Card title="Números de autoridade" eyebrow="Prova social">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando números...</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <NumberField
                    label="Anos de experiência"
                    name="experience_years"
                    defaultValue={settings.experience_years}
                  />
                  <NumberField
                    label="Imóveis negociados/cadastrados"
                    name="properties_count"
                    defaultValue={settings.properties_count}
                  />
                  <NumberField
                    label="Clientes atendidos"
                    name="clients_count"
                    defaultValue={settings.clients_count}
                  />
                  <NumberField
                    label="Bairros atendidos"
                    name="neighborhoods_count"
                    defaultValue={settings.neighborhoods_count}
                  />
                </div>
              )}
            </Card>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="submit"
              disabled={saving || loading}
              className="h-10 px-5 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>
        </form>

        <form onSubmit={handleAdminSubmit}>
          <Card title="Adicionar novo admin" eyebrow="Acessos">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label>
                <span className={labelCls}>Nome</span>
                <input name="admin_name" className={inp} placeholder="Nome do admin" required />
              </label>
              <label>
                <span className={labelCls}>E-mail</span>
                <input
                  name="admin_email"
                  type="email"
                  className={inp}
                  placeholder="admin@email.com"
                  required
                />
              </label>
              <label>
                <span className={labelCls}>Senha inicial</span>
                <input
                  name="admin_password"
                  type="password"
                  minLength={6}
                  className={inp}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </label>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              O acesso é criado por uma Edge Function segura no Supabase. A chave service role fica
              apenas no ambiente da função, nunca no frontend.
            </p>
            {adminSuccessMessage && (
              <div className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-navy">
                {adminSuccessMessage}
              </div>
            )}
            {adminErrorMessage && (
              <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {adminErrorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={creatingAdmin}
              className="mt-5 h-10 px-5 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" strokeWidth={1.5} />
              {creatingAdmin ? "Criando..." : "Criar admin"}
            </button>
          </Card>
        </form>

        <Card title="Notificações no celular" eyebrow="PWA">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    pushStatus === "active" ? "bg-gold/15 text-navy" : "bg-muted text-navy"
                  }`}
                >
                  {pushStatus === "active" ? (
                    <BellRing className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Bell className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-navy">{pushStatusLabel(pushStatus)}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Para uma experiência melhor no celular, adicione o painel à tela inicial antes
                    de ativar. O navegador pode limitar push no iPhone fora do modo web app.
                  </p>
                </div>
              </div>
              {pushMessage && (
                <p className="mt-4 border border-border bg-background/70 px-4 py-3 text-xs text-muted-foreground">
                  {pushMessage}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading || pushStatus === "unsupported" || pushStatus === "denied"}
                className="inline-flex h-10 items-center justify-center gap-2 bg-navy px-4 text-xs uppercase tracking-[0.1em] text-white transition-colors hover:bg-navy-mid disabled:opacity-50"
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                {pushLoading ? "Ativando..." : "Ativar notificações"}
              </button>
              <button
                type="button"
                onClick={handleTestPush}
                disabled={testingPush || pushStatus !== "active"}
                className="inline-flex h-10 items-center justify-center gap-2 border border-border px-4 text-xs uppercase tracking-[0.1em] text-navy transition-colors hover:border-gold disabled:opacity-50"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
                {testingPush ? "Enviando..." : "Testar notificação"}
              </button>
            </div>
          </div>
        </Card>

        <Card title="Resetar dados do dashboard" eyebrow="Dados gerais">
          <div className="border border-destructive/20 bg-destructive/5 p-5">
            <p className="text-sm font-medium text-navy">Zerar dados do dashboard</p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
              Remove analytics, views, cliques, eventos e leads usados nos indicadores. Imóveis,
              admins e configurações permanecem intactos.
            </p>
            <button
              type="button"
              onClick={handleResetDashboard}
              disabled={resettingDashboard}
              className="mt-4 inline-flex h-10 items-center gap-2 border border-destructive/30 px-4 text-xs uppercase tracking-[0.1em] text-destructive transition-colors hover:border-destructive hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              {resettingDashboard ? "Resetando..." : "Resetar dados"}
            </button>
          </div>
        </Card>

        <Card
          title="Administradores cadastrados"
          eyebrow="Acessos"
          action={
            <button
              type="button"
              onClick={loadAdmins}
              disabled={loadingAdmins}
              className="h-9 px-4 border border-border text-xs uppercase tracking-[0.1em] text-navy hover:border-gold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingAdmins ? "animate-spin" : ""}`}
                strokeWidth={1.5}
              />
              Atualizar
            </button>
          }
        >
          {loadingAdmins ? (
            <div className="space-y-3">
              <AdminSkeleton />
              <AdminSkeleton />
              <AdminSkeleton />
            </div>
          ) : admins.length === 0 ? (
            <div className="border border-dashed border-border bg-background/60 p-8 text-center">
              <p className="text-sm text-navy">Nenhum admin encontrado.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie um admin pelo formulário acima para liberar acesso ao painel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border">
              <table className="min-w-[860px] w-full">
                <thead className="bg-muted/40">
                  <tr className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <th className="px-4 py-3 text-left font-normal">Admin</th>
                    <th className="px-4 py-3 text-left font-normal">Status</th>
                    <th className="px-4 py-3 text-left font-normal">Criado em</th>
                    <th className="px-4 py-3 text-left font-normal">Último login</th>
                    <th className="px-4 py-3 text-right font-normal">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {admins.map((admin) => {
                    const isCurrentUser = admin.id === currentUserId;
                    const isDeleting = deletingAdminId === admin.id;

                    return (
                      <tr key={admin.id} className="hover:bg-muted/25 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-navy">
                            {admin.name || "Sem nome"}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-gold">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{admin.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                              admin.confirmed_at
                                ? "bg-gold/15 text-navy"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {admin.confirmed_at ? "Confirmado" : "Pendente"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(admin.created_at)}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(admin.last_sign_in_at)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAdmin(admin)}
                            disabled={isCurrentUser || Boolean(deletingAdminId)}
                            className="inline-flex h-9 items-center gap-2 border border-destructive/30 px-3 text-xs uppercase tracking-[0.1em] text-destructive transition-colors hover:border-destructive disabled:cursor-not-allowed disabled:opacity-45"
                            title={
                              isCurrentUser
                                ? "Você não pode excluir o próprio usuário"
                                : "Excluir admin"
                            }
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            {isDeleting ? "Excluindo..." : "Excluir"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

const inp =
  "w-full h-11 px-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans";
const textareaCls =
  "w-full px-3 py-3 bg-background border border-input text-sm text-navy outline-none focus:border-gold transition-colors font-sans resize-none";
const labelCls = "block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2";

function Card({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border">
      <header className="px-6 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{eyebrow}</p>
          <h2 className="text-lg text-navy">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 md:items-center">
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="block border border-border bg-background/60 p-4 transition-colors focus-within:border-gold hover:border-gold/50">
      <span className={labelCls}>{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        step={1}
        className="h-11 w-full bg-transparent font-display text-3xl text-navy outline-none"
        defaultValue={defaultValue}
      />
    </label>
  );
}

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function toNonNegativeInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function authErrorMessage(error: unknown, fallback = "Não foi possível criar o admin.") {
  const message = String((error as { message?: string }).message ?? "").toLowerCase();

  if ((error as { message?: string }).message && !message.includes("edge function")) {
    return String((error as { message?: string }).message);
  }

  if (message.includes("already registered") || message.includes("already exists")) {
    return "Este e-mail já está cadastrado como usuário.";
  }

  if (message.includes("password")) {
    return "A senha precisa atender às regras do Supabase.";
  }

  if (message.includes("signup") || message.includes("signups")) {
    return "Cadastro de usuários está desativado no Supabase Auth.";
  }

  return fallback;
}

function pushStatusLabel(status: PushSupportStatus) {
  const labels: Record<PushSupportStatus, string> = {
    supported: "Disponível",
    "missing-vapid-key": "Chave pública VAPID ausente",
    unsupported: "Navegador sem suporte",
    denied: "Permissão bloqueada",
    inactive: "Inativo neste dispositivo",
    active: "Ativo neste dispositivo",
  };

  return labels[status];
}

function pushErrorMessage(error: unknown) {
  const message = String((error as { message?: string }).message ?? "");
  const normalized = message.toLowerCase();

  if (normalized.includes("permission") || normalized.includes("permiss")) {
    return "Permissão de notificação não concedida neste navegador.";
  }

  if (normalized.includes("vapid")) {
    return "Configure a chave pública VAPID no frontend e a chave privada na Edge Function.";
  }

  if (normalized.includes("push_subscriptions") || normalized.includes("schema cache")) {
    return "Tabela push_subscriptions ainda não disponível. Rode a migration no Supabase.";
  }

  if (message) return message;

  return "Não foi possível configurar as notificações.";
}

async function functionInvokeError(error: unknown, fallback: string) {
  const response = (error as { context?: Response }).context;

  if (!response) return error;

  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return new Error(body?.message || fallback);
}

async function resetDashboardData(confirmation: string) {
  const functionResult = await supabase.functions.invoke<{
    ok?: boolean;
    message?: string;
    deleted?: {
      property_events?: number;
      leads?: number;
    };
  }>("reset-dashboard-data", {
    body: { confirmation },
  });

  if (!functionResult.error && functionResult.data?.ok) {
    return {
      deleted: {
        property_events: functionResult.data.deleted?.property_events ?? 0,
        leads: functionResult.data.deleted?.leads ?? 0,
      },
    };
  }

  console.warn("Reset via Edge Function failed. Trying direct delete fallback.", {
    error: functionResult.error,
    data: functionResult.data,
  });

  const [eventsDeleted, leadsDeleted] = await Promise.all([
    clearDashboardTable("property_events"),
    clearDashboardTable("leads"),
  ]);

  return {
    deleted: {
      property_events: eventsDeleted,
      leads: leadsDeleted,
    },
  };
}

async function clearDashboardTable(table: "property_events" | "leads") {
  let deletedCount = 0;

  while (true) {
    const { data, error: selectError } = await supabase.from(table).select("id").limit(500);

    if (selectError) {
      throw new Error(`Não foi possível ler ${table}: ${selectError.message}`);
    }

    const ids = (data ?? []).map((row) => row.id).filter(Boolean);
    if (ids.length === 0) break;

    const { data: deletedRows, error: deleteError } = await supabase
      .from(table)
      .delete()
      .in("id", ids)
      .select("id");

    if (deleteError) {
      throw new Error(`Não foi possível apagar ${table}: ${deleteError.message}`);
    }

    if (!deletedRows || deletedRows.length === 0) {
      throw new Error(
        `O Supabase não apagou registros de ${table}. Confira a policy de DELETE ou faça deploy da Edge Function reset-dashboard-data.`,
      );
    }

    deletedCount += deletedRows.length;
  }

  const { count, error: countError } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Não foi possível conferir ${table}: ${countError.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error(`Ainda existem ${count} registros em ${table}.`);
  }

  return deletedCount;
}

function formatDate(value: string | null) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminSkeleton() {
  return (
    <div className="h-16 animate-pulse border border-border bg-muted/40">
      <div className="flex h-full items-center gap-4 px-4">
        <div className="h-4 w-48 bg-muted" />
        <div className="h-4 w-24 bg-muted" />
        <div className="ml-auto h-8 w-24 bg-muted" />
      </div>
    </div>
  );
}
