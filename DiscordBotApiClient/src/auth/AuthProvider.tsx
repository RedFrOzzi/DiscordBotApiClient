import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "./authApi";
import { tokenStore } from "./tokenStore";
import { decodeJwt, getRoles } from "./JwtPayload";

export type AuthContextValue = {
  isAuthenticated: boolean;
  roles: string[];
  isAdmin: boolean;
  isModerator: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  tryRestoreSession: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  const tryRestoreSession = useCallback(async () => {
    try {
      const token = await authApi.refresh();
      tokenStore.set(token);
      setRoles(getRoles(decodeJwt(token)));
      setIsAuthenticated(true);
      return true;
    } catch {
      tokenStore.clear();
      setRoles([]);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const token = await authApi.login(loginValue, password);
    tokenStore.set(token);
    setRoles(getRoles(decodeJwt(token)));
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(
    async (loginValue: string, password: string) => {
      await authApi.createUser(loginValue, password);
      await login(loginValue, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      tokenStore.clear();
      setRoles([]);
      setIsAuthenticated(false);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      roles,
      isAdmin: roles.includes("Admin"),
      isModerator: roles.includes("Moderator"),
      login,
      register,
      logout,
      tryRestoreSession,
    }),
    [isAuthenticated, roles, login, register, logout, tryRestoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
