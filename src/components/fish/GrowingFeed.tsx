import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Object3D } from "three";

const MAX_SCALE = 1;
const MIN_SCALE = 0;
const INCREASE_FEED_SPEED = 0.005;
const DECREASE_FEED_SPEED = 0.05;

interface GrowingFeedProps {
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
	isGameOver: boolean;
	onCollected: () => void;
	onExpire: () => void;
}

export const GrowingFeed = ({ position, fishRef, isGameOver, onCollected, onExpire }: GrowingFeedProps) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(0.1);
	const [isVisible, setIsVisible] = useState(true);

	const decreaseFeed = useCallback(() => {
		if (!meshRef.current || isGameOver || !isVisible) return;
		const shrinkInterval = setInterval(() => {
			if (!meshRef.current || !isVisible) {
				clearInterval(shrinkInterval);
				return;
			}
			if (scaleRef.current <= MIN_SCALE) {
				clearInterval(shrinkInterval);
				setIsVisible(false);
				onExpire();
			} else {
				scaleRef.current = Math.max(MIN_SCALE, scaleRef.current - DECREASE_FEED_SPEED);
				meshRef.current.scale.setScalar(scaleRef.current);
			}
		}, 1000 / 60);
	}, [isGameOver, isVisible, onExpire]);

	useEffect(() => {
		if (scaleRef.current >= MAX_SCALE) {
			setTimeout(decreaseFeed, 500);
		}
	}, [decreaseFeed]);

	useFrame(() => {
		if (isGameOver || !meshRef.current || !fishRef.current || !isVisible) return;

		if (scaleRef.current < MAX_SCALE) {
			scaleRef.current += INCREASE_FEED_SPEED;
			meshRef.current.scale.setScalar(scaleRef.current);
		}

		const feedPos = meshRef.current.position;
		const fishPos = fishRef.current.position;
		const dist = feedPos.distanceTo(fishPos);
		if (dist < 1.5 && isVisible) {
			setIsVisible(false);
			onCollected();
		}
	});

	useEffect(() => {
		if (meshRef.current) {
			meshRef.current.position.set(...position);
		}
	}, [position]);

	if (!isVisible) return null;

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[0.5, 16, 16]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};
