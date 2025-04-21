"use client";

// library
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Mesh, Object3D, WebGLRenderTarget } from "three";

// store
import { useFishStore } from "@/store/useFishStore";

// components
import { FishModel } from "./FishModel";
import { FishConfig } from "./FishConfig";
import { Ground } from "./Ground";
import { ClickHandler } from "./ClickHandler";
import { BombZone } from "./BombZone";
import { GrowingSphere } from "./GrowingSphere";
import { VideoCaustics } from "./VideoCaustics";
import { BackgroundTransition } from "./BackgroundTransition";
import { ShaderTransition } from "./ShaderTransition";

type BonusSphere = {
	id: string;
	position: [number, number, number];
};

const Experience = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [loadingComplete, setLoadingComplete] = useState(false);
	const [showShader, setShowShader] = useState(true);

	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const darkMode = useFishStore((state) => state.darkMode);

	const [isInBombZone, setIsInBombZone] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [bombActive, setBombActive] = useState(false);
	const [score, setScore] = useState(0);
	const [bonusSpheres, setBonusSpheres] = useState<BonusSphere[]>([]);

	const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 512), []);

	// shader transition 시작 타이밍 조정
	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsLoading(false);
			setLoadingComplete(true);
		}, 1500);
		return () => clearTimeout(timeout);
	}, []);

	useEffect(() => {
		if (loadingComplete) {
			renderTarget.dispose();
		}
	}, [loadingComplete]);

	// 먹이 생성
	useEffect(() => {
		const interval = setInterval(() => {
			const cellSize = 6;
			const gridHalf = 3;
			const x = (Math.floor(Math.random() * (gridHalf * 2 + 1)) - gridHalf) * cellSize - 50;
			const z = (Math.floor(Math.random() * (gridHalf * 2 + 1)) - gridHalf) * cellSize;
			const newSphere: BonusSphere = {
				id: crypto.randomUUID(),
				position: [x, 1, z],
			};

			setBonusSpheres((prev) => (prev.length === 0 ? [newSphere] : prev));
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	// 폭탄 카운트다운
	useEffect(() => {
		let isCancelled = false;

		const countdownAsync = async () => {
			let current = countdown;
			while (current && current > 0 && !isCancelled) {
				await new Promise((res) => setTimeout(res, 1000));
				current--;
				setCountdown(current);
			}

			if (!isCancelled) {
				setCountdown(null);
				setBombActive(true);
			}
		};

		if (countdown !== null) countdownAsync();

		return () => {
			isCancelled = true;
		};
	}, [countdown]);

	// 게임 오버 시 초기화
	const resetGame = useCallback(() => {
		if (fishRef.current) {
			fishRef.current.position.set(0, 1, 0);
		}
		setIsGameOver(false);
		setIsInBombZone(false);
		setBombActive(false);
		setScore(0);
		setCountdown(null);
	}, []);

	return (
		<>
			<Canvas shadows camera={{ position: [0, 17, 14], fov: 75 }}>
				<BackgroundTransition darkMode={darkMode} />

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
							setScore={setScore}
						/>
						{bonusSpheres.map(({ id, position }) => (
							<GrowingSphere
								key={id}
								position={position}
								fishRef={fishRef}
								onCollected={() => setBonusSpheres((prev) => prev.filter((sphere) => sphere.id !== id))}
							/>
						))}
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
				{bombActive && <div className="score">피한 폭탄 수: {score}</div>}
			</div>

			{isGameOver && (
				<div onClick={resetGame} className="gameover_overlay">
					<h1>YOU'RE COOKED</h1>
					<p>화면을 클릭해 다시 시작하세요</p>
				</div>
			)}
		</>
	);
};

export default Experience;
