interface Props {
  tag?: string;
  title: string;
  titleEm?: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function SectionHeader({ tag, title, titleEm, subtitle, align = "left", light }: Props) {
  return (
    <div className={`mb-14 ${align === "center" ? "text-center" : ""}`}>
      {tag && <span className="eyebrow mb-3 block">{tag}</span>}
      <h2
        className={`font-display text-[clamp(28px,3.2vw,44px)] font-light leading-[1.12] ${light ? "text-white" : "text-navy"}`}
      >
        {title} {titleEm && <em className="not-italic italic text-gold">{titleEm}</em>}
      </h2>
      {subtitle && (
        <p
          className={`mt-5 max-w-2xl text-[14px] leading-[1.6] ${align === "center" ? "mx-auto" : ""} ${light ? "text-white/65" : "text-muted-foreground"}`}
        >
          {subtitle}
        </p>
      )}
      <div className={`mt-5 h-[2px] w-12 bg-gold ${align === "center" ? "mx-auto" : ""}`} />
    </div>
  );
}
