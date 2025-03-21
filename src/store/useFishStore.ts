// store/useFishStore.ts
import { create } from "zustand";

export const useFishStore = create((set) => ({
	fishColor: "#ffffff",
	fishSpeed: 50,
	fishScale: 1,
	darkMode: false,

	setFishColor: (color: string) => set({ fishColor: color }),
	setFishSpeed: (speed: number) => set({ fishSpeed: speed }),
	setFishScale: (scale: number) => set({ fishScale: scale }),
	toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
