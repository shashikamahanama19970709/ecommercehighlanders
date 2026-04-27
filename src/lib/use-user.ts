import { useSession } from "next-auth/react";

export function useUser() {
  const { data, status } = useSession();
  return {
    user: data?.user ?? null,
    loading: status === "loading",
    authenticated: !!data?.user,
  };
}
