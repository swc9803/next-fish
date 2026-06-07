"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AirRaidAugmentOverlay } from "./components/AirRaidAugmentOverlay";
import { AirRaidControls } from "./components/AirRaidControls";
import { AirRaidHud } from "./components/AirRaidHud";
import { AirRaidModelLayer } from "./components/AirRaidModelLayer";
import { AirRaidOverlay } from "./components/AirRaidOverlay";
import { AirRaidStageSelectOverlay } from "./components/AirRaidStageSelectOverlay";
import styles from "./AirRaidGame.module.scss";
import { applyAugment } from "./core/augments";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./core/constants";
import { activateBossSkill, beginMeleeCharge, releaseMeleeCharge } from "./core/engine";
import { createLayout } from "./core/layout";
import { createDefaultMetaProgress } from "./core/meta";
import { selectStageRoute } from "./core/stages";
import { createInitialState } from "./core/state";
import { buyMetaUpgrade, playCoinSlot, playStatSlot, readHighScore, readMetaProgress } from "./core/storage";
import { useAirRaidCanvas } from "./hooks/useAirRaidCanvas";
import { useAirRaidHud } from "./hooks/useAirRaidHud";
import type { AugmentId, BossSkillId, GameMode, GameState, Layout, MetaProgress, MetaUpgradeId, SlotSpinResult, StageKind } from "./core/types";

export const AirRaidGame = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const stateRef = useRef<GameState | null>(null);
	const layoutRef = useRef<Layout>(createLayout(WORLD_WIDTH, WORLD_HEIGHT));
	const { hud, syncHud } = useAirRaidHud();
	const [metaProgress, setMetaProgress] = useState<MetaProgress>(() => createDefaultMetaProgress());
	const [slotResult, setSlotResult] = useState<SlotSpinResult | null>(null);
	const metaProgressRef = useRef<MetaProgress>(metaProgress);

	const resetGame = useCallback((mode: GameMode = "playing") => {
		const state = createInitialState(Math.max(readHighScore(), stateRef.current?.highScore || 0), metaProgressRef.current);
		state.mode = mode;
		stateRef.current = state;
		syncHud(state, true);
	}, [syncHud]);

	const handleBuyUpgrade = useCallback((upgradeId: MetaUpgradeId) => {
		const nextProgress = buyMetaUpgrade(upgradeId);
		metaProgressRef.current = nextProgress;
		setMetaProgress(nextProgress);

		if (stateRef.current?.mode === "ready") {
			resetGame("ready");
		}
	}, [resetGame]);

	const syncMetaProgress = useCallback((nextProgress: MetaProgress) => {
		metaProgressRef.current = nextProgress;
		setMetaProgress(nextProgress);
		if (stateRef.current?.mode === "ready") {
			const state = createInitialState(Math.max(readHighScore(), stateRef.current?.highScore || 0), nextProgress);
			state.mode = "ready";
			stateRef.current = state;
			syncHud(state, true);
		}
	}, [syncHud]);

	const handleCoinSlot = useCallback(() => {
		const { progress, result } = playCoinSlot();
		setSlotResult(result);
		syncMetaProgress(progress);
	}, [syncMetaProgress]);

	const handleStatSlot = useCallback(() => {
		const { progress, result } = playStatSlot();
		setSlotResult(result);
		syncMetaProgress(progress);
	}, [syncMetaProgress]);

	const togglePause = useCallback(() => {
		const state = stateRef.current;
		if (!state || (state.mode !== "playing" && state.mode !== "paused")) return;

		state.mode = state.mode === "paused" ? "playing" : "paused";
		syncHud(state, true);
	}, [syncHud]);

	const selectAugment = useCallback((augmentId: AugmentId) => {
		const state = stateRef.current;
		if (!state) return;

		applyAugment(state, augmentId);
		syncHud(state, true);
	}, [syncHud]);

	const selectStage = useCallback((stage: StageKind) => {
		const state = stateRef.current;
		if (!state) return;

		if (selectStageRoute(state, stage)) {
			syncHud(state, true);
		}
	}, [syncHud]);

	const handleMeleeDown = useCallback(() => {
		const state = stateRef.current;
		if (!state) return;

		beginMeleeCharge(state);
		syncHud(state, true);
	}, [syncHud]);

	const handleMeleeUp = useCallback(() => {
		const state = stateRef.current;
		if (!state) return;

		releaseMeleeCharge(state);
		syncHud(state, true);
	}, [syncHud]);

	const handleBossSkill = useCallback((skillId: BossSkillId) => {
		const state = stateRef.current;
		if (!state) return;

		if (activateBossSkill(state, skillId)) {
			syncHud(state, true);
		}
	}, [syncHud]);

	useEffect(() => {
		const nextProgress = readMetaProgress();
		metaProgressRef.current = nextProgress;
		setMetaProgress(nextProgress);
		resetGame("ready");
	}, [resetGame]);

	useAirRaidCanvas({
		canvasRef,
		layoutRef,
		metaProgressRef,
		resetGame,
		setMetaProgress,
		stateRef,
		syncHud,
		togglePause,
		wrapperRef,
	});

	return (
		<main className={styles.page}>
			<AirRaidHud hud={hud} />

			<div ref={wrapperRef} className={styles.stage}>
				<canvas ref={canvasRef} className={styles.canvas} aria-label="슈팅 게임 canvas" />
				<AirRaidModelLayer stateRef={stateRef} layoutRef={layoutRef} />
					<AirRaidOverlay
						hud={hud}
						metaProgress={metaProgress}
						mode={hud.mode}
					onBuyUpgrade={handleBuyUpgrade}
					onCoinSlot={handleCoinSlot}
					onResume={togglePause}
						onStart={() => resetGame("playing")}
						onStatSlot={handleStatSlot}
						slotResult={slotResult}
					/>
					<AirRaidAugmentOverlay augmentStacks={hud.augmentStacks} choices={hud.augmentChoices} mode={hud.mode} onSelect={selectAugment} />
					<AirRaidStageSelectOverlay
						bossSkills={hud.bossSkills}
						choices={hud.stageChoices}
						mode={hud.mode}
						pendingBossSkill={hud.pendingBossSkill}
						onSelect={selectStage}
					/>
				</div>

				<AirRaidControls
				chargeRatio={hud.chargeRatio}
				chargeUnlocked={hud.chargeUnlocked}
				bossSkillCooldowns={hud.bossSkillCooldowns}
				bossSkills={hud.bossSkills}
				meleeUnlocked={hud.meleeUnlocked}
				mode={hud.mode}
				onBossSkill={handleBossSkill}
				onMeleeDown={handleMeleeDown}
				onMeleeUp={handleMeleeUp}
				onRestart={() => resetGame("playing")}
				onTogglePause={togglePause}
			/>
		</main>
	);
};
