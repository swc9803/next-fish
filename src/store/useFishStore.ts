import { create } from "zustand";

interface FishStoreState {
	fishColor: string;
	fishSpeed: number;
	fishScale: number;
	darkMode: boolean;
	score: number;
	backgroundColor: string;
	fogColor: string;
	fogDensity: number;
}

interface FishStoreActions {
	setFishColor: (color: string) => void;
	setFishSpeed: (speed: number) => void;
	setFishScale: (scale: number | ((prev: number) => number)) => void;
	toggleDarkMode: () => void;
	setScore: (score: number) => void;
	setBackgroundColor: (color: string) => void;
	setFogColor: (color: string) => void;
	setFogDensity: (density: number) => void;
}

export const useFishStore = create<FishStoreState & FishStoreActions>((set) => ({
	fishColor: "#e7b518",
	fishSpeed: 50,
	fishScale: 1,
	darkMode: false,
	score: 0,

	backgroundColor: "#0c6ceb",
	fogColor: "#00bfff",
	fogDensity: 0.02,

	setFishColor: (color) => set({ fishColor: color }),
	setFishSpeed: (speed) => set({ fishSpeed: speed }),
	setFishScale: (value) =>
		set((state) => ({
			fishScale: typeof value === "function" ? value(state.fishScale) : value,
		})),
	toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
	setScore: (score) => set({ score }),

	setBackgroundColor: (color: string) => set({ backgroundColor: color }),
	setFogColor: (color: string) => set({ fogColor: color }),
	setFogDensity: (density: number) => set({ fogDensity: density }),
}));
