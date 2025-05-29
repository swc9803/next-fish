import { useEffect, useRef } from "react";

import { useGallerySlide } from "@/store/useGallerySlide";

export const IntroOverlay = () => {
	const overlayRef = useRef<HTMLDivElement>(null);
	const { isIntroPlaying, isIntroStarted, setIsIntroPlaying } = useGallerySlide();

	useEffect(() => {
		const handleEnd = () => {
			setIsIntroPlaying(false);
		};

		const node = overlayRef.current;
		if (node) {
			node.addEventListener("animationend", handleEnd);
		}

		return () => {
			if (node) {
				node.removeEventListener("animationend", handleEnd);
			}
		};
	}, [setIsIntroPlaying]);

	return (
		<div
			ref={overlayRef}
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				background: "linear-gradient(white, #a0cfff)",
				pointerEvents: "none",
				zIndex: 10,
				opacity: isIntroPlaying ? 1 : 0,
				transition: "opacity 0.3s ease-out",
				animation: isIntroStarted ? "fadeOut 4s ease-out 0.5s forwards" : "none",
			}}
		/>
	);
};
