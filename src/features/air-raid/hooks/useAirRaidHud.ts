import { useCallback, useRef, useState } from "react";

import { createInitialState, makeHud } from "../core/state";
import type { GameState, HudState } from "../core/types";

const createHudSignature = (hud: HudState) =>
	[
		hud.mode,
		hud.score,
		hud.highScore,
		hud.experienceLevel,
		hud.experience,
		hud.nextExperience,
		hud.combo,
		hud.wave,
		hud.stage,
		hud.bossSkills.join(","),
		hud.bossSkills.map((skillId) => Math.ceil(hud.bossSkillCooldowns[skillId] * 10) / 10).join(","),
		hud.stageChoices.map((choice) => choice.id).join(","),
		hud.pendingBossSkill ?? "",
		hud.lives,
		hud.power,
		hud.weapon,
		hud.weaponLevel,
		hud.augmentCount,
		hud.augmentChoices.join(","),
		hud.augmentChoices.map((augmentId) => hud.augmentStacks[augmentId] ?? 0).join(","),
		hud.lastAugmentId ?? "",
		hud.petCount,
		hud.petLevelTotal,
		hud.damageBonusPercent,
		hud.fireRateBonusPercent,
		hud.speedBonusPercent,
		hud.magnetBonusPercent,
		hud.reloadBonusPercent,
		hud.shieldCharges,
		hud.shieldMaxCharges,
		hud.defeatedEnemies,
		hud.maxCombo,
		hud.damageTaken,
		Math.round(hud.bossDamageDealt),
		hud.missionsCompleted,
		hud.suppliesCollected,
		hud.earnedCoins,
		hud.stageMission
			? `${hud.stageMission.id},${Math.floor(hud.stageMission.progress)},${hud.stageMission.completed},${hud.stageMission.failed}`
			: "",
		hud.routeModifier,
		Math.round(hud.rewardMultiplier * 100),
		Math.round(hud.threatMultiplier * 100),
		hud.laserFocus,
		Math.round(hud.projectileChaos * 10),
		hud.meleeUnlocked,
		hud.chargeUnlocked,
		Math.round(hud.chargeRatio * 20),
	].join(":");

export const useAirRaidHud = () => {
	const hudSignatureRef = useRef("");
	const [hud, setHud] = useState<HudState>(() => makeHud(createInitialState(0)));

	const syncHud = useCallback((state: GameState, force = false) => {
		const nextHud = makeHud(state);
		const signature = createHudSignature(nextHud);
		if (force || signature !== hudSignatureRef.current) {
			hudSignatureRef.current = signature;
			setHud(nextHud);
		}
	}, []);

	return { hud, syncHud };
};
