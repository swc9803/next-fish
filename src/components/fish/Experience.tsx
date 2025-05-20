"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { Material, Mesh, MeshStandardMaterial, Object3D, WebGLRenderTarget } from "three";

import { useFishStore } from "@/store/useFishStore";
import { resetGameState } from "@/hooks/resetGameState";

import { LoadingShader } from "./LoadingShader";
import { GuideShader } from "./GuideShader";
import { FishModel } from "./FishModel";
import { FishConfig } from "./FishConfig";
import { MoveRouter } from "./MoveRouter";
import { Ground } from "./Ground";
import { ClickHandler } from "./ClickHandler";
import { BombZone } from "./BombZone";
import { VideoCaustics } from "./VideoCaustics";
import { BackgroundWithFog } from "./BackgroundWithFog";

// preload
useGLTF.preload("/models/fish.glb");
useTexture.preload([
	"/textures/sand3/aerial_beach_01_diff_1k.jpg",
	"/textures/sand3/aerial_beach_01_nor_gl_1k.jpg",
	"/textures/sand3/aerial_beach_01_rough_1k.jpg",
]);

const GalleryTransitionOverlay = () => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const raf = requestAnimationFrame(() => {
			setVisible(true);
		});
		return () => cancelAnimationFrame(raf);
	}, []);

	return <div className={`move_gallery_overlay ${visible ? "show" : ""}`} />;
};

const Experience = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [loadingComplete, setLoadingComplete] = useState(false);
	const [showLoadingShader, setShowLoadingShader] = useState(true);
	const [showGuideShader, setShowGuideShader] = useState(false);
	const [isShowGuide, setIsShowGuide] = useState(false);
	const [showGalleryTransitionOverlay, setShowGalleryTransitionOverlay] = useState(false);
	const router = useRouter();

	const [isInBombZone, setIsInBombZone] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
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

	const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 512), []);
	const { score, setScore, darkMode, backgroundColor, fogColor, fogDensity } = useFishStore((state) => state);

	// loading shader 시작 타이밍 조정
	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsLoading(false);
			setLoadingComplete(true);
		}, 1500);
		return () => clearTimeout(timeout);
	}, []);

	// guide shader 시작 타이밍 조정
	useEffect(() => {
		if (loadingComplete) {
			const showDelay = setTimeout(() => {
				setShowGuideShader(true);
				requestAnimationFrame(() => setIsShowGuide(true));
			}, 1000);
			return () => clearTimeout(showDelay);
		}
	}, [loadingComplete]);

	const galleryTransitionOverlayHandler = () => {
		setShowGalleryTransitionOverlay(true);
		setTimeout(() => {
			router.push("/gallery");
		}, 1000);
	};

	// 게임 오버 시 초기화
	const resetGame = useCallback(() => {
		resetGameState(setIsGameOver, setIsInBombZone, setBombActive, setScore, setCountdown, setFeeds);
	}, [setScore]);

	useEffect(() => {
		if (isGameOver) {
			setPreventClick(false);
			const timeout = setTimeout(() => {
				setPreventClick(true);
			}, 1200);
			return () => clearTimeout(timeout);
		}
	}, [isGameOver]);

	const handleReset = () => {
		if (!preventClick) return;

		blinkTweens.current.forEach((t) => t.kill());
		blinkTweens.current = [];

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
					preserveDrawingBuffer: true,
					powerPreference: "high-performance",
					antialias: true,
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

				{!isLoading && (
					<>
						<FishModel
							fishRef={fishRef}
							setIsInBombZone={setIsInBombZone}
							setCountdown={setCountdown}
							isGameOver={isGameOver}
							deathPosition={deathPosition}
						/>
						<MoveRouter fishRef={fishRef} showGalleryOverlay={galleryTransitionOverlayHandler} />
						<Ground planeRef={planeRef} />
						<BombZone
							fishRef={fishRef}
							setIsGameOver={setIsGameOver}
							setIsInBombZone={setIsInBombZone}
							isInBombZone={isInBombZone}
							bombActive={bombActive}
							isGameOver={isGameOver}
							feeds={feeds}
							setFeeds={setFeeds}
							countdown={countdown}
							setCountdown={setCountdown}
							setBombActive={setBombActive}
							meshRefs={meshRefs}
							hitTilesRef={hitTilesRef}
							blinkTweens={blinkTweens}
							cellTweens={cellTweens}
							setDeathPosition={setDeathPosition}
						/>
						<ClickHandler fishRef={fishRef} planeRef={planeRef} isInBombZone={isInBombZone} isGameOver={isGameOver} />
					</>
				)}
			</Canvas>

			{/* 갤러리로 이동 오버레이 */}
			{showGalleryTransitionOverlay && <GalleryTransitionOverlay />}

			{/* 로딩 */}
			{showLoadingShader && (
				<div className="shader_container">
					<Canvas orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
						<LoadingShader renderTarget={renderTarget} loadingComplete={loadingComplete} onFinish={() => setShowLoadingShader(false)} />
					</Canvas>
				</div>
			)}

			{/* 가이드 */}
			{showGuideShader && (
				<div className={`guide_container ${isShowGuide ? "show" : ""}`}>
					<Canvas orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
						<GuideShader onFinish={() => setShowGuideShader(false)} />
					</Canvas>
				</div>
			)}

			<FishConfig />

			<div className="hud">
				{countdown !== null && (
					<div key={countdown} className="countdown">
						{countdown}
					</div>
				)}
				{bombActive && <div className="score">SCORE: {score}</div>}
			</div>

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
