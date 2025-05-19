import { useRef, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Object3D, Mesh, TorusGeometry, MeshBasicMaterial } from "three";

const logoData: {
	id: string;
	url: string;
	modelPath: string;
	position: [number, number, number];
}[] = [
	{
		id: "github",
		url: "https://github.com/swc9803",
		modelPath: "/models/github.glb",
		position: [-7, 0.5, 20],
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
		position: [7, 0.5, 20],
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
	const [triggered, setTriggered] = useState(false);
	const progressRef = useRef(0);
	const maxDistance = 10;

	useEffect(() => {
		if (ringRef.current) {
			ringRef.current.material = new MeshBasicMaterial({ color: "white", transparent: false });
			ringRef.current.rotation.x = Math.PI * -0.5;
			ringRef.current.rotation.z = Math.PI * 0.5;
		}
	}, []);

	useFrame((_, delta) => {
		if (!ref.current || !fishRef.current || !ringRef.current) return;
		const dist = ref.current.position.distanceTo(fishRef.current.position);
		let progress = progressRef.current;

		if (dist < maxDistance) {
			progress = Math.min(1, progress + delta / 4);
			if (progress >= 1 && !triggered) {
				setTriggered(true);
				window.open(url, "_blank");
			}
		} else {
			progress = Math.max(0, progress - delta / 1.5);
			if (progress < 1) setTriggered(false);
		}

		progressRef.current = progress;

		const arc = -progress * Math.PI * 2;
		const newGeometry = new TorusGeometry(1.125, 0.05, 4, 64, arc);
		const ring = ringRef.current;
		if (ring.geometry) ring.geometry.dispose();
		ring.geometry = newGeometry;
	});

	const ring = useMemo(() => {
		const geometry = new TorusGeometry(1.125, 0.05, 4, 64, 0);
		const material = new MeshBasicMaterial({ color: "white" });
		const mesh = <mesh ref={ringRef} geometry={geometry} material={material} position={[0, 0.01, 0]} />;
		return mesh;
	}, []);

	return (
		<group ref={ref} position={position} scale={3.5}>
			<primitive object={scene} />
			{ring}
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
				<LogoModel key={logo.id} {...logo} fishRef={fishRef} />
			))}
		</group>
	);
};

logoData.forEach((logo) => useGLTF.preload(logo.modelPath));
