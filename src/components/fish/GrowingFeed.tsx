import { RefObject, useCallback, useEffect, useRef, useState, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Object3D } from "three";
import { useFishStore } from "@/store/useFishStore";

const MAX_SCALE = 1;
const INCREASE_FEED_SPEED = 0.005;
const DECREASE_FEED_SPEED = 0.05;

interface GrowingFeedProps {
	position: [number, number, number];
	fishRef: RefObject<Object3D>;
	isGameOver: boolean;
	active: boolean;
	onCollected: () => void;
	onExpire: () => void;
}

export const GrowingFeed = memo(({ position, fishRef, isGameOver, active, onCollected, onExpire }: GrowingFeedProps) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(0.1);
	const [isVisible, setIsVisible] = useState(false);
	const expirationTimer = useRef<NodeJS.Timeout | null>(null);
	const shrinking = useRef(false);
	const fishScale = useFishStore((s) => s.fishScale);

	useEffect(() => {
		if (!active) return;
		setIsVisible(true);
		scaleRef.current = 0.1;
		shrinking.current = false;
		if (meshRef.current) meshRef.current.scale.setScalar(scaleRef.current);
	}, [active, position]);

	const startShrinking = useCallback(() => {
		if (!meshRef.current || isGameOver || !isVisible) return;
		shrinking.current = true;
		const shrinkInterval = setInterval(() => {
			if (!meshRef.current || !isVisible || !shrinking.current) {
				clearInterval(shrinkInterval);
				return;
			}
			if (!Number.isFinite(scaleRef.current) || scaleRef.current <= 0.01) {
				clearInterval(shrinkInterval);
				onExpire();
				setIsVisible(false);
				scaleRef.current = 0;
			} else {
				scaleRef.current = Math.max(0, scaleRef.current - DECREASE_FEED_SPEED);
				meshRef.current.scale.setScalar(scaleRef.current);
			}
		}, 1000 / 60);
	}, [isGameOver, isVisible, onExpire]);

	useFrame(() => {
		if (isGameOver || !meshRef.current || !fishRef.current || !isVisible) return;

		if (scaleRef.current < MAX_SCALE && !shrinking.current) {
			scaleRef.current += INCREASE_FEED_SPEED;
			meshRef.current.scale.setScalar(scaleRef.current);
			if (scaleRef.current >= MAX_SCALE) {
				expirationTimer.current = setTimeout(() => startShrinking(), 2000);
			}
		}

		const feedPos = meshRef.current.position;
		const fishPos = fishRef.current.position;
		const dist = feedPos.distanceTo(fishPos);
		if (dist < fishScale * 1.5 && isVisible) {
			setIsVisible(false);
			scaleRef.current = 0;
			if (expirationTimer.current) clearTimeout(expirationTimer.current);
			onCollected();
		}
	});

	useEffect(() => {
		if (meshRef.current) {
			meshRef.current.position.set(...position);
		}
	}, [position]);

	return (
		<mesh ref={meshRef} visible={isVisible}>
			<sphereGeometry args={[0.5, 16, 16]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
});
