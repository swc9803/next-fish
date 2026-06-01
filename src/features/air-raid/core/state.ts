import { MELEE_MAX_CHARGE, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { randomRange } from "./math";
import type { GameState, HudState } from "./types";

const createStars = () =>
	Array.from({ length: 90 }, () => ({
		x: Math.random() * WORLD_WIDTH,
		y: Math.random() * WORLD_HEIGHT,
		speed: randomRange(28, 145),
		size: randomRange(0.8, 2.4),
		alpha: randomRange(0.24, 0.9),
	}));

export const createInitialState = (highScore: number): GameState => ({
	mode: "ready",
	score: 0,
	highScore,
	wave: 1,
	time: 0,
	spawnTimer: 0.7,
	bossTimer: 28,
	bossActive: false,
	shake: 0,
	nextId: 1,
	weapon: "standard",
	damageMultiplier: 1,
	fireCooldownMultiplier: 1,
	bulletPierce: 0,
	laserFocus: 0,
	prismSplitter: false,
	projectileChaos: 0,
	meleeUnlocked: false,
	chargeUnlocked: false,
	meleeDamageMultiplier: 1,
	nextAugmentScore: 900,
	augmentChoices: [],
	augments: [],
	player: {
		x: WORLD_WIDTH / 2,
		y: WORLD_HEIGHT - 82,
		targetX: WORLD_WIDTH / 2,
		targetY: WORLD_HEIGHT - 82,
		radius: 16,
		lives: 3,
		power: 1,
		fireCooldown: 0,
		invincible: 2.2,
		meleeCooldown: 0,
		meleeCharge: 0,
		isCharging: false,
	},
	bullets: [],
	enemies: [],
	slashes: [],
	particles: [],
	powerUps: [],
	stars: createStars(),
	keys: new Set<string>(),
	pointerActive: false,
	hudTimer: 0,
});

export const makeHud = (state: GameState): HudState => ({
	mode: state.mode,
	score: state.score,
	highScore: state.highScore,
	wave: state.wave,
	lives: state.player.lives,
	power: state.player.power,
	weapon: state.weapon,
	augmentCount: state.augments.length,
	augmentChoices: state.augmentChoices,
	laserFocus: state.laserFocus,
	projectileChaos: state.projectileChaos,
	meleeUnlocked: state.meleeUnlocked,
	chargeUnlocked: state.chargeUnlocked,
	chargeRatio: Math.min(state.player.meleeCharge / MELEE_MAX_CHARGE, 1),
});

export const getNextId = (state: GameState) => {
	const id = state.nextId;
	state.nextId += 1;
	return id;
};
