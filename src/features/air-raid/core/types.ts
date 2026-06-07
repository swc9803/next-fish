export type GameMode = "ready" | "playing" | "paused" | "augment" | "stage-select" | "gameover";
export type EnemyKind = "scout" | "fighter" | "ace" | "bomber" | "goldfish" | "supply" | "boss";
export type WeaponKind = "standard" | "fork" | "scatter" | "lance" | "laser";
export type AugmentRarity = "common" | "rare" | "unique" | "legendary";
export type AugmentAttribute = "bomb" | "blade" | "machineGun" | "shotgun" | "pierce" | "laser" | "drone" | "defense" | "mobility" | "power" | "utility" | "risk";
export type StageKind = "coral" | "abyss" | "volcanic" | "glacier" | "kelp" | "ruins";
export type BossSkillId = "coral-surge" | "abyss-lance" | "ember-current" | "frost-shell" | "kelp-snare" | "ruin-prism";
export type StageDirection = "10" | "12" | "2";
export type StageRouteModifierId = "bounty" | "balanced" | "elite";
export type StageMissionKind = "survive" | "defeat" | "collect-coins" | "flawless" | "boss";
export type WarningZoneKind = "laser" | "ring" | "charge";
export type AugmentId =
	| "forked-cannon"
	| "scatter-pods"
	| "lance-core"
	| "needle-laser"
	| "focusing-lens"
	| "split-prism"
	| "piercing-rounds"
	| "current-fins"
	| "rapid-siphon"
	| "pressure-chamber"
	| "magnet-tide"
	| "reef-armor"
	| "heavy-pearl"
	| "overclocked-gills"
	| "glass-scales"
	| "shield-battery"
	| "blade-array"
	| "charged-blade"
	| "echoing-blade"
	| "wingman-drone"
	| "drone-swarm"
	| "drone-core"
	| "pet-overdrive"
	| "abyssal-bargain"
	| "volatile-cache"
	| "redline-current"
	| "legendary-carrier";

export type MetaUpgradeId = "health" | "shieldCycle" | "speed" | "fireRate" | "damage" | "magnet" | "reload" | "pet";
export type MetaSlotBonusId = "health" | "shieldCycle" | "speed" | "fireRate" | "damage" | "magnet" | "reload" | "pet";

export type MetaUpgradeDefinition = {
	id: MetaUpgradeId;
	title: string;
	description: string;
	maxLevel: number;
	baseCost: number;
	costGrowth: number;
};

export type MetaProgress = {
	coins: number;
	upgrades: Record<MetaUpgradeId, number>;
	slotBonuses: Record<MetaSlotBonusId, number>;
};

export type SlotSpinResult = {
	kind: "coin" | "stat";
	title: string;
	description: string;
	deltaCoins?: number;
	bonusId?: MetaSlotBonusId;
	bonusPoints?: number;
};

export type AugmentDefinition = {
	id: AugmentId;
	rarity: AugmentRarity;
	title: string;
	description: string;
	flavor: string;
	attribute?: AugmentAttribute;
	maxStacks?: number;
};

export type StageChoice = {
	id: StageKind;
	direction: StageDirection;
	routeModifier: StageRouteModifierId;
	routeTitle: string;
	routeDescription: string;
	title: string;
	description: string;
	boss: string;
	rewardSkill: BossSkillId;
	weaknessSkill?: BossSkillId;
};

export type StageMission = {
	id: string;
	kind: StageMissionKind;
	title: string;
	description: string;
	target: number;
	progress: number;
	rewardCoins: number;
	rewardExperience: number;
	completed: boolean;
	failed: boolean;
	startDamageTaken: number;
};

export type Plane = {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
	hp: number;
	maxHp: number;
	kind: EnemyKind;
	fireCooldown: number;
	age: number;
	stage?: StageKind;
	bossPhase?: 1 | 2;
	specialCooldown?: number;
	escapeTime?: number;
	coinReward?: number;
	experienceReward?: number;
};

export type Bullet = {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
	visualRadius?: number;
	blastRadius?: number;
	damage: number;
	pierce: number;
	from: "player" | "enemy";
	color: string;
};

export type Slash = {
	id: number;
	x: number;
	y: number;
	radius: number;
	damage: number;
	charge: number;
	life: number;
	maxLife: number;
	hitEnemyIds: number[];
};

export type Particle = {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
	color: string;
};

export type PowerUp = {
	id: number;
	x: number;
	y: number;
	vy: number;
	radius: number;
	kind: "power" | "repair";
};

export type ExperienceOrb = {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	value: number;
	radius: number;
	kind?: "experience" | "coin";
	autoCollect?: boolean;
	homeDelay?: number;
};

export type CollectionEffect = {
	id: number;
	kind: "experience" | "coin" | "power" | "repair";
	startX: number;
	startY: number;
	x: number;
	y: number;
	radius: number;
	life: number;
	maxLife: number;
	phase: number;
};

export type Star = {
	x: number;
	y: number;
	speed: number;
	size: number;
	alpha: number;
};

export type Player = {
	x: number;
	y: number;
	targetX: number;
	targetY: number;
	radius: number;
	lives: number;
	maxLives: number;
	power: number;
	fireCooldown: number;
	invincible: number;
	meleeCooldown: number;
	meleeCharge: number;
	isCharging: boolean;
};

export type Pet = {
	id: number;
	x: number;
	y: number;
	level: number;
	fireCooldown: number;
	phase: number;
};

export type WarningZone = {
	id: number;
	kind: WarningZoneKind;
	x: number;
	y: number;
	radius: number;
	width: number;
	angle: number;
	life: number;
	maxLife: number;
	color: string;
	stage?: StageKind;
};

export type GameState = {
	mode: GameMode;
	score: number;
	highScore: number;
	experienceLevel: number;
	experience: number;
	nextExperience: number;
	combo: number;
	comboTimer: number;
	wave: number;
	stage: StageKind;
	routeModifier: StageRouteModifierId;
	clearedStages: StageKind[];
	bossSkills: BossSkillId[];
	bossSkillCooldowns: Record<BossSkillId, number>;
	stageChoices: StageChoice[];
	pendingBossSkill: BossSkillId | null;
	stageMission: StageMission | null;
	time: number;
	spawnTimer: number;
	bossTimer: number;
	treasureTimer: number;
	supplyTimer: number;
	bossActive: boolean;
	shake: number;
	nextId: number;
	weapon: WeaponKind;
	weaponLevels: Record<WeaponKind, number>;
	damageMultiplier: number;
	fireCooldownMultiplier: number;
	playerSpeedMultiplier: number;
	magnetMultiplier: number;
	reloadSpeedMultiplier: number;
	rewardMultiplier: number;
	threatMultiplier: number;
	spawnIntensityMultiplier: number;
	routeRewardMultiplier: number;
	augmentChoiceBonus: number;
	riskStacks: number;
	bulletPierce: number;
	laserFocus: number;
	prismSplitter: boolean;
	projectileChaos: number;
	meleeUnlocked: boolean;
	chargeUnlocked: boolean;
	meleeDamageMultiplier: number;
	petDamageMultiplier: number;
	petFireCooldownMultiplier: number;
	shieldUnlocked: boolean;
	shieldTimer: number;
	shieldInterval: number;
	shieldCharges: number;
	shieldMaxCharges: number;
	defeatedEnemies: number;
	defeatedBosses: number;
	maxCombo: number;
	damageTaken: number;
	bossDamageDealt: number;
	missionsCompleted: number;
	suppliesCollected: number;
	earnedCoins: number;
	coinRewardClaimed: boolean;
	augmentChoices: AugmentId[];
	augments: AugmentId[];
	player: Player;
	pets: Pet[];
	bullets: Bullet[];
	enemies: Plane[];
	slashes: Slash[];
	particles: Particle[];
	powerUps: PowerUp[];
	experienceOrbs: ExperienceOrb[];
	collectionEffects: CollectionEffect[];
	warningZones: WarningZone[];
	stars: Star[];
	keys: Set<string>;
	pointerActive: boolean;
	hudTimer: number;
};

export type HudState = {
	mode: GameMode;
	score: number;
	highScore: number;
	experienceLevel: number;
	experience: number;
	nextExperience: number;
	combo: number;
	wave: number;
	stage: StageKind;
	stageTitle: string;
	stageBoss: string;
	bossSkills: BossSkillId[];
	bossSkillCooldowns: Record<BossSkillId, number>;
	stageChoices: StageChoice[];
	pendingBossSkill: BossSkillId | null;
	lives: number;
	maxLives: number;
	power: number;
	weapon: WeaponKind;
	weaponLevel: number;
	augmentCount: number;
	augmentChoices: AugmentId[];
	augmentStacks: Partial<Record<AugmentId, number>>;
	lastAugmentId: AugmentId | null;
	laserFocus: number;
	projectileChaos: number;
	meleeUnlocked: boolean;
	chargeUnlocked: boolean;
	chargeRatio: number;
	petCount: number;
	petLevelTotal: number;
	damageBonusPercent: number;
	fireRateBonusPercent: number;
	speedBonusPercent: number;
	magnetBonusPercent: number;
	reloadBonusPercent: number;
	shieldCharges: number;
	shieldMaxCharges: number;
	defeatedEnemies: number;
	maxCombo: number;
	damageTaken: number;
	bossDamageDealt: number;
	missionsCompleted: number;
	suppliesCollected: number;
	earnedCoins: number;
	stageMission: StageMission | null;
	routeModifier: StageRouteModifierId;
	rewardMultiplier: number;
	threatMultiplier: number;
};

export type Layout = {
	width: number;
	height: number;
	scale: number;
	offsetX: number;
	offsetY: number;
};
