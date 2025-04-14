import { create } from "zustand";

interface GallerySlideState {
	slide: number;
	setSlide: (slide: number) => void;

	freemode: boolean;
	setFreemode: (freemode: boolean) => void;

	isSliding: boolean;
	setIsSliding: (v: boolean) => void;

	focusIndex: number | null;
	setFocusIndex: (index: number | null) => void;

	lastFocusTarget: { x: number; z: number } | null;
	setLastFocusTarget: (pos: { x: number; z: number }) => void;

	isZoom: boolean;
	setIsZoom: (v: boolean) => void;

	hoverStates: Record<number, "enter" | "leave">;
	setHoverState: (index: number, state: "enter" | "leave") => void;

	resetAllHoverStates: () => void;
}

export const useGallerySlide = create<GallerySlideState>((set) => ({
	slide: 0,
	setSlide: (slide) => set({ slide }),

	freemode: false,
	setFreemode: (freemode) => set({ freemode }),

	isSliding: false,
	setIsSliding: (v) => set({ isSliding: v }),

	focusIndex: null,
	setFocusIndex: (index) => set({ focusIndex: index }),

	lastFocusTarget: null,
	setLastFocusTarget: (pos) => set({ lastFocusTarget: pos }),

	isZoom: false,
	setIsZoom: (v) => set({ isZoom: v }),

	hoverStates: {},
	setHoverState: (index, state) =>
		set((prev) => ({
			hoverStates: {
				...prev.hoverStates,
				[index]: state,
			},
		})),

	resetAllHoverStates: () =>
		set((state) => {
			const newHoverStates: Record<number, "leave"> = {};

			for (const indexString of Object.keys(state.hoverStates)) {
				const slideIndex = parseInt(indexString, 10);
				newHoverStates[slideIndex] = "leave";
			}

			return { hoverStates: newHoverStates };
		}),
}));
