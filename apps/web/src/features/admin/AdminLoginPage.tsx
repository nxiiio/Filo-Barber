import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { PoleMark } from "../../components/PoleMark";
import { ApiError } from "../../lib/api";
import { useAdminSession } from "./AdminSessionContext";

export function AdminLoginPage() {
  const { session, login } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No pudimos iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-graphite px-5 py-10">
      <div className="grid w-full max-w-sm gap-8 rounded-xl bg-porcelain p-8">
        <header className="grid gap-4">
          <PoleMark size={40} />
          <div className="grid gap-2">
            <h1 className="text-5xl font-black">Panel de Filo</h1>
            <p className="text-sm text-steel">Acceso solo para el equipo de la barbería.</p>
          </div>
        </header>

        <form onSubmit={submit} className="grid gap-5">
          {error && <Alert>{error}</Alert>}
          <Field
            label="Correo"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" loading={loading} block>
            Ingresar
          </Button>
        </form>
      </div>
    </main>
  );
}
