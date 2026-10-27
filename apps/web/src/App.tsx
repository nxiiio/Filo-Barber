import { Link, Outlet, Route, Routes } from "react-router";
import { SiteHeader } from "./components/SiteHeader";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminLoginPage } from "./features/admin/AdminLoginPage";
import { AdminSessionProvider } from "./features/admin/AdminSessionContext";
import { AgendaPage } from "./features/admin/AgendaPage";
import { CatalogPage } from "./features/admin/CatalogPage";
import { BookingPage } from "./features/booking/BookingPage";
import { MyBookingPage } from "./features/my-booking/MyBookingPage";
import { SHOP } from "./lib/shop";

function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-6 text-sm text-steel">
          <p>
            {SHOP.name} {SHOP.tagline.toLowerCase()}, {SHOP.address}
          </p>
          <p>
            <a href={`tel:${SHOP.phone.replace(/\s/g, "")}`}>{SHOP.phone}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto grid max-w-6xl justify-items-start gap-4 px-5 py-20">
      <h1 className="text-6xl font-black">Esta página no existe</h1>
      <p className="text-steel">Puede que el enlace esté mal escrito.</p>
      <Link to="/" className="font-semibold">
        Ir a reservar una hora
      </Link>
    </div>
  );
}

export function App() {
  return (
    <AdminSessionProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<BookingPage />} />
          <Route path="mi-reserva" element={<MyBookingPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/ingresar" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AgendaPage />} />
          <Route path="catalogo" element={<CatalogPage />} />
        </Route>
      </Routes>
    </AdminSessionProvider>
  );
}
