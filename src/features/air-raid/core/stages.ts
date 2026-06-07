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
		title: "산호 격류",
		shortTitle: "산호",
		description: "보스 코어를 회수했습니다. 산호 계열 해역의 적에게 주는 피해가 증가합니다.",
		color: "#ff8fae",
		bonusMultiplier: 2.15,
		targetStages: ["abyss"],
	},
	"abyss-lance": {
		id: "abyss-lance",
		title: "심연 창",
		shortTitle: "심연",
		description: "보스 코어를 회수했습니다. 심연 계열 해역의 적에게 주는 피해가 증가합니다.",
		color: "#9cc7ff",
		bonusMultiplier: 2.15,
		targetStages: ["volcanic"],
	},
	"ember-current": {
		id: "ember-current",
		title: "열기 해류",
		shortTitle: "열류",
		description: "보스 코어를 회수했습니다. 열기 계열 해역의 적에게 주는 피해가 증가합니다.",
		color: "#ffb45f",
		bonusMultiplier: 2.15,
		targetStages: ["glacier"],
	},
	"frost-shell": {
		id: "frost-shell",
		title: "서리 조개",
		shortTitle: "서리",
		description: "보스 코어를 회수했습니다. 빙하 계열 해역의 적에게 주는 피해가 증가합니다.",
		color: "#8bf4ff",
		bonusMultiplier: 2.15,
		targetStages: ["kelp"],
	},
	"kelp-snare": {
		id: "kelp-snare",
		title: "해초 포박",
		shortTitle: "해초",
		description: "보스 코어를 회수했습니다. 해초 계열 해역의 적에게 주는 피해가 증가합니다.",
		color: "#9eff8f",
		bonusMultiplier: 2.15,
		targetStages: ["ruins"],
	},
	"ruin-prism": {
		id: "ruin-prism",
		title: "유적 프리즘",
		shortTitle: "유적",
		description: "보스 코어를 회수했습니다. 유적 계열 해역의 적에게 주는 피해가 증가합니다.",
		color: "#c79cff",
		bonusMultiplier: 2.15,
		targetStages: ["coral"],
	},
};

export const STAGES: Record<StageKind, StageDefinition> = {
	coral: {
		id: "coral",
		title: "만개한 산호초",
		shortTitle: "산호초",
		description: "적 편성이 균형 잡힌 밝은 진입 해역입니다.",
		boss: "산호 함장 루미나",
		threat: "균형 순찰대",
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
		title: "검은 심연 해구",
		shortTitle: "심연 해구",
		description: "느리지만 묵직한 적들이 어두운 압력 항로를 밀고 들어옵니다.",
		boss: "심연 거인 모르도",
		threat: "중장 화력",
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
		title: "열수 분출 지대",
		shortTitle: "분출 지대",
		description: "빠른 공격대가 뜨거운 해류를 타고 좁은 항로를 파고듭니다.",
		boss: "분출 포식자 이그나",
		threat: "고속 돌파",
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
		title: "빙하 표류층",
		shortTitle: "빙하층",
		description: "정밀한 적들이 차가운 물살 속에서 촘촘한 탄막을 펼칩니다.",
		boss: "빙하 여왕 네리아",
		threat: "정밀 탄막",
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
		title: "해초 미로",
		shortTitle: "해초 미로",
		description: "빽빽한 해초 사이로 불규칙한 이동 패턴이 이어집니다.",
		boss: "해초 사냥꾼 비리드",
		threat: "변칙 기동",
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
		title: "가라앉은 유적",
		shortTitle: "침몰 유적",
		description: "고대 에너지가 적을 단단하게 만들지만 보상도 더 커집니다.",
		boss: "유적 문지기 프리즘",
		threat: "복합 패턴",
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
