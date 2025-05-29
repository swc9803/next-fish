import { create } from "zustand";
import { devtools } from "zustand/middleware"; // temp

interface GallerySlideState {
	slide: number;
	focusIndex: number | null;
	hoverIndex: number | null;
	freemode: boolean;
	isSliding: boolean;
	isZoom: boolean;
	lastFocusTarget: { x: number; z: number } | null;
	isIntroPlaying: boolean;
	isCameraIntroDone: boolean;
	isIntroStarted: boolean;
	hasIntroPlayed: boolean;

	setSlide: (index: number) => void;
	setFocusIndex: (index: number | null) => void;
	setHoverIndex: (index: number | null) => void;
	setFreemode: (mode: boolean) => void;
	setIsSliding: (state: boolean) => void;
	setIsZoom: (state: boolean) => void;
	setLastFocusTarget: (pos: { x: number; z: number } | null) => void;
	setIsIntroPlaying: (value: boolean) => void;
	setCameraIntroDone: (value: boolean) => void;
	setIntroStarted: (value: boolean) => void;
	setHasIntroPlayed: (value: boolean) => void;
}

export const useGallerySlide = create<GallerySlideState>()(
	devtools((set) => ({
		slide: 0,
		focusIndex: null,
		hoverIndex: null,
		freemode: false,
		isSliding: false,
		isZoom: false,
		lastFocusTarget: null,
		isIntroPlaying: true,
		isCameraIntroDone: false,
		isIntroStarted: false,
		hasIntroPlayed: false,

		setSlide: (index) => set({ slide: index }),
		setFocusIndex: (index) => set({ focusIndex: index }),
		setHoverIndex: (index) => set({ hoverIndex: index }),
		setFreemode: (mode) => set({ freemode: mode }),
		setIsSliding: (state) => set({ isSliding: state }),
		setIsZoom: (state) => set({ isZoom: state }),
		setLastFocusTarget: (pos) => set({ lastFocusTarget: pos }),
		setIsIntroPlaying: (value) => set({ isIntroPlaying: value }),
		setCameraIntroDone: (value) => set({ isCameraIntroDone: value }),
		setIntroStarted: (value) => set({ isIntroStarted: value }),
		setHasIntroPlayed: (value) => set({ hasIntroPlayed: value }),
	}))
);
