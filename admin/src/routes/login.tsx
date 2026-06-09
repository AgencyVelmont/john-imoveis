import React from "react";
import { supabase } from "@/lib/supabase";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo-branca.png";
import { siteInfo } from "@/lib/site-info";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(authErrorMessage(error));
      return;
    }

    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-navy text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />

        <div
          className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, oklch(0.76 0.10 80 / 0.15), transparent 70%)",
          }}
        />

        <img src={logo} alt={siteInfo.name} className="h-12 w-auto object-contain relative" />

        <div className="relative max-w-md">
          <p className="eyebrow mb-3">Painel administrativo</p>

          <h2 className="font-display text-5xl leading-tight font-light">
            Gerencie seu{" "}
            <em className="text-gold-light not-italic font-display italic">portfólio</em> de imóveis
            em Santarém.
          </h2>

          <div className="gold-line mt-6" />
        </div>

        <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 relative">
          {siteInfo.phoneDisplay} · Santarém, Pará
        </p>
      </aside>

      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="eyebrow mb-2">Acessar painel</p>

          <h1 className="font-display text-4xl text-navy mb-2">Bem-vindo de volta</h1>

          <p className="text-sm text-muted-foreground mb-10">
            Entre com suas credenciais para continuar.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMessage && (
              <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                E-mail
              </span>

              <input
                name="email"
                type="email"
                required
                className="w-full h-12 px-3 bg-background border border-input text-sm outline-none focus:border-gold transition-colors"
                placeholder="seu@email.com"
              />
            </label>

            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Senha
              </span>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full h-12 px-3 pr-12 bg-background border border-input text-sm outline-none focus:border-gold transition-colors"
                  placeholder="Senha"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-navy"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center h-12 bg-navy text-white text-xs tracking-[0.1em] uppercase hover:bg-navy-mid transition-colors"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground mt-8 text-center leading-6">
            Esqueceu a senha?{" "}
            <a href={siteInfo.phoneHref} className="text-navy transition-colors hover:text-gold">
              Recuperar acesso por telefone
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

function authErrorMessage(error: unknown) {
  const message = String((error as { message?: string }).message ?? "").toLowerCase();

  if (message.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado no Supabase Auth.";
  }

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha não conferem com um usuário cadastrado no Supabase Auth.";
  }

  if (message.includes("password")) {
    return "A senha precisa atender às regras do Supabase.";
  }

  return "Não foi possível entrar.";
}
