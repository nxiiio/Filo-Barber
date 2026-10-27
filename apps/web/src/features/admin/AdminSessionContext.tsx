import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ApiError, api } from "../../lib/api";
import type { AdminSession } from "../../types";

const STORAGE_KEY = "filo.admin-session";

interface AdminSessionValue {
  session: AdminSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  guard: <T>(request: (token: string) => Promise<T>) => Promise<T>;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

function readStoredSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: AdminSession | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento disponible la sesión vive solo en memoria.
  }
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(readStoredSession);

  const logout = useCallback(() => {
    storeSession(null);
    setSession(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const next = await api.login(email, password);
    storeSession(next);
    setSession(next);
  }, []);

  const guard = useCallback(
    async <T,>(request: (token: string) => Promise<T>): Promise<T> => {
      if (!session) throw new ApiError(401, "UNAUTHORIZED", "Debes iniciar sesión");
      try {
        return await request(session.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) logout();
        throw error;
      }
    },
    [session, logout]
  );

  const value = useMemo(() => ({ session, login, logout, guard }), [session, login, logout, guard]);
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext);
  if (!value) throw new Error("useAdminSession debe usarse dentro de AdminSessionProvider");
  return value;
}
