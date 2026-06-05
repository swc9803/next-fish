import { randomRange } from "./math";
import { getNextId } from "./state";
import type { Bullet, GameState } from "./types";

const getShotChaos = (state: GameState) => {
	const focusStabilizer = state.weapon === "laser" ? state.laserFocus * 0.24 : 0;
	return Math.max(0, state.projectileChaos - focusStabilizer);
};

export const addPlayerBullet = (
	state: GameState,
	x: number,
	y: number,
	vx: number,
	vy: number,
	damage = 1,
	radius = 4,
	color = "#8bf4ff",
	pierceBonus = 0,
	visualRadius?: number,
	blastRadius?: number,
) => {
	const powerBonus = 1 + state.player.power * 0.08;
	const chaos = getShotChaos(state);
	const nextVx = vx + (chaos > 0 ? randomRange(-85, 85) * chaos : 0);
	const nextVy = vy + (chaos > 0 ? randomRange(-20, 28) * chaos : 0);

	const bullet: Bullet = {
		id: getNextId(state),
		x,
		y,
		vx: nextVx,
		vy: nextVy,
		radius,
		damage: damage * state.damageMultiplier * powerBonus,
		pierce: state.bulletPierce + pierceBonus,
		from: "player",
		color,
	};

	if (visualRadius !== undefined) bullet.visualRadius = visualRadius;
	if (blastRadius !== undefined) bullet.blastRadius = blastRadius;
	state.bullets.push(bullet);
};

export const firePlayer = (state: GameState) => {
	const { player } = state;
	const headY = player.y - 34;
	const gillY = player.y - 22;
	const sideFinY = player.y - 14;
	const weaponLevel = state.weaponLevels[state.weapon] || 1;

	if (state.weapon === "fork") {
		const forkVx = state.prismSplitter ? 170 : 115;
		addPlayerBullet(state, player.x - 14, gillY, -forkVx, -635, 1.46 + weaponLevel * 0.18, 4.6, "#92fff2");
		addPlayerBullet(state, player.x + 14, gillY, forkVx, -635, 1.46 + weaponLevel * 0.18, 4.6, "#92fff2");
		if (weaponLevel >= 2) addPlayerBullet(state, player.x, headY, 0, -670, 0.86 + weaponLevel * 0.16, 4.1, "#d8fff8");
		if (weaponLevel >= 3) {
			addPlayerBullet(state, player.x - 24, sideFinY, -68, -590, 0.72, 3.6, "#92fff2");
			addPlayerBullet(state, player.x + 24, sideFinY, 68, -590, 0.72, 3.6, "#92fff2");
		}
		return;
	}

	if (state.weapon === "scatter") {
		const sideCount = (state.prismSplitter ? 3 : 2) + weaponLevel - 1;
		for (let i = -sideCount; i <= sideCount; i++) {
			const edgePenalty = Math.abs(i) / Math.max(1, sideCount);
			addPlayerBullet(state, player.x + i * 5.2, gillY, i * 66, -600 + Math.abs(i) * 15, i === 0 ? 1.05 : 0.74 - edgePenalty * 0.08, 3.8, "#b3ff74");
		}
		return;
	}

	if (state.weapon === "laser") {
		const focus = state.laserFocus + weaponLevel - 1;
		const laserDamage = focus > 0 ? 0.74 + focus * 0.62 : 0.28;
		const laserRadius = focus > 0 ? 2.8 + focus * 1.35 : 1.85;
		const laserPierce = focus + (state.prismSplitter ? 1 : 0);

		if (state.prismSplitter && focus === 0) {
			addPlayerBullet(state, player.x - 8, headY, -34, -850, 0.26, 1.75, "#ff9cff", laserPierce);
			addPlayerBullet(state, player.x + 8, headY, 34, -850, 0.26, 1.75, "#ff9cff", laserPierce);
			return;
		}

		addPlayerBullet(state, player.x, headY, 0, -930, laserDamage, laserRadius, focus >= 2 ? "#ffffff" : "#ff9cff", laserPierce);

		if (state.prismSplitter) {
			addPlayerBullet(state, player.x - 13, gillY, -24, -880, laserDamage * 0.72, Math.max(1.9, laserRadius * 0.75), "#ffb7ff", laserPierce);
			addPlayerBullet(state, player.x + 13, gillY, 24, -880, laserDamage * 0.72, Math.max(1.9, laserRadius * 0.75), "#ffb7ff", laserPierce);
		}

		if (focus >= 2) {
			addPlayerBullet(state, player.x, sideFinY, 0, -780, laserDamage * 0.58, laserRadius * 0.65, "#f6fdff", laserPierce);
		}
		if (weaponLevel >= 3) {
			addPlayerBullet(state, player.x - 18, sideFinY, -18, -820, laserDamage * 0.52, laserRadius * 0.58, "#d9fbff", laserPierce);
			addPlayerBullet(state, player.x + 18, sideFinY, 18, -820, laserDamage * 0.52, laserRadius * 0.58, "#d9fbff", laserPierce);
		}
		return;
	}

	if (state.weapon === "lance") {
		addPlayerBullet(state, player.x, headY, 0, -720, 2.25 + weaponLevel * 0.42, 7 + weaponLevel * 0.45, "#ffe989", weaponLevel >= 2 ? 1 : 0, undefined, weaponLevel >= 3 ? 58 : undefined);
		if (weaponLevel >= 2) {
			addPlayerBullet(state, player.x - 14, gillY, -34, -650, 1.05, 4.2, "#fff5b5", 0);
			addPlayerBullet(state, player.x + 14, gillY, 34, -650, 1.05, 4.2, "#fff5b5", 0);
		}
		return;
	}

	addPlayerBullet(state, player.x, headY, 0, -650, 1.2);
};
