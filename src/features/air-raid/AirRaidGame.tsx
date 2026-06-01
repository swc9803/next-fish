"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AirRaidAugmentOverlay } from "./components/AirRaidAugmentOverlay";
import { AirRaidControls } from "./components/AirRaidControls";
import { AirRaidHud } from "./components/AirRaidHud";
import { AirRaidOverlay } from "./components/AirRaidOverlay";
import styles from "./AirRaidGame.module.scss";
import { applyAugment } from "./core/augments";
import { CONTROL_KEYS, WORLD_HEIGHT, WORLD_WIDTH } from "./core/constants";
import { beginMeleeCharge, releaseMeleeCharge, updateGame } from "./core/engine";
import { getCanvasPoint } from "./core/input";
import { drawGame } from "./core/renderer";
import { createInitialState, makeHud } from "./core/state";
import { readHighScore, writeHighScore } from "./core/storage";
import type { AugmentId, GameMode, GameState, HudState, Layout } from "./core/types";

const createLayout = (width: number, height: number): Layout => {
	const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
	return {
		width,
		height,
		scale,
		offsetX: (width - WORLD_WIDTH * scale) / 2,
		offsetY: (height - WORLD_HEIGHT * scale) / 2,
	};
};

export const AirRaidGame = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const stateRef = useRef<GameState | null>(null);
	const layoutRef = useRef<Layout>(createLayout(WORLD_WIDTH, WORLD_HEIGHT));
	const animationRef = useRef<number | null>(null);
	const lastFrameRef = useRef<number>(0);
	const hudSignatureRef = useRef("");
	const [hud, setHud] = useState<HudState>(() => makeHud(createInitialState(0)));

	const syncHud = useCallback((state: GameState, force = false) => {
		const nextHud = makeHud(state);
		const signature = [
			nextHud.mode,
			nextHud.score,
			nextHud.highScore,
			nextHud.wave,
			nextHud.lives,
			nextHud.power,
			nextHud.weapon,
			nextHud.augmentCount,
			nextHud.augmentChoices.join(","),
			nextHud.laserFocus,
			Math.round(nextHud.projectileChaos * 10),
			nextHud.meleeUnlocked,
			nextHud.chargeUnlocked,
			Math.round(nextHud.chargeRatio * 20),
		].join(":");
		if (force || signature !== hudSignatureRef.current) {
			hudSignatureRef.current = signature;
			setHud(nextHud);
		}
	}, []);

	const resetGame = useCallback((mode: GameMode = "playing") => {
		const state = createInitialState(Math.max(readHighScore(), stateRef.current?.highScore || 0));
		state.mode = mode;
		stateRef.current = state;
		syncHud(state, true);
	}, [syncHud]);

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

	useEffect(() => {
		resetGame("ready");
	}, [resetGame]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const wrapper = wrapperRef.current;
		if (!canvas || !wrapper) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			const rect = wrapper.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width = Math.max(320, rect.width);
			const height = Math.max(520, rect.height);

			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			layoutRef.current = createLayout(width, height);
		};

		const startFromCanvas = () => {
			const state = stateRef.current;
			if (!state) return;
			if (state.mode === "ready" || state.mode === "gameover") resetGame("playing");
		};

		const handlePointerDown = (event: PointerEvent) => {
			event.preventDefault();
			canvas.setPointerCapture(event.pointerId);
			startFromCanvas();

			const state = stateRef.current;
			if (!state) return;

			const point = getCanvasPoint(event, canvas, layoutRef.current);
			state.pointerActive = true;
			state.player.targetX = point.x;
			state.player.targetY = point.y;
		};

		const handlePointerMove = (event: PointerEvent) => {
			const state = stateRef.current;
			if (!state || !state.pointerActive) return;

			event.preventDefault();
			const point = getCanvasPoint(event, canvas, layoutRef.current);
			state.player.targetX = point.x;
			state.player.targetY = point.y;
		};

		const handlePointerUp = (event: PointerEvent) => {
			const state = stateRef.current;
			if (!state) return;

			if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
			state.pointerActive = false;
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			const state = stateRef.current;
			if (!state) return;

			if (event.code === "Enter" && (state.mode === "ready" || state.mode === "gameover")) {
				event.preventDefault();
				resetGame("playing");
				return;
			}

			if (event.code === "KeyR") {
				event.preventDefault();
				resetGame("playing");
				return;
			}

			if (event.code === "KeyP" || event.code === "Escape") {
				event.preventDefault();
				togglePause();
				return;
			}

			if (event.code === "Space") {
				event.preventDefault();
				if (!event.repeat) {
					beginMeleeCharge(state);
					syncHud(state, true);
				}
				return;
			}

			if (CONTROL_KEYS.has(event.code)) {
				event.preventDefault();
				state.keys.add(event.code);
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.code === "Space") {
				event.preventDefault();
				const state = stateRef.current;
				if (state) {
					releaseMeleeCharge(state);
					syncHud(state, true);
				}
			}
			stateRef.current?.keys.delete(event.code);
		};

		const handleVisibilityChange = () => {
			const state = stateRef.current;
			if (document.hidden && state?.mode === "playing") {
				state.mode = "paused";
				syncHud(state, true);
			}
		};

		const loop = (now: number) => {
			const state = stateRef.current;
			if (state) {
				const dt = Math.min((now - lastFrameRef.current) / 1000 || 0, 0.033);
				lastFrameRef.current = now;

				updateGame(state, dt);
				if (state.mode === "gameover") writeHighScore(state.highScore);

				state.hudTimer -= dt;
				if (state.hudTimer <= 0) {
					syncHud(state);
					state.hudTimer = 0.08;
				}

				const dpr = Math.min(window.devicePixelRatio || 1, 2);
				drawGame(ctx, state, layoutRef.current, dpr);
			}

			animationRef.current = requestAnimationFrame(loop);
		};

		resize();
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(wrapper);
		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("pointercancel", handlePointerUp);
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		lastFrameRef.current = performance.now();
		animationRef.current = requestAnimationFrame(loop);

		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);
			resizeObserver.disconnect();
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerup", handlePointerUp);
			canvas.removeEventListener("pointercancel", handlePointerUp);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [resetGame, syncHud, togglePause]);

	return (
		<main className={styles.page}>
			<AirRaidHud hud={hud} />

			<div ref={wrapperRef} className={styles.stage}>
				<canvas ref={canvasRef} className={styles.canvas} aria-label="Sky 1945 game canvas" />
				<AirRaidOverlay mode={hud.mode} onResume={togglePause} onStart={() => resetGame("playing")} />
				<AirRaidAugmentOverlay choices={hud.augmentChoices} mode={hud.mode} onSelect={selectAugment} />
			</div>

			<AirRaidControls
				chargeRatio={hud.chargeRatio}
				chargeUnlocked={hud.chargeUnlocked}
				meleeUnlocked={hud.meleeUnlocked}
				mode={hud.mode}
				onMeleeDown={handleMeleeDown}
				onMeleeUp={handleMeleeUp}
				onRestart={() => resetGame("playing")}
				onTogglePause={togglePause}
			/>
		</main>
	);
};
