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

modelArray.forEach((model) => useTexture.preload(model.path));

const getPosition = (index: number, radius: number) => {
	const angle = -(2 * Math.PI * index) / modelArray.length;
	return {
		x: radius * Math.sin(angle),
		z: radius * Math.cos(angle),
		angle,
	};
};

const getCameraPosition = (x: number, z: number, angle: number, radius: number) => ({
	x: x + radius * Math.sin(angle + Math.PI),
	z: z + radius * Math.cos(angle + Math.PI),
});

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
}
const CameraHandler = ({ cameraRadius, totalRadius }: CameraHandlerProps): JSX.Element => {
	const cameraControls = useRef<CameraControls>(null);

	const { slide, freemode, focusIndex, setLastFocusTarget, lastFocusTarget, setIsSliding } = useGallerySlide();

	const lastSlide = useRef<number>(-1);
	const hasInitialized = useRef(false);
	const zoomOutRadius = cameraRadius + 2;

	const moveToSlide = async (index: number, isInitial = false) => {
		if (!cameraControls.current || freemode) return;

		setIsSliding(true);
		const { x, z, angle } = getPosition(index, totalRadius);
		const close = getCameraPosition(x, z, angle, cameraRadius);
		const far = getCameraPosition(x, z, angle, zoomOutRadius);

		if (isInitial) {
			cameraControls.current.setLookAt(close.x, 0, close.z, x, 0, z, false);
			requestAnimationFrame(() => {
				cameraControls.current?.setLookAt(close.x, 0, close.z, x, 0, z, true);
				setIsSliding(false);
			});
			return;
		}

		const { x: lx, z: lz, angle: la } = getPosition(lastSlide.current, totalRadius);
		const lastFar = getCameraPosition(lx, lz, la, zoomOutRadius);

		// 줌 아웃
		await cameraControls.current.setLookAt(lastFar.x, 0, lastFar.z, lx, 0, lz, true);
		// 회전
		await cameraControls.current.setLookAt(far.x, 0, far.z, x, 0, z, true);
		// 줌 인
		await cameraControls.current.setLookAt(close.x, 0, close.z, x, 0, z, true);
		setIsSliding(false);
	};

	useEffect(() => {
		if (!hasInitialized.current && !freemode) {
			hasInitialized.current = true;
			moveToSlide(slide, true);
			lastSlide.current = slide;
		}
	}, [freemode]);

	useEffect(() => {
		if (!freemode && lastSlide.current !== slide) {
			moveToSlide(slide);
			lastSlide.current = slide;
		}
	}, [slide, freemode]);

	useEffect(() => {
		if (freemode && focusIndex !== null && cameraControls.current) {
			const { x, z, angle } = getPosition(focusIndex, totalRadius);
			const close = getCameraPosition(x, z, angle, cameraRadius);
			setLastFocusTarget({ x, z });
			cameraControls.current.setLookAt(close.x, 0, close.z, x, 0, z, true);
		}
	}, [freemode, focusIndex]);

	useEffect(() => {
		if (freemode && focusIndex === null && cameraControls.current && lastFocusTarget) {
			const { x, z } = lastFocusTarget;
			const angle = Math.atan2(x, z);
			const dist = cameraRadius * 2.5;
			const camX = x + dist * Math.sin(angle + Math.PI);
			const camZ = z + dist * Math.cos(angle + Math.PI);
			cameraControls.current.setLookAt(camX, 0, camZ, 0, 0, 0, true);
		}
	}, [freemode, focusIndex, cameraRadius, lastFocusTarget]);

	const isInteractive = freemode && focusIndex === null;

	return (
		<CameraControls
			ref={cameraControls}
			mouseButtons={{
				left: isInteractive ? 1 : 0, // 1 = rotate
				middle: 0,
				right: 0,
				wheel: 0,
			}}
			touches={{
				one: isInteractive ? 32 : 0, // 32 = touch rotate
				two: 0,
				three: 0,
			}}
			minPolarAngle={Math.PI / 2}
			maxPolarAngle={Math.PI / 2}
			azimuthRotateSpeed={-0.5}
			polarRotateSpeed={-0.5}
			draggingSmoothTime={0.25}
			dollySpeed={0.3}
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

	const textures = useTexture(modelArray.map((m) => m.path));
	const { freemode, setFocusIndex } = useGallerySlide();

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset="city" />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />

			{modelArray.map((model, index) => {
				const { x, z, angle } = getPosition(index, totalRadius);
				const rotationY = angle + Math.PI;

				return (
					<group key={index} position={[x, 0, z]} rotation={[0, rotationY, 0]} onClick={() => freemode && setFocusIndex(index)}>
						<mesh position-y={3}>
							<boxGeometry />
							<MeshDistortMaterial color={model.mainColor} speed={3} />
						</mesh>
						<mesh>
							<planeGeometry args={[viewport.height * aspect, viewport.height]} />
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
