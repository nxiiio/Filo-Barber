import { NavLink } from "react-router";
import { cn } from "../lib/cn";
import { SHOP } from "../lib/shop";
import { PoleMark } from "./PoleMark";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex min-h-11 items-center rounded-full px-4 font-semibold no-underline focus-visible:rounded-full",
    isActive ? "bg-graphite text-white" : "text-graphite hover:bg-porcelain-deep"
  );

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-graphite no-underline"
          aria-label={`${SHOP.name}, ${SHOP.tagline}. Ir al inicio`}
        >
          <PoleMark />
          <span className="font-display text-3xl leading-none font-black">{SHOP.name}</span>
        </NavLink>
        <nav aria-label="Principal">
          <ul className="flex gap-1">
            <li>
              <NavLink to="/" end className={navClass}>
                Reservar
              </NavLink>
            </li>
            <li>
              <NavLink to="/mi-reserva" className={navClass}>
                Mi reserva
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
