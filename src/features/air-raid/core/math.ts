export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

export const distanceSquared = (ax: number, ay: number, bx: number, by: number) => {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
};
