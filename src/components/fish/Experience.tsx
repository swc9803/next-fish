import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, Object3D, PCFShadowMap } from "three";
import gsap from "gsap";

import { resetGameState } from "@/hooks/resetGameState";
import { DECORATION_MODELS, TALKATIVE_MODELS, createDecorationLoadedFlags } from "@/data/fishScene";
import { SceneCleanup } from "@/components/three/SceneCleanup";
import { toVector3Tuple } from "@/utils/tuples";

import { FishModel } from "./FishModel";
import { FishColorPicker } from "./FishColorPicker";
import { MoveRouter } from "./MoveRouter";
import { Ground } from "./Ground";
import { ClickHandler } from "./ClickHandler";
import { BombZone } from "./BombZone";
import { VideoCaustics } from "./VideoCaustics";
import { OceanBackground } from "./OceanBackground";
import { TalkativeModel } from "./TalkativeModel";
import { DecorationModel } from "./DecorationModel";
import { GalleryTransitionOverlay } from "./GalleryTransitionOverlay";
import { GameStatusOverlay } from "./GameStatusOverlay";
import { GuideOverlay } from "./GuideOverlay";
import { GameOverOverlay } from "./GameOverOverlay";

export const Experience = ({ onReady, startAnimation }: { onReady: () => void; startAnimation: boolean }) => {
	const [fishLoaded, setFishLoaded] = useState(false);
	const [groundLoaded, setGroundLoaded] = useState(false);
	const [videoLoaded, setVideoLoaded] = useState(false);
	const handleVideoLoaded = useCallback(() => {
		setVideoLoaded(true);
	}, []);

	const [loadedFlags, setLoadedFlags] = useState(createDecorationLoadedFlags);
	const loadedCallbacks = useMemo(() => {
		const result: Partial<Record<keyof typeof loadedFlags, () => void>> = {};
		for (const item of DECORATION_MODELS) {
			result[item.key] = () => {
				setLoadedFlags((prev) => ({ ...prev, [item.key]: true }));
			};
		}
		return result;
	}, []);

	const allDecorationsLoaded = useMemo(() => Object.values(loadedFlags).every(Boolean), [loadedFlags]);

	const [hasNotified, setHasNotified] = useState(false);

	const [isShowGuide, setIsShowGuide] = useState(false);
	const [showGuideShader, setShowGuideShader] = useState(false);
	const [showGalleryTransitionOverlay, setShowGalleryTransitionOverlay] = useState(false);
	const [isMovingToGallery, setIsNavigatingToGallery] = useState(false);

	const countdownRef = useRef<HTMLParagraphElement | null>(null);
	const [isInBombZone, setIsInBombZone] = useState(false);
	const [score, setScore] = useState(0);
	const [isCleared, setIsCleared] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [isGameOver, setIsGameOver] = useState(false);
	const [bombActive, setBombActive] = useState(false);
	const [feed, setFeed] = useState<{ position: [number, number, number]; active: boolean }>({ position: [0, 1, 0], active: false });
	const [preventClick, setPreventClick] = useState(false);
	const [deathPosition, setDeathPosition] = useState<[number, number, number] | null>(null);
	const bombZoneResetRef = useRef<() => void>(() => {});
	const [showClearText, setShowClearText] = useState(false);

	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const hitTilesRef = useRef<number[]>([]);
	const blinkTweens = useRef<gsap.core.Tween[]>([]);
	const cellTweens = useRef<{ [index: number]: gsap.core.Tween | undefined }>({});
	const meshRefs = useRef<Mesh[]>([]);
	const readyFrameRef = useRef<number | null>(null);
	const hasStartedReadyNotificationRef = useRef(false);
	const guideFrameRef = useRef<number | null>(null);
	const galleryNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const router = useRouter();

	// 로딩 대기
	useEffect(() => {
		if (!fishLoaded || !groundLoaded || !videoLoaded || !allDecorationsLoaded || hasStartedReadyNotificationRef.current) return;

		hasStartedReadyNotificationRef.current = true;
		let frame = 0;
		const wait = () => {
			frame++;
			if (frame >= 2) {
				readyFrameRef.current = null;
				setHasNotified(true);
				onReady();
				return;
			}
			readyFrameRef.current = requestAnimationFrame(wait);
		};
		readyFrameRef.current = requestAnimationFrame(wait);

		return () => {
			if (readyFrameRef.current !== null) cancelAnimationFrame(readyFrameRef.current);
		};
	}, [fishLoaded, groundLoaded, videoLoaded, allDecorationsLoaded, onReady]);

	useEffect(() => {
		if (!hasNotified) return;

		const timeout = setTimeout(() => {
			setShowGuideShader(true);

			guideFrameRef.current = requestAnimationFrame(() => {
				guideFrameRef.current = requestAnimationFrame(() => {
					setIsShowGuide(true);
				});
			});
		}, 2000);

		return () => {
			clearTimeout(timeout);
			if (guideFrameRef.current !== null) cancelAnimationFrame(guideFrameRef.current);
		};
	}, [hasNotified]);

	const galleryTransitionOverlayHandler = useCallback(() => {
		setIsNavigatingToGallery(true);
		setShowGalleryTransitionOverlay(true);
		if (galleryNavTimeoutRef.current) clearTimeout(galleryNavTimeoutRef.current);
		galleryNavTimeoutRef.current = setTimeout(() => router.push("/gallery"), 800);
	}, [router]);

	useEffect(() => {
		return () => {
			if (galleryNavTimeoutRef.current) clearTimeout(galleryNavTimeoutRef.current);
		};
	}, []);

	useEffect(() => {
		if (isInBombZone && countdown === null && !bombActive && !isCleared) {
			setCountdown(3);
		}
	}, [isInBombZone, countdown, bombActive, isCleared]);

	useEffect(() => {
		if (countdown === null) return;

		if (countdown === 0) {
			const startTimeout = setTimeout(() => {
				setBombActive(true);
				setCountdown(null);
			}, 700);
			return () => clearTimeout(startTimeout);
		}

		const timeout = setTimeout(() => setCountdown((prev) => (prev ?? 1) - 1), 1000);
		return () => clearTimeout(timeout);
	}, [countdown]);

	useEffect(() => {
		if (countdown !== null) {
			const el = countdownRef.current;
			if (!el) return;

			gsap.to(el, {
				scale: 1,
				opacity: 1,
				duration: 0.6,
				ease: "back.out(4)",
			});
		}
	}, [countdown]);

	const incrementScore = () => {
		setScore((prev) => {
			const next = Math.min(prev + 1, 1000);
			if (next === 1000 && !isCleared) {
				setIsCleared(true);
				setBombActive(false);
				setIsInBombZone(false);
				setFeed({ position: [0, 1, 0], active: false });
			}

			return next;
		});
	};

	// 게임 오버 시 초기화
	const resetGame = useCallback(() => {
		resetGameState(setIsGameOver, setIsInBombZone, setBombActive, () => {});
		setFeed({ position: [0, 1, 0], active: false });

		bombZoneResetRef.current?.();

		blinkTweens.current.forEach((t) => t.kill());
		blinkTweens.current = [];

		hitTilesRef.current.forEach((index) => {
			const mesh = meshRefs.current[index];
			if (mesh) {
				(mesh.material as MeshStandardMaterial).color.set("white");
			}
		});
		hitTilesRef.current = [];
	}, []);

	useEffect(() => {
		if (isGameOver) {
			setPreventClick(false);
			const timeout = setTimeout(() => setPreventClick(true), 1200);
			return () => clearTimeout(timeout);
		}
	}, [isGameOver]);

	const handleReset = () => {
		if (!preventClick) return;

		blinkTweens.current.forEach((t) => t.kill());
		hitTilesRef.current.forEach((index) => {
			const mesh = meshRefs.current[index];
			if (mesh) (mesh.material as MeshStandardMaterial).color.set("white");
		});
		hitTilesRef.current = [];

		setScore(0);
		setFeed({ position: [0, 1, 0], active: false });
		setIsCleared(false);
		setCountdown(null);
		setBombActive(false);
		setIsInBombZone(false);

		resetGame();
	};

	useEffect(() => {
		if (isCleared) {
			setShowClearText(true);
			const timer = setTimeout(() => setShowClearText(false), 2000);
			setIsInBombZone(false);
			setBombActive(false);

			return () => clearTimeout(timer);
		}
	}, [isCleared]);

	useEffect(() => {
		if (showClearText && countdownRef.current) {
			gsap.fromTo(countdownRef.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(4)" });
		}
	}, [showClearText]);

	return (
		<>
			<Canvas
				shadows={{ type: PCFShadowMap }}
				camera={{ position: [0, 17, 14], fov: 75 }}
				gl={{
					alpha: false,
					stencil: false,
					depth: true,
					antialias: true,
					preserveDrawingBuffer: false,
					powerPreference: "high-performance",
					failIfMajorPerformanceCaveat: false,
				}}
				onCreated={({ gl }) => {
					gl.getContext().canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
				}}
			>
				<SceneCleanup />
				<OceanBackground />
				<ambientLight color={0xffffff} intensity={1.2} />
				<directionalLight
					color={0xf8f8ff}
					intensity={2}
					position={[-70, 70, 50]}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-left={-200}
					shadow-camera-right={200}
					shadow-camera-top={150}
					shadow-camera-bottom={-100}
					shadow-camera-near={10}
					shadow-camera-far={200}
				/>

				<VideoCaustics onLoaded={handleVideoLoaded} />

				<FishModel
					fishRef={fishRef}
					setIsInBombZone={setIsInBombZone}
					setBombActive={setBombActive}
					isGameOver={isGameOver}
					deathPosition={deathPosition}
					onLoaded={() => setFishLoaded(true)}
					startAnimation={startAnimation}
					isCleared={isCleared}
				/>
				<MoveRouter fishRef={fishRef} showGalleryOverlay={galleryTransitionOverlayHandler} hideSpeechBubble={isMovingToGallery} />
				<Ground planeRef={planeRef} onLoaded={() => setGroundLoaded(true)} />

				{TALKATIVE_MODELS.map((item) => (
					<TalkativeModel
						key={item.modelPath}
						modelPath={item.modelPath}
						modelPosition={toVector3Tuple(item.modelPosition)}
						bubblePosition={toVector3Tuple(item.bubblePosition)}
						text={item.text}
						fishRef={fishRef}
						scale={1}
						speed={70}
					/>
				))}

				{DECORATION_MODELS.map((item) => (
					<DecorationModel
						key={item.key}
						modelKey={item.key}
						modelPath={item.path}
						position={toVector3Tuple(item.position)}
						rotation={"rotation" in item ? toVector3Tuple(item.rotation) : undefined}
						scale={item.scale ?? 1}
						onLoaded={loadedCallbacks[item.key] ?? (() => {})}
					/>
				))}

				<BombZone
					fishRef={fishRef}
					setIsGameOver={setIsGameOver}
					setIsInBombZone={setIsInBombZone}
					isInBombZone={isInBombZone}
					bombActive={bombActive}
					isGameOver={isGameOver}
					feed={feed}
					setFeed={setFeed}
					setBombActive={setBombActive}
					meshRefs={meshRefs}
					hitTilesRef={hitTilesRef}
					blinkTweens={blinkTweens}
					cellTweens={cellTweens}
					score={score}
					incrementScore={incrementScore}
					setDeathPosition={setDeathPosition}
					onResetRef={bombZoneResetRef}
				/>

				<ClickHandler fishRef={fishRef} planeRef={planeRef} isInBombZone={isInBombZone} isGameOver={isGameOver} />
			</Canvas>
			<GameStatusOverlay
				countdown={countdown}
				countdownRef={countdownRef}
				isGameOver={isGameOver}
				isInBombZone={isInBombZone}
				score={score}
				showClearText={showClearText}
			/>

			{showGalleryTransitionOverlay && <GalleryTransitionOverlay />}

			{showGuideShader && <GuideOverlay isVisible={isShowGuide} onFinish={() => setShowGuideShader(false)} />}

			<FishColorPicker />

			{isGameOver && <GameOverOverlay canRestart={preventClick} onReset={handleReset} />}
		</>
	);
};

export default Experience;
