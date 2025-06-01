import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { Material, Mesh, MeshStandardMaterial, Object3D } from "three";
import gsap from "gsap";

import { resetGameState } from "@/hooks/resetGameState";

import { GuideShader } from "./GuideShader";
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

const GalleryTransitionOverlay = () => {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const raf = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(raf);
	}, []);
	return <div className={`move_gallery_overlay ${visible ? "show" : ""}`} />;
};

function SceneCleanup() {
	const { scene } = useThree();
	useEffect(() => {
		return () => {
			scene.traverse((child: Object3D) => {
				if ((child as Mesh).isMesh) {
					const mesh = child as Mesh;
					mesh.geometry?.dispose();
					if (Array.isArray(mesh.material)) {
						mesh.material.forEach((m: Material) => m.dispose());
					} else {
						(mesh.material as Material)?.dispose();
					}
				}
			});
		};
	}, [scene]);
	return null;
}

export const Experience = ({ onReady, startAnimation }: { onReady: () => void; startAnimation: boolean }) => {
	const [fishLoaded, setFishLoaded] = useState(false);
	const [groundLoaded, setGroundLoaded] = useState(false);
	const [videoLoaded, setVideoLoaded] = useState(false);
	const handleVideoLoaded = useCallback(() => {
		setVideoLoaded(true);
	}, []);

	type DecorationType = {
		key: keyof typeof loadedFlags;
		path: string;
		scale?: number;
		position: [number, number, number];
		rotation?: [number, number, number];
	};

	const decorationArray: DecorationType[] = useMemo(
		() => [
			{ key: "shell2", path: "/models/decoration/shell2.glb", scale: 2, position: [10, 0, 12], rotation: [0, 0, Math.PI / 2] },
			{ key: "seaweed1", path: "/models/decoration/seaweed1.glb", scale: 2.5, position: [35, 0.5, 27] },
			{ key: "seaweed2", path: "/models/decoration/seaweed2.glb", scale: 0.3, position: [-42, 0.5, 30] },
			{ key: "coral1", path: "/models/decoration/coral1.glb", scale: 0.5, position: [10, 0.5, 30] },
			{ key: "coral2", path: "/models/decoration/coral2.glb", scale: 4, position: [37, 0.5, -16] },
			{ key: "seastar", path: "/models/decoration/seastar.glb", scale: 3, position: [20, 0.5, -17] },
			{ key: "seaspike", path: "/models/decoration/seaspike.glb", scale: 0.6, position: [-25, 0.5, -20], rotation: [0, Math.PI / 4, 0] },
			{ key: "sushi", path: "/models/decoration/sushi.glb", scale: 4, position: [-135, 0.5, -20], rotation: [0, Math.PI / 1.5, 0] },
			{ key: "crab", path: "/models/decoration/crab.glb", scale: 7, position: [-15, 0.5, -12], rotation: [0, Math.PI / 8, 0] },
		],
		[]
	);

	const [loadedFlags, setLoadedFlags] = useState(() => ({
		shell2: false,
		seaweed1: false,
		seaweed2: false,
		coral1: false,
		coral2: false,
		seastar: false,
		seaspike: false,
		sushi: false,
		crab: false,
	}));
	const setLoaded = useCallback((key: keyof typeof loadedFlags) => () => setLoadedFlags((prev) => ({ ...prev, [key]: true })), []);

	const allDecorationsLoaded = useMemo(() => Object.values(loadedFlags).every(Boolean), [loadedFlags]);

	const [hasNotified, setHasNotified] = useState(false);

	const [isShowGuide, setIsShowGuide] = useState(false);
	const [showGuideShader, setShowGuideShader] = useState(false);
	const [showGalleryTransitionOverlay, setShowGalleryTransitionOverlay] = useState(false);
	const [isMovingToGallery, setIsNavigatingToGallery] = useState(false);

	const countdownRef = useRef<HTMLDivElement | null>(null);
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

	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const hitTilesRef = useRef<number[]>([]);
	const blinkTweens = useRef<gsap.core.Tween[]>([]);
	const cellTweens = useRef<{ [index: number]: gsap.core.Tween | undefined }>({});
	const meshRefs = useRef<Mesh[]>([]);

	const router = useRouter();

	// 로딩 대기
	useEffect(() => {
		if (fishLoaded && groundLoaded && videoLoaded && allDecorationsLoaded && !hasNotified) {
			setHasNotified(true);

			let frame = 0;
			const wait = () => {
				frame++;
				if (frame >= 2) {
					onReady();
				} else {
					requestAnimationFrame(wait);
				}
			};
			requestAnimationFrame(wait);
		}
	}, [fishLoaded, groundLoaded, videoLoaded, allDecorationsLoaded, hasNotified]);

	useEffect(() => {
		if (!hasNotified) return;

		const timeout = setTimeout(() => {
			setShowGuideShader(true);

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsShowGuide(true);
				});
			});
		}, 2000);

		return () => clearTimeout(timeout);
	}, [hasNotified]);

	const galleryTransitionOverlayHandler = useCallback(() => {
		setIsNavigatingToGallery(true);
		setShowGalleryTransitionOverlay(true);
		setTimeout(() => router.push("/gallery"), 800);
	}, [router]);

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
				setTimeout(() => setIsCleared(false), 2000);
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

	return (
		<>
			<Canvas
				shadows
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
				/>
				<MoveRouter fishRef={fishRef} showGalleryOverlay={galleryTransitionOverlayHandler} hideSpeechBubble={isMovingToGallery} />
				<Ground planeRef={planeRef} onLoaded={() => setGroundLoaded(true)} />

				<TalkativeModel
					modelPath="/models/fish_logo.glb"
					modelPosition={[-40, 0.5, -10]}
					bubblePosition={[-41, 1, -15]}
					text="왼쪽 지형은 여러 게임들을 즐길 수 있는 곳 입니다."
					fishRef={fishRef}
					scale={1}
					speed={70}
				/>
				<TalkativeModel
					modelPath="/models/fish_car.glb"
					modelPosition={[35, 0.5, 0]}
					bubblePosition={[36, 1, -5]}
					text="오른쪽으로 이동하시면 프로젝트들을 보실 수 있습니다."
					fishRef={fishRef}
					scale={1}
					speed={70}
				/>
				<TalkativeModel
					modelPath="/models/fish_game.glb"
					modelPosition={[-18, 0.5, 16]}
					bubblePosition={[-19, 1, 11]}
					text="각 로고에 다가가면 각 사이트가 열립니다."
					fishRef={fishRef}
					scale={1}
					speed={70}
				/>
				<TalkativeModel
					modelPath="/models/update.glb"
					modelPosition={[-125, 0.5, 10]}
					bubblePosition={[-126, 1, 5]}
					text="곧 게임이 추가될 예정입니다!"
					fishRef={fishRef}
					scale={1}
					speed={70}
				/>

				{decorationArray.map((item) => (
					<DecorationModel
						key={item.key}
						modelPath={item.path}
						position={item.position}
						rotation={item.rotation}
						scale={item.scale ?? 1}
						onLoaded={setLoaded(item.key)}
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

			{(countdown !== null || countdown === 0 || isCleared || isInBombZone || isGameOver) && (
				<div className="game_overlay">
					{(countdown !== null || isCleared) && (
						<div key={countdown === 0 ? "start" : isCleared ? "clear" : countdown} ref={countdownRef} className="countdown">
							{isCleared ? "CLEAR!" : countdown === 0 ? "START!" : countdown}
						</div>
					)}
					{(isInBombZone || isGameOver) && <div className="score">Score: {score}</div>}
				</div>
			)}

			{showGalleryTransitionOverlay && <GalleryTransitionOverlay />}

			{showGuideShader && (
				<div className={`guide_overlay ${isShowGuide ? "show" : ""}`}>
					<Canvas
						orthographic
						camera={{ zoom: 1, position: [0, 0, 100] }}
						gl={{
							alpha: true,
							depth: false,
							stencil: false,
							antialias: false,
							preserveDrawingBuffer: false,
							powerPreference: "low-power",
							failIfMajorPerformanceCaveat: false,
						}}
						onCreated={({ gl }) => {
							gl.getContext().canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
						}}
					>
						<GuideShader onFinish={() => setShowGuideShader(false)} />
					</Canvas>
				</div>
			)}

			<FishColorPicker />

			{isGameOver && (
				<div onClick={handleReset} className="gameover_overlay">
					<h1>YOU&apos;RE COOKED</h1>
					<p className={preventClick ? "show" : ""}>Click the screen to restart</p>
				</div>
			)}
		</>
	);
};

export default Experience;
