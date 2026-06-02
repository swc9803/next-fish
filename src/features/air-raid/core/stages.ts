import type { BossSkillId, EnemyKind, GameState, Plane, StageChoice, StageDirection, StageKind } from "./types";

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
	enemyWeights: Record<Exclude<EnemyKind, "boss" | "goldfish">, number>;
	hpMultiplier: number;
	speedMultiplier: number;
	fireDelayMultiplier: number;
	bossHpMultiplier: number;
	palette: StagePalette;
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
const STAGE_DIRECTIONS: StageDirection[] = ["10시", "12시", "2시"];

export const BOSS_SKILLS: Record<BossSkillId, BossSkillDefinition> = {
	"coral-surge": {
		id: "coral-surge",
		title: "산호 충격파",
		shortTitle: "CORAL",
		description: "심연 계열 적의 외피를 깨뜨려 큰 피해를 줍니다.",
		color: "#ff8fae",
		bonusMultiplier: 2.15,
		targetStages: ["abyss"],
	},
	"abyss-lance": {
		id: "abyss-lance",
		title: "흑조 관통창",
		shortTitle: "ABYSS",
		description: "열수 계열 적의 장갑을 관통합니다.",
		color: "#9cc7ff",
		bonusMultiplier: 2.15,
		targetStages: ["volcanic"],
	},
	"ember-current": {
		id: "ember-current",
		title: "열수 해류",
		shortTitle: "EMBER",
		description: "빙결 계열 적을 녹여 높은 피해를 줍니다.",
		color: "#ffb45f",
		bonusMultiplier: 2.15,
		targetStages: ["glacier"],
	},
	"frost-shell": {
		id: "frost-shell",
		title: "빙결 소라",
		shortTitle: "FROST",
		description: "해초 계열 적의 움직임을 굳혀 큰 피해를 줍니다.",
		color: "#8bf4ff",
		bonusMultiplier: 2.15,
		targetStages: ["kelp"],
	},
	"kelp-snare": {
		id: "kelp-snare",
		title: "해초 결박",
		shortTitle: "KELP",
		description: "유적 계열 적의 균열을 묶어 약점을 드러냅니다.",
		color: "#9eff8f",
		bonusMultiplier: 2.15,
		targetStages: ["ruins"],
	},
	"ruin-prism": {
		id: "ruin-prism",
		title: "유적 프리즘",
		shortTitle: "PRISM",
		description: "산호 계열 적에게 반사 피해를 증폭합니다.",
		color: "#c79cff",
		bonusMultiplier: 2.15,
		targetStages: ["coral"],
	},
};

export const STAGES: Record<StageKind, StageDefinition> = {
	coral: {
		id: "coral",
		title: "붉은 산호 협곡",
		shortTitle: "CORAL REEF",
		description: "좌우로 퍼지는 정찰 개체가 많은 초입 해역입니다.",
		boss: "산호 함장 루미나",
		threat: "넓은 편대",
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
		title: "검은 해구",
		shortTitle: "ABYSS TRENCH",
		description: "느리지만 단단한 적이 깊은 어둠에서 밀고 옵니다.",
		boss: "해구 거인 모르도",
		threat: "고내구 장갑",
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
		title: "열수 분출구",
		shortTitle: "VENT FIELD",
		description: "탄속이 빠른 적이 뜨거운 수류를 타고 접근합니다.",
		boss: "열수 포식자 이그나",
		threat: "고속 탄막",
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
		title: "빙하 소용돌이",
		shortTitle: "ICE DRIFT",
		description: "빠른 정예와 단단한 장갑이 섞인 차가운 수역입니다.",
		boss: "빙하 여왕 네리아",
		threat: "정예 돌파",
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
		shortTitle: "KELP MAZE",
		description: "흔들리는 이동 궤적 때문에 중앙 조준이 까다로운 해역입니다.",
		boss: "해초 사냥꾼 비리드",
		threat: "불규칙 기동",
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
		shortTitle: "SUNKEN RUINS",
		description: "균열 에너지에 물든 적이 강하지만 보상이 큽니다.",
		boss: "유적 수문장 프리즘",
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
		return {
			id: definition.id,
			direction: STAGE_DIRECTIONS[index],
			title: definition.title,
			description: definition.description,
			boss: definition.boss,
			rewardSkill: definition.rewardSkill,
			weaknessSkill: definition.weaknessSkill,
		};
	});
};

export const pickStageEnemyKind = (stage: StageKind): Exclude<EnemyKind, "boss" | "goldfish"> => {
	const weights = STAGES[stage].enemyWeights;
	const entries = Object.entries(weights) as Array<[Exclude<EnemyKind, "boss" | "goldfish">, number]>;
	const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
	let roll = Math.random() * total;

	for (const [kind, weight] of entries) {
		roll -= weight;
		if (roll <= 0) return kind;
	}

	return "fighter";
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
	state.player.invincible = Math.max(state.player.invincible, 1.4);
};

export const selectStageRoute = (state: GameState, stage: StageKind) => {
	if (state.mode !== "stage-select" || !state.stageChoices.some((choice) => choice.id === stage)) return false;

	state.stage = stage;
	state.stageChoices = [];
	state.pendingBossSkill = null;
	state.mode = "playing";
	state.wave = Math.max(state.wave + 1, 1 + state.clearedStages.length);
	state.spawnTimer = 0.75;
	state.bossTimer = 28;
	state.bossActive = false;
	state.enemies = [];
	state.bullets = [];
	state.slashes = [];
	state.powerUps = [];
	state.experienceOrbs = [];
	state.player.invincible = Math.max(state.player.invincible, 1.6);
	state.shake = Math.max(state.shake, 0.18);
	return true;
};
