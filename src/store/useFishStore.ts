import { create } from "zustand";

interface FishStoreState {
	fishColor: string;
	fishSpeed: number;
	fishScale: number;
}

interface FishStoreActions {
	setFishColor: (color: string) => void;
	setFishSpeed: (speed: number | ((prev: number) => number)) => void;
	setFishScale: (scale: number | ((prev: number) => number)) => void;
}

export const useFishStore = create<FishStoreState & FishStoreActions>((set) => ({
	fishColor: "#e7b518",
	fishSpeed: 12,
	fishScale: 1,

	setFishColor: (color) => set({ fishColor: color }),
	setFishSpeed: (value) =>
		set((state) => ({
			fishSpeed: typeof value === "function" ? value(state.fishSpeed) : value,
		})),
	setFishScale: (value) =>
		set((state) => ({
			fishScale: typeof value === "function" ? value(state.fishScale) : value,
		})),
}));
