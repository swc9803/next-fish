import { MELEE_MAX_CHARGE, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { randomRange } from "./math";
import { STAGES } from "./stages";
import type { GameState, HudState, MetaProgress } from "./types";

const createStars = () =>
	Array.from({ length: 90 }, () => ({
		x: Math.random() * WORLD_WIDTH,
		y: Math.random() * WORLD_HEIGHT,
		speed: randomRange(28, 145),
		size: randomRange(0.8, 2.4),
		alpha: randomRange(0.24, 0.9),
	}));

export const createInitialState = (highScore: number, metaProgress?: MetaProgress): GameState => {
	const upgrades = metaProgress?.upgrades;
	const slotBonuses = metaProgress?.slotBonuses;
	const state: GameState = {
		mode: "ready",
		score: 0,
		highScore,
		experienceLevel: 1,
		experience: 0,
		nextExperience: 70,
		combo: 0,
		comboTimer: 0,
		wave: 1,
		stage: "coral",
		clearedStages: [],
		bossSkills: [],
		bossSkillCooldowns: {
			"coral-surge": 0,
			"abyss-lance": 0,
			"ember-current": 0,
			"frost-shell": 0,
			"kelp-snare": 0,
			"ruin-prism": 0,
		},
		stageChoices: [],
		pendingBossSkill: null,
		time: 0,
	spawnTimer: 1.15,
	bossTimer: 36,
	treasureTimer: randomRange(82, 126),
	bossActive: false,
	shake: 0,
	nextId: 1,
	weapon: "standard",
	damageMultiplier: 1,
	fireCooldownMultiplier: 1,
	playerSpeedMultiplier: 1,
	magnetMultiplier: 1.55,
	reloadSpeedMultiplier: 1,
	bulletPierce: 0,
	laserFocus: 0,
	prismSplitter: false,
	projectileChaos: 0,
	meleeUnlocked: false,
	chargeUnlocked: false,
	meleeDamageMultiplier: 1,
	petDamageMultiplier: 1,
	petFireCooldownMultiplier: 1,
	shieldUnlocked: false,
	shieldTimer: 0,
	shieldInterval: 10,
	shieldCharges: 0,
	shieldMaxCharges: 1,
	defeatedEnemies: 0,
	defeatedBosses: 0,
	earnedCoins: 0,
	coinRewardClaimed: false,
	augmentChoices: [],
	augments: [],
	player: {
		x: WORLD_WIDTH / 2,
		y: WORLD_HEIGHT - 82,
		targetX: WORLD_WIDTH / 2,
		targetY: WORLD_HEIGHT - 82,
		radius: 16,
		lives: 3,
		maxLives: 3,
		power: 1,
		fireCooldown: 0,
		invincible: 2.2,
		meleeCooldown: 0,
		meleeCharge: 0,
		isCharging: false,
	},
	pets: [],
	bullets: [],
	enemies: [],
	slashes: [],
	particles: [],
	powerUps: [],
	experienceOrbs: [],
	collectionEffects: [],
	stars: createStars(),
	keys: new Set<string>(),
	pointerActive: false,
	hudTimer: 0,
	};

	const healthLevel = upgrades?.health ?? 0;
	const shieldLevel = upgrades?.shieldCycle ?? 0;
	const speedLevel = upgrades?.speed ?? 0;
	const fireRateLevel = upgrades?.fireRate ?? 0;
	const damageLevel = upgrades?.damage ?? 0;
	const magnetLevel = upgrades?.magnet ?? 0;
	const reloadLevel = upgrades?.reload ?? 0;
	const petLevel = upgrades?.pet ?? 0;
	const slotHealthLevel = Math.floor((slotBonuses?.health ?? 0) / 2);
	const slotShieldPoints = slotBonuses?.shieldCycle ?? 0;
	const slotPetLevel = Math.floor((slotBonuses?.pet ?? 0) / 3);

	state.player.maxLives += healthLevel + slotHealthLevel;
	state.player.lives = state.player.maxLives;
	state.damageMultiplier *= 1 + damageLevel * 0.06 + (slotBonuses?.damage ?? 0) * 0.025;
	state.fireCooldownMultiplier *= 1 / (1 + fireRateLevel * 0.05 + (slotBonuses?.fireRate ?? 0) * 0.02);
	state.playerSpeedMultiplier *= 1 + speedLevel * 0.06 + (slotBonuses?.speed ?? 0) * 0.02;
	state.magnetMultiplier *= 1 + magnetLevel * 0.12 + (slotBonuses?.magnet ?? 0) * 0.05;
	state.reloadSpeedMultiplier *= 1 + reloadLevel * 0.07 + (slotBonuses?.reload ?? 0) * 0.03;

	if (shieldLevel > 0 || slotShieldPoints > 0) {
		state.shieldUnlocked = true;
		state.shieldInterval = 12 * 0.88 ** Math.max(0, shieldLevel - 1) * 0.96 ** slotShieldPoints;
		state.shieldTimer = state.shieldInterval;
		state.shieldCharges = 1;
	}

	for (let i = 0; i < petLevel + slotPetLevel; i++) {
		state.pets.push({
			id: state.nextId,
			x: state.player.x,
			y: state.player.y + 18,
			level: 1,
			fireCooldown: 0.18 + i * 0.05,
			phase: (Math.PI * 2 * i) / 5,
		});
		state.nextId += 1;
	}

	return state;
};

export const makeHud = (state: GameState): HudState => ({
	mode: state.mode,
	score: state.score,
	highScore: state.highScore,
	experienceLevel: state.experienceLevel,
	experience: state.experience,
	nextExperience: state.nextExperience,
	combo: state.combo,
	wave: state.wave,
	stage: state.stage,
	stageTitle: STAGES[state.stage].shortTitle,
	stageBoss: STAGES[state.stage].boss,
	bossSkills: state.bossSkills,
	bossSkillCooldowns: state.bossSkillCooldowns,
	stageChoices: state.stageChoices,
	pendingBossSkill: state.pendingBossSkill,
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
	petCount: state.pets.length,
	petLevelTotal: state.pets.reduce((total, pet) => total + pet.level, 0),
	damageBonusPercent: Math.round((state.damageMultiplier - 1) * 100),
	fireRateBonusPercent: Math.round((1 / state.fireCooldownMultiplier - 1) * 100),
	speedBonusPercent: Math.round((state.playerSpeedMultiplier - 1) * 100),
	magnetBonusPercent: Math.round((state.magnetMultiplier - 1) * 100),
	reloadBonusPercent: Math.round((state.reloadSpeedMultiplier - 1) * 100),
	shieldCharges: state.shieldCharges,
	shieldMaxCharges: state.shieldUnlocked ? state.shieldMaxCharges : 0,
	defeatedEnemies: state.defeatedEnemies,
	earnedCoins: state.earnedCoins,
});

export const getNextId = (state: GameState) => {
	const id = state.nextId;
	state.nextId += 1;
	return id;
};
