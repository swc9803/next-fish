export type GameMode = "ready" | "playing" | "paused" | "augment" | "gameover";
export type EnemyKind = "scout" | "fighter" | "ace" | "bomber" | "boss";
export type WeaponKind = "standard" | "fork" | "scatter" | "lance" | "laser";
export type AugmentRarity = "common" | "rare" | "unique" | "legendary";
export type AugmentId =
	| "forked-cannon"
	| "scatter-pods"
	| "lance-core"
	| "needle-laser"
	| "focusing-lens"
	| "split-prism"
	| "piercing-rounds"
	| "blade-array"
	| "charged-blade"
	| "wingman-drone"
	| "drone-swarm"
	| "drone-core"
	| "pet-overdrive"
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
	maxStacks?: number;
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
};

export type Bullet = {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
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
	time: number;
	spawnTimer: number;
	bossTimer: number;
	bossActive: boolean;
	shake: number;
	nextId: number;
	weapon: WeaponKind;
	damageMultiplier: number;
	fireCooldownMultiplier: number;
	playerSpeedMultiplier: number;
	magnetMultiplier: number;
	reloadSpeedMultiplier: number;
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
	lives: number;
	power: number;
	weapon: WeaponKind;
	augmentCount: number;
	augmentChoices: AugmentId[];
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
	earnedCoins: number;
};

export type Layout = {
	width: number;
	height: number;
	scale: number;
	offsetX: number;
	offsetY: number;
};
