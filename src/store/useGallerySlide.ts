import { create } from "zustand";

interface FocusTarget {
	x: number;
	z: number;
}

interface GallerySlideState {
	freemode: boolean;
	slide: number;
	focusIndex: number | null;
	hoverIndex: number | null;
	isSliding: boolean;
	isZoom: boolean;
	lastFocusTarget: FocusTarget | null;

	setFreemode: (mode: boolean) => void;
	setSlide: (index: number) => void;
	setFocusIndex: (index: number | null) => void;
	setHoverIndex: (index: number | null) => void;
	setIsSliding: (flag: boolean) => void;
	setIsZoom: (flag: boolean) => void;
	setLastFocusTarget: (target: FocusTarget) => void;
}

export const useGallerySlide = create<GallerySlideState>((set) => ({
	freemode: false,
	slide: 0,
	focusIndex: null,
	hoverIndex: null,
	isSliding: false,
	isZoom: false,
	lastFocusTarget: null,

	setFreemode: (mode) => set({ freemode: mode }),
	setSlide: (index) => set({ slide: index }),
	setFocusIndex: (index) => set({ focusIndex: index }),
	setHoverIndex: (index) => set({ hoverIndex: index }),
	setIsSliding: (flag) => set({ isSliding: flag }),
	setIsZoom: (flag) => set({ isZoom: flag }),
	setLastFocusTarget: (target) => set({ lastFocusTarget: target }),
}));
