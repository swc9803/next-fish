import { create } from "zustand";

interface GallerySlideState {
	slide: number;
	setSlide: (slide: number) => void;
	freemode: boolean;
	setFreemode: (freemode: boolean) => void;
}

export const useGallerySlide = create<GallerySlideState>((set) => ({
	slide: 0,
	setSlide: (slide) => set({ slide }),
	freemode: false,
	setFreemode: (freemode) => set({ freemode }),
}));
