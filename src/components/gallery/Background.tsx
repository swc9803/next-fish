import { useMemo, useRef } from "react";
import { Group, Mesh } from "three";
import { useFrame } from "@react-three/fiber";

const randomPosition = (radius: number): [number, number, number] => {
	const angle = Math.random() * 2 * Math.PI;
	const distance = radius * (1.5 + Math.random() * 1.5);
	const height = (Math.random() - 0.5) * 16;
	return [Math.cos(angle) * distance, height, Math.sin(angle) * distance];
};

const Geometry = ({ type }: { type: number }) => {
	switch (type) {
		case 0:
			return <sphereGeometry args={[1, 32, 32]} />;
		case 1:
			return <boxGeometry args={[1, 1, 1]} />;
		case 2:
			return <torusGeometry args={[0.6, 0.2, 16, 100]} />;
		case 3:
			return <coneGeometry args={[0.7, 1.5, 32]} />;
		case 4:
			return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
		case 5:
			return <icosahedronGeometry args={[1, 0]} />;
		default:
			return null;
	}
};

interface FloatingObjectData {
	position: [number, number, number];
	scale: number;
	type: number;
	offset: number;
	floatRange: number;
	floatSpeed: number;
	rotation: [number, number, number];
}

export const Background = () => {
	const groupRef = useRef<Group>(null);

	const floatingObjects = useMemo<FloatingObjectData[]>(
		() =>
			Array.from({ length: 50 }, () => ({
				position: randomPosition(20),
				scale: 0.4 + Math.random() * 1.2,
				type: Math.floor(Math.random() * 6),
				offset: Math.random() * 100,
				floatRange: 0.1 + Math.random() * 0.3,
				floatSpeed: 0.2 + Math.random() * 0.3,
				rotation: [Math.random(), Math.random(), Math.random()],
			})),
		[]
	);

	useFrame(({ clock }) => {
		const t = clock.getElapsedTime();
		if (!groupRef.current) return;

		groupRef.current.rotation.y = t * 0.01;

		groupRef.current.children.forEach((child, i) => {
			const data = floatingObjects[i];
			if (!(child instanceof Mesh) || !data) return;

			const { position, floatRange, floatSpeed, offset } = data;
			child.position.y = position[1] + Math.sin(t * floatSpeed + offset) * floatRange;
		});
	});

	return (
		<>
			<color attach="background" args={["#b0ddff"]} />
			<ambientLight intensity={1.5} color="#ffffff" />
			<group ref={groupRef}>
				{floatingObjects.map(({ position, scale, type, rotation }, i) => (
					<mesh key={i} position={position} scale={scale} rotation={rotation}>
						<Geometry type={type} />
						<meshStandardMaterial color="#6699cc" transparent opacity={0.25} roughness={0.6} metalness={0.3} />
					</mesh>
				))}
			</group>
		</>
	);
};
