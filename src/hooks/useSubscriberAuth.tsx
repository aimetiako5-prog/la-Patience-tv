import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";

interface SubscriberProfile {
  id: string;
  name: string;
  phone: string;
  phone_secondary?: string;
  email?: string;
  address: string;
  line_number?: string;
  subscription_status: string;
  subscription_expires_at?: string;
  signal_active: boolean;
  zone?: {
    id: string;
    name: string;
    city: string;
    quartier: string;
  };
  bouquet?: {
    id: string;
    name: string;
    price: number;
    channels_count: number;
    description?: string;
  };
}

interface SubscriberAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: SubscriberProfile | null;
  login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  setPin: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  checkPhone: (phone: string) => Promise<{ success: boolean; hasPin: boolean; subscriberName?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SubscriberAuthContext = createContext<SubscriberAuthContextType | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callAuthApi(action: string, data: Record<string, string>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/subscriber-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return response.json();
}

async function callDataApi(resource: string, token: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/subscriber-data?resource=${resource}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export function SubscriberAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<SubscriberProfile | null>(null);

  const getToken = () => localStorage.getItem("subscriber_token");
  const setToken = (token: string) => localStorage.setItem("subscriber_token", token);
  const clearToken = () => localStorage.removeItem("subscriber_token");

  const refreshProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setProfile(null);
      return;
    }

    try {
      const result = await callDataApi("profile", token);
      if (result.success && result.data) {
        setProfile(result.data);
        setIsAuthenticated(true);
      } else {
        clearToken();
        setIsAuthenticated(false);
        setProfile(null);
      }
    } catch {
      clearToken();
      setIsAuthenticated(false);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const validateSession = async () => {
      setIsLoading(true);
      await refreshProfile();
      setIsLoading(false);
    };
    validateSession();
  }, [refreshProfile]);

  const checkPhone = async (phone: string) => {
    try {
      const result = await callAuthApi("check", { phone });
      return result;
    } catch {
      return { success: false, hasPin: false, error: "Erreur de connexion" };
    }
  };

  const setPin = async (phone: string, pin: string) => {
    try {
      const result = await callAuthApi("set-pin", { phone, pin });
      if (result.success && result.token) {
        setToken(result.token);
        await refreshProfile();
        return { success: true };
      }
      return { success: false, error: result.error || "Erreur lors de la création du PIN" };
    } catch {
      return { success: false, error: "Erreur de connexion" };
    }
  };

  const login = async (phone: string, pin: string) => {
    try {
      const result = await callAuthApi("login", { phone, pin });
      if (result.success && result.token) {
        setToken(result.token);
        await refreshProfile();
        return { success: true };
      }
      return { success: false, error: result.error || "Identifiants incorrects" };
    } catch {
      return { success: false, error: "Erreur de connexion" };
    }
  };

  const logout = async () => {
    const token = getToken();
    if (token) {
      try {
        await callAuthApi("logout", { token });
      } catch {
        // Ignore logout errors
      }
    }
    clearToken();
    setIsAuthenticated(false);
    setProfile(null);
  };

  return (
    <SubscriberAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        profile,
        login,
        setPin,
        checkPhone,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </SubscriberAuthContext.Provider>
  );
}

export function useSubscriberAuth() {
  const context = useContext(SubscriberAuthContext);
  if (!context) {
    throw new Error("useSubscriberAuth must be used within a SubscriberAuthProvider");
  }
  return context;
}
