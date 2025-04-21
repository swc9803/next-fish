import { create } from "zustand";

interface FishStoreState {
	fishColor: string;
	fishSpeed: number;
	fishScale: number;
	darkMode: boolean;
	score: number;
}

interface FishStoreActions {
	setFishColor: (color: string) => void;
	setFishSpeed: (speed: number) => void;
	setFishScale: (scale: number | ((prev: number) => number)) => void;
	toggleDarkMode: () => void;
	setScore: (score: number) => void;
}

export const useFishStore = create<FishStoreState & FishStoreActions>((set) => ({
	fishColor: "#e7b518",
	fishSpeed: 50,
	fishScale: 1,
	darkMode: false,
	score: 0,
	setFishColor: (color) => set({ fishColor: color }),
	setFishSpeed: (speed) => set({ fishSpeed: speed }),
	setFishScale: (value) =>
		set((state) => ({
			fishScale: typeof value === "function" ? value(state.fishScale) : value,
		})),
	toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
	setScore: (score) => set({ score }),
}));
