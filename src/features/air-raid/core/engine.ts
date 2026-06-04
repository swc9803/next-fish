import {
	ENEMY_FIRE_SAFE_MARGIN_X,
	ENEMY_FIRE_SAFE_MARGIN_Y,
	MELEE_MAX_CHARGE,
	PLAYER_BOUNDS_PADDING_BOTTOM,
	PLAYER_BOUNDS_PADDING_TOP,
	PLAYER_BOUNDS_PADDING_X,
	PLAYER_HITBOX_HEAD_OFFSET_Y,
	PLAYER_HITBOX_RADIUS,
	PLAYER_SPEED,
	WORLD_HEIGHT,
	WORLD_WIDTH,
} from "./constants";
import { openAugmentSelection } from "./augments";
import { clamp, distanceSquared, randomRange } from "./math";
import { getBossSkillDamageMultiplier, getStageEnemyTuning, getStagePalette, openStageSelection, pickStageEnemyKind, selectStageRoute } from "./stages";
import { getNextId } from "./state";
import type { BossSkillId, Bullet, CollectionEffect, EnemyKind, GameState, Plane, PowerUp } from "./types";

const COLLECTION_EFFECT_LIFE = 0.28;
const GOLDFISH_ESCAPE_TIME = 7.6;
const BOSS_COIN_DROP_COUNT = 46;
const ROUTE_PORTAL_Y = 46;
const ROUTE_SIDE_PORTAL_Y = 126;
const ROUTE_PORTAL_RADIUS = 42;
const BOSS_SKILL_COOLDOWNS: Record<BossSkillId, number> = {
	"coral-surge": 18,
	"abyss-lance": 16,
	"ember-current": 22,
	"frost-shell": 20,
	"kelp-snare": 17,
	"ruin-prism": 24,
};

export const getPlayerHitbox = (state: GameState) => ({
	x: state.player.x,
	y: state.player.y - PLAYER_HITBOX_HEAD_OFFSET_Y,
	radius: PLAYER_HITBOX_RADIUS,
});

export const getStageRoutePosition = (index: number) => ({
	x: [88, WORLD_WIDTH / 2, WORLD_WIDTH - 88][index] ?? WORLD_WIDTH / 2,
	y: index === 1 ? ROUTE_PORTAL_Y : ROUTE_SIDE_PORTAL_Y,
	radius: ROUTE_PORTAL_RADIUS,
});

const addParticleBurst = (state: GameState, x: number, y: number, color: string, count: number) => {
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

const addCollectionEffect = (state: GameState, kind: CollectionEffect["kind"], x: number, y: number, radius: number) => {
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

const awardEnemyScore = (state: GameState, enemy: Plane) => {
	const baseScore =
		enemy.kind === "boss" ? 2200 : enemy.kind === "goldfish" ? 1250 : enemy.kind === "bomber" ? 260 : enemy.kind === "ace" ? 230 : enemy.kind === "fighter" ? 180 : 110;
	state.combo = Math.min(99, state.combo + 1);
	state.comboTimer = 2.6;
	state.score += Math.round(baseScore * (1 + Math.min(state.combo - 1, 18) * 0.05));
	state.defeatedEnemies += 1;
	if (enemy.kind === "boss") state.defeatedBosses += 1;
};

const calculateCoinReward = (state: GameState) =>
	Math.max(0, state.earnedCoins + Math.floor(state.defeatedEnemies * 3 + Math.max(0, state.wave - 1) * 35 + state.defeatedBosses * 90 + state.score / 720));

const getEnemyExperience = (state: GameState, enemy: Plane) => {
	if (enemy.kind === "goldfish") return enemy.experienceReward ?? 90 + state.wave * 10;

	const baseExperience = enemy.kind === "boss" ? 125 : enemy.kind === "bomber" ? 18 : enemy.kind === "ace" ? 16 : enemy.kind === "fighter" ? 12 : 8;
	return baseExperience + Math.floor(state.wave * (enemy.kind === "boss" ? 4 : 0.8));
};

const getNextExperience = (level: number, currentNext: number) => Math.round(currentNext * 1.22 + 18 + level * 6);

const addExperience = (state: GameState, amount: number) => {
	state.experience += amount;
	if (state.mode !== "playing" || state.experience < state.nextExperience) return;

	state.experience -= state.nextExperience;
	state.experienceLevel += 1;
	state.nextExperience = getNextExperience(state.experienceLevel, state.nextExperience);
	state.shake = Math.max(state.shake, 0.2);
	addParticleBurst(state, state.player.x, state.player.y, "#b6ff7a", 26);
	openAugmentSelection(state);
};

const dropExperience = (state: GameState, enemy: Plane) => {
	const totalExperience = getEnemyExperience(state, enemy);
	const orbCount = enemy.kind === "boss" ? 28 : enemy.kind === "goldfish" ? 14 : enemy.kind === "bomber" ? 4 : enemy.kind === "ace" ? 3 : 2;
	let remaining = totalExperience;

	for (let i = 0; i < orbCount; i++) {
		const value = i === orbCount - 1 ? remaining : Math.max(1, Math.floor(totalExperience / orbCount));
		remaining -= value;
		state.experienceOrbs.push({
			id: getNextId(state),
			x: enemy.x + randomRange(-enemy.radius * 0.35, enemy.radius * 0.35),
			y: enemy.y + randomRange(-enemy.radius * 0.25, enemy.radius * 0.25),
			vx: enemy.kind === "boss" ? randomRange(-150, 150) : randomRange(-44, 44),
			vy: enemy.kind === "boss" ? randomRange(-140, 85) : randomRange(48, 98),
			value,
			radius: enemy.kind === "boss" || enemy.kind === "goldfish" ? 5.6 : 4.6,
			kind: "experience",
			autoCollect: enemy.kind === "boss",
			homeDelay: enemy.kind === "boss" ? randomRange(0.2, 0.62) : 0,
		});
	}
};

const dropCoins = (state: GameState, enemy: Plane, totalCoins: number, count: number, autoCollect = false) => {
	let remaining = Math.max(0, Math.floor(totalCoins));

	for (let i = 0; i < count; i++) {
		const slotsLeft = count - i;
		const value = i === count - 1 ? remaining : Math.max(1, Math.floor(remaining / slotsLeft) + Math.floor(randomRange(-1, 3)));
		remaining -= value;
		const angle = autoCollect ? randomRange(-Math.PI, 0) : randomRange(-Math.PI * 0.94, -Math.PI * 0.06);
		const speed = randomRange(autoCollect ? 120 : 72, enemy.kind === "boss" ? 230 : 150);

		state.experienceOrbs.push({
			id: getNextId(state),
			x: enemy.x + randomRange(-enemy.radius * 0.5, enemy.radius * 0.5),
			y: enemy.y + randomRange(-enemy.radius * 0.35, enemy.radius * 0.35),
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed + randomRange(42, 96),
			value,
			radius: enemy.kind === "boss" ? randomRange(5.4, 7.2) : randomRange(4.8, 6.2),
			kind: "coin",
			autoCollect,
			homeDelay: autoCollect ? randomRange(0.18, 0.7) : 0,
		});
	}
};

const getShotChaos = (state: GameState) => {
	const focusStabilizer = state.weapon === "laser" ? state.laserFocus * 0.24 : 0;
	return Math.max(0, state.projectileChaos - focusStabilizer);
};

const addPlayerBullet = (
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

const firePlayer = (state: GameState) => {
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

const getPetShieldRadius = (level: number) => 18 + level * 3.2;

const addEnemyBullet = (state: GameState, enemy: Plane, angle: number, speed: number) => {
	const adjustedSpeed = speed * getEnemyBulletSpeedMultiplier(state.wave);
	const palette = getStagePalette(enemy.stage);
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
		color: enemy.kind === "boss" ? palette.accent : "#ffcb74",
	});
};

const damageEnemies = (state: GameState, amount: number, x: number, y: number, radius: number, color: string) => {
	for (const enemy of state.enemies) {
		if (distanceSquared(enemy.x, enemy.y, x, y) <= radius * radius) {
			enemy.hp -= amount * state.damageMultiplier * getBossSkillDamageMultiplier(state, enemy);
			addParticleBurst(state, enemy.x, enemy.y, color, enemy.kind === "boss" ? 18 : 9);
		}
	}
};

const addBossSkillProjectile = (state: GameState, skillId: BossSkillId, xOffset: number, vx: number) => {
	const color = skillId === "ruin-prism" ? "#c79cff" : skillId === "abyss-lance" ? "#9cc7ff" : "#ffb45f";
	state.bullets.push({
		id: getNextId(state),
		x: state.player.x + xOffset,
		y: state.player.y - 42,
		vx,
		vy: skillId === "ember-current" ? -255 : -315,
		radius: skillId === "ruin-prism" ? 16 : 14,
		visualRadius: skillId === "ruin-prism" ? 11 : 9,
		blastRadius: skillId === "ruin-prism" ? 98 : 76,
		damage: skillId === "ruin-prism" ? 44 : 36,
		pierce: skillId === "ruin-prism" ? 4 : 3,
		from: "player",
		color,
	});
};

const resolveDefeatedEnemies = (state: GameState, canDropPowerUp: boolean) => {
	const removedEnemies = new Set<number>();
	for (const enemy of state.enemies) {
		if (enemy.hp <= 0) defeatEnemy(state, enemy, removedEnemies, canDropPowerUp);
	}
	state.enemies = state.enemies.filter((enemy) => !removedEnemies.has(enemy.id));
};

export const activateBossSkill = (state: GameState, skillId: BossSkillId) => {
	if (state.mode !== "playing" || !state.bossSkills.includes(skillId) || state.bossSkillCooldowns[skillId] > 0) return false;

	state.bossSkillCooldowns[skillId] = BOSS_SKILL_COOLDOWNS[skillId];
	state.shake = Math.max(state.shake, skillId === "ruin-prism" ? 0.5 : 0.34);

	switch (skillId) {
		case "coral-surge":
			state.bullets = state.bullets.filter((bullet) => bullet.from === "player");
			damageEnemies(state, 22, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT, "#ff8fae");
			addParticleBurst(state, state.player.x, state.player.y - 24, "#ff8fae", 56);
			break;
		case "abyss-lance":
			addBossSkillProjectile(state, skillId, 0, 0);
			addParticleBurst(state, state.player.x, state.player.y - 42, "#9cc7ff", 26);
			break;
		case "ember-current":
			addBossSkillProjectile(state, skillId, 0, 0);
			damageEnemies(state, 18, state.player.x, state.player.y - 160, 150, "#ffb45f");
			addParticleBurst(state, state.player.x, state.player.y - 90, "#ffb45f", 42);
			break;
		case "frost-shell":
			state.bullets = state.bullets.filter((bullet) => bullet.from === "player");
			state.player.invincible = Math.max(state.player.invincible, 3.2);
			if (state.shieldUnlocked) state.shieldCharges = Math.min(state.shieldMaxCharges, state.shieldCharges + 1);
			damageEnemies(state, 16, state.player.x, state.player.y, 190, "#8bf4ff");
			addParticleBurst(state, state.player.x, state.player.y, "#8bf4ff", 52);
			break;
		case "kelp-snare":
			for (const enemy of state.enemies) {
				enemy.vx *= 0.24;
				enemy.vy *= 0.42;
				enemy.fireCooldown += 1.8;
			}
			damageEnemies(state, 24, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT, "#9eff8f");
			addParticleBurst(state, state.player.x, state.player.y - 36, "#9eff8f", 48);
			break;
		case "ruin-prism":
			addBossSkillProjectile(state, skillId, -28, -34);
			addBossSkillProjectile(state, skillId, 0, 0);
			addBossSkillProjectile(state, skillId, 28, 34);
			addParticleBurst(state, state.player.x, state.player.y - 42, "#c79cff", 44);
			break;
	}

	resolveDefeatedEnemies(state, false);
	return true;
};

const getPlayerMinY = (radius: number) => radius + PLAYER_BOUNDS_PADDING_TOP;
const getPlayerMaxY = (radius: number) => WORLD_HEIGHT - radius - PLAYER_BOUNDS_PADDING_BOTTOM;

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
		const baseAngle = getEnemyAimAngle(state, enemy, 0.42 + ramp * 0.12);
		const sweep = Math.sin(enemy.age * 2.2) * 0.1;
		for (let i = -2; i <= 2; i++) addEnemyBullet(state, enemy, baseAngle + sweep + i * 0.16, 238);
		addEnemyBullet(state, enemy, getEnemyAimAngle(state, enemy, 0.68, laneSign * 62), 205);
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

const spawnEnemy = (state: GameState) => {
	const kind: EnemyKind = pickStageEnemyKind(state.stage);
	const radius = kind === "bomber" ? 22 : kind === "ace" ? 16 : kind === "fighter" ? 17 : 14;
	const tuning = getStageEnemyTuning(state.stage);
	const speedMultiplier = getEnemySpeedMultiplier(state.wave) * tuning.speedMultiplier;
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
		fireCooldown: getInitialEnemyFireCooldown(state.wave) * tuning.fireDelayMultiplier,
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
		age: 0,
		stage: state.stage,
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

const updatePlayer = (state: GameState, dt: number, canFire = true) => {
	const { player, keys } = state;
	let dx = 0;
	let dy = 0;

	if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
	if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
	if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
	if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;

	if (state.pointerActive) {
		const targetDx = player.targetX - player.x;
		const targetDy = player.targetY - player.y;
		const targetDistance = Math.hypot(targetDx, targetDy);
		const maxDistance = PLAYER_SPEED * state.playerSpeedMultiplier * dt;

		if (targetDistance <= maxDistance) {
			player.x = player.targetX;
			player.y = player.targetY;
		} else if (targetDistance > 0) {
			player.x += (targetDx / targetDistance) * maxDistance;
			player.y += (targetDy / targetDistance) * maxDistance;
		}
	} else if (dx !== 0 || dy !== 0) {
		const length = Math.hypot(dx, dy);
		player.x += (dx / length) * PLAYER_SPEED * state.playerSpeedMultiplier * dt;
		player.y += (dy / length) * PLAYER_SPEED * state.playerSpeedMultiplier * dt;
	}

	player.x = clamp(player.x, player.radius + PLAYER_BOUNDS_PADDING_X, WORLD_WIDTH - player.radius - PLAYER_BOUNDS_PADDING_X);
	player.y = clamp(player.y, getPlayerMinY(player.radius), getPlayerMaxY(player.radius));
	player.targetX = clamp(player.targetX, player.radius + PLAYER_BOUNDS_PADDING_X, WORLD_WIDTH - player.radius - PLAYER_BOUNDS_PADDING_X);
	player.targetY = clamp(player.targetY, getPlayerMinY(player.radius), getPlayerMaxY(player.radius));
	player.invincible = Math.max(0, player.invincible - dt);
	player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
	if (player.isCharging) {
		player.meleeCharge = Math.min(MELEE_MAX_CHARGE, player.meleeCharge + dt);
	}

	if (!canFire) {
		player.fireCooldown = Math.max(0, player.fireCooldown - dt);
		return;
	}

	player.fireCooldown -= dt;
	const weaponRate = state.weapon === "laser" ? 0.075 : state.weapon === "lance" ? 0.34 : state.weapon === "scatter" ? 0.27 : state.weapon === "fork" ? 0.25 : 0.24;
	const reloadMultiplier = state.weapon === "fork" || state.weapon === "scatter" || state.weapon === "lance" ? 1 / state.reloadSpeedMultiplier : 1;
	const fireRate = clamp((weaponRate - player.power * 0.018) * state.fireCooldownMultiplier * reloadMultiplier, 0.045, 0.5);
	if (player.fireCooldown <= 0) {
		firePlayer(state);
		player.fireCooldown = fireRate;
	}
};

const updateEnemies = (state: GameState, dt: number) => {
	for (const enemy of state.enemies) {
		enemy.age += dt;

		if (enemy.kind === "boss") {
			if (enemy.y < 86) {
				enemy.y += enemy.vy * dt;
			} else {
				enemy.x += enemy.vx * dt;
				if (enemy.x < 76 || enemy.x > WORLD_WIDTH - 76) enemy.vx *= -1;
			}
		} else if (enemy.kind === "goldfish") {
			const escapeRatio = enemy.escapeTime ? clamp(enemy.age / enemy.escapeTime, 0, 1) : 0;
			const dartSpeed = 1 + escapeRatio * 0.48;
			enemy.x += enemy.vx * dartSpeed * dt;
			enemy.y += (enemy.vy + Math.sin(enemy.age * 4.2) * 26) * dt;
		} else {
			const movementMultiplier = getEnemySpeedMultiplier(state.wave);
			const weave = (enemy.kind === "ace" ? 82 : enemy.kind === "fighter" ? 44 : 28) * movementMultiplier;
			const waveSpeed = (enemy.kind === "ace" ? 5.8 : enemy.kind === "fighter" ? 3.4 : 2.1) * (0.76 + getDifficultyRamp(state.wave) * 0.18);
			enemy.x += Math.sin(enemy.age * waveSpeed) * weave * dt + enemy.vx * dt;
			enemy.y += enemy.vy * dt;
			if (enemy.x < enemy.radius || enemy.x > WORLD_WIDTH - enemy.radius) enemy.vx *= -1;
		}

		if (enemy.kind === "goldfish") continue;

		enemy.fireCooldown -= dt;
		if (enemy.fireCooldown <= 0 && canEnemyFire(enemy)) {
			fireEnemyPattern(state, enemy);
			enemy.fireCooldown = getEnemyRefireCooldown(state.wave, enemy.kind) * getStageFireDelay(enemy);
		}
	}
};

const updatePets = (state: GameState, dt: number) => {
	const count = state.pets.length;
	if (count === 0) return;

	for (let i = 0; i < count; i++) {
		const pet = state.pets[i];
		const angle = state.time * (1.55 + pet.level * 0.08) + pet.phase;
		const orbitRadius = 35 + Math.min(4, pet.level) * 4 + Math.sin(state.time * 3 + pet.phase) * 2;
		const targetX = clamp(state.player.x + Math.cos(angle) * orbitRadius, 24, WORLD_WIDTH - 24);
		const targetY = clamp(state.player.y + Math.sin(angle) * orbitRadius * 0.72, 28, WORLD_HEIGHT - 28);
		const follow = Math.min(1, dt * 12);

		pet.x += (targetX - pet.x) * follow;
		pet.y += (targetY - pet.y) * follow;
		pet.fireCooldown = Math.max(0, pet.fireCooldown - dt);
	}
};

const updateBullets = (state: GameState, dt: number) => {
	for (const bullet of state.bullets) {
		bullet.x += bullet.vx * dt;
		bullet.y += bullet.vy * dt;
	}

	state.bullets = state.bullets.filter((bullet) => bullet.y > -40 && bullet.y < WORLD_HEIGHT + 48 && bullet.x > -40 && bullet.x < WORLD_WIDTH + 40);
};

const updateBossSkillCooldowns = (state: GameState, dt: number) => {
	for (const skillId of state.bossSkills) {
		state.bossSkillCooldowns[skillId] = Math.max(0, state.bossSkillCooldowns[skillId] - dt);
	}
};

const updateParticles = (state: GameState, dt: number) => {
	for (const particle of state.particles) {
		particle.x += particle.vx * dt;
		particle.y += particle.vy * dt;
		particle.vy += 70 * dt;
		particle.life -= dt;
	}

	state.particles = state.particles.filter((particle) => particle.life > 0);
};

const updatePowerUps = (state: GameState, dt: number) => {
	for (const powerUp of state.powerUps) {
		powerUp.y += powerUp.vy * dt;
	}

	state.powerUps = state.powerUps.filter((powerUp) => powerUp.y < WORLD_HEIGHT + 32);
};

const getPickupRadius = (state: GameState, itemRadius: number, baseBonus: number) => state.player.radius + itemRadius + baseBonus * state.magnetMultiplier;

const collectPowerUp = (state: GameState, powerUp: PowerUp) => {
	if (powerUp.kind === "repair") {
		state.player.lives = Math.min(state.player.maxLives, state.player.lives + 1);
	} else {
		state.player.power = Math.min(5, state.player.power + 1);
	}

	addCollectionEffect(state, powerUp.kind, powerUp.x, powerUp.y, powerUp.radius);
};

const updateExperienceOrbs = (state: GameState, dt: number) => {
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

const updateCollectionEffects = (state: GameState, dt: number) => {
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

const updateShield = (state: GameState, dt: number) => {
	if (!state.shieldUnlocked || state.shieldCharges >= state.shieldMaxCharges) return;

	state.shieldTimer -= dt;
	if (state.shieldTimer <= 0) {
		state.shieldCharges = Math.min(state.shieldMaxCharges, state.shieldCharges + 1);
		state.shieldTimer = state.shieldInterval;
		addParticleBurst(state, state.player.x, state.player.y, "#8bf4ff", 14);
	}
};

const damagePlayer = (state: GameState) => {
	const { player } = state;
	if (player.invincible > 0) return;

	if (state.shieldCharges > 0) {
		state.shieldCharges -= 1;
		state.shieldTimer = Math.min(state.shieldTimer, state.shieldInterval);
		player.invincible = 0.85;
		state.shake = Math.max(state.shake, 0.18);
		addParticleBurst(state, player.x, player.y, "#8bf4ff", 28);
		return;
	}

	player.lives -= 1;
	player.power = Math.max(1, player.power - 1);
	player.invincible = 2.3;
	state.combo = 0;
	state.comboTimer = 0;
	state.shake = 0.3;
	addParticleBurst(state, player.x, player.y, "#67eaff", 24);

	if (player.lives <= 0) {
		state.mode = "gameover";
		state.highScore = Math.max(state.highScore, state.score);
		state.earnedCoins = calculateCoinReward(state);
	}
};

const addSlash = (state: GameState, chargeRatio: number) => {
	const { player } = state;
	const clampedCharge = clamp(chargeRatio, 0, 1);
	const radius = 58 + clampedCharge * 64;
	const damage = (3.4 + clampedCharge * 11.5) * state.meleeDamageMultiplier * state.damageMultiplier;

	state.slashes.push({
		id: getNextId(state),
		x: player.x,
		y: player.y - 44 - clampedCharge * 14,
		radius,
		damage,
		charge: clampedCharge,
		life: 0.17 + clampedCharge * 0.16,
		maxLife: 0.17 + clampedCharge * 0.16,
		hitEnemyIds: [],
	});
	state.shake = Math.max(state.shake, 0.12 + clampedCharge * 0.22);
	addParticleBurst(state, player.x, player.y - 42, clampedCharge > 0.7 ? "#fff27a" : "#8bf4ff", 10 + Math.floor(clampedCharge * 18));
};

export const beginMeleeCharge = (state: GameState) => {
	if (state.mode !== "playing" || !state.meleeUnlocked || state.player.meleeCooldown > 0) return;

	if (!state.chargeUnlocked) {
		addSlash(state, 0.18);
		state.player.meleeCooldown = 0.72;
		return;
	}

	state.player.isCharging = true;
};

export const releaseMeleeCharge = (state: GameState) => {
	if (!state.meleeUnlocked) return;

	const { player } = state;
	if (player.meleeCooldown > 0 && !player.isCharging) return;

	const chargeRatio = state.chargeUnlocked ? clamp(player.meleeCharge / MELEE_MAX_CHARGE, 0.2, 1) : 0.18;
	addSlash(state, chargeRatio);
	player.isCharging = false;
	player.meleeCharge = 0;
	player.meleeCooldown = 0.72 + chargeRatio * 0.58;
};

const updateSlashes = (state: GameState, dt: number) => {
	for (const slash of state.slashes) {
		slash.life -= dt;
	}

	state.slashes = state.slashes.filter((slash) => slash.life > 0);
};

const getEnemyBurstColor = (enemy: Plane) => {
	if (enemy.kind === "boss") return "#ff8ad7";
	if (enemy.kind === "goldfish") return "#fff27a";
	return "#ffb15f";
};

const awardGoldfishBonus = (state: GameState, enemy: Plane) => {
	const coinReward = enemy.coinReward ?? Math.round(65 + state.wave * 24);
	dropCoins(state, enemy, coinReward, 12);
};

const defeatEnemy = (state: GameState, enemy: Plane, removedEnemies: Set<number>, canDropPowerUp: boolean) => {
	removedEnemies.add(enemy.id);
	awardEnemyScore(state, enemy);
	state.shake = Math.max(state.shake, enemy.kind === "boss" ? 0.42 : enemy.kind === "goldfish" ? 0.32 : 0.13);
	addParticleBurst(state, enemy.x, enemy.y, getEnemyBurstColor(enemy), enemy.kind === "boss" ? 58 : enemy.kind === "goldfish" ? 42 : 18);

	if (enemy.kind === "goldfish") {
		awardGoldfishBonus(state, enemy);
	}

	dropExperience(state, enemy);

	if (enemy.kind === "boss") {
		const coinReward = Math.round(260 + state.wave * 42 + state.defeatedBosses * 85);
		dropCoins(state, enemy, coinReward, BOSS_COIN_DROP_COUNT, true);
		addParticleBurst(state, enemy.x, enemy.y, "#fff27a", 76);
		addParticleBurst(state, enemy.x, enemy.y, "#ffffff", 42);
		state.bossActive = false;
		openStageSelection(state);
	} else if (enemy.kind !== "goldfish" && canDropPowerUp && Math.random() < 0.13) {
		state.powerUps.push({
			id: getNextId(state),
			x: enemy.x,
			y: enemy.y,
			vy: 88,
			radius: 12,
			kind: Math.random() < 0.22 ? "repair" : "power",
		});
	}
};

const resolveCollisions = (state: GameState) => {
	const playerBullets = state.bullets.filter((bullet) => bullet.from === "player");
	const enemyBullets = state.bullets.filter((bullet) => bullet.from === "enemy");
	const removedBullets = new Set<number>();
	const removedEnemies = new Set<number>();
	const playerHitbox = getPlayerHitbox(state);

	for (const bullet of playerBullets) {
		for (const enemy of state.enemies) {
			if (removedEnemies.has(enemy.id)) continue;
				const hitDistance = bullet.radius + enemy.radius;
				if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
					if (bullet.blastRadius) {
						damageEnemies(state, bullet.damage, bullet.x, bullet.y, bullet.blastRadius, bullet.color);
						removedBullets.add(bullet.id);
						addParticleBurst(state, bullet.x, bullet.y, bullet.color, 32);
						for (const blastEnemy of state.enemies) {
							if (!removedEnemies.has(blastEnemy.id) && blastEnemy.hp <= 0) defeatEnemy(state, blastEnemy, removedEnemies, false);
						}
					} else {
						enemy.hp -= bullet.damage * getBossSkillDamageMultiplier(state, enemy);
						addParticleBurst(state, bullet.x, bullet.y, "#8bf4ff", 3);
					}

					if (!bullet.blastRadius && bullet.pierce > 0) {
						bullet.pierce -= 1;
					} else if (!bullet.blastRadius) {
						removedBullets.add(bullet.id);
					}

					if (!removedEnemies.has(enemy.id) && enemy.hp <= 0) {
						defeatEnemy(state, enemy, removedEnemies, true);
					}
				break;
			}
		}
	}

	for (const slash of state.slashes) {
		for (const enemy of state.enemies) {
			if (removedEnemies.has(enemy.id) || slash.hitEnemyIds.includes(enemy.id)) continue;

			const hitDistance = slash.radius + enemy.radius * 0.25;
			if (enemy.y < state.player.y + 24 && distanceSquared(slash.x, slash.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
				enemy.hp -= slash.damage * getBossSkillDamageMultiplier(state, enemy);
				slash.hitEnemyIds.push(enemy.id);
				addParticleBurst(state, enemy.x, enemy.y, slash.charge > 0.75 ? "#fff27a" : "#8bf4ff", 8);

				if (enemy.hp <= 0) {
					defeatEnemy(state, enemy, removedEnemies, false);
				}
			}
		}

		for (const bullet of enemyBullets) {
			if (distanceSquared(slash.x, slash.y, bullet.x, bullet.y) <= slash.radius * slash.radius) {
				removedBullets.add(bullet.id);
			}
		}
	}

	for (const bullet of enemyBullets) {
		for (const pet of state.pets) {
			const shieldRadius = getPetShieldRadius(pet.level);
			const hitDistance = bullet.radius + shieldRadius;
			if (distanceSquared(bullet.x, bullet.y, pet.x, pet.y) <= hitDistance * hitDistance) {
				removedBullets.add(bullet.id);
				pet.fireCooldown = 0.18;
				state.shake = Math.max(state.shake, 0.06);
				addParticleBurst(state, pet.x, pet.y, pet.level >= 4 ? "#ffffff" : "#8bf4ff", 12 + pet.level * 3);
				break;
			}
		}
		if (removedBullets.has(bullet.id)) continue;

		const hitDistance = bullet.radius + playerHitbox.radius;
		if (distanceSquared(bullet.x, bullet.y, playerHitbox.x, playerHitbox.y) <= hitDistance * hitDistance) {
			removedBullets.add(bullet.id);
			damagePlayer(state);
		}
	}

	for (const enemy of state.enemies) {
		const hitDistance = enemy.radius + playerHitbox.radius;
		if (enemy.y > -20 && distanceSquared(enemy.x, enemy.y, playerHitbox.x, playerHitbox.y) <= hitDistance * hitDistance) {
			removedEnemies.add(enemy.id);
			if (enemy.kind !== "boss") addParticleBurst(state, enemy.x, enemy.y, getEnemyBurstColor(enemy), 12);
			damagePlayer(state);
		}
	}

	for (const powerUp of state.powerUps) {
		const pickupRadius = getPickupRadius(state, powerUp.radius, 28);
		if (distanceSquared(powerUp.x, powerUp.y, state.player.x, state.player.y) <= pickupRadius * pickupRadius) {
			collectPowerUp(state, powerUp);
			removedBullets.add(powerUp.id);
		}
	}

	state.bullets = state.bullets.filter((bullet) => !removedBullets.has(bullet.id));
	state.enemies = state.enemies.filter(
		(enemy) => !removedEnemies.has(enemy.id) && (enemy.kind !== "goldfish" || !enemy.escapeTime || enemy.age < enemy.escapeTime) && enemy.y < WORLD_HEIGHT + enemy.radius + 40,
	);
	state.powerUps = state.powerUps.filter((powerUp) => !removedBullets.has(powerUp.id));
	if (state.mode === "stage-select") {
		state.enemies = [];
		state.bullets = [];
		state.slashes = [];
		state.powerUps = [];
	}
};

const updateStageSelection = (state: GameState, dt: number) => {
	state.time += dt;
	state.shake = Math.max(0, state.shake - dt);
	updatePlayer(state, dt, false);
	updateExperienceOrbs(state, dt);
	updateCollectionEffects(state, dt);
	updateParticles(state, dt);

	for (let index = 0; index < state.stageChoices.length; index++) {
		const route = getStageRoutePosition(index);
		const hitRadius = state.player.radius + route.radius * 0.58;
		if (distanceSquared(state.player.x, state.player.y, route.x, route.y) <= hitRadius * hitRadius) {
			selectStageRoute(state, state.stageChoices[index].id);
			break;
		}
	}
};

const updateSpawn = (state: GameState, dt: number) => {
	state.wave = Math.max(state.wave, 1 + Math.floor(state.score / 1800));
	state.spawnTimer -= dt;
	state.bossTimer -= dt;
	state.treasureTimer -= dt;

	if (state.spawnTimer <= 0 && !state.bossActive) {
		spawnEnemy(state);
		const speedUp = Math.min(0.38, Math.max(0, state.wave - 1) * 0.032);
		state.spawnTimer = randomRange(0.82, 1.34) - speedUp;
	}

	if (state.treasureTimer <= 0) {
		if (!state.bossActive && state.wave >= 3 && !state.enemies.some((enemy) => enemy.kind === "goldfish")) {
			spawnGoldfish(state);
		}
		state.treasureTimer = randomRange(118, 182);
	}

	if (state.bossTimer <= 0 && !state.bossActive) {
		spawnBoss(state);
	}
};

const updateStars = (state: GameState, dt: number) => {
	for (const star of state.stars) {
		star.y += star.speed * dt;
		if (star.y > WORLD_HEIGHT + 8) {
			star.y = -8;
			star.x = Math.random() * WORLD_WIDTH;
		}
	}
};

export const updateGame = (state: GameState, dt: number) => {
	updateStars(state, dt);
	if (state.mode !== "playing") {
		if (state.mode === "stage-select") {
			updateStageSelection(state, dt);
			return;
		}
		if (state.mode === "augment" || state.mode === "gameover") {
			updateCollectionEffects(state, dt);
			updateParticles(state, dt);
		}
		return;
	}
	addExperience(state, 0);
	if (state.mode !== "playing") {
		updateCollectionEffects(state, dt);
		updateParticles(state, dt);
		return;
	}

	state.time += dt;
	state.shake = Math.max(0, state.shake - dt);
	state.comboTimer = Math.max(0, state.comboTimer - dt);
	if (state.comboTimer <= 0) state.combo = 0;
	updatePlayer(state, dt);
	updateBossSkillCooldowns(state, dt);
	updateSpawn(state, dt);
	updateEnemies(state, dt);
	updatePets(state, dt);
	updateShield(state, dt);
	updateBullets(state, dt);
	updatePowerUps(state, dt);
	updateSlashes(state, dt);
	resolveCollisions(state);
	updateExperienceOrbs(state, dt);
	updateCollectionEffects(state, dt);
	updateParticles(state, dt);
};
