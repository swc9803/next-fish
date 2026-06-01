import { useRef, useEffect, useMemo, RefObject, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Object3D, Mesh, TorusGeometry, MeshBasicMaterial } from "three";

import { useTyping } from "@/hooks/useTyping";
import { ROUTER_LOGOS } from "@/data/fishScene";
import { toVector3Tuple } from "@/utils/tuples";
import { disposeObject3D } from "@/utils/disposeThree";
import { useIsMobile } from "@/hooks/useViewportWidth";

interface LogoProps {
	fishRef: RefObject<Object3D | null>;
	url: string;
	modelPath: string;
	position: [number, number, number];
	isInternal?: boolean;
	showGalleryOverlay?: () => void;
	text?: string;
	hideSpeechBubble?: boolean;
}

const LogoModel = ({ modelPath, position, url, fishRef, isInternal = false, showGalleryOverlay, text, hideSpeechBubble = false }: LogoProps) => {
	const { scene } = useGLTF(modelPath);
	const modelRef = useRef<Object3D>(null);
	const progressCircleRef = useRef<Mesh>(null);
	const backgroundCircleRef = useRef<Mesh>(null);
	const progressRef = useRef(0);
	const triggeredRef = useRef(false);
	const prevArcRef = useRef<number | null>(null);
	const bubbleElemRef = useRef<HTMLDivElement>(null);
	const visibleRef = useRef(false);

	const [visible, setVisible] = useState(false);
	const circleMaterial = useMemo(() => new MeshBasicMaterial({ color: "#000c44" }), []);
	const backgroundMaterial = useMemo(() => new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }), []);

	const DETECT_DISTANCE = 5;
	const isMobile = useIsMobile();
	const bubblePosition: [number, number, number] = isMobile ? [-0.25, -0.5, -2.0] : [-0.25, 0.5, -1.5];

	const typedText = useTyping(text || "", visible, 150);

	useEffect(() => {
		// 진행도 원 초기 세팅
		if (progressCircleRef.current) {
			progressCircleRef.current.material = circleMaterial;
			progressCircleRef.current.rotation.set(Math.PI * -0.5, 0, Math.PI * 0.5);
		}
		// 배경 원 초기 세팅
		if (backgroundCircleRef.current) {
			backgroundCircleRef.current.material = backgroundMaterial;
			backgroundCircleRef.current.geometry = new TorusGeometry(1.125, 0.05, 16, 64, Math.PI * 2);
			backgroundCircleRef.current.rotation.set(Math.PI * -0.5, 0, Math.PI * 0.5);
		}
	}, [circleMaterial, backgroundMaterial]);

	// 특정 모델만 그림자 생성
	useEffect(() => {
		const isCar = modelPath.includes("car");

		scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = isCar;
			}
		});
	}, [scene, modelPath]);

	useFrame((_, delta) => {
		const ring = progressCircleRef.current;
		const model = modelRef.current;
		const fish = fishRef.current;
		if (!model || !fish || !ring) return;

		const dist = model.position.distanceTo(fish.position);
		const isNear = dist < DETECT_DISTANCE;

		if (visibleRef.current !== isNear) {
			visibleRef.current = isNear;
			setVisible(isNear);
		}

		if (bubbleElemRef.current) {
			bubbleElemRef.current.style.display = isNear && !hideSpeechBubble ? "block" : "none";
		}

		let progress = progressRef.current;
		if (isNear) {
			progress = Math.min(1, progress + delta / 4);
			if (progress >= 1 && !triggeredRef.current) {
				triggeredRef.current = true;

				if (isInternal && url === "/gallery") {
					showGalleryOverlay?.();
				} else {
					window.open(url, "_blank");
				}
			}
		} else {
			progress = Math.max(0, progress - delta / 1.5);
			if (progress < 1) triggeredRef.current = false;
		}

		progressRef.current = progress;

		const arc = -progress * Math.PI * 2;
		if (prevArcRef.current === null || Math.abs(arc - prevArcRef.current) > 0.01) {
			if (ring.geometry) ring.geometry.dispose();
			ring.geometry = new TorusGeometry(1.125, 0.05, 16, 64, arc);
			prevArcRef.current = arc;
		}
	});

	// 메모리 해제
	useEffect(() => {
		return () => disposeObject3D(scene);
	}, [scene]);

	return (
		<group ref={modelRef} position={position} scale={3.5}>
			<primitive object={scene} />
			<mesh ref={backgroundCircleRef} position={[0, 0.009, 0]} />
			<mesh ref={progressCircleRef} position={[0, 0.01, 0]} />
			{text && (
				<Html position={bubblePosition} distanceFactor={15} wrapperClass="prevent_click">
					<div className="speech_bubble" ref={bubbleElemRef}>
						{typedText}
					</div>
				</Html>
			)}
		</group>
	);
};

interface MoveRouterProps {
	fishRef: RefObject<Object3D | null>;
	showGalleryOverlay?: () => void;
	hideSpeechBubble?: boolean;
}

export const MoveRouter = ({ fishRef, showGalleryOverlay, hideSpeechBubble }: MoveRouterProps) => {
	return (
		<group>
			{ROUTER_LOGOS.map((logo) => (
				<LogoModel
					key={logo.id}
					url={logo.url}
					modelPath={logo.modelPath}
					position={toVector3Tuple(logo.position)}
					fishRef={fishRef}
					isInternal={"isInternal" in logo ? logo.isInternal : false}
					showGalleryOverlay={showGalleryOverlay}
					hideSpeechBubble={hideSpeechBubble}
				/>
			))}
		</group>
	);
};
