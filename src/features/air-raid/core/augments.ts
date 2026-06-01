import type { AugmentDefinition, AugmentId, GameState, WeaponKind } from "./types";

export const WEAPON_LABELS: Record<WeaponKind, string> = {
	standard: "Standard",
	fork: "Fork",
	scatter: "Scatter",
	lance: "Lance",
	laser: "Laser",
};

export const AUGMENTS: Record<AugmentId, AugmentDefinition> = {
	"forked-cannon": {
		id: "forked-cannon",
		title: "양갈래 기관포",
		description: "중앙 탄을 포기하고 양쪽으로 강한 탄을 2발 발사합니다.",
		flavor: "가운데가 비어 더 어렵지만, 화력은 확실히 올라갑니다.",
	},
	"scatter-pods": {
		id: "scatter-pods",
		title: "산탄 포드",
		description: "넓게 퍼지는 탄막 무기로 교체합니다.",
		flavor: "정밀도는 낮아지지만 화면 장악력이 좋아집니다.",
	},
	"lance-core": {
		id: "lance-core",
		title: "관통 랜스",
		description: "느리지만 굵고 강한 직선 탄으로 무기를 교체합니다.",
		flavor: "정면을 찌르는 한 방형 무장입니다.",
	},
	"needle-laser": {
		id: "needle-laser",
		title: "니들 레이저",
		description: "일자로 나가는 약한 고속 레이저 무기로 교체합니다.",
		flavor: "처음엔 심심하지만 렌즈를 만나면 전혀 다른 무기가 됩니다.",
	},
	"focusing-lens": {
		id: "focusing-lens",
		title: "초점 렌즈",
		description: "레이저 계열을 크게 강화합니다. 레이저가 없어도 나중을 위해 남습니다.",
		flavor: "먼저 먹으면 애매하고, 맞는 무기를 만나면 폭발합니다.",
	},
	"split-prism": {
		id: "split-prism",
		title: "분광 프리즘",
		description: "탄을 더 갈라 보냅니다. 레이저와는 시너지가 있지만 산탄/양갈래와는 불안정합니다.",
		flavor: "좋은 조합이면 빛이 갈라지고, 나쁜 조합이면 조준이 갈라집니다.",
	},
	"heavy-core": {
		id: "heavy-core",
		title: "중탄 코어",
		description: "총알 데미지가 크게 증가하지만 연사 속도가 조금 느려집니다.",
		flavor: "한 발의 의미가 커집니다.",
	},
	"rapid-cycle": {
		id: "rapid-cycle",
		title: "고속 약실",
		description: "연사 속도가 빨라집니다.",
		flavor: "작게 더 자주 때립니다.",
	},
	"piercing-rounds": {
		id: "piercing-rounds",
		title: "관통탄",
		description: "플레이어 탄이 적을 한 번 더 관통합니다.",
		flavor: "줄지어 오는 적에게 특히 강합니다.",
	},
	"unstable-core": {
		id: "unstable-core",
		title: "불안정 코어",
		description: "화력은 크게 오르지만 탄도가 흔들립니다. 산탄/양갈래와 만나면 꽤 골치 아픕니다.",
		flavor: "강한데 말을 잘 안 듣습니다.",
	},
	"blade-array": {
		id: "blade-array",
		title: "근접 블레이드",
		description: "Space 또는 Blade 버튼으로 전방 근접 공격을 사용할 수 있습니다.",
		flavor: "위험하게 붙을수록 강합니다.",
	},
	"charged-blade": {
		id: "charged-blade",
		title: "차지 블레이드",
		description: "Space 또는 Charge 버튼을 길게 눌러 강한 베기를 충전합니다.",
		flavor: "기를 모아 크게 휘두릅니다.",
	},
};

const AUGMENT_POOL: AugmentId[] = [
	"forked-cannon",
	"scatter-pods",
	"lance-core",
	"needle-laser",
	"focusing-lens",
	"split-prism",
	"heavy-core",
	"rapid-cycle",
	"piercing-rounds",
	"unstable-core",
	"blade-array",
	"charged-blade",
];

const canOfferAugment = (state: GameState, augmentId: AugmentId) => {
	if (augmentId === "focusing-lens") return state.laserFocus < 2;
	if (state.augments.includes(augmentId)) return false;
	if (augmentId === "charged-blade" && state.chargeUnlocked) return false;
	if (augmentId === "blade-array" && state.meleeUnlocked && state.chargeUnlocked) return false;
	if (augmentId === "split-prism" && state.prismSplitter) return false;
	return true;
};

export const getAugmentChoices = (state: GameState) => {
	const available = AUGMENT_POOL.filter((augmentId) => canOfferAugment(state, augmentId));
	const choices: AugmentId[] = [];

	while (available.length > 0 && choices.length < 3) {
		const index = Math.floor(Math.random() * available.length);
		const [augmentId] = available.splice(index, 1);
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

	switch (augmentId) {
		case "forked-cannon":
			state.weapon = "fork";
			state.damageMultiplier *= 1.18;
			break;
		case "scatter-pods":
			state.weapon = "scatter";
			state.fireCooldownMultiplier *= 1.08;
			break;
		case "lance-core":
			state.weapon = "lance";
			state.damageMultiplier *= 1.35;
			state.fireCooldownMultiplier *= 1.18;
			state.bulletPierce += 1;
			break;
		case "needle-laser":
			state.weapon = "laser";
			state.fireCooldownMultiplier *= 0.86;
			break;
		case "focusing-lens":
			state.laserFocus += 1;
			state.damageMultiplier *= state.weapon === "laser" ? 1.18 : 1.04;
			break;
		case "split-prism":
			state.prismSplitter = true;
			state.bulletPierce += state.weapon === "laser" ? 1 : 0;
			state.projectileChaos += state.weapon === "fork" || state.weapon === "scatter" ? 0.7 : 0.18;
			break;
		case "heavy-core":
			state.damageMultiplier *= 1.42;
			state.fireCooldownMultiplier *= 1.14;
			break;
		case "rapid-cycle":
			state.fireCooldownMultiplier *= 0.78;
			break;
		case "piercing-rounds":
			state.bulletPierce += 1;
			break;
		case "unstable-core":
			state.damageMultiplier *= 1.58;
			state.fireCooldownMultiplier *= 1.08;
			state.projectileChaos += state.weapon === "fork" || state.weapon === "scatter" ? 1.05 : 0.42;
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
	}
};
