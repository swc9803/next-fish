"use client";

// library
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, Object3D, WebGLRenderTarget } from "three";

// store
import { useFishStore } from "@/store/useFishStore";

// components
import { FishModel } from "./FishModel";
import { FishConfig } from "./FishConfig";
import { Ground } from "./Ground";
import { ClickHandler } from "./ClickHandler";
import { BombZone, resetGameState } from "./BombZone";
import { VideoCaustics } from "./VideoCaustics";
import { BackgroundWithFog } from "./BackgroundWithFog";
import { ShaderTransition } from "./ShaderTransition";

const Experience = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [loadingComplete, setLoadingComplete] = useState(false);
	const [showShader, setShowShader] = useState(true);
	const [isInBombZone, setIsInBombZone] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [bombActive, setBombActive] = useState(false);
	const [feeds, setFeeds] = useState<{ id: string; position: [number, number, number] }[]>([]);

	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const hitTilesRef = useRef<number[]>([]);
	const blinkTweens = useRef<gsap.core.Tween[]>([]);
	const cellTweens = useRef<{ [index: number]: gsap.core.Tween | undefined }>({});
	const meshRefs = useRef<Mesh[]>([]);

	const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 512), []);
	const { score, setScore, darkMode, backgroundColor, fogColor, fogDensity } = useFishStore((state) => state);

	// shader transition 시작 타이밍 조정
	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsLoading(false);
			setLoadingComplete(true);
		}, 1500);
		return () => clearTimeout(timeout);
	}, []);

	useEffect(() => {
		if (loadingComplete) renderTarget.dispose();
	}, [loadingComplete, renderTarget]);

	// 게임 오버 시 초기화
	const resetGame = useCallback(() => {
		resetGameState(fishRef, setIsGameOver, setIsInBombZone, setBombActive, setScore, setCountdown, setFeeds);
	}, [setScore]);

	const handleReset = () => {
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

	return (
		<>
			<Canvas shadows camera={{ position: [0, 17, 14], fov: 75 }}>
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
						<FishModel fishRef={fishRef} setIsInBombZone={setIsInBombZone} setCountdown={setCountdown} />
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
						/>
						<ClickHandler fishRef={fishRef} planeRef={planeRef} isInBombZone={isInBombZone} isGameOver={isGameOver} />
					</>
				)}
			</Canvas>

			{showShader && (
				<div className="shader_container">
					<Canvas orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
						<ShaderTransition renderTarget={renderTarget} loadingComplete={loadingComplete} onFinish={() => setShowShader(false)} />
					</Canvas>
				</div>
			)}

			<FishConfig />

			<div className="hud">
				{countdown !== null && <div className="countdown">폭탄 시작까지: {countdown}</div>}
				{bombActive && <div className="score">점수: {score}</div>}
			</div>

			{isGameOver && (
				<div onClick={handleReset} className="gameover_overlay">
					<h1>YOU&apos;RE COOKED</h1>
					<p>화면을 클릭해 다시 시작하세요</p>
				</div>
			)}
		</>
	);
};

export default Experience;
