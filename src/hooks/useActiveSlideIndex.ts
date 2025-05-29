import { useGallerySlide } from "@/store/useGallerySlide";

export const useActiveSlideIndex = (): number => {
	const freemode = useGallerySlide((s) => s.freemode);
	const focusIndex = useGallerySlide((s) => s.focusIndex);
	const hoverIndex = useGallerySlide((s) => s.hoverIndex);
	const slide = useGallerySlide((s) => s.slide);

	if (freemode) {
		if (focusIndex !== null) return focusIndex;
		if (hoverIndex !== null) return hoverIndex;
	}
	return slide;
};
