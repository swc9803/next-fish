import { addParticleBurst } from "./effects";
import { addExperience } from "./rewards";
import type { GameState, StageMissionKind } from "./types";

const completeMission = (state: GameState) => {
	const mission = state.stageMission;
	if (!mission || mission.completed || mission.failed) return;

	mission.completed = true;
	mission.progress = mission.target;
	state.missionsCompleted += 1;
	state.earnedCoins += mission.rewardCoins;
	addExperience(state, mission.rewardExperience);
	state.shake = Math.max(state.shake, 0.16);
	addParticleBurst(state, state.player.x, state.player.y - 28, "#fff27a", 22);
};

export const updateStageMission = (state: GameState, dt: number) => {
	const mission = state.stageMission;
	if (!mission || mission.completed || mission.failed) return;

	if (mission.kind === "survive") {
		mission.progress = Math.min(mission.target, mission.progress + dt);
	}

	if (mission.kind === "flawless" && state.damageTaken > mission.startDamageTaken) {
		mission.failed = true;
		return;
	}

	if (mission.progress >= mission.target) completeMission(state);
};

export const addStageMissionProgress = (state: GameState, kind: StageMissionKind, amount = 1) => {
	const mission = state.stageMission;
	if (!mission || mission.completed || mission.failed || mission.kind !== kind) return;

	mission.progress = Math.min(mission.target, mission.progress + amount);
	if (mission.progress >= mission.target) completeMission(state);
};

export const recordMissionEnemyDefeated = (state: GameState, isBoss: boolean) => {
	addStageMissionProgress(state, "defeat", 1);
	addStageMissionProgress(state, "flawless", 1);
	if (isBoss) addStageMissionProgress(state, "boss", 1);
};

export const recordMissionCoinsCollected = (state: GameState, amount: number) => {
	addStageMissionProgress(state, "collect-coins", amount);
};

export const failFlawlessMission = (state: GameState) => {
	const mission = state.stageMission;
	if (mission?.kind === "flawless" && !mission.completed) mission.failed = true;
};
