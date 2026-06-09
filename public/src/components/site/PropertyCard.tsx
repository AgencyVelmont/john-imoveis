import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, UIEvent } from "react";
import {
  BedDouble,
  Bath,
  Car,
  Maximize,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Property, formatPrice, insertPropertyEvent } from "@/data/properties";
import { WHATSAPP_LINK } from "@/lib/site";

export function PropertyCard({ property }: { property: Property }) {
  const [imageIndex, setImageIndex] = useState(0);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const pointerStartXRef = useRef(0);
  const pointerMovedRef = useRef(false);

  const msg = `Olá Felipe, tenho interesse no imóvel "${property.title}" (${property.neighborhood}). Pode me passar mais informações?`;
  const propertyRouteParams = { propertyId: property.id };

  const images = useMemo(
    () =>
      property.images && property.images.length > 0
        ? property.images.map((image) => image.url)
        : [property.image],
    [property.image, property.images],
  );

  const hasMultipleImages = images.length > 1;
  const carouselTrackStyle = {
    "--property-image-index": imageIndex,
  } as CSSProperties;

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  const handleWhatsAppClick = () => {
    void insertPropertyEvent(property.id, "whatsapp_click");
  };

  const previousImage = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setImageIndex((current) => (current === 0 ? images.length - 1 : current - 1));
    },
    [images.length],
  );

  const nextImage = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setImageIndex((current) => (current === images.length - 1 ? 0 : current + 1));
    },
    [images.length],
  );

  const goToImage = useCallback((event: MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();

    setImageIndex(index);
    mobileScrollRef.current?.scrollTo({
      left: mobileScrollRef.current.clientWidth * index,
      behavior: "smooth",
    });
  }, []);

  const handleMobileScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!hasMultipleImages || scrollFrameRef.current !== null) {
        return;
      }

      const container = event.currentTarget;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;

        const nextIndex = Math.round(container.scrollLeft / container.clientWidth);
        const boundedIndex = Math.min(Math.max(nextIndex, 0), images.length - 1);
        setImageIndex((current) => (current === boundedIndex ? current : boundedIndex));
      });
    },
    [hasMultipleImages, images.length],
  );

  const handlePointerDown = useCallback((event: PointerEvent<HTMLAnchorElement>) => {
    pointerStartXRef.current = event.clientX;
    pointerMovedRef.current = false;
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLAnchorElement>) => {
    if (Math.abs(event.clientX - pointerStartXRef.current) > 8) {
      pointerMovedRef.current = true;
    }
  }, []);

  const handleSlideClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (!pointerMovedRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    pointerMovedRef.current = false;
  }, []);

  return (
    <article className="group flex flex-col overflow-hidden bg-white shadow-elegant-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elegant-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="absolute inset-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth md:overflow-hidden md:scroll-auto [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div
            className="flex h-full md:transition-transform md:duration-[220ms] md:ease-out md:[transform:translateX(calc(var(--property-image-index)*-100%))]"
            style={carouselTrackStyle}
          >
            {images.map((image, index) => (
              <Link
                key={`${image}-${index}`}
                to="/imoveis/$propertyId"
                params={propertyRouteParams}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onClick={handleSlideClick}
                className="block h-full min-w-full snap-center"
              >
                <img
                  src={image}
                  alt={`${property.title} - foto ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] md:group-hover:scale-[1.04]"
                />
              </Link>
            ))}
          </div>
        </div>

        <span
          className={`absolute left-4 top-4 z-10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
            property.featured ? "bg-gold text-navy" : "bg-navy text-white"
          }`}
        >
          {property.featured ? "Destaque" : property.purpose}
        </span>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={previousImage}
              className="absolute left-3 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 shadow-elegant-sm backdrop-blur-sm transition-all duration-200 hover:bg-black/60 group-hover:opacity-100 md:flex"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 shadow-elegant-sm backdrop-blur-sm transition-all duration-200 hover:bg-black/60 group-hover:opacity-100 md:flex"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => goToImage(event, index)}
                  className={`h-1.5 rounded-full shadow-sm transition-all duration-200 ${
                    imageIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white/90"
                  }`}
                  aria-label={`Ver imagem ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-gold">
          {property.type} · {property.purpose}
        </p>

        <Link
          to="/imoveis/$propertyId"
          params={propertyRouteParams}
          className="mb-1.5 font-display text-xl font-normal leading-snug text-navy transition-colors hover:text-gold"
        >
          {property.title}
        </Link>

        <p className="mb-4 flex items-center gap-1 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-navy-light" />
          {property.neighborhood}, {property.city}
        </p>

        <div className="my-2 flex flex-wrap gap-4 border-y border-border py-4 text-[12px] text-[oklch(0.45_0.01_90)]">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-3.5 w-3.5 text-navy-light" /> {property.bedrooms} dorm
            </span>
          )}

          <span className="flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5 text-navy-light" /> {property.bathrooms} banh
          </span>

          <span className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-navy-light" /> {property.parking_spaces} vagas
          </span>

          <span className="flex items-center gap-1.5">
            <Maximize className="h-3.5 w-3.5 text-navy-light" /> {property.total_area} m²
          </span>
        </div>

        <div className="mt-auto pt-2">
          <span className="font-display text-[22px] font-medium text-navy">
            {formatPrice(property.price, property.purpose)}
          </span>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/imoveis/$propertyId"
              params={propertyRouteParams}
              className="premium-cta inline-flex min-h-10 items-center justify-center gap-1.5 bg-navy px-3 py-2 text-center text-[11px] uppercase tracking-[0.06em] text-white hover:bg-navy-light"
            >
              Expandir <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <a
              href={WHATSAPP_LINK(msg)}
              target="_blank"
              rel="noreferrer"
              onClick={handleWhatsAppClick}
              className="premium-cta inline-flex min-h-10 items-center justify-center gap-1.5 bg-whatsapp px-3 py-2 text-center text-[11px] uppercase tracking-[0.06em] text-white hover:bg-[oklch(0.6_0.18_145)]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
