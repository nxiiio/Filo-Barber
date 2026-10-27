import { useState, type FormEvent } from "react";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { useRemote } from "../../hooks/useRemote";
import { ApiError, api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { formatClp, formatDuration } from "../../lib/format";
import type { Barber, Service } from "../../types";
import { useAdminSession } from "./AdminSessionContext";

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.details[0]?.message ?? error.message;
  return "Ocurrió un error inesperado";
}

export function CatalogPage() {
  return (
    <div className="grid gap-14">
      <header className="grid gap-1">
        <h1 className="text-6xl font-black">Servicios y barberos</h1>
        <p className="text-lg text-steel">Lo que se desactiva deja de aparecer en la página de reservas.</p>
      </header>
      <ServicesSection />
      <BarbersSection />
    </div>
  );
}

function ActiveToggle({ active, label, onToggle }: { active: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${label} visible en reservas`}
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full text-sm font-semibold focus-visible:rounded-full"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          active ? "bg-barbicide" : "bg-steel-light"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
            active && "translate-x-5"
          )}
        />
      </span>
      {active ? "Activo" : "Inactivo"}
    </button>
  );
}

function ServicesSection() {
  const { guard } = useAdminSession();
  const services = useRemote(() => guard((token) => api.adminServices(token)), []);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  async function update(id: number, changes: Partial<Omit<Service, "id">>) {
    setError(null);
    try {
      await guard((token) => api.updateService(token, id, changes));
      setEditing(null);
      services.reload();
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  return (
    <section aria-labelledby="services-title" className="grid gap-5">
      <h2 id="services-title" className="text-4xl">
        Servicios
      </h2>
      {(error || services.error) && <Alert>{error ?? services.error?.message}</Alert>}

      <div className="overflow-x-auto rounded-xl border-2 border-graphite bg-white">
        <table className="w-full min-w-[40rem] text-left">
          <thead className="border-b-2 border-graphite text-sm">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Servicio</th>
              <th scope="col" className="px-5 py-3 font-semibold">Duración</th>
              <th scope="col" className="px-5 py-3 font-semibold">Precio</th>
              <th scope="col" className="px-5 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {services.data?.map((service) =>
              editing === service.id ? (
                <ServiceEditRow key={service.id} service={service} onCancel={() => setEditing(null)} onSave={update} />
              ) : (
                <tr key={service.id} className={cn("border-t border-line", !service.active && "text-steel")}>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-sm text-steel">{service.description}</p>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{formatDuration(service.durationMinutes)}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{formatClp(service.priceClp)}</td>
                  <td className="px-5 py-3">
                    <ActiveToggle
                      active={service.active}
                      label={service.name}
                      onToggle={() => update(service.id, { active: !service.active })}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" onClick={() => setEditing(service.id)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <NewServiceForm onCreated={services.reload} />
    </section>
  );
}

interface ServiceEditRowProps {
  service: Service;
  onCancel: () => void;
  onSave: (id: number, changes: Partial<Omit<Service, "id">>) => Promise<void>;
}

function ServiceEditRow({ service, onCancel, onSave }: ServiceEditRowProps) {
  const [duration, setDuration] = useState(String(service.durationMinutes));
  const [price, setPrice] = useState(String(service.priceClp));

  return (
    <tr className="border-t border-line bg-barbicide-tint/50">
      <td className="px-5 py-3 font-semibold">{service.name}</td>
      <td className="px-5 py-3">
        <label className="sr-only" htmlFor={`duration-${service.id}`}>Duración en minutos</label>
        <input
          id={`duration-${service.id}`}
          type="number"
          min={15}
          step={15}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="min-h-10 w-24 rounded-md border-[1.5px] border-line bg-white px-3 tabular-nums"
        />
      </td>
      <td className="px-5 py-3">
        <label className="sr-only" htmlFor={`price-${service.id}`}>Precio en pesos</label>
        <input
          id={`price-${service.id}`}
          type="number"
          min={0}
          step={500}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="min-h-10 w-28 rounded-md border-[1.5px] border-line bg-white px-3 tabular-nums"
        />
      </td>
      <td className="px-5 py-3" colSpan={2}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Descartar
          </Button>
          <Button onClick={() => onSave(service.id, { durationMinutes: Number(duration), priceClp: Number(price) })}>
            Guardar
          </Button>
        </div>
      </td>
    </tr>
  );
}

function NewServiceForm({ onCreated }: { onCreated: () => void }) {
  const { guard } = useAdminSession();
  const [form, setForm] = useState({ name: "", description: "", durationMinutes: "30", priceClp: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await guard((token) =>
        api.createService(token, {
          name: form.name,
          description: form.description,
          durationMinutes: Number(form.durationMinutes),
          priceClp: Number(form.priceClp),
          active: true
        })
      );
      setForm({ name: "", description: "", durationMinutes: "30", priceClp: "" });
      onCreated();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border-2 border-dashed border-line p-5">
      <h3 className="text-2xl">Agregar servicio</h3>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 md:grid-cols-[1fr_2fr_8rem_9rem]">
        <Field label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Field
          label="Descripción"
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Field
          label="Minutos"
          type="number"
          min={15}
          step={15}
          required
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
        />
        <Field
          label="Precio"
          type="number"
          min={0}
          step={500}
          required
          value={form.priceClp}
          onChange={(e) => setForm({ ...form, priceClp: e.target.value })}
        />
      </div>
      <Button type="submit" variant="secondary" loading={saving} className="justify-self-start">
        Agregar servicio
      </Button>
    </form>
  );
}

function BarbersSection() {
  const { guard } = useAdminSession();
  const barbers = useRemote(() => guard((token) => api.adminBarbers(token)), []);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", specialty: "" });
  const [saving, setSaving] = useState(false);

  async function toggle(barber: Barber) {
    setError(null);
    try {
      await guard((token) => api.updateBarber(token, barber.id, { active: !barber.active }));
      barbers.reload();
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await guard((token) => api.createBarber(token, { ...form, active: true }));
      setForm({ name: "", specialty: "" });
      barbers.reload();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="barbers-title" className="grid gap-5">
      <h2 id="barbers-title" className="text-4xl">
        Barberos
      </h2>
      {(error || barbers.error) && <Alert>{error ?? barbers.error?.message}</Alert>}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {barbers.data?.map((barber) => (
          <li
            key={barber.id}
            className={cn(
              "flex items-center justify-between gap-4 rounded-xl border-2 bg-white px-5 py-4",
              barber.active ? "border-graphite" : "border-line text-steel"
            )}
          >
            <div className="grid">
              <span className="font-display text-2xl font-bold">{barber.name}</span>
              <span className="text-sm text-steel">{barber.specialty}</span>
            </div>
            <ActiveToggle active={barber.active} label={barber.name} onToggle={() => toggle(barber)} />
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="grid gap-4 rounded-xl border-2 border-dashed border-line p-5">
        <h3 className="text-2xl">Agregar barbero</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field
            label="Especialidad"
            required
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />
        </div>
        <Button type="submit" variant="secondary" loading={saving} className="justify-self-start">
          Agregar barbero
        </Button>
      </form>
    </section>
  );
}
