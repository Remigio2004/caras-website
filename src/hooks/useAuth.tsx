import { createContext, useContext, useEffect, useState } from "react";

type User = { email: string } | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("caras_user");
    if (stored) setUser({ email: stored });
    setLoading(false);
  }, []);

  const login = (email: string) => {
    localStorage.setItem("caras_user", email);
    setUser({ email });
  };

  const logout = () => {
    localStorage.removeItem("caras_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
