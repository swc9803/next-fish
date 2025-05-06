import { create } from "zustand";

interface GallerySlideState {
	slide: number;
	focusIndex: number | null;
	hoverIndex: number | null;
	freemode: boolean;
	isSliding: boolean;
	isZoom: boolean;
	lastFocusTarget: { x: number; z: number } | null;
	isIntroPlaying: boolean;

	setSlide: (index: number) => void;
	setFocusIndex: (index: number | null) => void;
	setHoverIndex: (index: number | null) => void;
	setFreemode: (mode: boolean) => void;
	setIsSliding: (state: boolean) => void;
	setIsZoom: (state: boolean) => void;
	setLastFocusTarget: (pos: { x: number; z: number } | null) => void;
	setIsIntroPlaying: (value: boolean) => void;
}

export const useGallerySlide = create<GallerySlideState>((set) => ({
	slide: 0,
	focusIndex: null,
	hoverIndex: null,
	freemode: false,
	isSliding: false,
	isZoom: false,
	lastFocusTarget: null,
	isIntroPlaying: true,

	setSlide: (index) => set({ slide: index }),
	setFocusIndex: (index) => set({ focusIndex: index }),
	setHoverIndex: (index) => set({ hoverIndex: index }),
	setFreemode: (mode) => set({ freemode: mode }),
	setIsSliding: (state) => set({ isSliding: state }),
	setIsZoom: (state) => set({ isZoom: state }),
	setLastFocusTarget: (pos) => set({ lastFocusTarget: pos }),
	setIsIntroPlaying: (value) => set({ isIntroPlaying: value }),
}));
