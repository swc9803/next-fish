"use client";

import { useEffect, useRef } from "react";

interface IntroOverlayProps {
	onFinish: () => void;
}

export const IntroOverlay = ({ onFinish }: IntroOverlayProps) => {
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleEnd = () => onFinish();
		const node = overlayRef.current;
		if (node) {
			node.addEventListener("animationend", handleEnd);
		}
		return () => {
			if (node) {
				node.removeEventListener("animationend", handleEnd);
			}
		};
	}, [onFinish]);

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
