"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Object3D, Mesh, TorusGeometry, MeshBasicMaterial } from "three";
import { useTyping } from "@/hooks/useTyping";

const logoData = [
	{
		id: "github",
		url: "https://github.com/swc9803",
		modelPath: "/models/github.glb",
		position: [-10, 0.5, 25],
	},
	{
		id: "codepen",
		url: "https://codepen.io/swc9803/pens/public",
		modelPath: "/models/codepen.glb",
		position: [0, 0.5, 25],
	},
	{
		id: "email",
		url: "mailto:swc9803@gmail.com",
		modelPath: "/models/email.glb",
		position: [10, 0.5, 25],
	},
	{
		id: "gallery",
		url: "/gallery",
		modelPath: "/models/fishing.glb",
		position: [20, 0.5, 10],
		isInternal: true,
		text: "갤러리로 이동",
	},
];

interface LogoProps {
	url: string;
	modelPath: string;
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
	isInternal?: boolean;
	showGalleryOverlay?: () => void;
	text?: string;
}

const LogoModel = ({ modelPath, position, url, fishRef, isInternal = false, showGalleryOverlay, text }: LogoProps) => {
	const { scene } = useGLTF(modelPath);
	const modelRef = useRef<Object3D>(null);
	const progressCircleRef = useRef<Mesh>(null);
	const progressRef = useRef(0);
	const triggeredRef = useRef(false);
	const prevArcRef = useRef<number | null>(null);
	const [isNear, setIsNear] = useState(false);

	const isFishingRod = modelPath.includes("fishing_rod");
	const typedText = useTyping(text || "", isNear, isFishingRod ? 100 : 50);
	const circleMaterial = useMemo(() => new MeshBasicMaterial({ color: "white" }), []);

	const DETECT_DISTANCE = 5;

	useEffect(() => {
		if (progressCircleRef.current) {
			progressCircleRef.current.material = circleMaterial;
			progressCircleRef.current.rotation.set(Math.PI * -0.5, 0, Math.PI * 0.5);
		}
	}, [circleMaterial]);

	useFrame((_, delta) => {
		const ring = progressCircleRef.current;
		const model = modelRef.current;
		const fish = fishRef.current;
		if (!model || !fish || !ring) return;

		const dist = model.position.distanceTo(fish.position);
		setIsNear(dist < DETECT_DISTANCE);

		let progress = progressRef.current;

		if (dist < DETECT_DISTANCE) {
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

	const rotation = isFishingRod ? ([0, Math.PI / 2, 0] as const) : undefined;

	return (
		<group ref={modelRef} position={position} scale={3.5} rotation={rotation}>
			<primitive object={scene} />
			<mesh ref={progressCircleRef} position={[0, 0.01, 0]} />
			{text && isNear && (
				<Html position={[0, 1.4, 0]} distanceFactor={15} wrapperClass="prevent_click">
					<div className={`speech_bubble ${isFishingRod ? "rod" : ""}`}>{typedText}</div>
				</Html>
			)}
		</group>
	);
};

interface MoveRouterProps {
	fishRef: React.RefObject<Object3D>;
	showGalleryOverlay?: () => void;
}

export const MoveRouter = ({ fishRef, showGalleryOverlay }: MoveRouterProps) => {
	return (
		<group>
			{logoData.map((logo) => (
				<LogoModel
					key={logo.id}
					url={logo.url}
					modelPath={logo.modelPath}
					position={logo.position as [number, number, number]}
					fishRef={fishRef}
					isInternal={logo.isInternal}
					showGalleryOverlay={showGalleryOverlay}
					text={logo.text}
				/>
			))}
		</group>
	);
};

logoData.forEach((logo) => useGLTF.preload(logo.modelPath));
