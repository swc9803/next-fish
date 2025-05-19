import { useRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Object3D, Mesh, TorusGeometry, MeshBasicMaterial } from "three";

const logoData = [
	{
		id: "github",
		url: "https://github.com/swc9803",
		modelPath: "/models/github.glb",
		position: [-10, 0.5, 20],
	},
	{
		id: "codepen",
		url: "https://codepen.io/swc9803/pens/public",
		modelPath: "/models/codepen.glb",
		position: [0, 0.5, 20],
	},
	{
		id: "email",
		url: "mailto:swc9803@gmail.com",
		modelPath: "/models/email.glb",
		position: [10, 0.5, 20],
	},
];

interface LogoProps {
	url: string;
	modelPath: string;
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
}

const LogoModel = ({ modelPath, position, url, fishRef }: LogoProps) => {
	const { scene } = useGLTF(modelPath);
	const ref = useRef<Object3D>(null);
	const ringRef = useRef<Mesh>(null);
	const progressRef = useRef(0);
	const triggeredRef = useRef(false);
	const prevArcRef = useRef<number | null>(null);
	const ringMaterial = useMemo(() => new MeshBasicMaterial({ color: "white" }), []);

	const MAX_DISTANCE = 5;

	useEffect(() => {
		if (ringRef.current) {
			ringRef.current.material = ringMaterial;
			ringRef.current.rotation.set(Math.PI * -0.5, 0, Math.PI * 0.5);
		}
	}, [ringMaterial]);

	useFrame((_, delta) => {
		const ring = ringRef.current;
		const self = ref.current;
		const fish = fishRef.current;

		if (!self || !fish || !ring) return;

		const dist = self.position.distanceTo(fish.position);
		let progress = progressRef.current;

		if (dist < MAX_DISTANCE) {
			progress = Math.min(1, progress + delta / 4);
			if (progress >= 1 && !triggeredRef.current) {
				triggeredRef.current = true;
				window.open(url, "_blank");
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
		<group ref={ref} position={position} scale={3.5}>
			<primitive object={scene} />
			<mesh ref={ringRef} position={[0, 0.01, 0]} />
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
				<LogoModel key={logo.id} url={logo.url} modelPath={logo.modelPath} position={logo.position as [number, number, number]} fishRef={fishRef} />
			))}
		</group>
	);
};

logoData.forEach((logo) => useGLTF.preload(logo.modelPath));
