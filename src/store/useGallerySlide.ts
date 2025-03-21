import { create } from "zustand";

interface GalleryStoreState {
	slide: number;
	setSlide: (value: number) => void;
}

export const useGallerySlide = create<GalleryStoreState>((set) => ({
	slide: 0,
	setSlide: (value) => set({ slide: value }),
}));
