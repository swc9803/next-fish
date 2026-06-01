import { STORAGE_KEY } from "./constants";

export const readHighScore = () => {
	if (typeof window === "undefined") return 0;
	return Number(window.localStorage.getItem(STORAGE_KEY) || 0);
};

export const writeHighScore = (score: number) => {
	window.localStorage.setItem(STORAGE_KEY, String(score));
};
