import { type Dispatch, type RefObject, type SetStateAction, useEffect, useRef } from "react";

import { CONTROL_KEYS, TOUCH_DRAG_OFFSET } from "../core/constants";
import { beginMeleeCharge, releaseMeleeCharge, updateGame } from "../core/engine";
import { getCanvasPoint } from "../core/input";
import { createLayout } from "../core/layout";
import { drawGame } from "../core/renderer";
import { grantCoins, writeHighScore } from "../core/storage";
import type { GameMode, GameState, Layout, MetaProgress } from "../core/types";

type UseAirRaidCanvasOptions = {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	wrapperRef: RefObject<HTMLDivElement | null>;
	stateRef: RefObject<GameState | null>;
	layoutRef: RefObject<Layout>;
	metaProgressRef: RefObject<MetaProgress>;
	resetGame: (mode?: GameMode) => void;
	setMetaProgress: Dispatch<SetStateAction<MetaProgress>>;
	syncHud: (state: GameState, force?: boolean) => void;
	togglePause: () => void;
};

export const useAirRaidCanvas = ({
	canvasRef,
	wrapperRef,
	stateRef,
	layoutRef,
	metaProgressRef,
	resetGame,
	setMetaProgress,
	syncHud,
	togglePause,
}: UseAirRaidCanvasOptions) => {
	const animationRef = useRef<number | null>(null);
	const lastFrameRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		const wrapper = wrapperRef.current;
		if (!canvas || !wrapper) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			const rect = wrapper.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width = Math.max(1, rect.width);
			const height = Math.max(1, rect.height);

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
			state.player.targetY = point.y - (event.pointerType === "touch" ? TOUCH_DRAG_OFFSET : 0);
		};

		const handlePointerMove = (event: PointerEvent) => {
			const state = stateRef.current;
			if (!state || !state.pointerActive) return;

			event.preventDefault();
			const point = getCanvasPoint(event, canvas, layoutRef.current);
			state.player.targetX = point.x;
			state.player.targetY = point.y - (event.pointerType === "touch" ? TOUCH_DRAG_OFFSET : 0);
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
				if (state.mode === "gameover") {
					writeHighScore(state.highScore);
					if (!state.coinRewardClaimed) {
						state.coinRewardClaimed = true;
						const nextProgress = grantCoins(state.earnedCoins);
						metaProgressRef.current = nextProgress;
						setMetaProgress(nextProgress);
						syncHud(state, true);
					}
				}

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
	}, [canvasRef, layoutRef, metaProgressRef, resetGame, setMetaProgress, stateRef, syncHud, togglePause, wrapperRef]);
};
