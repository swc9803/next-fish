"use client";

import { useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Object3D, Mesh, TorusGeometry, MeshBasicMaterial } from "three";

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
		modelPath: "/models/fishing_rod.glb",
		position: [20, 0.5, 10],
		isInternal: true,
	},
];

interface LogoProps {
	url: string;
	modelPath: string;
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
	isInternal?: boolean;
}

const LogoModel = ({ modelPath, position, url, fishRef, isInternal = false }: LogoProps) => {
	const { scene } = useGLTF(modelPath);
	const modelRef = useRef<Object3D>(null);
	const progressCircleRef = useRef<Mesh>(null);
	const progressRef = useRef(0);
	const triggeredRef = useRef(false);
	const prevArcRef = useRef<number | null>(null);
	const circleMaterial = useMemo(() => new MeshBasicMaterial({ color: "white" }), []);
	const router = useRouter();

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
		let progress = progressRef.current;

		if (dist < DETECT_DISTANCE) {
			progress = Math.min(1, progress + delta / 4);
			if (progress >= 1 && !triggeredRef.current) {
				triggeredRef.current = true;

				if (isInternal) {
					router.push(url);
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

	return (
		<group ref={modelRef} position={position} scale={3.5}>
			<primitive object={scene} />
			<mesh ref={progressCircleRef} position={[0, 0.01, 0]} />
		</group>
	);
};

interface MoveRouterProps {
	fishRef: React.RefObject<Object3D>;
}

export const MoveRouter = ({ fishRef }: MoveRouterProps) => {
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
				/>
			))}
		</group>
	);
};

logoData.forEach((logo) => useGLTF.preload(logo.modelPath));
