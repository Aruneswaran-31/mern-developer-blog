import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import jwt_decode from "jwt-decode";
import axios from "axios";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/users/login", { email, password });
      const { token } = response.data;

      // Store token in localStorage
      localStorage.setItem("authToken", token);

      // Decode token to get user info
      const decoded: any = jwt_decode(token);
      setUser({
        id: decoded.userId,
        username: decoded.username,
        email,
      });
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Login failed:", error.response?.data || error.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/users/register", { username, email, password });
      const { token } = response.data;

      localStorage.setItem("authToken", token);

      const decoded: any = jwt_decode(token);
      setUser({
        id: decoded.userId,
        username: decoded.username,
        email,
      });
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data || error.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      const decoded: any = jwt_decode(token);
      setUser({
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      });
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext>
  );
};

export default AuthContext;