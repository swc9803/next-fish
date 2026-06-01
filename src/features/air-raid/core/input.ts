import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { clamp } from "./math";
import type { Layout } from "./types";

export const getCanvasPoint = (event: PointerEvent, canvas: HTMLCanvasElement, layout: Layout) => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: clamp((event.clientX - rect.left - layout.offsetX) / layout.scale, 0, WORLD_WIDTH),
		y: clamp((event.clientY - rect.top - layout.offsetY) / layout.scale, 0, WORLD_HEIGHT),
	};
};
