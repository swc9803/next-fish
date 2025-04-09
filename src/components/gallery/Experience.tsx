"use client";

import { useRef, useEffect, JSX } from "react";
import { CameraControls, Environment, MeshDistortMaterial, MeshReflectorMaterial, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

import { useGallerySlide } from "@/store/useGallerySlide";

export interface ModelInfo {
	path: string;
	mainColor: string;
	name: string;
	description: string;
	price: number;
	range: number;
}
export const modelArray: ModelInfo[] = [
	{ path: "images/gallery1.png", mainColor: "#ff0000", name: "car name 1", description: "1 빨강", price: 72000, range: 660 },
	{ path: "images/gallery2.png", mainColor: "#ffa500", name: "car name 2", description: "2 주황", price: 29740, range: 576 },
	{ path: "images/gallery3.png", mainColor: "#ffff00", name: "car name 3", description: "3 노랑", price: 150000, range: 800 },
	{ path: "images/gallery4.png", mainColor: "#008000", name: "car name 4", description: "4 초록", price: 95000, range: 500 },
	{ path: "images/gallery5.png", mainColor: "#0000ff", name: "car name 5", description: "5 파랑", price: 120000, range: 700 },
	{ path: "images/gallery6.png", mainColor: "#800080", name: "car name 6", description: "6 보라", price: 20000, range: 400 },
];
modelArray.forEach((model) => {
	useTexture.preload(model.path);
});

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
}

const CameraHandler = ({ cameraRadius, totalRadius }: CameraHandlerProps): JSX.Element => {
	const cameraControls = useRef<CameraControls>(null);
	const slide = useGallerySlide((state) => state.slide);
	const lastSlide = useRef<number>(-1);
	const hasInitialized = useRef(false);
	const zoomOutRadius = cameraRadius + 2;
	const freemode = useGallerySlide((state) => state.freemode);
	const focusIndex = useGallerySlide((state) => state.focusIndex);
	const setFocusIndex = useGallerySlide((state) => state.setFocusIndex);

	useEffect(() => {
		console.log("🔍 [CameraHandler] freemode:", freemode);
		console.log("🔍 [CameraHandler] focusIndex:", focusIndex);
	}, [freemode, focusIndex]);
	useEffect(() => {
		if (cameraControls.current) {
			console.log("🎮 [CameraControls] 실제 상태 확인", {
				left: cameraControls.current.mouseButtons.left,
				touch: cameraControls.current.touches.one,
			});
		}
	}, [freemode, focusIndex]);

	useEffect(() => {
		if (freemode && focusIndex !== null && cameraControls.current) {
			console.log("🎯 [CameraHandler] focusIndex 줌인 시작");

			const { x: targetX, z: targetZ, angle } = getPosition(focusIndex, totalRadius);
			const close = getCameraPosition(targetX, targetZ, angle, cameraRadius);
			cameraControls.current.setLookAt(close.x, 0, close.z, targetX, 0, targetZ, true);
		}
	}, [focusIndex, freemode]);

	const getPosition = (index: number, radius: number) => {
		const angle = -(2 * Math.PI * index) / modelArray.length;
		const x = radius * Math.sin(angle);
		const z = radius * Math.cos(angle);
		return { x, z, angle };
	};

	const getCameraPosition = (targetX: number, targetZ: number, angle: number, radius: number) => ({
		x: targetX + radius * Math.sin(angle + Math.PI),
		z: targetZ + radius * Math.cos(angle + Math.PI),
	});

	const animateStep = (from: { x: number; z: number }, to: { x: number; z: number }, lookAt: { x: number; z: number }, wait = 0) =>
		cameraControls.current!.setLookAt(from.x, 0, from.z, lookAt.x, 0, lookAt.z, true).then(() => new Promise((res) => setTimeout(res, wait)));

	const moveToSlide = async (index: number, isInitial = false) => {
		if (!cameraControls.current || freemode) return;

		const { x: targetX, z: targetZ, angle } = getPosition(index, totalRadius);
		const close = getCameraPosition(targetX, targetZ, angle, cameraRadius);
		const far = getCameraPosition(targetX, targetZ, angle, zoomOutRadius);

		if (isInitial) {
			cameraControls.current.setLookAt(close.x, 0, close.z, targetX, 0, targetZ, false);
			requestAnimationFrame(() => {
				cameraControls.current?.setLookAt(close.x, 0, close.z, targetX, 0, targetZ, true);
			});
		} else {
			const { x: lastTargetX, z: lastTargetZ, angle: lastAngle } = getPosition(lastSlide.current, totalRadius);
			const lastFar = getCameraPosition(lastTargetX, lastTargetZ, lastAngle, zoomOutRadius);

			// 줌 아웃
			await animateStep(lastFar, lastFar, { x: lastTargetX, z: lastTargetZ }, 200);
			// 회전
			await animateStep(far, far, { x: targetX, z: targetZ }, 200);
			// 줌 인
			await animateStep(close, close, { x: targetX, z: targetZ });
		}
	};

	useEffect(() => {
		if (!hasInitialized.current && !freemode) {
			hasInitialized.current = true;
			moveToSlide(slide, true);
			lastSlide.current = slide;
		}
	}, [freemode]);

	useEffect(() => {
		if (lastSlide.current !== slide && !freemode) {
			moveToSlide(slide);
			lastSlide.current = slide;
		}
	}, [slide, freemode]);

	useEffect(() => {
		if (freemode && focusIndex === null && cameraControls.current) {
			console.log("📦 [CameraHandler] 자유모드 복귀 → 줌아웃");
			cameraControls.current.setLookAt(0, 0, cameraRadius * 2.5, 0, 0, 0, true);
		}
	}, [freemode, focusIndex]);
	console.log("📦 [CameraHandler] 자유모드 복귀 → 줌아웃", {
		freemode,
		focusIndex,
	});

	const isInteractive = freemode && focusIndex === null;
	console.log("🔧 mouseButtons:", {
		left: isInteractive ? 1 : 0,
	});

	return (
		<CameraControls
			ref={cameraControls}
			touches={{
				one: isInteractive ? 1 : 0,
				two: 0,
				three: 0,
			}}
			mouseButtons={{
				left: isInteractive ? 1 : 0,
				middle: 0,
				right: 0,
				wheel: 0,
			}}
			minPolarAngle={Math.PI / 2}
			maxPolarAngle={Math.PI / 2}
			minAzimuthAngle={-Infinity}
			maxAzimuthAngle={Infinity}
		/>
	);
};

export const Experience = (): JSX.Element => {
	const { viewport, camera, size } = useThree();
	const aspect = size.width / size.height;
	const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;

	const cameraRadius = viewport.height / (2 * Math.tan(fov / 2));
	const slideDistance = viewport.width * 2.8;
	const totalRadius = (slideDistance * modelArray.length) / (2 * Math.PI);
	const width = viewport.height * aspect;
	const height = viewport.height;
	const texturePaths = modelArray.map((model) => model.path);
	const textures = useTexture(texturePaths);

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset="city" />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />

			{modelArray.map((model, index) => {
				const angle = -(2 * Math.PI * index) / modelArray.length;
				const x = totalRadius * Math.sin(angle);
				const z = totalRadius * Math.cos(angle);
				const rotationY = angle + Math.PI;

				const freemode = useGallerySlide((state) => state.freemode);
				const setFocusIndex = useGallerySlide((state) => state.setFocusIndex);

				return (
					<group
						key={index}
						position={[x, 0, z]}
						rotation={[0, rotationY, 0]}
						onClick={() => {
							if (freemode) {
								setFocusIndex(index);
							}
						}}
					>
						<mesh position-y={3}>
							<boxGeometry />
							<MeshDistortMaterial color={model.mainColor} speed={3} />
						</mesh>

						<mesh position={[0, 0, 0]}>
							<planeGeometry args={[width, height]} />
							<meshBasicMaterial map={textures[index]} toneMapped={false} />
						</mesh>
					</group>
				);
			})}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
				<planeGeometry args={[50, 50]} />
				<MeshReflectorMaterial
					blur={[300, 100]}
					resolution={2048}
					mixBlur={1}
					mixStrength={80}
					roughness={1}
					depthScale={1.2}
					minDepthThreshold={0.4}
					maxDepthThreshold={1.4}
					color="#050505"
					metalness={0.5}
				/>
			</mesh>
		</>
	);
};
