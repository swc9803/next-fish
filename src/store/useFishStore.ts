import { create } from "zustand";

interface FishStoreState {
	fishColor: string;
	fishSpeed: number;
	fishScale: number;
	darkMode: boolean;
}

interface FishStoreActions {
	setFishColor: (color: string) => void;
	setFishSpeed: (speed: number) => void;
	setFishScale: (scale: number) => void;
	toggleDarkMode: () => void;
}

export const useFishStore = create<FishStoreState & FishStoreActions>((set) => ({
	fishColor: "#e7b518",
	fishSpeed: 50,
	fishScale: 1,
	darkMode: false,
	setFishColor: (color: string) => set({ fishColor: color }),
	setFishSpeed: (speed: number) => set({ fishSpeed: speed }),
	setFishScale: (scale: number) => set({ fishScale: scale }),
	toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
