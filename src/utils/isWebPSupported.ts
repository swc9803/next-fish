let cachedSupport: boolean | null = null;

export const isWebPSupported = (): boolean => {
	if (cachedSupport !== null) return cachedSupport;
	if (typeof window === "undefined") return false;

	const canvas = document.createElement("canvas");
	cachedSupport = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
	return cachedSupport;
};
