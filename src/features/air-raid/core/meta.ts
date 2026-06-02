import type { MetaProgress, MetaSlotBonusId, MetaUpgradeDefinition, MetaUpgradeId, SlotSpinResult } from "./types";

export const COIN_SLOT_COST = 50;
export const STAT_SLOT_COST = 28;

export const META_UPGRADE_DEFINITIONS: Record<MetaUpgradeId, MetaUpgradeDefinition> = {
	health: {
		id: "health",
		title: "강화 외피",
		description: "잠수 시작 내구도 +1",
		maxLevel: 5,
		baseCost: 45,
		costGrowth: 1.45,
	},
	shieldCycle: {
		id: "shieldCycle",
		title: "거품 방벽",
		description: "자동 방벽 해금, 재충전 시간 단축",
		maxLevel: 6,
		baseCost: 80,
		costGrowth: 1.5,
	},
	speed: {
		id: "speed",
		title: "유선형 지느러미",
		description: "회피 기동 속도 +6%",
		maxLevel: 8,
		baseCost: 40,
		costGrowth: 1.38,
	},
	fireRate: {
		id: "fireRate",
		title: "진주 압축기",
		description: "주 무기 발사 주기 +5%",
		maxLevel: 8,
		baseCost: 50,
		costGrowth: 1.42,
	},
	damage: {
		id: "damage",
		title: "심해 독성",
		description: "모든 공격 위력 +6%",
		maxLevel: 8,
		baseCost: 55,
		costGrowth: 1.42,
	},
	magnet: {
		id: "magnet",
		title: "조류 포획장",
		description: "진주/보급품 회수 범위 +12%",
		maxLevel: 8,
		baseCost: 38,
		costGrowth: 1.36,
	},
	reload: {
		id: "reload",
		title: "소라 재장전",
		description: "양갈래/산호/소라창 장전 속도 +7%",
		maxLevel: 6,
		baseCost: 65,
		costGrowth: 1.46,
	},
	pet: {
		id: "pet",
		title: "출격 조개",
		description: "잠수 시작 시 회전 조개 +1",
		maxLevel: 3,
		baseCost: 130,
		costGrowth: 1.8,
	},
};

export const META_UPGRADE_ORDER: MetaUpgradeId[] = ["health", "shieldCycle", "speed", "fireRate", "damage", "magnet", "reload", "pet"];
export const META_SLOT_BONUS_ORDER: MetaSlotBonusId[] = ["health", "shieldCycle", "speed", "fireRate", "damage", "magnet", "reload", "pet"];

export const META_SLOT_BONUS_LABELS: Record<MetaSlotBonusId, string> = {
	health: "외피",
	shieldCycle: "방벽",
	speed: "기동",
	fireRate: "압축",
	damage: "독성",
	magnet: "회수",
	reload: "장전",
	pet: "조개",
};

export const createDefaultMetaProgress = (): MetaProgress => ({
	coins: 0,
	upgrades: {
		health: 0,
		shieldCycle: 0,
		speed: 0,
		fireRate: 0,
		damage: 0,
		magnet: 0,
		reload: 0,
		pet: 0,
	},
	slotBonuses: {
		health: 0,
		shieldCycle: 0,
		speed: 0,
		fireRate: 0,
		damage: 0,
		magnet: 0,
		reload: 0,
		pet: 0,
	},
});

export const getUpgradeCost = (upgradeId: MetaUpgradeId, level: number) => {
	const definition = META_UPGRADE_DEFINITIONS[upgradeId];
	if (level >= definition.maxLevel) return null;
	return Math.round(definition.baseCost * definition.costGrowth ** level);
};

export const sanitizeMetaProgress = (progress?: Partial<MetaProgress> | null): MetaProgress => {
	const fallback = createDefaultMetaProgress();
	if (!progress) return fallback;

	const next = createDefaultMetaProgress();
	next.coins = Number.isFinite(progress.coins) ? Math.max(0, Math.floor(progress.coins ?? 0)) : 0;

	for (const upgradeId of META_UPGRADE_ORDER) {
		const level = Number(progress.upgrades?.[upgradeId] ?? 0);
		next.upgrades[upgradeId] = Math.max(0, Math.min(META_UPGRADE_DEFINITIONS[upgradeId].maxLevel, Math.floor(level)));
	}

	for (const bonusId of META_SLOT_BONUS_ORDER) {
		const points = Number(progress.slotBonuses?.[bonusId] ?? 0);
		next.slotBonuses[bonusId] = Math.max(0, Math.min(999, Math.floor(points)));
	}

	return next;
};

const pickWeighted = <T>(entries: Array<{ value: T; weight: number }>) => {
	const totalWeight = entries.reduce((total, entry) => total + entry.weight, 0);
	let roll = Math.random() * totalWeight;

	for (const entry of entries) {
		roll -= entry.weight;
		if (roll <= 0) return entry.value;
	}

	return entries[entries.length - 1].value;
};

export const spinCoinSlot = (progress: MetaProgress): { progress: MetaProgress; result: SlotSpinResult } => {
	const next = sanitizeMetaProgress(progress);
	if (next.coins < COIN_SLOT_COST) {
		return {
			progress: next,
			result: {
				kind: "coin",
				title: "인양 주화 부족",
				description: `${COIN_SLOT_COST} SALVAGE가 필요합니다.`,
				deltaCoins: 0,
			},
		};
	}

	const payout = pickWeighted([
		{ value: 0, weight: 32 },
		{ value: 20, weight: 25 },
		{ value: 50, weight: 20 },
		{ value: 90, weight: 14 },
		{ value: 180, weight: 7 },
		{ value: 420, weight: 2 },
	]);
	const deltaCoins = payout - COIN_SLOT_COST;
	next.coins += deltaCoins;

	const title = payout === 0 ? "침몰 잔해" : payout < COIN_SLOT_COST ? "부분 인양" : payout === COIN_SLOT_COST ? "균형 회수" : payout >= 180 ? "황금 난파선" : "인양 성공";

	return {
		progress: next,
		result: {
			kind: "coin",
			title,
			description: `${COIN_SLOT_COST} SALVAGE를 투입해 ${payout} SALVAGE를 회수했습니다.`,
			deltaCoins,
		},
	};
};

export const spinStatSlot = (progress: MetaProgress): { progress: MetaProgress; result: SlotSpinResult } => {
	const next = sanitizeMetaProgress(progress);
	if (next.coins < STAT_SLOT_COST) {
		return {
			progress: next,
			result: {
				kind: "stat",
				title: "변이 코어 부족",
				description: `${STAT_SLOT_COST} SALVAGE가 필요합니다.`,
				deltaCoins: 0,
			},
		};
	}

	const bonusId = pickWeighted<MetaSlotBonusId>([
		{ value: "health", weight: 10 },
		{ value: "shieldCycle", weight: 12 },
		{ value: "speed", weight: 16 },
		{ value: "fireRate", weight: 16 },
		{ value: "damage", weight: 16 },
		{ value: "magnet", weight: 16 },
		{ value: "reload", weight: 10 },
		{ value: "pet", weight: 4 },
	]);
	const tier = pickWeighted([
		{ value: { title: "미세 변이", points: 1 }, weight: 62 },
		{ value: { title: "안정 변이", points: 2 }, weight: 28 },
		{ value: { title: "과충전 변이", points: 4 }, weight: 9 },
		{ value: { title: "심연 각성", points: 8 }, weight: 1 },
	]);

	next.coins -= STAT_SLOT_COST;
	next.slotBonuses[bonusId] += tier.points;

	return {
		progress: next,
		result: {
			kind: "stat",
			title: tier.title,
			description: `${META_SLOT_BONUS_LABELS[bonusId]} 코어가 +${tier.points}만큼 공명합니다.`,
			deltaCoins: -STAT_SLOT_COST,
			bonusId,
			bonusPoints: tier.points,
		},
	};
};
