import { BedDouble, Bath, Car, Home, Maximize, MessageCircle, MapPin } from "lucide-react";
import { Property, formatPrice } from "@/data/properties";
import { WHATSAPP_LINK } from "@/lib/site";

export function PropertyCard({ property }: { property: Property }) {
  const msg = `Olá Felipe, tenho interesse no imóvel "${property.title}" (${property.neighborhood}). Pode me passar mais informações?`;
  return (
    <article className="group flex flex-col overflow-hidden bg-white shadow-elegant-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elegant-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={property.image}
          alt={property.title}
          loading="lazy"
          width={1024}
          height={768}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className={`absolute left-4 top-4 px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
            property.featured ? "bg-gold text-navy" : "bg-navy text-white"
          }`}
        >
          {property.featured ? "Destaque" : property.operation}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-gold">{property.type} · {property.operation}</p>
        <h3 className="mb-1.5 font-display text-xl font-normal leading-snug text-navy">{property.title}</h3>
        <p className="mb-4 flex items-center gap-1 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-navy-light" />
          {property.neighborhood}, {property.city}
        </p>

        <div className="my-2 flex flex-wrap gap-4 border-y border-border py-4 text-[12px] text-[oklch(0.45_0.01_90)]">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5 text-navy-light" /> {property.bedrooms} dorm</span>
          )}
          {property.suites > 0 && (
            <span className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-navy-light" /> {property.suites} {property.suites === 1 ? "suíte" : "suítes"}
            </span>
          )}
          <span className="flex items-center gap-1.5"><Bath className="h-3.5 w-3.5 text-navy-light" /> {property.bathrooms} banh</span>
          <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-navy-light" /> {property.parking} vagas</span>
          <span className="flex items-center gap-1.5"><Maximize className="h-3.5 w-3.5 text-navy-light" /> {property.area} m²</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-[22px] font-medium text-navy">{formatPrice(property.price, property.operation)}</span>
          <a
            href={WHATSAPP_LINK(msg)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-[oklch(0.7_0.18_145)] px-3.5 py-2 text-[11px] uppercase tracking-[0.06em] text-white transition-transform hover:scale-105"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
