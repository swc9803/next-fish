import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Mesh, Object3D } from "three";

interface GrowingFeedProps {
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
	onCollected: () => void;
}

export const GrowingFeed = ({ position, fishRef, onCollected }: GrowingFeedProps) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(0.5);
	const maxScale = 1.5;
	const speed = 0.005;

	useFrame(() => {
		if (!meshRef.current || !fishRef.current) return;

		// 크기 증가
		if (scaleRef.current < maxScale) {
			scaleRef.current += speed;
			meshRef.current.scale.setScalar(scaleRef.current);
		}

		// 충돌 감지
		const feedPos = meshRef.current.position;
		const fishPos = fishRef.current.position;
		const dist = feedPos.distanceTo(fishPos);

		if (dist < 1.5) {
			onCollected();
		}
	});

	useEffect(() => {
		if (meshRef.current) {
			meshRef.current.position.set(...position);
		}
	}, [position]);

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[0.5, 16, 16]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};
