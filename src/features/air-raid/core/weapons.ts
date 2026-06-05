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
	state.bullets.push(bullet);
};

export const firePlayer = (state: GameState) => {
	const { player } = state;
	const headY = player.y - 34;
	const gillY = player.y - 22;
	const sideFinY = player.y - 14;

	if (state.weapon === "fork") {
		const forkVx = state.prismSplitter ? 170 : 115;
		addPlayerBullet(state, player.x - 14, gillY, -forkVx, -635, 1.55, 4.6, "#92fff2");
		addPlayerBullet(state, player.x + 14, gillY, forkVx, -635, 1.55, 4.6, "#92fff2");
		return;
	}

	if (state.weapon === "scatter") {
		const sideCount = state.prismSplitter ? 3 : 2;
		for (let i = -sideCount; i <= sideCount; i++) {
			addPlayerBullet(state, player.x + i * 6, gillY, i * 76, -600 + Math.abs(i) * 18, i === 0 ? 0.9 : 0.72, 3.8, "#b3ff74");
		}
		return;
	}

	if (state.weapon === "laser") {
		const focus = state.laserFocus;
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
		return;
	}

	if (state.weapon === "lance") {
		addPlayerBullet(state, player.x, headY, 0, -720, 2.45, 7, "#ffe989");
		return;
	}

	addPlayerBullet(state, player.x, headY, 0, -650, 1.2);
};
