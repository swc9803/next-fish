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

	hoverIndex: number | null;
	setHoverIndex: (index: number | null) => void;
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

	hoverIndex: null,
	setHoverIndex: (index) => set({ hoverIndex: index }),
}));
