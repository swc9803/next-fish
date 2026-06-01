import { useEffect, useState } from "react";

export const GalleryTransitionOverlay = () => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const raf = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(raf);
	}, []);

	return <div className={`move_gallery_overlay ${visible ? "show" : ""}`} />;
};
