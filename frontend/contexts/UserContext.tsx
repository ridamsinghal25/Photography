"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import UserService from "@/services/UserService";
import { isApiError } from "@/lib/typeGuard";
import type { User } from "@/types/user";

type UserContextValue = {
  user: User | null;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({ user: null, loading: true });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    UserService.getMe<User>().then((res) => {
      if (!isApiError(res)) setUser(res.data!);
      setLoading(false);
    });
  }, [isSignedIn, isLoaded]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(UserContext);
}
