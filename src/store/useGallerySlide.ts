import { create } from "zustand";

interface GallerySlideState {
	freemode: boolean;
	slide: number;
	focusIndex: number | null;
	hoverIndex: number | null;
	isSliding: boolean;
	isZoom: boolean;
	lastFocusTarget: { x: number; z: number } | null;
	currentLightIndex: number | null;

	setFreemode: (mode: boolean) => void;
	setSlide: (index: number) => void;
	setFocusIndex: (index: number | null) => void;
	setHoverIndex: (index: number | null) => void;
	setIsSliding: (flag: boolean) => void;
	setIsZoom: (flag: boolean) => void;
	setLastFocusTarget: (target: { x: number; z: number }) => void;
	setCurrentLightIndex: (index: number | null) => void;
}

export const useGallerySlide = create<GallerySlideState>((set) => ({
	freemode: false,
	slide: 0,
	focusIndex: null,
	hoverIndex: null,
	isSliding: false,
	isZoom: false,
	lastFocusTarget: null,
	currentLightIndex: null,

	setFreemode: (mode) => set({ freemode: mode }),
	setSlide: (index) => set({ slide: index }),
	setFocusIndex: (index) => set({ focusIndex: index }),
	setHoverIndex: (index) => set({ hoverIndex: index }),
	setIsSliding: (flag) => set({ isSliding: flag }),
	setIsZoom: (flag) => set({ isZoom: flag }),
	setLastFocusTarget: (target) => set({ lastFocusTarget: target }),
	setCurrentLightIndex: (index) => set({ currentLightIndex: index }),
}));
