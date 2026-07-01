import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, UIEvent } from "react";
import {
  BedDouble,
  Bath,
  Car,
  Home,
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

  const msg = `Olá John, tenho interesse no imóvel "${property.title}" (${property.neighborhood}). Pode me passar mais informações?`;
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
    <article className="group relative flex flex-col overflow-hidden bg-off-white transition duration-300">
      <div className="relative aspect-[1.12/1] overflow-hidden bg-warm-gray">
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
                  className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </Link>
            ))}
          </div>
        </div>

        <span
          className={`absolute left-4 top-4 z-10 inline-flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
            property.featured ? "bg-peach text-deep-green" : "bg-deep-green text-white"
          }`}
        >
          <KeyBadge />
          {property.featured ? "Destaque" : property.purpose}
        </span>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={previousImage}
              className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-deep-green/40 text-white opacity-0 shadow-elegant-sm backdrop-blur transition-all duration-200 hover:bg-deep-green/70 group-hover:opacity-100 md:flex"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-deep-green/40 text-white opacity-0 shadow-elegant-sm backdrop-blur transition-all duration-200 hover:bg-deep-green/70 group-hover:opacity-100 md:flex"
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
                    imageIndex === index ? "w-5 bg-peach" : "w-1.5 bg-white/70 hover:bg-white"
                  }`}
                  aria-label={`Ver imagem ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col border border-t-0 border-deep-green/12 p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sage">
          {property.type} · {property.purpose}
        </p>

        <Link
          to="/imoveis/$propertyId"
          params={propertyRouteParams}
          className="mb-2 text-[clamp(1.25rem,1.45vw,1.6rem)] leading-[1.15] text-deep-green transition-colors hover:text-sage"
        >
          {property.title}
        </Link>

        <p className="mb-5 flex items-center gap-1.5 text-[12px] leading-[1.5] text-sage">
          <MapPin className="h-3.5 w-3.5 text-peach" />
          {property.neighborhood}, {property.city}
          {property.state ? `, ${property.state}` : ""}
        </p>

        <div className="my-3 grid grid-cols-2 gap-px bg-deep-green/10 text-[11px] leading-[1.45] text-sage sm:grid-cols-3">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5 bg-off-white px-3 py-3">
              <BedDouble className="h-3.5 w-3.5 text-deep-green" /> {property.bedrooms} dorm
            </span>
          )}

          {property.suites > 0 && (
            <span className="flex items-center gap-1.5 bg-off-white px-3 py-3">
              <Home className="h-3.5 w-3.5 text-deep-green" /> {property.suites}{" "}
              {property.suites === 1 ? "suíte" : "suítes"}
            </span>
          )}

          <span className="flex items-center gap-1.5 bg-off-white px-3 py-3">
            <Bath className="h-3.5 w-3.5 text-deep-green" /> {property.bathrooms} banh
          </span>

          <span className="flex items-center gap-1.5 bg-off-white px-3 py-3">
            <Car className="h-3.5 w-3.5 text-deep-green" /> {property.parking_spaces} vagas
          </span>

          <span className="flex items-center gap-1.5 bg-off-white px-3 py-3">
            <Maximize className="h-3.5 w-3.5 text-deep-green" /> Terreno {property.total_area} m²
          </span>
        </div>

        <div className="mt-auto pt-2">
          <span className="text-[clamp(1.1rem,1.25vw,1.25rem)] font-semibold text-deep-green">
            {formatPrice(property.price, property.purpose)}
          </span>

          <div className="mt-5 grid grid-cols-2 gap-px bg-deep-green/12">
            <Link
              to="/imoveis/$propertyId"
              params={propertyRouteParams}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 bg-deep-green px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-sage"
            >
              Expandir <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <a
              href={WHATSAPP_LINK(msg)}
              target="_blank"
              rel="noreferrer"
              onClick={handleWhatsAppClick}
              className="inline-flex min-h-12 items-center justify-center gap-1.5 bg-peach px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-deep-green transition hover:bg-white"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function KeyBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path
        d="M17 6.2a5.2 5.2 0 0 1-6.2 5.1l-.7.8a.8.8 0 0 1-.6.3H8.2v1.3a.8.8 0 0 1-.8.8H6.1v1.3a.8.8 0 0 1-.8.8H1.8a.8.8 0 0 1-.8-.8v-2.5a.8.8 0 0 1 .2-.6l5.1-5.1A5.2 5.2 0 1 1 17 6.2Zm-5.7-1.4a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 0 0-2.6 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
