import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { addCollectionEffect } from "./effects";
import { clamp, distanceSquared } from "./math";
import { addExperience } from "./rewards";
import type { GameState, PowerUp } from "./types";

export const getPickupRadius = (state: GameState, itemRadius: number, baseBonus: number) => state.player.radius + itemRadius + baseBonus * state.magnetMultiplier;

export const collectPowerUp = (state: GameState, powerUp: PowerUp) => {
	if (powerUp.kind === "repair") {
		state.player.lives = Math.min(state.player.maxLives, state.player.lives + 1);
	} else {
		state.player.power = Math.min(5, state.player.power + 1);
	}

	addCollectionEffect(state, powerUp.kind, powerUp.x, powerUp.y, powerUp.radius);
};

export const updatePowerUps = (state: GameState, dt: number) => {
	for (const powerUp of state.powerUps) {
		powerUp.y += powerUp.vy * dt;
	}

	state.powerUps = state.powerUps.filter((powerUp) => powerUp.y < WORLD_HEIGHT + 32);
};

export const updateExperienceOrbs = (state: GameState, dt: number) => {
	const collectedOrbs = new Set<number>();

	for (const orb of state.experienceOrbs) {
		const kind = orb.kind ?? "experience";
		const pickupRadius = orb.autoCollect ? state.player.radius + orb.radius + 18 : getPickupRadius(state, orb.radius, kind === "coin" ? 30 : 24);

		if (distanceSquared(orb.x, orb.y, state.player.x, state.player.y) <= pickupRadius * pickupRadius) {
			collectedOrbs.add(orb.id);
			if (kind === "coin") {
				state.earnedCoins += orb.value;
				addCollectionEffect(state, "coin", orb.x, orb.y, orb.radius);
			} else {
				addExperience(state, orb.value);
				addCollectionEffect(state, "experience", orb.x, orb.y, orb.radius);
			}
			continue;
		}

		if (orb.autoCollect) {
			orb.homeDelay = Math.max(0, (orb.homeDelay ?? 0) - dt);
			if ((orb.homeDelay ?? 0) <= 0) {
				const dx = state.player.x - orb.x;
				const dy = state.player.y - orb.y;
				const distance = Math.max(1, Math.hypot(dx, dy));
				const pull = clamp(920 / distance, 2.6, 9.5);
				orb.vx += (dx / distance) * pull * 180 * dt;
				orb.vy += (dy / distance) * pull * 180 * dt;
				orb.vx *= 0.94;
				orb.vy *= 0.94;
			} else {
				orb.vx *= 0.955;
				orb.vy *= 0.955;
			}
		} else {
			orb.vx *= 0.985;
			orb.vy = Math.min(180, orb.vy + 28 * dt);
		}

		orb.x += orb.vx * dt;
		orb.y += orb.vy * dt;
	}

	state.experienceOrbs = state.experienceOrbs.filter(
		(orb) => !collectedOrbs.has(orb.id) && (orb.autoCollect || (orb.y < WORLD_HEIGHT + 32 && orb.x > -32 && orb.x < WORLD_WIDTH + 32)),
	);
};
