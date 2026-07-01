import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

type EditorialButtonProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  type?: "button" | "submit";
  target?: string;
  rel?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "peach" | "green" | "white" | "whatsapp";
  className?: string;
};

const toneClasses = {
  peach: "bg-peach text-deep-green hover:brightness-105",
  green: "bg-deep-green text-white hover:bg-sage",
  white: "bg-white text-deep-green hover:bg-warm-gray",
  whatsapp: "bg-whatsapp text-white hover:brightness-95",
};

const content = (children: ReactNode) => (
  <>
    <span className="relative z-10">{children}</span>
    <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
  </>
);

export function EditorialButton({
  children,
  to,
  href,
  type = "button",
  target,
  rel,
  onClick,
  disabled,
  tone = "peach",
  className = "",
}: EditorialButtonProps) {
  const classes = `editorial-button group inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3 text-[clamp(0.75rem,0.85vw,0.86rem)] font-bold uppercase tracking-[0.16em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach focus-visible:ring-offset-2 focus-visible:ring-offset-deep-green disabled:pointer-events-none disabled:opacity-60 ${toneClasses[tone]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content(children)}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target={target} rel={rel} onClick={onClick} className={classes}>
        {content(children)}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {content(children)}
    </button>
  );
}
