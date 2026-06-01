import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type { AugmentDefinition, AugmentId, AugmentRarity, GameState, Pet, WeaponKind } from "./types";

export const WEAPON_LABELS: Record<WeaponKind, string> = {
	standard: "기본포",
	fork: "쌍열포",
	scatter: "산탄포",
	lance: "관통창",
	laser: "레이저",
};

export const RARITY_LABELS: Record<AugmentRarity, string> = {
	common: "일반",
	rare: "희귀",
	unique: "유니크",
	legendary: "전설",
};

export const AUGMENTS: Record<AugmentId, AugmentDefinition> = {
	"forked-cannon": {
		id: "forked-cannon",
		rarity: "rare",
		title: "쌍열 캐논",
		description: "중앙 포화를 버리고 좌우로 강한 탄을 두 발 발사합니다.",
		flavor: "영구 업그레이드 화력과 만나면 편대 처리력이 크게 올라갑니다.",
	},
	"scatter-pods": {
		id: "scatter-pods",
		rarity: "rare",
		title: "산탄 포드",
		description: "넓은 각도로 퍼지는 다연장 무기로 교체합니다.",
		flavor: "경험치 오브를 먹으러 움직일 때 빈틈을 줄여줍니다.",
	},
	"lance-core": {
		id: "lance-core",
		rarity: "rare",
		title: "관통 코어",
		description: "느리지만 강한 직선 관통탄으로 무기를 교체합니다.",
		flavor: "중화기 재장전 업그레이드가 있으면 더 안정적입니다.",
	},
	"needle-laser": {
		id: "needle-laser",
		rarity: "rare",
		title: "니들 레이저",
		description: "빠르고 가는 고속 레이저 무기로 교체합니다.",
		flavor: "초점 렌즈를 모으면 보스전이 날카로워집니다.",
	},
	"focusing-lens": {
		id: "focusing-lens",
		rarity: "rare",
		title: "초점 렌즈",
		description: "레이저 계열의 집중도와 관통력을 강화합니다.",
		flavor: "레이저 빌드의 방향을 분명하게 만들어줍니다.",
		maxStacks: 2,
	},
	"split-prism": {
		id: "split-prism",
		rarity: "unique",
		title: "분광 프리즘",
		description: "탄을 갈라 보냅니다. 레이저와는 안정적이고, 산탄/쌍열포와는 다소 불안정합니다.",
		flavor: "무기 형태를 바꾸는 유니크 증강입니다.",
	},
	"piercing-rounds": {
		id: "piercing-rounds",
		rarity: "common",
		title: "관통탄",
		description: "플레이어 탄이 적을 한 번 더 관통합니다.",
		flavor: "줄지어 오는 편대에 특히 강합니다.",
		maxStacks: 3,
	},
	"blade-array": {
		id: "blade-array",
		rarity: "rare",
		title: "근접 블레이드",
		description: "Space 또는 Blade 버튼으로 전방 근접 공격을 사용할 수 있습니다.",
		flavor: "경험치를 먹으러 파고들 때 보험이 됩니다.",
	},
	"charged-blade": {
		id: "charged-blade",
		rarity: "unique",
		title: "차지 블레이드",
		description: "Space 또는 Charge 버튼을 길게 눌러 강한 베기를 충전합니다.",
		flavor: "기회를 모아 크게 휘두릅니다.",
	},
	"wingman-drone": {
		id: "wingman-drone",
		rarity: "rare",
		title: "윙맨 드론",
		description: "플레이어를 따라다니며 자동 사격하는 펫을 하나 얻습니다.",
		flavor: "영구 펫 업그레이드와 합쳐지면 작은 편대가 됩니다.",
		maxStacks: 1,
	},
	"drone-swarm": {
		id: "drone-swarm",
		rarity: "unique",
		title: "드론 편대",
		description: "전투 펫을 하나 더 호출합니다. 최대 5기까지 보유할 수 있습니다.",
		flavor: "보조 화력이 화면을 같이 밀어줍니다.",
		maxStacks: 4,
	},
	"drone-core": {
		id: "drone-core",
		rarity: "rare",
		title: "펫 코어 성장",
		description: "보유 중인 펫의 레벨을 올려 탄속과 피해량을 강화합니다.",
		flavor: "펫이 많을수록 가치가 커집니다.",
		maxStacks: 5,
	},
	"pet-overdrive": {
		id: "pet-overdrive",
		rarity: "unique",
		title: "펫 오버드라이브",
		description: "모든 펫의 연사 속도와 피해량을 강화합니다.",
		flavor: "보조 화력이 한 박자 빠르게 따라옵니다.",
		maxStacks: 3,
	},
	"legendary-carrier": {
		id: "legendary-carrier",
		rarity: "legendary",
		title: "전설: 캐리어 링크",
		description: "상급 펫 두 기를 호출하고 모든 펫을 성장시킵니다.",
		flavor: "하늘 위에 작은 함대가 펼쳐집니다.",
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
	"blade-array",
	"charged-blade",
	"wingman-drone",
	"drone-swarm",
	"drone-core",
	"pet-overdrive",
	"legendary-carrier",
];

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

const canOfferAugment = (state: GameState, augmentId: AugmentId) => {
	const augment = AUGMENTS[augmentId];
	const stacks = countAugmentStacks(state, augmentId);
	if (stacks >= (augment.maxStacks ?? 1)) return false;
	if (augmentId === "focusing-lens" && state.laserFocus >= 2) return false;
	if (augmentId === "charged-blade" && state.chargeUnlocked) return false;
	if (augmentId === "blade-array" && state.meleeUnlocked && state.chargeUnlocked) return false;
	if (augmentId === "split-prism" && state.prismSplitter) return false;
	if (augmentId === "drone-swarm" && state.pets.length >= 5) return false;
	if ((augmentId === "drone-core" || augmentId === "pet-overdrive") && state.pets.length === 0) return false;
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

export const getAugmentChoices = (state: GameState) => {
	const available = AUGMENT_POOL.filter((augmentId) => canOfferAugment(state, augmentId));
	const choices: AugmentId[] = [];

	while (available.length > 0 && choices.length < 3) {
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

	switch (augmentId) {
		case "forked-cannon":
			state.weapon = "fork";
			break;
		case "scatter-pods":
			state.weapon = "scatter";
			break;
		case "lance-core":
			state.weapon = "lance";
			state.bulletPierce += 1;
			break;
		case "needle-laser":
			state.weapon = "laser";
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
		case "blade-array":
			state.meleeUnlocked = true;
			state.meleeDamageMultiplier *= 1.1;
			break;
		case "charged-blade":
			state.meleeUnlocked = true;
			state.chargeUnlocked = true;
			state.meleeDamageMultiplier *= 1.25;
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
		case "legendary-carrier":
			addPet(state, 2);
			addPet(state, 2);
			upgradePets(state, 2);
			state.petDamageMultiplier *= 1.32;
			state.petFireCooldownMultiplier *= 0.78;
			break;
	}

	for (const pet of state.pets) {
		pet.x = Math.min(WORLD_WIDTH - 24, Math.max(24, pet.x));
		pet.y = Math.min(WORLD_HEIGHT - 32, Math.max(32, pet.y));
	}
};
