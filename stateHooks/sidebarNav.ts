import { create } from "zustand";

type NavStore = {
  sidebarMenu: boolean;
  toggleSidebarMenu: () => void;
};

export const navStore = create<NavStore>((set) => ({
  sidebarMenu: false,
  toggleSidebarMenu: () =>
    set((state) => ({ sidebarMenu: !state.sidebarMenu })),
}));
