import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

const stilBaza =
  // min-h-11 = 44px: ținta minimă de atingere pe telefon.
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tema px-5 " +
  "text-sm font-bold uppercase tracking-[0.12em] transition-opacity " +
  "disabled:opacity-60 focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-accent";

const stiluri = {
  principal: "bg-accent text-accent-text hover:opacity-90",
  secundar:
    "border border-text-slab text-accent hover:border-accent hover:bg-suprafata",
} as const;

type Fel = keyof typeof stiluri;

export function Buton({
  fel = "principal",
  className = "",
  children,
  ...rest
}: ComponentProps<"button"> & { fel?: Fel; children: ReactNode }) {
  return (
    <button className={`${stilBaza} ${stiluri[fel]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButonLegatura({
  fel = "principal",
  className = "",
  children,
  ...rest
}: ComponentProps<typeof Link> & { fel?: Fel; children: ReactNode }) {
  return (
    <Link className={`${stilBaza} ${stiluri[fel]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
