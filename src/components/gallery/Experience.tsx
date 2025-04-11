"use client";

import { useRef, useEffect, JSX } from "react";
import { CameraControls, Environment, MeshDistortMaterial, MeshReflectorMaterial, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

import { useGallerySlide } from "@/store/useGallerySlide";

export interface slideInfo {
	path: string;
	mainColor: string;
	name: string;
	description: string;
	price: number;
	range: number;
}
export const slideArray: slideInfo[] = [
	{ path: "images/gallery1.png", mainColor: "#ff0000", name: "car name 1", description: "1 빨강", price: 72000, range: 660 },
	{ path: "images/gallery2.png", mainColor: "#ffa500", name: "car name 2", description: "2 주황", price: 29740, range: 576 },
	{ path: "images/gallery3.png", mainColor: "#ffff00", name: "car name 3", description: "3 노랑", price: 150000, range: 800 },
	{ path: "images/gallery4.png", mainColor: "#008000", name: "car name 4", description: "4 초록", price: 95000, range: 500 },
	{ path: "images/gallery5.png", mainColor: "#0000ff", name: "car name 5", description: "5 파랑", price: 120000, range: 700 },
	{ path: "images/gallery6.png", mainColor: "#800080", name: "car name 6", description: "6 보라", price: 20000, range: 400 },
];

slideArray.forEach((slide) => useTexture.preload(slide.path));

const getSlidePosition = (slideIndex: number, radius: number) => {
	const angleInRadians = -(2 * Math.PI * slideIndex) / slideArray.length;
	return {
		x: radius * Math.sin(angleInRadians),
		z: radius * Math.cos(angleInRadians),
		angleInRadians,
	};
};

interface CameraHandlerProps {
	cameraRadius: number;
	totalRadius: number;
}
const CameraHandler = ({ cameraRadius, totalRadius }: CameraHandlerProps): JSX.Element => {
	const cameraControlsRef = useRef<CameraControls>(null);
	const prevFreemodeRef = useRef<boolean>(false);
	const hasInitializedRef = useRef(false);
	const lastSlideIndexRef = useRef<number>(-1);

	const { slide, freemode, focusIndex, setLastFocusTarget, lastFocusTarget, setIsSliding } = useGallerySlide();

	const zoomOutRadius = cameraRadius + 2;

	const getCameraPosition = (targetX: number, targetZ: number, angleInRadians: number, radius: number) => ({
		x: targetX + radius * Math.sin(angleInRadians + Math.PI),
		z: targetZ + radius * Math.cos(angleInRadians + Math.PI),
	});

	const moveToSlide = async (targetIndex: number, isInitial = false) => {
		if (!cameraControlsRef.current || freemode) return;

		setIsSliding(true);

		const { x: targetX, z: targetZ, angleInRadians: targetAngle } = getSlidePosition(targetIndex, totalRadius);
		const closeCameraPos = getCameraPosition(targetX, targetZ, targetAngle, cameraRadius);
		const farCameraPos = getCameraPosition(targetX, targetZ, targetAngle, zoomOutRadius);

		setLastFocusTarget({ x: targetX, z: targetZ });

		if (isInitial) {
			cameraControlsRef.current.setLookAt(closeCameraPos.x, 0, closeCameraPos.z, targetX, 0, targetZ, false);
			requestAnimationFrame(() => {
				cameraControlsRef.current?.setLookAt(closeCameraPos.x, 0, closeCameraPos.z, targetX, 0, targetZ, true);
				setIsSliding(false);
			});
			return;
		}

		const { x: lastTargetX, z: lastTargetZ, angleInRadians: lastAngle } = getSlidePosition(lastSlideIndexRef.current, totalRadius);
		const lastFarCameraPos = getCameraPosition(lastTargetX, lastTargetZ, lastAngle, zoomOutRadius);

		// 줌 아웃
		await cameraControlsRef.current.setLookAt(lastFarCameraPos.x, 0, lastFarCameraPos.z, lastTargetX, 0, lastTargetZ, true);
		// 회전
		await cameraControlsRef.current.setLookAt(farCameraPos.x, 0, farCameraPos.z, targetX, 0, targetZ, true);
		// 줌 인
		await cameraControlsRef.current.setLookAt(closeCameraPos.x, 0, closeCameraPos.z, targetX, 0, targetZ, true);
		setIsSliding(false);
	};

	// 초기 로드 시
	useEffect(() => {
		if (!hasInitializedRef.current && !freemode && focusIndex === null) {
			if (slide === 0) {
				moveToSlide(slide, true);
			}
			lastSlideIndexRef.current = slide;
			hasInitializedRef.current = true;
		}
	}, [freemode, focusIndex]);

	// 슬라이드 모드에서 이동
	useEffect(() => {
		if (!freemode && lastSlideIndexRef.current !== slide) {
			moveToSlide(slide);
			lastSlideIndexRef.current = slide;
		}
	}, [slide, freemode]);

	// 자유모드에서 슬라이드 클릭 시 이동
	useEffect(() => {
		if (!freemode || focusIndex === null || !cameraControlsRef.current) return;

		const { x: focusX, z: focusZ, angleInRadians: focusAngle } = getSlidePosition(focusIndex, totalRadius);
		const focusCameraPos = getCameraPosition(focusX, focusZ, focusAngle, cameraRadius);

		setLastFocusTarget({ x: focusX, z: focusZ });
		cameraControlsRef.current.setLookAt(focusCameraPos.x, 0, focusCameraPos.z, focusX, 0, focusZ, true);

		if (slide === focusIndex) {
			lastSlideIndexRef.current = slide;
		}
	}, [freemode, focusIndex, slide]);

	// 자유모드 변경 시 줌아웃
	useEffect(() => {
		const prevWasFreemode = prevFreemodeRef.current;
		const currentIsFreemode = freemode;
		prevFreemodeRef.current = freemode;

		const enteredFreemodeNow = !prevWasFreemode && currentIsFreemode;
		const needZoomOutToOverview = enteredFreemodeNow || (freemode && focusIndex === null);

		if (needZoomOutToOverview && cameraControlsRef.current) {
			const { x: focusX, z: focusZ } = lastFocusTarget ?? { x: 0, z: 0 };
			const angle = Math.atan2(focusX, focusZ);
			const distance = cameraRadius * 2.5;
			const camX = focusX + distance * Math.sin(angle + Math.PI);
			const camZ = focusZ + distance * Math.cos(angle + Math.PI);

			cameraControlsRef.current.setLookAt(camX, 0, camZ, 0, 0, 0, true);
		}
		if (!freemode && focusIndex !== null) {
			lastSlideIndexRef.current = focusIndex;
		}
	}, [freemode, focusIndex, cameraRadius, lastFocusTarget]);

	const isInteractive = freemode && focusIndex === null;

	return (
		<CameraControls
			ref={cameraControlsRef}
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
	const aspectRatio = size.width / size.height;
	const fieldOfView = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const cameraRadius = viewport.height / (2 * Math.tan(fieldOfView / 2));
	const slideSpacing = viewport.width * 2.8;
	const totalRadius = (slideSpacing * slideArray.length) / (2 * Math.PI);

	const textures = useTexture(slideArray.map((m) => m.path));
	const { freemode, setFocusIndex, setSlide } = useGallerySlide();

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset="city" />
			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />

			{slideArray.map((slide, index) => {
				const { x: slideX, z: slideZ, angleInRadians: slideAngle } = getSlidePosition(index, totalRadius);
				const slideRotationY = slideAngle + Math.PI;

				return (
					<group
						key={index}
						position={[slideX, 0, slideZ]}
						rotation={[0, slideRotationY, 0]}
						onClick={() => {
							if (freemode) {
								setFocusIndex(index);
								setSlide(index);
							}
						}}
					>
						{/* 슬라이드 장식 */}
						<mesh position-y={3}>
							<boxGeometry />
							<MeshDistortMaterial color={slide.mainColor} speed={3} />
						</mesh>

						{/* 슬라이드 이미지 + 테두리 */}
						<group>
							{/* 바깥쪽 테두리 */}
							<mesh position={[0, 0, -0.03]}>
								<planeGeometry args={[viewport.height * aspectRatio + 0.25, viewport.height + 0.2]} />
								<meshBasicMaterial color="#111111" toneMapped={false} />
							</mesh>

							{/* 안쪽 테두리 */}
							<mesh position={[0, 0, -0.02]}>
								<planeGeometry args={[viewport.height * aspectRatio + 0.075, viewport.height + 0.075]} />
								<meshBasicMaterial color="#ffffff" toneMapped={false} />
							</mesh>

							{/* 이미지 */}
							<mesh position={[0, 0, -0.01]}>
								<planeGeometry args={[viewport.height * aspectRatio, viewport.height]} />
								<meshBasicMaterial map={textures[index]} toneMapped={false} />
							</mesh>
						</group>
					</group>
				);
			})}

			{/* 바닥 */}
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
					color="#111111"
					metalness={0.5}
				/>
			</mesh>

			{/* 배경 */}
			<color attach="background" args={["#222222"]} />
			{/* <fog attach="fog" args={["#191920", 0, 50]} /> */}
		</>
	);
};
