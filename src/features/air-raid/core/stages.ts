import type {
	BossSkillId,
	EnemyKind,
	GameState,
	Plane,
	StageChoice,
	StageDirection,
	StageKind,
	StageMission,
	StageMissionKind,
	StageRouteModifierId,
} from "./types";

export type StagePalette = {
	top: string;
	mid: string;
	bottom: string;
	accent: string;
	enemyFill: string;
	bossFill: string;
};

type StageDefinition = {
	id: StageKind;
	title: string;
	shortTitle: string;
	description: string;
	boss: string;
	threat: string;
	rewardSkill: BossSkillId;
	weaknessSkill?: BossSkillId;
	enemyWeights: Record<Exclude<EnemyKind, "boss" | "goldfish" | "supply">, number>;
	hpMultiplier: number;
	speedMultiplier: number;
	fireDelayMultiplier: number;
	bossHpMultiplier: number;
	palette: StagePalette;
};

type StageRouteModifierDefinition = {
	id: StageRouteModifierId;
	title: string;
	description: string;
	rewardMultiplier: number;
	spawnIntensityMultiplier: number;
	bossTimer: number;
	augmentChoiceBonus: number;
};

type BossSkillDefinition = {
	id: BossSkillId;
	title: string;
	shortTitle: string;
	description: string;
	color: string;
	bonusMultiplier: number;
	targetStages: StageKind[];
};

export const STAGE_ORDER: StageKind[] = ["coral", "abyss", "volcanic", "glacier", "kelp", "ruins"];
const STAGE_DIRECTIONS: StageDirection[] = ["10", "12", "2"];

export const STAGE_ROUTE_MODIFIERS: Record<StageRouteModifierId, StageRouteModifierDefinition> = {
	bounty: {
		id: "bounty",
		title: "난류 보상로",
		description: "적이 더 자주 몰려오지만 경험치와 인양 보상이 증가합니다.",
		rewardMultiplier: 1.28,
		spawnIntensityMultiplier: 1.2,
		bossTimer: 32,
		augmentChoiceBonus: 0,
	},
	balanced: {
		id: "balanced",
		title: "정면 안정로",
		description: "위험도와 보상이 균형 잡힌 경로입니다. 진입 시 선체를 조금 정비합니다.",
		rewardMultiplier: 1,
		spawnIntensityMultiplier: 1,
		bossTimer: 28,
		augmentChoiceBonus: 0,
	},
	elite: {
		id: "elite",
		title: "심층 급행로",
		description: "보스가 더 빨리 나타납니다. 대신 유물 선택지가 하나 늘어납니다.",
		rewardMultiplier: 1.12,
		spawnIntensityMultiplier: 1.08,
		bossTimer: 20,
		augmentChoiceBonus: 1,
	},
};

const ROUTE_MODIFIERS_BY_DIRECTION: Record<StageDirection, StageRouteModifierId> = {
	"10": "bounty",
	"12": "balanced",
	"2": "elite",
};

export const BOSS_SKILLS: Record<BossSkillId, BossSkillDefinition> = {
	"coral-surge": {
		id: "coral-surge",
		title: "Coral Surge",
		shortTitle: "CORAL",
		description: "Recovered boss core. Coral-aligned enemies take increased damage.",
		color: "#ff8fae",
		bonusMultiplier: 2.15,
		targetStages: ["abyss"],
	},
	"abyss-lance": {
		id: "abyss-lance",
		title: "Abyss Lance",
		shortTitle: "ABYSS",
		description: "Recovered boss core. Abyss-aligned enemies take increased damage.",
		color: "#9cc7ff",
		bonusMultiplier: 2.15,
		targetStages: ["volcanic"],
	},
	"ember-current": {
		id: "ember-current",
		title: "Ember Current",
		shortTitle: "EMBER",
		description: "Recovered boss core. Heat-aligned enemies take increased damage.",
		color: "#ffb45f",
		bonusMultiplier: 2.15,
		targetStages: ["glacier"],
	},
	"frost-shell": {
		id: "frost-shell",
		title: "Frost Shell",
		shortTitle: "FROST",
		description: "Recovered boss core. Ice-aligned enemies take increased damage.",
		color: "#8bf4ff",
		bonusMultiplier: 2.15,
		targetStages: ["kelp"],
	},
	"kelp-snare": {
		id: "kelp-snare",
		title: "Kelp Snare",
		shortTitle: "KELP",
		description: "Recovered boss core. Kelp-aligned enemies take increased damage.",
		color: "#9eff8f",
		bonusMultiplier: 2.15,
		targetStages: ["ruins"],
	},
	"ruin-prism": {
		id: "ruin-prism",
		title: "Ruin Prism",
		shortTitle: "PRISM",
		description: "Recovered boss core. Ruin-aligned enemies take increased damage.",
		color: "#c79cff",
		bonusMultiplier: 2.15,
		targetStages: ["coral"],
	},
};

export const STAGES: Record<StageKind, StageDefinition> = {
	coral: {
		id: "coral",
		title: "Blooming Coral Reef",
		shortTitle: "CORAL REEF",
		description: "A bright entry route with balanced enemy formations.",
		boss: "Lumina, Coral Captain",
		threat: "Balanced patrols",
		rewardSkill: "coral-surge",
		weaknessSkill: "ruin-prism",
		enemyWeights: { scout: 42, fighter: 35, ace: 14, bomber: 9 },
		hpMultiplier: 0.96,
		speedMultiplier: 1,
		fireDelayMultiplier: 1.04,
		bossHpMultiplier: 1,
		palette: {
			top: "#15566f",
			mid: "#18445d",
			bottom: "#071a2b",
			accent: "#ff8fae",
			enemyFill: "#6a6578",
			bossFill: "#7a416d",
		},
	},
	abyss: {
		id: "abyss",
		title: "Black Abyss Trench",
		shortTitle: "ABYSS TRENCH",
		description: "Slow heavy enemies push through dark pressure lanes.",
		boss: "Mordo, Abyss Giant",
		threat: "Heavy artillery",
		rewardSkill: "abyss-lance",
		weaknessSkill: "coral-surge",
		enemyWeights: { scout: 24, fighter: 28, ace: 16, bomber: 32 },
		hpMultiplier: 1.18,
		speedMultiplier: 0.88,
		fireDelayMultiplier: 1.12,
		bossHpMultiplier: 1.14,
		palette: {
			top: "#101c35",
			mid: "#0b2742",
			bottom: "#030815",
			accent: "#9cc7ff",
			enemyFill: "#40506b",
			bossFill: "#343c68",
		},
	},
	volcanic: {
		id: "volcanic",
		title: "Hydrothermal Vent Field",
		shortTitle: "VENT FIELD",
		description: "Fast attackers ride hot currents through narrow lanes.",
		boss: "Igna, Vent Predator",
		threat: "High speed rush",
		rewardSkill: "ember-current",
		weaknessSkill: "abyss-lance",
		enemyWeights: { scout: 26, fighter: 34, ace: 26, bomber: 14 },
		hpMultiplier: 1.03,
		speedMultiplier: 1.08,
		fireDelayMultiplier: 0.88,
		bossHpMultiplier: 1.08,
		palette: {
			top: "#3d2733",
			mid: "#4f2631",
			bottom: "#120914",
			accent: "#ffb45f",
			enemyFill: "#775142",
			bossFill: "#7a3747",
		},
	},
	glacier: {
		id: "glacier",
		title: "Glacier Drift",
		shortTitle: "ICE DRIFT",
		description: "Precise enemies fire tight patterns through cold water.",
		boss: "Neria, Glacier Queen",
		threat: "Precision volleys",
		rewardSkill: "frost-shell",
		weaknessSkill: "ember-current",
		enemyWeights: { scout: 20, fighter: 30, ace: 32, bomber: 18 },
		hpMultiplier: 1.08,
		speedMultiplier: 0.98,
		fireDelayMultiplier: 0.98,
		bossHpMultiplier: 1.12,
		palette: {
			top: "#21546f",
			mid: "#143c60",
			bottom: "#06142a",
			accent: "#8bf4ff",
			enemyFill: "#506f81",
			bossFill: "#386b84",
		},
	},
	kelp: {
		id: "kelp",
		title: "Kelp Maze",
		shortTitle: "KELP MAZE",
		description: "Unstable movement patterns weave through dense growth.",
		boss: "Virid, Kelp Hunter",
		threat: "Erratic movement",
		rewardSkill: "kelp-snare",
		weaknessSkill: "frost-shell",
		enemyWeights: { scout: 36, fighter: 36, ace: 20, bomber: 8 },
		hpMultiplier: 0.98,
		speedMultiplier: 1.12,
		fireDelayMultiplier: 1,
		bossHpMultiplier: 1.04,
		palette: {
			top: "#154d4a",
			mid: "#0f3e36",
			bottom: "#061915",
			accent: "#9eff8f",
			enemyFill: "#456f57",
			bossFill: "#477257",
		},
	},
	ruins: {
		id: "ruins",
		title: "Sunken Ruins",
		shortTitle: "SUNKEN RUINS",
		description: "Ancient energy makes enemies tougher, but rewards are stronger.",
		boss: "Prism, Ruin Gatekeeper",
		threat: "Mixed patterns",
		rewardSkill: "ruin-prism",
		weaknessSkill: "kelp-snare",
		enemyWeights: { scout: 22, fighter: 30, ace: 24, bomber: 24 },
		hpMultiplier: 1.14,
		speedMultiplier: 1.02,
		fireDelayMultiplier: 0.94,
		bossHpMultiplier: 1.18,
		palette: {
			top: "#2f315f",
			mid: "#25214c",
			bottom: "#090817",
			accent: "#c79cff",
			enemyFill: "#5c5578",
			bossFill: "#59407a",
		},
	},
};

const uniqueStages = (stages: StageKind[]) => stages.filter((stage, index) => stages.indexOf(stage) === index);

const rotateFrom = (stage: StageKind) => {
	const start = STAGE_ORDER.indexOf(stage);
	return [...STAGE_ORDER.slice(start + 1), ...STAGE_ORDER.slice(0, start + 1)];
};

export const getStageChoices = (state: GameState): StageChoice[] => {
	const cleared = new Set(state.clearedStages);
	const uncleared = STAGE_ORDER.filter((stage) => !cleared.has(stage));
	const skillTargets = uncleared.filter((stage) => {
		const weakness = STAGES[stage].weaknessSkill;
		return Boolean(weakness && state.bossSkills.includes(weakness));
	});
	const fallback = uncleared.length > 0 ? uncleared : STAGE_ORDER.filter((stage) => stage !== state.stage);
	const pool = uniqueStages([...skillTargets, ...rotateFrom(state.stage), ...fallback]).filter((stage) => stage !== state.stage || fallback.length === 0);

	return pool.slice(0, 3).map((stage, index) => {
		const definition = STAGES[stage];
		const direction = STAGE_DIRECTIONS[index];
		const routeModifier = ROUTE_MODIFIERS_BY_DIRECTION[direction];
		const modifierDefinition = STAGE_ROUTE_MODIFIERS[routeModifier];
		return {
			id: definition.id,
			direction,
			routeModifier,
			routeTitle: modifierDefinition.title,
			routeDescription: modifierDefinition.description,
			title: definition.title,
			description: definition.description,
			boss: definition.boss,
			rewardSkill: definition.rewardSkill,
			weaknessSkill: definition.weaknessSkill,
		};
	});
};

export const pickStageEnemyKind = (stage: StageKind): Exclude<EnemyKind, "boss" | "goldfish" | "supply"> => {
	const weights = STAGES[stage].enemyWeights;
	const entries = Object.entries(weights) as Array<[Exclude<EnemyKind, "boss" | "goldfish" | "supply">, number]>;
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
	let roll = Math.random() * total;

	for (const [kind, weight] of entries) {
		roll -= weight;
		if (roll <= 0) return kind;
	}

	return "fighter";
};

const MISSION_KINDS: StageMissionKind[] = ["defeat", "survive", "collect-coins", "flawless", "boss"];

export const createStageMission = (state: GameState, stage: StageKind, routeModifier: StageRouteModifierId): StageMission => {
	const stageIndex = STAGE_ORDER.indexOf(stage);
	const kind = MISSION_KINDS[(state.clearedStages.length + stageIndex + state.wave) % MISSION_KINDS.length];
	const rewardScale = STAGE_ROUTE_MODIFIERS[routeModifier].rewardMultiplier;
	const baseCoins = Math.round((42 + state.wave * 12 + state.clearedStages.length * 16) * rewardScale);
	const baseExperience = Math.round(30 + state.wave * 7 + state.clearedStages.length * 6);

	switch (kind) {
		case "survive":
			return {
				id: `${stage}-${state.wave}-survive`,
				kind,
				title: "압력 버티기",
				description: "제한 시간 동안 심해 탄막을 견디세요.",
				target: 42 + Math.min(22, state.wave * 2),
				progress: 0,
				rewardCoins: baseCoins,
				rewardExperience: baseExperience,
				completed: false,
				failed: false,
				startDamageTaken: state.damageTaken,
			};
		case "collect-coins":
			return {
				id: `${stage}-${state.wave}-coins`,
				kind,
				title: "인양 회수",
				description: "전투 중 떨어진 인양 주화를 회수하세요.",
				target: Math.round(75 + state.wave * 18),
				progress: 0,
				rewardCoins: Math.round(baseCoins * 1.2),
				rewardExperience: baseExperience,
				completed: false,
				failed: false,
				startDamageTaken: state.damageTaken,
			};
		case "flawless":
			return {
				id: `${stage}-${state.wave}-flawless`,
				kind,
				title: "무피격 항로",
				description: "피격 없이 적을 격파하세요.",
				target: 14 + Math.min(14, state.wave),
				progress: 0,
				rewardCoins: Math.round(baseCoins * 1.35),
				rewardExperience: Math.round(baseExperience * 1.15),
				completed: false,
				failed: false,
				startDamageTaken: state.damageTaken,
			};
		case "boss":
			return {
				id: `${stage}-${state.wave}-boss`,
				kind,
				title: "코어 추출",
				description: "이 해역의 보스를 격파하세요.",
				target: 1,
				progress: 0,
				rewardCoins: Math.round(baseCoins * 1.45),
				rewardExperience: Math.round(baseExperience * 1.25),
				completed: false,
				failed: false,
				startDamageTaken: state.damageTaken,
			};
		case "defeat":
		default:
			return {
				id: `${stage}-${state.wave}-defeat`,
				kind: "defeat",
				title: "무리 소탕",
				description: "지정 수만큼 적성 생물을 격파하세요.",
				target: 18 + Math.min(18, state.wave * 2),
				progress: 0,
				rewardCoins: baseCoins,
				rewardExperience: baseExperience,
				completed: false,
				failed: false,
				startDamageTaken: state.damageTaken,
			};
	}
};

export const getStagePalette = (stage?: StageKind) => STAGES[stage ?? "coral"].palette;

export const getStageEnemyTuning = (stage?: StageKind) => {
	const definition = STAGES[stage ?? "coral"];
	return {
		hpMultiplier: definition.hpMultiplier,
		speedMultiplier: definition.speedMultiplier,
		fireDelayMultiplier: definition.fireDelayMultiplier,
		bossHpMultiplier: definition.bossHpMultiplier,
	};
};

export const getBossSkillDamageMultiplier = (state: GameState, enemy: Plane) => {
	if (!enemy.stage || enemy.kind === "goldfish") return 1;

	const weaknessSkill = STAGES[enemy.stage].weaknessSkill;
	if (!weaknessSkill || !state.bossSkills.includes(weaknessSkill)) return 1;
	return BOSS_SKILLS[weaknessSkill].bonusMultiplier;
};

export const openStageSelection = (state: GameState) => {
	const stageDefinition = STAGES[state.stage];

	if (!state.clearedStages.includes(state.stage)) state.clearedStages.push(state.stage);
	if (!state.bossSkills.includes(stageDefinition.rewardSkill)) state.bossSkills.push(stageDefinition.rewardSkill);

	state.pendingBossSkill = stageDefinition.rewardSkill;
	state.stageChoices = getStageChoices(state);
	state.mode = "stage-select";
	state.player.isCharging = false;
	state.player.meleeCharge = 0;
	state.pointerActive = false;
	state.bullets = [];
	state.slashes = [];
	state.powerUps = [];
	state.player.targetX = state.player.x;
	state.player.targetY = state.player.y;
	state.player.invincible = Math.max(state.player.invincible, 1.4);
};

export const selectStageRoute = (state: GameState, stage: StageKind) => {
	const choice = state.stageChoices.find((stageChoice) => stageChoice.id === stage);
	if (state.mode !== "stage-select" || !choice) return false;
	const routeModifier = STAGE_ROUTE_MODIFIERS[choice.routeModifier];

	state.stage = stage;
	state.routeModifier = choice.routeModifier;
	state.routeRewardMultiplier = routeModifier.rewardMultiplier;
	state.spawnIntensityMultiplier = routeModifier.spawnIntensityMultiplier;
	state.augmentChoiceBonus = routeModifier.augmentChoiceBonus;
	state.stageMission = createStageMission(state, stage, choice.routeModifier);
	state.stageChoices = [];
	state.pendingBossSkill = null;
	state.mode = "playing";
	state.wave = Math.max(state.wave + 1, 1 + state.clearedStages.length);
	state.spawnTimer = 0.75;
	state.bossTimer = routeModifier.bossTimer;
	state.bossActive = false;
	state.enemies = [];
	state.bullets = [];
	state.slashes = [];
	state.powerUps = [];
	state.warningZones = [];
	state.experienceOrbs = [];
	state.player.invincible = Math.max(state.player.invincible, 1.6);
	if (choice.routeModifier === "balanced") state.player.lives = Math.min(state.player.maxLives, state.player.lives + 1);
	state.shake = Math.max(state.shake, 0.18);
	return true;
};
