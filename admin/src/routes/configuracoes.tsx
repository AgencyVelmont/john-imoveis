import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, BellRing, Palette, RefreshCw, Send, Trash2, UserPlus } from "lucide-react";
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
  disablePushNotifications,
  getPushStatus,
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
  active?: boolean;
  confirmed_at: string | null;
};

function Configuracoes() {
  const [settings, setSettings] = React.useState<SiteSettingsInput>(defaultSiteSettings);
  const [themeDraft, setThemeDraft] = React.useState(siteThemeFromSettings(defaultSiteSettings));
  const [savedTheme, setSavedTheme] = React.useState(siteThemeFromSettings(defaultSiteSettings));
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
        const loadedSettings = await loadSiteSettings();
        setSettings(loadedSettings);
        setThemeDraft(siteThemeFromSettings(loadedSettings));
        setSavedTheme(siteThemeFromSettings(loadedSettings));
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
      ...themeSettingsFromDraft(themeDraft),
    };

    try {
      const themeChanged = JSON.stringify(themeDraft) !== JSON.stringify(savedTheme);
      if (themeChanged) {
        const invalidMessage = criticalThemeIssue(themeDraft);
        if (invalidMessage) {
          toast.error(invalidMessage);
          return;
        }

        const confirmed = window.confirm(
          "Publicar esta nova paleta no site público? As cores serão aplicadas para visitantes após salvar.",
        );
        if (!confirmed) return;
      }

      await saveSiteSettings(values);
      setSettings(values);
      setSavedTheme(themeDraft);
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
    const role = text(formData.get("admin_role")) === "super_admin" ? "super_admin" : "admin";

    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        message?: string;
      }>("create-admin", {
        body: { name, email, password, role },
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

  const handleUpdateAdmin = async (
    admin: AdminUser,
    values: { role?: string; active?: boolean },
  ) => {
    const nextRole = values.role ?? admin.role;
    const nextActive = values.active ?? Boolean(admin.active);

    if (admin.id === currentUserId && (nextRole !== "super_admin" || !nextActive)) {
      setAdminErrorMessage("Você não pode remover seu próprio acesso de superadministrador.");
      return;
    }

    setAdminErrorMessage("");
    setAdminSuccessMessage("");

    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        message?: string;
      }>("update-admin", {
        body: { userId: admin.id, role: nextRole, active: nextActive },
      });

      if (error) throw await functionInvokeError(error, "Não foi possível alterar o admin.");
      if (!data?.ok) throw new Error(data?.message || "Não foi possível alterar o admin.");

      setAdminSuccessMessage("Admin atualizado com sucesso.");
      toast.success("Admin atualizado.");
      await loadAdmins();
    } catch (error) {
      console.error(error);
      const message = authErrorMessage(error, "Não foi possível alterar o admin.");
      setAdminErrorMessage(message);
      toast.error(message);
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

  const handleDisablePush = async () => {
    setPushLoading(true);
    setPushMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Faça login novamente para desativar notificações.");

      await disablePushNotifications(user.id);
      await refreshPushStatus();
      setPushMessage("Notificações desativadas neste dispositivo.");
      toast.success("Notificações desativadas.");
    } catch (error) {
      console.error(error);
      const message = pushErrorMessage(error);
      setPushMessage(message);
      toast.error(message);
    } finally {
      setPushLoading(false);
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

          <div className="mt-6">
            <Card title="Personalização do site" eyebrow="Cores públicas">
              <ThemeEditor
                value={themeDraft}
                savedValue={savedTheme}
                onChange={setThemeDraft}
                onCancel={() => setThemeDraft(savedTheme)}
                onRestoreDefault={() => setThemeDraft(siteThemeFromSettings(defaultSiteSettings))}
              />
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                  minLength={8}
                  className={inp}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </label>
              <label>
                <span className={labelCls}>Papel</span>
                <select name="admin_role" className={inp} defaultValue="admin">
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super admin</option>
                </select>
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

        <Card title="Notificações de novos leads" eyebrow="Push">
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
                    A permissão só será solicitada ao clicar em ativar. No iPhone, o push funciona
                    apenas com o CRM instalado na tela inicial em navegadores compatíveis.
                  </p>
                  {pushStatus === "denied" && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Para desbloquear, abra as configurações do navegador, libere notificações para
                      este site e clique em tentar novamente.
                    </p>
                  )}
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
                disabled={
                  pushLoading ||
                  pushStatus === "unsupported" ||
                  pushStatus === "denied" ||
                  pushStatus === "ios-install-required"
                }
                className="inline-flex h-10 items-center justify-center gap-2 bg-navy px-4 text-xs uppercase tracking-[0.1em] text-white transition-colors hover:bg-navy-mid disabled:opacity-50"
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                {pushLoading ? "Ativando..." : "Ativar notificações"}
              </button>
              <button
                type="button"
                onClick={handleDisablePush}
                disabled={pushLoading || pushStatus !== "active"}
                className="inline-flex h-10 items-center justify-center gap-2 border border-border px-4 text-xs uppercase tracking-[0.1em] text-navy transition-colors hover:border-gold disabled:opacity-50"
              >
                <BellOff className="h-4 w-4" strokeWidth={1.5} />
                Desativar
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
              <button
                type="button"
                onClick={refreshPushStatus}
                disabled={pushLoading}
                className="inline-flex h-10 items-center justify-center gap-2 border border-border px-4 text-xs uppercase tracking-[0.1em] text-navy transition-colors hover:border-gold disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                Tentar novamente
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
              <table className="min-w-[980px] w-full">
                <thead className="bg-muted/40">
                  <tr className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <th className="px-4 py-3 text-left font-normal">Admin</th>
                    <th className="px-4 py-3 text-left font-normal">Papel</th>
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
                          <select
                            value={admin.role}
                            onChange={(event) =>
                              handleUpdateAdmin(admin, { role: event.currentTarget.value })
                            }
                            disabled={admin.id === currentUserId || Boolean(deletingAdminId)}
                            className="h-9 border border-border bg-background px-2 text-xs text-navy outline-none transition-colors focus:border-gold disabled:opacity-50"
                          >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                              admin.active
                                ? "bg-gold/15 text-navy"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {admin.active ? "Ativo" : "Inativo"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateAdmin(admin, { active: !admin.active })}
                            disabled={admin.id === currentUserId || Boolean(deletingAdminId)}
                            className="ml-2 text-[10px] uppercase tracking-[0.12em] text-sage underline-offset-4 hover:text-navy hover:underline disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {admin.active ? "Desativar" : "Ativar"}
                          </button>
                          {!admin.confirmed_at && (
                            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                              Auth pendente
                            </p>
                          )}
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

type SiteThemeDraft = {
  color_primary: string;
  color_secondary: string;
  color_button: string;
  color_accent: string;
  color_text: string;
  color_background: string;
  color_surface: string;
};

const colorFields: Array<{
  key: keyof SiteThemeDraft;
  label: string;
  description: string;
}> = [
  {
    key: "color_primary",
    label: "Cor principal",
    description: "Cabeçalhos, navegação, títulos e blocos principais.",
  },
  {
    key: "color_secondary",
    label: "Cor secundária",
    description: "Textos auxiliares, etiquetas e elementos de apoio.",
  },
  {
    key: "color_button",
    label: "Cor dos botões",
    description: "Chamadas de ação e botões principais do site.",
  },
  {
    key: "color_accent",
    label: "Detalhes e destaques",
    description: "Destaques, links ativos, badges e pequenos acentos visuais.",
  },
  {
    key: "color_text",
    label: "Cor de textos",
    description: "Texto principal em áreas claras do site.",
  },
  {
    key: "color_background",
    label: "Fundo principal",
    description: "Fundo geral das páginas públicas.",
  },
  {
    key: "color_surface",
    label: "Fundo secundário",
    description: "Cards, formulários e superfícies de conteúdo.",
  },
];

function ThemeEditor({
  value,
  savedValue,
  onChange,
  onCancel,
  onRestoreDefault,
}: {
  value: SiteThemeDraft;
  savedValue: SiteThemeDraft;
  onChange: (value: SiteThemeDraft) => void;
  onCancel: () => void;
  onRestoreDefault: () => void;
}) {
  const warnings = themeWarnings(value);
  const criticalIssue = criticalThemeIssue(value);
  const changed = JSON.stringify(value) !== JSON.stringify(savedValue);
  const onButton = readableTextColor(value.color_button);
  const buttonHover = shadeHex(value.color_button, -10);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {colorFields.map((field) => {
          const currentValue = value[field.key];
          const valid = isHexColor(currentValue);

          return (
            <div key={field.key} className="border border-border bg-background/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">{field.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {field.description}
                  </p>
                </div>
                <span
                  className="h-9 w-9 shrink-0 border border-border"
                  style={{ backgroundColor: valid ? currentValue : "#ffffff" }}
                />
              </div>
              <div className="mt-4 grid grid-cols-[52px_1fr] gap-3">
                <input
                  type="color"
                  value={valid ? currentValue : "#000000"}
                  onChange={(event) =>
                    onChange({ ...value, [field.key]: event.currentTarget.value })
                  }
                  className="h-11 w-full cursor-pointer border border-border bg-transparent p-1"
                  aria-label={field.label}
                />
                <input
                  value={currentValue}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      [field.key]: normalizeColorInput(event.currentTarget.value),
                    })
                  }
                  className={inp}
                  placeholder="#014340"
                />
              </div>
              {!valid && <p className="mt-2 text-xs text-destructive">Use hexadecimal #RRGGBB.</p>}
            </div>
          );
        })}
      </div>

      <div
        className="border border-border p-5"
        style={{ backgroundColor: value.color_background, color: value.color_text }}
      >
        <div
          className="border p-5"
          style={{
            backgroundColor: value.color_surface,
            borderColor: alphaHex(value.color_primary, 0.18),
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
            <Palette className="h-4 w-4" />
            Preview antes de publicar
          </div>
          <h3 className="font-display text-2xl" style={{ color: value.color_primary }}>
            Imóvel em destaque
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: value.color_text }}>
            Esta prévia simula textos, card e botão do site público com a paleta atual.
          </p>
          <button
            type="button"
            className="mt-4 h-10 px-5 text-xs uppercase tracking-[0.1em]"
            style={{ backgroundColor: value.color_button, color: onButton }}
          >
            Botão principal
          </button>
          <span
            className="ml-3 inline-flex h-10 items-center px-4 text-xs uppercase tracking-[0.1em]"
            style={{
              backgroundColor: value.color_accent,
              color: readableTextColor(value.color_accent),
            }}
          >
            Destaque
          </span>
          <p className="mt-3 text-xs" style={{ color: value.color_secondary }}>
            Hover do botão será gerado automaticamente como {buttonHover}.
          </p>
        </div>
      </div>

      {(criticalIssue || warnings.length > 0) && (
        <div
          className={`border px-4 py-3 text-sm ${
            criticalIssue
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-gold/40 bg-gold/10 text-navy"
          }`}
        >
          {criticalIssue || warnings.join(" ")}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={!changed}
          className="h-10 border border-border px-4 text-xs uppercase tracking-[0.1em] text-navy hover:border-gold disabled:opacity-50"
        >
          Cancelar alterações
        </button>
        <button
          type="button"
          onClick={onRestoreDefault}
          className="h-10 border border-border px-4 text-xs uppercase tracking-[0.1em] text-navy hover:border-gold"
        >
          Restaurar paleta padrão
        </button>
      </div>
    </div>
  );
}

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
        className="h-11 w-full bg-transparent font-display text-[clamp(1.5rem,2vw,1.9rem)] leading-[1.1] text-navy outline-none"
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

function siteThemeFromSettings(settings: SiteSettingsInput): SiteThemeDraft {
  return {
    color_primary: normalizeHex(settings.color_primary, defaultSiteSettings.color_primary),
    color_secondary: normalizeHex(settings.color_secondary, defaultSiteSettings.color_secondary),
    color_button: normalizeHex(settings.color_button, defaultSiteSettings.color_button),
    color_accent: normalizeHex(settings.color_accent, defaultSiteSettings.color_accent),
    color_text: normalizeHex(settings.color_text, defaultSiteSettings.color_text),
    color_background: normalizeHex(settings.color_background, defaultSiteSettings.color_background),
    color_surface: normalizeHex(settings.color_surface, defaultSiteSettings.color_surface),
  };
}

function themeSettingsFromDraft(theme: SiteThemeDraft) {
  return {
    color_primary: normalizeHex(theme.color_primary, defaultSiteSettings.color_primary),
    color_secondary: normalizeHex(theme.color_secondary, defaultSiteSettings.color_secondary),
    color_button: normalizeHex(theme.color_button, defaultSiteSettings.color_button),
    color_accent: normalizeHex(theme.color_accent, defaultSiteSettings.color_accent),
    color_text: normalizeHex(theme.color_text, defaultSiteSettings.color_text),
    color_background: normalizeHex(theme.color_background, defaultSiteSettings.color_background),
    color_surface: normalizeHex(theme.color_surface, defaultSiteSettings.color_surface),
  };
}

function themeWarnings(theme: SiteThemeDraft) {
  const warnings: string[] = [];

  if (contrastRatio(theme.color_text, theme.color_background) < 7) {
    warnings.push("Contraste entre texto e fundo principal está abaixo do ideal.");
  }

  if (contrastRatio(theme.color_text, theme.color_surface) < 7) {
    warnings.push("Contraste entre texto e fundo secundário está abaixo do ideal.");
  }

  if (contrastRatio(readableTextColor(theme.color_button), theme.color_button) < 4.5) {
    warnings.push("A cor do botão está próxima demais da cor automática do texto.");
  }

  return warnings;
}

function criticalThemeIssue(theme: SiteThemeDraft) {
  const values = Object.values(theme);
  if (values.some((value) => !isHexColor(value))) {
    return "Corrija os valores hexadecimais antes de publicar a paleta.";
  }

  if (contrastRatio(theme.color_text, theme.color_background) < 4.5) {
    return "Combinação bloqueada: texto e fundo principal ficam ilegíveis.";
  }

  if (contrastRatio(theme.color_text, theme.color_surface) < 4.5) {
    return "Combinação bloqueada: texto e fundo secundário ficam ilegíveis.";
  }

  if (contrastRatio(readableTextColor(theme.color_button), theme.color_button) < 4.5) {
    return "Combinação bloqueada: botão sem contraste suficiente.";
  }

  return "";
}

function normalizeColorInput(value: string) {
  const text = value.trim().toLowerCase();
  if (!text) return "#";
  return text.startsWith("#") ? text.slice(0, 7) : `#${text.slice(0, 6)}`;
}

function normalizeHex(value: unknown, fallback: string) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  return isHexColor(text) ? text : fallback;
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function readableTextColor(hex: string) {
  return relativeLuminance(hex) > 0.52 ? "#014340" : "#ffffff";
}

function contrastRatio(first: string, second: string) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function shadeHex(hex: string, percent: number) {
  const next = hexToRgb(hex).map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel + (percent / 100) * 255))),
  );

  return `#${next.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function alphaHex(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex, defaultSiteSettings.color_primary).slice(1);
  return [0, 2, 4].map((start) => Number.parseInt(normalized.slice(start, start + 2), 16));
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
    "missing-vapid-key": "Erro de configuração",
    "ios-install-required": "Instalação necessária no iPhone",
    unsupported: "Navegador sem suporte",
    denied: "Permissão bloqueada no navegador",
    inactive: "Notificações desativadas",
    active: "Notificações ativadas",
    expired: "Inscrição expirada",
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

  if (functionResult.error) {
    throw await functionInvokeError(functionResult.error, "Não foi possível resetar o dashboard.");
  }

  throw new Error(functionResult.data?.message || "Não foi possível resetar o dashboard.");
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
