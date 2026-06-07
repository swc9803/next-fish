import { useEffect, useState } from "react";

interface GalleryTransitionOverlayProps {
	variant?: "gallery" | "game";
}

export const GalleryTransitionOverlay = ({ variant = "gallery" }: GalleryTransitionOverlayProps) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const raf = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(raf);
	}, []);

	return <div className={`move_gallery_overlay ${variant === "game" ? "game" : ""} ${visible ? "show" : ""}`} />;
};
