import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type { AugmentAttribute, AugmentDefinition, AugmentId, AugmentRarity, GameState, Pet, WeaponKind } from "./types";

export const WEAPON_LABELS: Record<WeaponKind, string> = {
	standard: "진주 물방울",
	fork: "양갈래 해류",
	scatter: "산호 파편",
	lance: "소라 관통창",
	laser: "심해 광선",
};

export const RARITY_LABELS: Record<AugmentRarity, string> = {
	common: "일반",
	rare: "희귀",
	unique: "유니크",
	legendary: "전설",
};

export const AUGMENT_ATTRIBUTE_LABELS: Record<AugmentAttribute, { icon: string; label: string }> = {
	bomb: { icon: "BOM", label: "폭탄" },
	blade: { icon: "CUT", label: "근접 칼" },
	machineGun: { icon: "MG", label: "기관총" },
	shotgun: { icon: "SG", label: "샷건" },
	pierce: { icon: "PEN", label: "관통" },
	laser: { icon: "LZR", label: "광선" },
	drone: { icon: "ORB", label: "조개" },
	defense: { icon: "SHD", label: "방어" },
	mobility: { icon: "SPD", label: "기동" },
	power: { icon: "DMG", label: "화력" },
	utility: { icon: "UTL", label: "보조" },
	risk: { icon: "RSK", label: "위험" },
};

export const AUGMENTS: Record<AugmentId, AugmentDefinition> = {
	"forked-cannon": {
		id: "forked-cannon",
		rarity: "rare",
		title: "기관총 해류",
		description: "빠른 양갈래 탄으로 전방을 압박합니다.",
		flavor: "진화할수록 가운데 빈틈이 줄고 측면 화력이 거칠어집니다.",
		attribute: "machineGun",
		maxStacks: 3,
	},
	"scatter-pods": {
		id: "scatter-pods",
		rarity: "rare",
		title: "산호 샷건",
		description: "넓게 퍼지는 산호탄을 발사합니다.",
		flavor: "진화할수록 파편 수가 늘어 가까운 적을 빨리 걷어냅니다.",
		attribute: "shotgun",
		maxStacks: 3,
	},
	"lance-core": {
		id: "lance-core",
		rarity: "rare",
		title: "폭발 작살",
		description: "느리지만 강한 직선 탄을 쏩니다.",
		flavor: "진화한 소라창은 보스전에서 폭발과 보조창을 남깁니다.",
		attribute: "bomb",
		maxStacks: 3,
	},
	"needle-laser": {
		id: "needle-laser",
		rarity: "rare",
		title: "속사 광선",
		description: "가늘고 빠른 광선 탄으로 교체합니다.",
		flavor: "진화할수록 광선 줄기가 늘고 초점 진주 효율이 좋아집니다.",
		attribute: "laser",
		maxStacks: 3,
	},
	"focusing-lens": {
		id: "focusing-lens",
		rarity: "rare",
		title: "초점 진주",
		description: "광선 계열의 집중도와 관통력을 강화합니다.",
		flavor: "심해 광선 빌드의 방향을 분명하게 만들어줍니다.",
		attribute: "laser",
		maxStacks: 2,
	},
	"split-prism": {
		id: "split-prism",
		rarity: "unique",
		title: "조류 프리즘",
		description: "탄을 갈라 더 넓은 각도로 보냅니다.",
		flavor: "무기 형태를 바꾸는 유니크 증강입니다.",
		attribute: "utility",
	},
	"piercing-rounds": {
		id: "piercing-rounds",
		rarity: "common",
		title: "단단한 진주",
		description: "주 무기의 관통력을 올립니다.",
		flavor: "줄지어 내려오는 심해 생물에게 특히 강합니다.",
		attribute: "pierce",
		maxStacks: 3,
	},
	"current-fins": {
		id: "current-fins",
		rarity: "common",
		title: "해류 지느러미",
		description: "이동 속도를 올립니다.",
		flavor: "느린 초반 기동을 가장 정직하게 풀어주는 선택입니다.",
		attribute: "mobility",
		maxStacks: 3,
	},
	"rapid-siphon": {
		id: "rapid-siphon",
		rarity: "common",
		title: "흡입식 아가미",
		description: "주 무기의 연사 속도를 올립니다.",
		flavor: "기본 물방울이 답답할 때 가장 먼저 체감됩니다.",
		attribute: "machineGun",
		maxStacks: 3,
	},
	"pressure-chamber": {
		id: "pressure-chamber",
		rarity: "common",
		title: "압축 탄실",
		description: "비광선 무기의 장전 속도를 올립니다.",
		flavor: "무기를 교체한 뒤에 집으면 빌드가 훨씬 매끄러워집니다.",
		attribute: "utility",
		maxStacks: 3,
	},
	"magnet-tide": {
		id: "magnet-tide",
		rarity: "common",
		title: "회수 조류",
		description: "경험치와 보급품 회수 반경을 크게 넓힙니다.",
		flavor: "화력 대신 성장 속도를 고르는 안정적인 선택입니다.",
		attribute: "utility",
		maxStacks: 3,
	},
	"reef-armor": {
		id: "reef-armor",
		rarity: "common",
		title: "산호 장갑",
		description: "최대 체력과 현재 체력을 1 올립니다.",
		flavor: "느린 기동을 버티며 성장할 시간을 벌어줍니다.",
		attribute: "defense",
		maxStacks: 2,
	},
	"heavy-pearl": {
		id: "heavy-pearl",
		rarity: "rare",
		title: "중압 진주",
		description: "피해량이 크게 증가하지만 연사가 조금 느려집니다.",
		flavor: "소라창, 관통, 보스전 중심 빌드와 잘 맞습니다.",
		attribute: "power",
		maxStacks: 2,
	},
	"overclocked-gills": {
		id: "overclocked-gills",
		rarity: "unique",
		title: "과열 아가미",
		description: "연사 속도를 크게 올리지만 이동 속도가 조금 줄어듭니다.",
		flavor: "위치를 잘 잡고 화면을 밀어붙이는 고정포대형 선택입니다.",
		attribute: "machineGun",
		maxStacks: 2,
	},
	"glass-scales": {
		id: "glass-scales",
		rarity: "unique",
		title: "유리 비늘",
		description: "피해량과 이동 속도가 크게 오르지만 최대 체력이 1 줄어듭니다.",
		flavor: "강해지는 대신 실수가 비싸지는 날카로운 빌드입니다.",
		attribute: "risk",
	},
	"shield-battery": {
		id: "shield-battery",
		rarity: "rare",
		title: "조개 방전판",
		description: "재생 보호막을 해금하거나 보호막 보유량을 늘립니다.",
		flavor: "느린 초반을 안정적으로 넘기는 방어형 핵심입니다.",
		attribute: "defense",
		maxStacks: 3,
	},
	"blade-array": {
		id: "blade-array",
		rarity: "rare",
		title: "산호 지느러미",
		description: "Space 또는 Fin 버튼으로 전방 근접 공격을 사용할 수 있습니다.",
		flavor: "경험치를 먹으러 파고들 때 보험이 됩니다.",
		attribute: "blade",
	},
	"charged-blade": {
		id: "charged-blade",
		rarity: "unique",
		title: "차지 꼬리지느러미",
		description: "Space 또는 Charge 버튼을 길게 눌러 강한 물결 베기를 충전합니다.",
		flavor: "기회를 모아 크게 휘두릅니다.",
		attribute: "blade",
	},
	"echoing-blade": {
		id: "echoing-blade",
		rarity: "rare",
		title: "공명 칼날",
		description: "근접 공격을 해금하고 근접 피해량을 크게 강화합니다.",
		flavor: "탄막이 약한 초반에도 직접 파고드는 빌드를 열어줍니다.",
		attribute: "blade",
		maxStacks: 2,
	},
	"wingman-drone": {
		id: "wingman-drone",
		rarity: "rare",
		title: "회전 조개",
		description: "물고기 주변을 돌며 자동으로 진주탄을 쏘는 조개 무기를 하나 얻습니다.",
		flavor: "영구 조개 업그레이드와 합쳐지면 작은 소용돌이가 됩니다.",
		attribute: "drone",
		maxStacks: 1,
	},
	"drone-swarm": {
		id: "drone-swarm",
		rarity: "unique",
		title: "소라 군락",
		description: "회전 조개 무기를 하나 더 호출합니다. 최대 5개까지 보유할 수 있습니다.",
		flavor: "모델 주변을 도는 보조 화력이 화면을 같이 밀어줍니다.",
		attribute: "drone",
		maxStacks: 4,
	},
	"drone-core": {
		id: "drone-core",
		rarity: "rare",
		title: "진주핵 성장",
		description: "보유 중인 조개 무기의 레벨을 올려 탄속과 피해량을 강화합니다.",
		flavor: "조개가 많을수록 가치가 커집니다.",
		attribute: "drone",
		maxStacks: 5,
	},
	"pet-overdrive": {
		id: "pet-overdrive",
		rarity: "unique",
		title: "해류 공명",
		description: "모든 조개 무기의 연사 속도와 피해량을 강화합니다.",
		flavor: "주변을 도는 무기들이 한 박자 빠르게 따라옵니다.",
		attribute: "drone",
		maxStacks: 3,
	},
	"abyssal-bargain": {
		id: "abyssal-bargain",
		rarity: "unique",
		title: "심해 거래",
		description: "최대 체력을 1 잃는 대신 피해량과 인양 보상이 크게 증가합니다.",
		flavor: "선체 일부를 저당 잡히고 코어 출력을 당겨 씁니다.",
		attribute: "risk",
		maxStacks: 2,
	},
	"volatile-cache": {
		id: "volatile-cache",
		rarity: "rare",
		title: "불안정한 전리품",
		description: "적이 더 자주 몰려오지만 경험치와 인양 보상이 증가합니다.",
		flavor: "더 시끄러운 곳에 좋은 잔해가 모입니다.",
		attribute: "risk",
		maxStacks: 3,
	},
	"redline-current": {
		id: "redline-current",
		rarity: "unique",
		title: "레드라인 조류",
		description: "보스가 빨리 접근하고 적 화력이 거칠어집니다. 대신 유물 선택지가 늘어납니다.",
		flavor: "짧고 위험한 항로일수록 진화 속도는 빨라집니다.",
		attribute: "risk",
		maxStacks: 2,
	},
	"legendary-carrier": {
		id: "legendary-carrier",
		rarity: "legendary",
		title: "전설: 조개 성운",
		description: "상급 조개 무기 두 개를 호출하고 모든 조개를 성장시킵니다.",
		flavor: "물고기 주변에 작은 바다 성운이 펼쳐집니다.",
		attribute: "drone",
	},
};

const AUGMENT_POOL: AugmentId[] = [
	"forked-cannon",
	"scatter-pods",
	"lance-core",
	"needle-laser",
	"focusing-lens",
	"split-prism",
	"piercing-rounds",
	"current-fins",
	"rapid-siphon",
	"pressure-chamber",
	"magnet-tide",
	"reef-armor",
	"heavy-pearl",
	"overclocked-gills",
	"glass-scales",
	"shield-battery",
	"blade-array",
	"charged-blade",
	"echoing-blade",
	"wingman-drone",
	"drone-swarm",
	"drone-core",
	"pet-overdrive",
	"abyssal-bargain",
	"volatile-cache",
	"redline-current",
	"legendary-carrier",
];

const WEAPON_SWAP_AUGMENTS = new Set<AugmentId>(["forked-cannon", "scatter-pods", "lance-core", "needle-laser"]);
const LASER_ONLY_AUGMENTS = new Set<AugmentId>(["focusing-lens"]);
const REPLACEMENT_EXCLUDED_AUGMENTS = new Set<AugmentId>([...WEAPON_SWAP_AUGMENTS, ...LASER_ONLY_AUGMENTS]);

const countAugmentStacks = (state: GameState, augmentId: AugmentId) => state.augments.filter((id) => id === augmentId).length;

const addPet = (state: GameState, level = 1) => {
	if (state.pets.length >= 5) return;

	const nextIndex = state.pets.length;
	const pet: Pet = {
		id: state.nextId,
		x: state.player.x,
		y: state.player.y + 18,
		level,
		fireCooldown: 0.18 + nextIndex * 0.05,
		phase: (Math.PI * 2 * nextIndex) / 5,
	};
	state.nextId += 1;
	state.pets.push(pet);
};

const upgradePets = (state: GameState, amount = 1) => {
	if (state.pets.length === 0) {
		addPet(state, 1 + amount);
		return;
	}

	for (let i = 0; i < amount; i++) {
		const target = [...state.pets].sort((a, b) => a.level - b.level)[0];
		if (target) target.level = Math.min(5, target.level + 1);
	}
};

const upgradeWeapon = (state: GameState, weapon: WeaponKind) => {
	const previousWeapon = state.weapon;
	state.weapon = weapon;
	state.weaponLevels[weapon] = Math.min(3, Math.max(1, state.weaponLevels[weapon] + 1));
	if (state.weaponLevels[weapon] >= 3) state.shake = Math.max(state.shake, 0.34);
	if (previousWeapon === "laser" && weapon !== "laser") convertInactiveLaserAugments(state);
};

const canOfferAugment = (state: GameState, augmentId: AugmentId) => {
	const augment = AUGMENTS[augmentId];
	const stacks = countAugmentStacks(state, augmentId);
	if (stacks >= (augment.maxStacks ?? 1)) return false;
	if (augmentId === "focusing-lens" && state.weapon !== "laser") return false;
	if (augmentId === "focusing-lens" && state.laserFocus >= 2) return false;
	if (augmentId === "charged-blade" && state.chargeUnlocked) return false;
	if (augmentId === "blade-array" && state.meleeUnlocked && state.chargeUnlocked) return false;
	if (augmentId === "split-prism" && state.prismSplitter) return false;
	if (augmentId === "drone-swarm" && state.pets.length >= 5) return false;
	if ((augmentId === "drone-core" || augmentId === "pet-overdrive") && state.pets.length === 0) return false;
	if ((augmentId === "glass-scales" || augmentId === "abyssal-bargain") && state.player.maxLives <= 1) return false;
	if (augmentId === "legendary-carrier" && state.experienceLevel < 6) return false;
	return true;
};

const getRarityWeight = (state: GameState, rarity: AugmentRarity) => {
	const progress = Math.min(1, state.experienceLevel * 0.065 + state.augments.length * 0.035);

	switch (rarity) {
		case "common":
			return 58 - progress * 22;
		case "rare":
			return 32 + progress * 2;
		case "unique":
			return 9 + progress * 18;
		case "legendary":
			return 1 + progress * 6;
	}
};

const pickWeightedAugment = (state: GameState, available: AugmentId[]) => {
	const totalWeight = available.reduce((total, augmentId) => total + getRarityWeight(state, AUGMENTS[augmentId].rarity), 0);
	let roll = Math.random() * totalWeight;

	for (const augmentId of available) {
		roll -= getRarityWeight(state, AUGMENTS[augmentId].rarity);
		if (roll <= 0) return augmentId;
	}

	return available[available.length - 1];
};

const getReplacementAugment = (state: GameState) => {
	const available = AUGMENT_POOL.filter((augmentId) => !REPLACEMENT_EXCLUDED_AUGMENTS.has(augmentId) && canOfferAugment(state, augmentId));
	if (available.length === 0) return null;
	return pickWeightedAugment(state, available);
};

function grantAugmentImmediately(state: GameState, augmentId: AugmentId) {
	state.augments.push(augmentId);
	applyAugmentEffect(state, augmentId);
}

function convertInactiveLaserAugments(state: GameState) {
	const convertedCount = state.laserFocus;
	if (convertedCount <= 0) return;

	state.laserFocus = 0;
	state.augments = state.augments.filter((augmentId) => !LASER_ONLY_AUGMENTS.has(augmentId));

	for (let i = 0; i < convertedCount; i++) {
		const replacement = getReplacementAugment(state);
		if (!replacement) break;
		grantAugmentImmediately(state, replacement);
	}

	state.shake = Math.max(state.shake, 0.24);
}

export const getAugmentChoices = (state: GameState) => {
	const available = AUGMENT_POOL.filter((augmentId) => canOfferAugment(state, augmentId));
	const choices: AugmentId[] = [];
	const choiceLimit = Math.min(4, 3 + state.augmentChoiceBonus);

	while (available.length > 0 && choices.length < choiceLimit) {
		const augmentId = pickWeightedAugment(state, available);
		const index = available.indexOf(augmentId);
		available.splice(index, 1);
		choices.push(augmentId);
	}

	return choices;
};

export const openAugmentSelection = (state: GameState) => {
	const choices = getAugmentChoices(state);
	if (choices.length === 0) return;

	state.mode = "augment";
	state.augmentChoices = choices;
	state.player.isCharging = false;
	state.player.meleeCharge = 0;
};

export const applyAugment = (state: GameState, augmentId: AugmentId) => {
	if (!state.augmentChoices.includes(augmentId)) return;

	state.augments.push(augmentId);
	state.augmentChoices = [];
	state.mode = "playing";
	state.player.invincible = Math.max(state.player.invincible, 1);
	state.shake = Math.max(state.shake, AUGMENTS[augmentId].rarity === "legendary" ? 0.52 : AUGMENTS[augmentId].rarity === "unique" ? 0.32 : 0.18);

	applyAugmentEffect(state, augmentId);

	for (const pet of state.pets) {
		pet.x = Math.min(WORLD_WIDTH - 24, Math.max(24, pet.x));
		pet.y = Math.min(WORLD_HEIGHT - 32, Math.max(32, pet.y));
	}
};

function applyAugmentEffect(state: GameState, augmentId: AugmentId) {
	switch (augmentId) {
		case "forked-cannon":
			upgradeWeapon(state, "fork");
			break;
		case "scatter-pods":
			upgradeWeapon(state, "scatter");
			break;
		case "lance-core":
			upgradeWeapon(state, "lance");
			state.bulletPierce += 1;
			break;
		case "needle-laser":
			upgradeWeapon(state, "laser");
			break;
		case "focusing-lens":
			state.laserFocus += 1;
			break;
		case "split-prism":
			state.prismSplitter = true;
			state.bulletPierce += state.weapon === "laser" ? 1 : 0;
			state.projectileChaos += state.weapon === "fork" || state.weapon === "scatter" ? 0.7 : 0.18;
			break;
		case "piercing-rounds":
			state.bulletPierce += 1;
			break;
		case "current-fins":
			state.playerSpeedMultiplier *= 1.16;
			break;
		case "rapid-siphon":
			state.fireCooldownMultiplier *= 0.9;
			break;
		case "pressure-chamber":
			state.reloadSpeedMultiplier *= 1.18;
			break;
		case "magnet-tide":
			state.magnetMultiplier *= 1.32;
			break;
		case "reef-armor":
			state.player.maxLives += 1;
			state.player.lives = Math.min(state.player.maxLives, state.player.lives + 1);
			break;
		case "heavy-pearl":
			state.damageMultiplier *= 1.28;
			state.fireCooldownMultiplier *= 1.06;
			break;
		case "overclocked-gills":
			state.fireCooldownMultiplier *= 0.72;
			state.playerSpeedMultiplier *= 0.94;
			break;
		case "glass-scales":
			state.damageMultiplier *= 1.72;
			state.playerSpeedMultiplier *= 1.12;
			state.player.maxLives = Math.max(1, state.player.maxLives - 1);
			state.player.lives = Math.min(state.player.lives, state.player.maxLives);
			break;
		case "shield-battery":
			state.shieldUnlocked = true;
			state.shieldMaxCharges = Math.min(4, state.shieldMaxCharges + 1);
			state.shieldCharges = Math.min(state.shieldMaxCharges, state.shieldCharges + 1);
			state.shieldInterval *= 0.92;
			break;
		case "blade-array":
			state.meleeUnlocked = true;
			state.meleeDamageMultiplier *= 1.1;
			break;
		case "charged-blade":
			state.meleeUnlocked = true;
			state.chargeUnlocked = true;
			state.meleeDamageMultiplier *= 1.25;
			break;
		case "echoing-blade":
			state.meleeUnlocked = true;
			state.meleeDamageMultiplier *= 1.42;
			break;
		case "wingman-drone":
			addPet(state);
			break;
		case "drone-swarm":
			addPet(state);
			break;
		case "drone-core":
			upgradePets(state);
			state.petDamageMultiplier *= 1.08;
			break;
		case "pet-overdrive":
			state.petDamageMultiplier *= 1.18;
			state.petFireCooldownMultiplier *= 0.84;
			break;
		case "abyssal-bargain":
			state.player.maxLives = Math.max(1, state.player.maxLives - 1);
			state.player.lives = Math.min(state.player.lives, state.player.maxLives);
			state.damageMultiplier *= 1.55;
			state.rewardMultiplier *= 1.16;
			state.riskStacks += 1;
			break;
		case "volatile-cache":
			state.rewardMultiplier *= 1.24;
			state.spawnIntensityMultiplier *= 1.14;
			state.threatMultiplier *= 1.06;
			state.riskStacks += 1;
			break;
		case "redline-current":
			state.bossTimer = Math.max(8, state.bossTimer - 7);
			state.augmentChoiceBonus = Math.min(1, state.augmentChoiceBonus + 1);
			state.threatMultiplier *= 1.12;
			state.rewardMultiplier *= 1.12;
			state.riskStacks += 1;
			break;
		case "legendary-carrier":
			addPet(state, 2);
			addPet(state, 2);
			upgradePets(state, 2);
			state.petDamageMultiplier *= 1.32;
			state.petFireCooldownMultiplier *= 0.78;
			break;
	}
}
