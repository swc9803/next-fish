import { useGallerySlide } from "@/store/useGallerySlide";

export const useActiveSlideIndex = (): number => {
	const { freemode, hoverIndex, focusIndex, slide } = useGallerySlide();

	if (freemode) {
		if (focusIndex !== null) return focusIndex;
		if (hoverIndex !== null) return hoverIndex;
	}
	return slide;
};
