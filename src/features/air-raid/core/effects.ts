import { clamp, randomRange } from "./math";
import { getNextId } from "./state";
import type { CollectionEffect, GameState } from "./types";

const COLLECTION_EFFECT_LIFE = 0.28;

export const addParticleBurst = (state: GameState, x: number, y: number, color: string, count: number) => {
	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = randomRange(50, 240);
		state.particles.push({
			id: getNextId(state),
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: randomRange(0.28, 0.72),
			maxLife: 0.72,
			size: randomRange(2, 6),
			color,
		});
	}
};

export const addCollectionEffect = (state: GameState, kind: CollectionEffect["kind"], x: number, y: number, radius: number) => {
	state.collectionEffects.push({
		id: getNextId(state),
		kind,
		startX: x,
		startY: y,
		x,
		y,
		radius,
		life: COLLECTION_EFFECT_LIFE,
		maxLife: COLLECTION_EFFECT_LIFE,
		phase: Math.random() * Math.PI * 2,
	});
};

export const updateParticles = (state: GameState, dt: number) => {
	for (const particle of state.particles) {
		particle.x += particle.vx * dt;
		particle.y += particle.vy * dt;
		particle.vy += 70 * dt;
		particle.life -= dt;
	}

	state.particles = state.particles.filter((particle) => particle.life > 0);
};

export const updateCollectionEffects = (state: GameState, dt: number) => {
	for (const effect of state.collectionEffects) {
		effect.life -= dt;
		const progress = clamp(1 - effect.life / effect.maxLife, 0, 1);
		const eased = 1 - (1 - progress) ** 3;

		effect.x = effect.startX + (state.player.x - effect.startX) * eased;
		effect.y = effect.startY + (state.player.y - effect.startY) * eased;

		if (effect.life <= 0) {
			const color = effect.kind === "experience" ? "#b6ff7a" : effect.kind === "repair" ? "#9eff8f" : "#fff27a";
			addParticleBurst(state, state.player.x, state.player.y, color, effect.kind === "experience" ? 3 : 8);
		}
	}

	state.collectionEffects = state.collectionEffects.filter((effect) => effect.life > 0);
};
