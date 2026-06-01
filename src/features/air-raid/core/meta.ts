import type { MetaProgress, MetaSlotBonusId, MetaUpgradeDefinition, MetaUpgradeId, SlotSpinResult } from "./types";

export const COIN_SLOT_COST = 50;
export const STAT_SLOT_COST = 28;

export const META_UPGRADE_DEFINITIONS: Record<MetaUpgradeId, MetaUpgradeDefinition> = {
	health: {
		id: "health",
		title: "체력 강화",
		description: "시작 목숨 +1",
		maxLevel: 5,
		baseCost: 45,
		costGrowth: 1.45,
	},
	shieldCycle: {
		id: "shieldCycle",
		title: "보호막 주기",
		description: "주기 보호막 해금 및 충전 시간 단축",
		maxLevel: 6,
		baseCost: 80,
		costGrowth: 1.5,
	},
	speed: {
		id: "speed",
		title: "기동성",
		description: "이동 속도 +6%",
		maxLevel: 8,
		baseCost: 40,
		costGrowth: 1.38,
	},
	fireRate: {
		id: "fireRate",
		title: "연사 속도",
		description: "모든 주 무기 연사 +5%",
		maxLevel: 8,
		baseCost: 50,
		costGrowth: 1.42,
	},
	damage: {
		id: "damage",
		title: "데미지",
		description: "모든 공격 피해 +6%",
		maxLevel: 8,
		baseCost: 55,
		costGrowth: 1.42,
	},
	magnet: {
		id: "magnet",
		title: "자석",
		description: "경험치/보급품 흡입 범위 +12%",
		maxLevel: 8,
		baseCost: 38,
		costGrowth: 1.36,
	},
	reload: {
		id: "reload",
		title: "중화기 재장전",
		description: "쌍열/산탄/관통창 재장전 +7%",
		maxLevel: 6,
		baseCost: 65,
		costGrowth: 1.46,
	},
	pet: {
		id: "pet",
		title: "동료기 출격",
		description: "같이 싸워주는 시작 펫 +1",
		maxLevel: 3,
		baseCost: 130,
		costGrowth: 1.8,
	},
};

export const META_UPGRADE_ORDER: MetaUpgradeId[] = ["health", "shieldCycle", "speed", "fireRate", "damage", "magnet", "reload", "pet"];
export const META_SLOT_BONUS_ORDER: MetaSlotBonusId[] = ["health", "shieldCycle", "speed", "fireRate", "damage", "magnet", "reload", "pet"];

export const META_SLOT_BONUS_LABELS: Record<MetaSlotBonusId, string> = {
	health: "체력",
	shieldCycle: "보호막",
	speed: "이동속도",
	fireRate: "연사속도",
	damage: "데미지",
	magnet: "자석",
	reload: "재장전",
	pet: "펫",
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
				title: "주화 부족",
				description: `${COIN_SLOT_COST} 주화가 필요합니다.`,
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

	const title = payout === 0 ? "손실" : payout < COIN_SLOT_COST ? "부분 회수" : payout === COIN_SLOT_COST ? "본전" : payout >= 180 ? "대박" : "성공";

	return {
		progress: next,
		result: {
			kind: "coin",
			title,
			description: `${COIN_SLOT_COST} 주화를 넣고 ${payout} 주화를 돌려받았습니다.`,
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
				title: "주화 부족",
				description: `${STAT_SLOT_COST} 주화가 필요합니다.`,
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
		{ value: { title: "저효율", points: 1 }, weight: 62 },
		{ value: { title: "표준", points: 2 }, weight: 28 },
		{ value: { title: "고효율", points: 4 }, weight: 9 },
		{ value: { title: "초고효율", points: 8 }, weight: 1 },
	]);

	next.coins -= STAT_SLOT_COST;
	next.slotBonuses[bonusId] += tier.points;

	return {
		progress: next,
		result: {
			kind: "stat",
			title: tier.title,
			description: `${META_SLOT_BONUS_LABELS[bonusId]} 보너스 +${tier.points}점을 얻었습니다.`,
			deltaCoins: -STAT_SLOT_COST,
			bonusId,
			bonusPoints: tier.points,
		},
	};
};
