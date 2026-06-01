export type GameMode = "ready" | "playing" | "paused" | "augment" | "gameover";
export type EnemyKind = "scout" | "fighter" | "bomber" | "boss";
export type WeaponKind = "standard" | "fork" | "scatter" | "lance" | "laser";
export type AugmentId =
	| "forked-cannon"
	| "scatter-pods"
	| "lance-core"
	| "needle-laser"
	| "focusing-lens"
	| "split-prism"
	| "heavy-core"
	| "rapid-cycle"
	| "piercing-rounds"
	| "unstable-core"
	| "blade-array"
	| "charged-blade";

export type AugmentDefinition = {
	id: AugmentId;
	title: string;
	description: string;
	flavor: string;
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
	power: number;
	fireCooldown: number;
	invincible: number;
	meleeCooldown: number;
	meleeCharge: number;
	isCharging: boolean;
};

export type GameState = {
	mode: GameMode;
	score: number;
	highScore: number;
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
	bulletPierce: number;
	laserFocus: number;
	prismSplitter: boolean;
	projectileChaos: number;
	meleeUnlocked: boolean;
	chargeUnlocked: boolean;
	meleeDamageMultiplier: number;
	nextAugmentScore: number;
	augmentChoices: AugmentId[];
	augments: AugmentId[];
	player: Player;
	bullets: Bullet[];
	enemies: Plane[];
	slashes: Slash[];
	particles: Particle[];
	powerUps: PowerUp[];
	stars: Star[];
	keys: Set<string>;
	pointerActive: boolean;
	hudTimer: number;
};

export type HudState = {
	mode: GameMode;
	score: number;
	highScore: number;
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
};

export type Layout = {
	width: number;
	height: number;
	scale: number;
	offsetX: number;
	offsetY: number;
};
