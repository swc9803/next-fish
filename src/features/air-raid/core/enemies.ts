import { ENEMY_FIRE_SAFE_MARGIN_X, ENEMY_FIRE_SAFE_MARGIN_Y, PLAYER_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { addParticleBurst } from "./effects";
import { getPlayerMaxY, getPlayerMinY } from "./geometry";
import { clamp, randomRange } from "./math";
import { getStageEnemyTuning, getStagePalette, pickStageEnemyKind } from "./stages";
import { getNextId } from "./state";
import type { EnemyKind, GameState, Plane } from "./types";

const GOLDFISH_ESCAPE_TIME = 7.6;
const NORMAL_ENEMY_ADVANCE_LIMIT_Y = WORLD_HEIGHT * 0.62;

const getDifficultyRamp = (wave: number) => clamp((wave - 1) / 8, 0, 1);

const getEnemySpeedMultiplier = (wave: number) => 0.68 + getDifficultyRamp(wave) * 0.28;

const getEnemyBulletSpeedMultiplier = (wave: number) => 0.78 + getDifficultyRamp(wave) * 0.18;

const getInitialEnemyFireCooldown = (wave: number) => {
	const ramp = getDifficultyRamp(wave);
	return randomRange(1.75 - ramp * 0.35, 3.25 - ramp * 0.75);
};

const getEnemyRefireCooldown = (wave: number, kind: EnemyKind) => {
	const ramp = getDifficultyRamp(wave);
	if (kind === "boss") return 1.18 - ramp * 0.18;
	if (kind === "supply" || kind === "goldfish") return Number.POSITIVE_INFINITY;
	if (kind === "ace") return 1.75 - ramp * 0.3;
	if (kind === "bomber") return 2.15 - ramp * 0.32;
	return 1.95 - ramp * 0.35;
};

const getStageFireDelay = (enemy: Plane) => getStageEnemyTuning(enemy.stage).fireDelayMultiplier;

const canEnemyFire = (enemy: Plane) => {
	const minX = enemy.radius + ENEMY_FIRE_SAFE_MARGIN_X;
	const maxX = WORLD_WIDTH - enemy.radius - ENEMY_FIRE_SAFE_MARGIN_X;
	const minY = enemy.radius + ENEMY_FIRE_SAFE_MARGIN_Y;
	const maxY = WORLD_HEIGHT - enemy.radius - ENEMY_FIRE_SAFE_MARGIN_Y;

	return enemy.x >= minX && enemy.x <= maxX && enemy.y >= minY && enemy.y <= maxY;
};

const addEnemyBullet = (state: GameState, enemy: Plane, angle: number, speed: number) => {
	const adjustedSpeed = speed * getEnemyBulletSpeedMultiplier(state.wave) * Math.min(1.32, state.threatMultiplier);
	state.bullets.push({
		id: getNextId(state),
		x: enemy.x,
		y: enemy.y + enemy.radius * 0.45,
		vx: Math.cos(angle) * adjustedSpeed,
		vy: Math.sin(angle) * adjustedSpeed,
		radius: enemy.kind === "boss" ? 5 : 4,
		damage: 1,
		pierce: 0,
		from: "enemy",
		color: enemy.kind === "boss" ? "#ff4f9a" : "#ff4f6d",
	});
};

const getPlayerIntentVelocity = (state: GameState) => {
	const { player, keys } = state;
	let dx = 0;
	let dy = 0;

	if (state.pointerActive) {
		dx = player.targetX - player.x;
		dy = player.targetY - player.y;
	} else {
		if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
		if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
		if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
		if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
	}

	const length = Math.hypot(dx, dy);
	if (length < 0.001) return { x: 0, y: 0 };

	const speed = PLAYER_SPEED * state.playerSpeedMultiplier;
	return {
		x: (dx / length) * speed,
		y: (dy / length) * speed,
	};
};

const getEnemyAimAngle = (state: GameState, enemy: Plane, leadTime: number, laneOffset = 0) => {
	const intent = getPlayerIntentVelocity(state);
	const targetX = clamp(state.player.x + intent.x * leadTime + laneOffset, state.player.radius, WORLD_WIDTH - state.player.radius);
	const targetY = clamp(state.player.y + intent.y * leadTime, getPlayerMinY(state.player.radius), getPlayerMaxY(state.player.radius));

	return Math.atan2(targetY - enemy.y, targetX - enemy.x);
};

const getEnemyLaneSign = (enemy: Plane) => (Math.sin(enemy.id * 4.17 + Math.floor(enemy.age * 1.7) * 1.31) >= 0 ? 1 : -1);

const fireEnemyPattern = (state: GameState, enemy: Plane) => {
	const laneSign = getEnemyLaneSign(enemy);
	const ramp = getDifficultyRamp(state.wave);

	if (enemy.kind === "boss") {
		const isPhaseTwo = (enemy.bossPhase ?? 1) >= 2;
		const baseAngle = getEnemyAimAngle(state, enemy, 0.42 + ramp * 0.12);
		const sweep = Math.sin(enemy.age * (isPhaseTwo ? 3 : 2.2)) * (isPhaseTwo ? 0.16 : 0.1);
		for (let i = isPhaseTwo ? -3 : -2; i <= (isPhaseTwo ? 3 : 2); i++) addEnemyBullet(state, enemy, baseAngle + sweep + i * 0.15, isPhaseTwo ? 258 : 238);
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.68, laneSign * 62), isPhaseTwo ? 232 : 205);
		if (isPhaseTwo) {
			for (let i = 0; i < 8; i++) addEnemyBullet(state, enemy, Math.PI * 0.18 + (Math.PI * 0.64 * i) / 7, 184);
		}
		return;
	}

	if (enemy.kind === "ace") {
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.52, laneSign * 34), 258);
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.28, -laneSign * 28), 244);
		return;
	}

	if (enemy.kind === "bomber") {
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.46, laneSign * 52), 194);
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.16, -laneSign * 24), 176);
		return;
	}

	if (enemy.kind === "fighter") {
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.34, laneSign * 38), 236);
		return;
	}

	addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.24, laneSign * 24), 226);
};

const addBossWarning = (state: GameState, enemy: Plane) => {
	const palette = getStagePalette(enemy.stage);
	const isPhaseTwo = (enemy.bossPhase ?? 1) >= 2;
	const useRing = isPhaseTwo && Math.sin(enemy.id + enemy.age * 1.7) > 0;

	state.warningZones.push({
		id: getNextId(state),
		kind: useRing ? "ring" : "laser",
		x: useRing ? enemy.x : clamp(state.player.x + randomRange(-46, 46), 36, WORLD_WIDTH - 36),
		y: useRing ? enemy.y + 44 : enemy.y + 64,
		radius: useRing ? 136 + randomRange(-12, 18) : WORLD_HEIGHT,
		width: useRing ? 26 : isPhaseTwo ? 42 : 34,
		angle: useRing ? 0 : Math.PI / 2,
		life: isPhaseTwo ? 0.72 : 0.86,
		maxLife: isPhaseTwo ? 0.72 : 0.86,
		color: palette.accent,
		stage: enemy.stage,
	});
};

const spawnEnemy = (state: GameState) => {
	const kind: EnemyKind = pickStageEnemyKind(state.stage);
	const radius = kind === "bomber" ? 22 : kind === "ace" ? 16 : kind === "fighter" ? 17 : 14;
	const tuning = getStageEnemyTuning(state.stage);
	const speedMultiplier = getEnemySpeedMultiplier(state.wave) * tuning.speedMultiplier * Math.min(1.24, state.threatMultiplier);
	const baseHp =
		kind === "bomber"
			? 5 + state.wave
			: kind === "ace"
				? 3 + Math.floor(state.wave / 2)
				: kind === "fighter"
					? 3 + Math.floor(state.wave / 2)
					: 2 + Math.floor(state.wave / 3);
	const hp = Math.max(1, Math.round(baseHp * tuning.hpMultiplier));
	const x = randomRange(radius + 12, WORLD_WIDTH - radius - 12);
	const side = Math.random() > 0.5 ? 1 : -1;

	state.enemies.push({
		id: getNextId(state),
		x,
		y: -radius - 10,
		vx: side * (kind === "ace" ? randomRange(58, 90) : randomRange(12, 32)) * speedMultiplier,
		vy: (kind === "bomber" ? randomRange(34, 50) : kind === "ace" ? randomRange(82, 112) : randomRange(52, 82)) * speedMultiplier,
		radius,
		hp,
		maxHp: hp,
		kind,
		fireCooldown: (getInitialEnemyFireCooldown(state.wave) * tuning.fireDelayMultiplier) / Math.min(1.22, state.threatMultiplier),
		age: 0,
		stage: state.stage,
	});
};

const spawnBoss = (state: GameState) => {
	const tuning = getStageEnemyTuning(state.stage);
	const hp = Math.round((72 + state.wave * 12) * tuning.bossHpMultiplier);
	state.bossActive = true;
	state.enemies.push({
		id: getNextId(state),
		x: WORLD_WIDTH / 2,
		y: -72,
		vx: 64,
		vy: 42,
		radius: 54,
		hp,
		maxHp: hp,
		kind: "boss",
		fireCooldown: 1.35,
		bossPhase: 1,
		specialCooldown: 2.8,
		age: 0,
		stage: state.stage,
	});
};

const spawnSupplyCraft = (state: GameState) => {
	const radius = 21;
	const fromLeft = Math.random() > 0.5;

	state.enemies.push({
		id: getNextId(state),
		x: fromLeft ? -radius - 24 : WORLD_WIDTH + radius + 24,
		y: randomRange(150, 360),
		vx: (fromLeft ? 1 : -1) * randomRange(42, 58),
		vy: randomRange(-4, 12),
		radius,
		hp: 16 + state.wave * 3,
		maxHp: 16 + state.wave * 3,
		kind: "supply",
		fireCooldown: Number.POSITIVE_INFINITY,
		age: 0,
		stage: state.stage,
		coinReward: Math.round(28 + state.wave * 9),
		experienceReward: Math.round(18 + state.wave * 4),
	});
};

const spawnGoldfish = (state: GameState) => {
	const radius = 18;
	const fromLeft = Math.random() > 0.5;
	const hp = 58 + state.wave * 13;
	const coinReward = Math.round(65 + state.wave * 24);

	state.enemies.push({
		id: getNextId(state),
		x: fromLeft ? -radius - 18 : WORLD_WIDTH + radius + 18,
		y: randomRange(88, 238),
		vx: (fromLeft ? 1 : -1) * randomRange(46, 64),
		vy: randomRange(6, 18),
		radius,
		hp,
		maxHp: hp,
		kind: "goldfish",
		fireCooldown: Number.POSITIVE_INFINITY,
		age: 0,
		escapeTime: GOLDFISH_ESCAPE_TIME,
		coinReward,
		experienceReward: Math.round(86 + state.wave * 11),
	});
};

export const updateEnemies = (state: GameState, dt: number) => {
	for (const enemy of state.enemies) {
		enemy.age += dt;

		if (enemy.kind === "boss") {
			if (enemy.y < 86) {
				enemy.y += enemy.vy * dt;
			} else {
				const hpRatio = enemy.hp / enemy.maxHp;
				if (hpRatio <= 0.5 && enemy.bossPhase !== 2) {
					enemy.bossPhase = 2;
					enemy.vx *= 1.24;
					enemy.fireCooldown = Math.min(enemy.fireCooldown, 0.45);
					enemy.specialCooldown = 0.65;
					state.shake = Math.max(state.shake, 0.36);
					addParticleBurst(state, enemy.x, enemy.y, getStagePalette(enemy.stage).accent, 44);
				}
				enemy.x += enemy.vx * dt;
				if (enemy.x < 76 || enemy.x > WORLD_WIDTH - 76) enemy.vx *= -1;
				enemy.specialCooldown = Math.max(0, (enemy.specialCooldown ?? 2.8) - dt);
				if (enemy.specialCooldown <= 0) {
					addBossWarning(state, enemy);
					enemy.specialCooldown = randomRange(enemy.bossPhase === 2 ? 3.6 : 4.8, enemy.bossPhase === 2 ? 5.2 : 6.7) / Math.min(1.18, state.threatMultiplier);
				}
			}
		} else if (enemy.kind === "goldfish") {
			const escapeRatio = enemy.escapeTime ? clamp(enemy.age / enemy.escapeTime, 0, 1) : 0;
			const dartSpeed = 1 + escapeRatio * 0.48;
			enemy.x += enemy.vx * dartSpeed * dt;
			enemy.y += (enemy.vy + Math.sin(enemy.age * 4.2) * 26) * dt;
		} else if (enemy.kind === "supply") {
			enemy.x += enemy.vx * dt;
			enemy.y += (enemy.vy + Math.sin(enemy.age * 3.2) * 18) * dt;
		} else {
			const movementMultiplier = getEnemySpeedMultiplier(state.wave);
			const weave = (enemy.kind === "ace" ? 82 : enemy.kind === "fighter" ? 44 : 28) * movementMultiplier;
			const waveSpeed = (enemy.kind === "ace" ? 5.8 : enemy.kind === "fighter" ? 3.4 : 2.1) * (0.76 + getDifficultyRamp(state.wave) * 0.18);
			enemy.x += Math.sin(enemy.age * waveSpeed) * weave * dt + enemy.vx * dt;
			enemy.y += enemy.vy * dt;
			if (enemy.y >= NORMAL_ENEMY_ADVANCE_LIMIT_Y - enemy.radius) {
				enemy.y = NORMAL_ENEMY_ADVANCE_LIMIT_Y - enemy.radius;
				enemy.vy = -Math.abs(enemy.vy) * 0.72;
				enemy.fireCooldown = Math.min(enemy.fireCooldown, 0.22);
			}
			if (enemy.x < enemy.radius || enemy.x > WORLD_WIDTH - enemy.radius) enemy.vx *= -1;
		}

		if (enemy.kind === "goldfish" || enemy.kind === "supply") continue;

		enemy.fireCooldown -= dt;
		if (enemy.fireCooldown <= 0 && canEnemyFire(enemy)) {
			fireEnemyPattern(state, enemy);
			enemy.fireCooldown = (getEnemyRefireCooldown(state.wave, enemy.kind) * getStageFireDelay(enemy)) / Math.min(1.22, state.threatMultiplier);
		}
	}
};

export const updateSpawn = (state: GameState, dt: number) => {
	state.wave = Math.max(state.wave, 1 + Math.floor(state.score / 1800));
	state.spawnTimer -= dt;
	state.bossTimer -= dt;
	state.treasureTimer -= dt;
	state.supplyTimer -= dt;

	if (state.spawnTimer <= 0 && !state.bossActive) {
		spawnEnemy(state);
		const speedUp = Math.min(0.38, Math.max(0, state.wave - 1) * 0.032);
		state.spawnTimer = (randomRange(0.82, 1.34) - speedUp) / Math.max(0.75, state.spawnIntensityMultiplier * Math.min(1.18, state.threatMultiplier));
	}

	if (state.treasureTimer <= 0) {
		if (!state.bossActive && state.wave >= 3 && !state.enemies.some((enemy) => enemy.kind === "goldfish")) {
			spawnGoldfish(state);
		}
		state.treasureTimer = randomRange(118, 182);
	}

	if (state.supplyTimer <= 0) {
		if (!state.bossActive && !state.enemies.some((enemy) => enemy.kind === "supply")) {
			spawnSupplyCraft(state);
		}
		state.supplyTimer = randomRange(42, 68);
	}

	if (state.bossTimer <= 0 && !state.bossActive) {
		spawnBoss(state);
	}
};
