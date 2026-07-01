import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: SITE.name,
  description:
    "Corretor de imóveis com atendimento personalizado, visão jurídica e foco em segurança nas transações.",
  telephone: SITE.phone,
  email: SITE.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Santarém",
    addressRegion: "PA",
    addressCountry: "BR",
  },
  areaServed: SITE.region,
  sameAs: [SITE.instagram],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      contactType: "Atendimento imobiliário",
      availableLanguage: "Portuguese",
      url: SITE.whatsappUrl,
    },
  ],
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1] text-foreground">
          404
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  if (import.meta.env.DEV) {
    console.error(error);
  }
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo saiu do esperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "John Andrade | Corretor de Imóveis" },
      {
        name: "description",
        content:
          "John Andrade: corretor de imóveis com assessoria jurídica-imobiliária, atendimento personalizado e curadoria de bons negócios.",
      },
      { name: "author", content: SITE.name },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "John Andrade | Corretor de Imóveis" },
      {
        property: "og:description",
        content: "Negócios imobiliários com segurança, tecnologia e atendimento personalizado.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE.siteUrl },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "John Andrade Corretor de Imóveis" },
      { property: "og:image", content: `${SITE.siteUrl}/og-image.jpg` },
      { name: "telephone", content: SITE.phone },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: SITE.instagramHandle },
      { "script:ld+json": organizationSchema },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
