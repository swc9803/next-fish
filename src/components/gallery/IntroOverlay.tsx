import { useEffect, useRef } from "react";
import { useGallerySlide } from "@/store/useGallerySlide";

export const IntroOverlay = () => {
	const overlayRef = useRef<HTMLDivElement>(null);
	const { setIsIntroPlaying } = useGallerySlide.getState();

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
	}, []);

	return (
		<div
			ref={overlayRef}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				background: "linear-gradient(white, #a0cfff)",
				pointerEvents: "none",
				zIndex: 10,
				animation: "fadeOut 4s ease-out 0.5s forwards",
			}}
		/>
	);
};
