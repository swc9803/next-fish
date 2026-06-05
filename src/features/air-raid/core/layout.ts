import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type { Layout } from "./types";

export const createLayout = (width: number, height: number): Layout => {
	const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
	return {
		width,
		height,
		scale,
		offsetX: (width - WORLD_WIDTH * scale) / 2,
		offsetY: (height - WORLD_HEIGHT * scale) / 2,
	};
};
