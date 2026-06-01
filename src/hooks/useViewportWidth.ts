import { useEffect, useState } from "react";

export const MOBILE_BREAKPOINT = 768;

const getViewportWidth = (fallback: number) => (typeof window === "undefined" ? fallback : window.innerWidth);

export const useViewportWidth = (fallback = 1024) => {
	const [width, setWidth] = useState(() => getViewportWidth(fallback));

	useEffect(() => {
		const handleResize = () => setWidth(window.innerWidth);
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return width;
};

export const useIsMobile = () => useViewportWidth() <= MOBILE_BREAKPOINT;
