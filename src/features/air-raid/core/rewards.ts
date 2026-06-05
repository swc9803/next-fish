import { openAugmentSelection } from "./augments";
import { addParticleBurst } from "./effects";
import { randomRange } from "./math";
import { getNextId } from "./state";
import type { GameState, Plane } from "./types";

export const awardEnemyScore = (state: GameState, enemy: Plane) => {
	if (enemy.kind === "supply") return;
	const baseScore =
		enemy.kind === "boss" ? 2200 : enemy.kind === "goldfish" ? 1250 : enemy.kind === "bomber" ? 260 : enemy.kind === "ace" ? 230 : enemy.kind === "fighter" ? 180 : 110;
	state.combo = Math.min(99, state.combo + 1);
	state.maxCombo = Math.max(state.maxCombo, state.combo);
	state.comboTimer = 2.6;
	state.score += Math.round(baseScore * state.rewardMultiplier * state.routeRewardMultiplier * (1 + Math.min(state.combo - 1, 18) * 0.05));
	state.defeatedEnemies += 1;
	if (enemy.kind === "boss") state.defeatedBosses += 1;
};

export const calculateCoinReward = (state: GameState) =>
	Math.max(0, state.earnedCoins + Math.floor(state.defeatedEnemies * 3 + Math.max(0, state.wave - 1) * 35 + state.defeatedBosses * 90 + state.score / 720));

const getEnemyExperience = (state: GameState, enemy: Plane) => {
	if (enemy.kind === "supply") return enemy.experienceReward ?? 22 + state.wave * 4;
	if (enemy.kind === "goldfish") return enemy.experienceReward ?? 90 + state.wave * 10;

	const baseExperience = enemy.kind === "boss" ? 125 : enemy.kind === "bomber" ? 18 : enemy.kind === "ace" ? 16 : enemy.kind === "fighter" ? 12 : 8;
	return Math.round((baseExperience + Math.floor(state.wave * (enemy.kind === "boss" ? 4 : 0.8))) * state.rewardMultiplier * state.routeRewardMultiplier);
};

const getNextExperience = (level: number, currentNext: number) => Math.round(currentNext * 1.22 + 18 + level * 6);

export const addExperience = (state: GameState, amount: number) => {
	state.experience += amount;
	if (state.mode !== "playing" || state.experience < state.nextExperience) return;

	state.experience -= state.nextExperience;
	state.experienceLevel += 1;
	state.nextExperience = getNextExperience(state.experienceLevel, state.nextExperience);
	state.shake = Math.max(state.shake, 0.2);
	addParticleBurst(state, state.player.x, state.player.y, "#b6ff7a", 26);
	openAugmentSelection(state);
};

export const dropExperience = (state: GameState, enemy: Plane) => {
	const totalExperience = getEnemyExperience(state, enemy);
	const orbCount = enemy.kind === "boss" ? 28 : enemy.kind === "goldfish" ? 14 : enemy.kind === "bomber" ? 4 : enemy.kind === "ace" ? 3 : 2;
	let remaining = totalExperience;

	for (let i = 0; i < orbCount; i++) {
		const value = i === orbCount - 1 ? remaining : Math.max(1, Math.floor(totalExperience / orbCount));
		remaining -= value;
		state.experienceOrbs.push({
			id: getNextId(state),
			x: enemy.x + randomRange(-enemy.radius * 0.35, enemy.radius * 0.35),
			y: enemy.y + randomRange(-enemy.radius * 0.25, enemy.radius * 0.25),
			vx: enemy.kind === "boss" ? randomRange(-150, 150) : randomRange(-44, 44),
			vy: enemy.kind === "boss" ? randomRange(-140, 85) : randomRange(48, 98),
			value,
			radius: enemy.kind === "boss" || enemy.kind === "goldfish" ? 5.6 : 4.6,
			kind: "experience",
			autoCollect: enemy.kind === "boss",
			homeDelay: enemy.kind === "boss" ? randomRange(0.2, 0.62) : 0,
		});
	}
};

export const dropCoins = (state: GameState, enemy: Plane, totalCoins: number, count: number, autoCollect = false) => {
	let remaining = Math.max(0, Math.floor(totalCoins * state.rewardMultiplier * state.routeRewardMultiplier));

	for (let i = 0; i < count; i++) {
		const slotsLeft = count - i;
		const value = i === count - 1 ? remaining : Math.max(1, Math.floor(remaining / slotsLeft) + Math.floor(randomRange(-1, 3)));
		remaining -= value;
		const angle = autoCollect ? randomRange(-Math.PI, 0) : randomRange(-Math.PI * 0.94, -Math.PI * 0.06);
		const speed = randomRange(autoCollect ? 120 : 72, enemy.kind === "boss" ? 230 : 150);

		state.experienceOrbs.push({
			id: getNextId(state),
			x: enemy.x + randomRange(-enemy.radius * 0.5, enemy.radius * 0.5),
			y: enemy.y + randomRange(-enemy.radius * 0.35, enemy.radius * 0.35),
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed + randomRange(42, 96),
			value,
			radius: enemy.kind === "boss" ? randomRange(5.4, 7.2) : randomRange(4.8, 6.2),
			kind: "coin",
			autoCollect,
			homeDelay: autoCollect ? randomRange(0.18, 0.7) : 0,
		});
	}
};
