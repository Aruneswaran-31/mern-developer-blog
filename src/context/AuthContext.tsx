import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, apiMode, tokenStore, type ApiMode } from "../lib/api";
import { demoSetSession } from "../lib/demo";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: ApiMode | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<ApiMode | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const resolved = await apiMode();
      if (cancelled) return;
      setMode(resolved);

      const current = await api.me();
      if (cancelled) return;
      if (current) setUser(current);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: signedIn } = await api.login(email, password);
    tokenStore.set(token);
    setUser(signedIn);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { token, user: created } = await api.register(
        username,
        email,
        password
      );
      tokenStore.set(token);
      setUser(created);
    },
    []
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    demoSetSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        mode,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
