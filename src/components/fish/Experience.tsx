"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Material, Mesh, MeshStandardMaterial, Object3D } from "three";

import { useFishStore } from "@/store/useFishStore";
import { resetGameState } from "@/hooks/resetGameState";

import { GuideShader } from "./GuideShader";
import { FishModel } from "./FishModel";
import { FishConfig } from "./FishConfig";
import { MoveRouter } from "./MoveRouter";
import { Ground } from "./Ground";
import { ClickHandler } from "./ClickHandler";
import { BombZone } from "./BombZone";
import { VideoCaustics } from "./VideoCaustics";
import { BackgroundWithFog } from "./BackgroundWithFog";
import { TalkativeModel } from "./TalkativeModel";

// preload
useTexture.preload([
	"/textures/sand3/aerial_beach_01_diff_1k.jpg",
	"/textures/sand3/aerial_beach_01_nor_gl_1k.jpg",
	"/textures/sand3/aerial_beach_01_rough_1k.jpg",
]);

const GalleryTransitionOverlay = () => {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const raf = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(raf);
	}, []);
	return <div className={`move_gallery_overlay ${visible ? "show" : ""}`} />;
};

const Experience = ({ onReady }: { onReady: () => void }) => {
	const [isShowGuide, setIsShowGuide] = useState(false);
	const [showGuideShader, setShowGuideShader] = useState(false);
	const [showGalleryTransitionOverlay, setShowGalleryTransitionOverlay] = useState(false);

	const [isInBombZone, setIsInBombZone] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [bombActive, setBombActive] = useState(false);
	const [feeds, setFeeds] = useState<{ id: string; position: [number, number, number] }[]>([]);
	const [preventClick, setPreventClick] = useState(false);
	const [deathPosition, setDeathPosition] = useState<[number, number, number] | null>(null);

	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const hitTilesRef = useRef<number[]>([]);
	const blinkTweens = useRef<gsap.core.Tween[]>([]);
	const cellTweens = useRef<{ [index: number]: gsap.core.Tween | undefined }>({});
	const meshRefs = useRef<Mesh[]>([]);

	const router = useRouter();
	const { darkMode, backgroundColor, fogColor, fogDensity } = useFishStore((state) => state);

	const [hasNotified, setHasNotified] = useState(false);
	const [fishLoaded, setFishLoaded] = useState(false);
	const [groundLoaded, setGroundLoaded] = useState(false);

	// 모든 리소스 준비 완료 체크
	useEffect(() => {
		if (fishLoaded && groundLoaded && !hasNotified) {
			setHasNotified(true);
			onReady();
		}
	}, [fishLoaded, groundLoaded, hasNotified]);

	// 가이드 오버레이 보이기 전 딜레이
	useEffect(() => {
		if (!hasNotified) return;

		const delay = setTimeout(() => {
			setShowGuideShader(true);

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsShowGuide(true);
				});
			});
		}, 2000);

		return () => clearTimeout(delay);
	}, [hasNotified]);

	const galleryTransitionOverlayHandler = () => {
		setShowGalleryTransitionOverlay(true);
		setTimeout(() => {
			router.push("/gallery");
		}, 1000);
	};

	// 게임 오버 시 초기화
	const resetGame = useCallback(() => {
		resetGameState(setIsGameOver, setIsInBombZone, setBombActive, setFeeds);
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
			if (mesh) {
				(mesh.material as MeshStandardMaterial).color.set("white");
			}
		});
		hitTilesRef.current = [];
		resetGame();
	};

	const SceneCleanup = () => {
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
	};

	return (
		<>
			<Canvas
				shadows
				camera={{ position: [0, 17, 14], fov: 75 }}
				gl={{
					alpha: true,
					stencil: true,
					depth: true,
					antialias: true,
					preserveDrawingBuffer: true,
					powerPreference: "high-performance",
					failIfMajorPerformanceCaveat: false,
				}}
				onCreated={({ gl }) => {
					gl.getContext().canvas.addEventListener("webglcontextlost", (e) => {
						e.preventDefault();
					});
				}}
			>
				<SceneCleanup />
				<BackgroundWithFog darkMode={darkMode} backgroundColor={backgroundColor} fogColor={fogColor} fogDensity={fogDensity} />
				<ambientLight color={0xffffff} intensity={0.8} />
				<directionalLight
					color={0xf8f8ff}
					intensity={4}
					position={[2, 1, 3]}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-left={-200}
					shadow-camera-right={200}
					shadow-camera-top={200}
					shadow-camera-bottom={-200}
					shadow-camera-near={1}
					shadow-camera-far={500}
				/>
				<VideoCaustics />
				<FishModel
					fishRef={fishRef}
					setIsInBombZone={setIsInBombZone}
					isGameOver={isGameOver}
					deathPosition={deathPosition}
					onLoaded={() => setFishLoaded(true)}
				/>
				<MoveRouter fishRef={fishRef} showGalleryOverlay={galleryTransitionOverlayHandler} />
				<Ground planeRef={planeRef} onLoaded={() => setGroundLoaded(true)} />
				<TalkativeModel
					modelPath="/models/fish_game.glb"
					modelPosition={[10, 0.5, -10]}
					bubblePosition={[10, 1.4, -10]}
					text="게임을 즐길 수 있는 곳 입니다."
					fishRef={fishRef}
					scale={1}
				/>

				<TalkativeModel
					modelPath="/models/fish_logo.glb"
					modelPosition={[-10, 0.5, -10]}
					bubblePosition={[-10, 1.4, -10]}
					text="각 로고에 다가가면 해당하는 사이트가 열립니다."
					fishRef={fishRef}
					scale={1}
				/>

				<BombZone
					fishRef={fishRef}
					setIsGameOver={setIsGameOver}
					setIsInBombZone={setIsInBombZone}
					isInBombZone={isInBombZone}
					bombActive={bombActive}
					isGameOver={isGameOver}
					feeds={feeds}
					setFeeds={setFeeds}
					setBombActive={setBombActive}
					meshRefs={meshRefs}
					hitTilesRef={hitTilesRef}
					blinkTweens={blinkTweens}
					cellTweens={cellTweens}
					setDeathPosition={setDeathPosition}
				/>
				<ClickHandler fishRef={fishRef} planeRef={planeRef} isInBombZone={isInBombZone} isGameOver={isGameOver} />
			</Canvas>

			{/* 갤러리로 이동 오버레이 */}
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
							preserveDrawingBuffer: true,
							powerPreference: "low-power",
							failIfMajorPerformanceCaveat: true,
						}}
						onCreated={({ gl }) => {
							gl.getContext().canvas.addEventListener("webglcontextlost", (e) => {
								e.preventDefault();
							});
						}}
					>
						<GuideShader onFinish={() => setShowGuideShader(false)} />
					</Canvas>
				</div>
			)}

			<FishConfig />

			{/* <div className="hud">
				{countdown !== null && (
					<div className="countdown">
						{countdown}
					</div>
				)}
				{bombActive && <div className="score">SCORE: {score}</div>}
			</div> */}

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
