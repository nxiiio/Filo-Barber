import { NavLink, Navigate, Outlet } from "react-router";
import { Button } from "../../components/Button";
import { PoleMark } from "../../components/PoleMark";
import { cn } from "../../lib/cn";
import { useAdminSession } from "./AdminSessionContext";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex min-h-11 items-center rounded-full px-4 font-semibold no-underline focus-visible:rounded-full",
    isActive ? "bg-white text-graphite" : "text-white hover:bg-white/10"
  );

export function AdminLayout() {
  const { session, logout } = useAdminSession();
  if (!session) return <Navigate to="/admin/ingresar" replace />;

  return (
    <div className="min-h-dvh">
      <header className="bg-graphite text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <span className="inline-flex items-center gap-2">
            <PoleMark />
            <span className="font-display text-2xl font-black">Panel Filo</span>
          </span>
          <nav aria-label="Administración" className="order-last w-full sm:order-none sm:w-auto">
            <ul className="flex gap-1">
              <li>
                <NavLink to="/admin" end className={tabClass}>
                  Agenda
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/catalogo" className={tabClass}>
                  Servicios y barberos
                </NavLink>
              </li>
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-steel-light md:inline">{session.admin.email}</span>
            <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
