import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Account = { id: string; name: string; password?: string };

type AuthState = {
  currentUser: Account | null;
  accounts: Account[];
  register: (name: string, password: string) => { success: boolean; message?: string };
  login: (name: string, password: string) => boolean;
  logout: () => void;
  removeAccount: (id: string) => void;
  switchAccount: (id: string) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accounts: [],
      register: (name, password) => {
        const state = get();
        
        // 1. MAKSİMUM 3 HESAP SINIRI KONTROLÜ
        if (state.accounts.length >= 3) {
          return { success: false, message: "Cihaz başına en fazla 3 hesap açabilirsin!" };
        }

        const existing = state.accounts.find((a) => a.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          return { success: false, message: "Bu kullanıcı adı zaten alınmış." };
        }

        const newAccount = { id: crypto.randomUUID(), name, password };
        set({ accounts: [...state.accounts, newAccount] });
        return { success: true };
      },
      login: (name, password) => {
        const state = get();
        const account = state.accounts.find(
          (a) => a.name.toLowerCase() === name.toLowerCase() && a.password === password
        );
        if (account) {
          set({ currentUser: account });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),
      switchAccount: (id) =>
        set((state) => ({
          currentUser: state.accounts.find((a) => a.id === id) || null,
        })),
      removeAccount: (id) =>
        set((state) => {
          const newAccounts = state.accounts.filter((a) => a.id !== id);
          const isCurrent = state.currentUser?.id === id;
          return {
            accounts: newAccounts,
            currentUser: isCurrent ? null : state.currentUser,
          };
        }),
    }),
    { name: "scoutfit-auth" }
  )
);