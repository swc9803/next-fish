import { useEffect, useRef, useState } from "react";

export const useTyping = (text: string, trigger: boolean, speed: number) => {
	const [displayed, setDisplayed] = useState("");
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const currentIndex = useRef(0);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	useEffect(() => {
		if (!trigger) {
			if (intervalRef.current) clearInterval(intervalRef.current);
			currentIndex.current = 0;
			setDisplayed("");
			return;
		}

		if (intervalRef.current) clearInterval(intervalRef.current);
		setDisplayed("");
		currentIndex.current = 0;

		intervalRef.current = setInterval(() => {
			if (!mountedRef.current) return;

			currentIndex.current += 1;
			setDisplayed((prev) => {
				const next = text.slice(0, currentIndex.current);
				if (next === prev || currentIndex.current > text.length) {
					if (intervalRef.current) clearInterval(intervalRef.current);
				}
				return next;
			});
		}, speed);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [trigger, text, speed]);

	return displayed;
};
