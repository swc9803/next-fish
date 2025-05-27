import { RefObject, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Object3D } from "three";
import { useFishStore } from "@/store/useFishStore";

const DECREASE_FEED_SPEED = 0.05;

interface GrowingFeedProps {
	position: [number, number, number];
	fishRef: RefObject<Object3D>;
	isGameOver: boolean;
	active: boolean;
	onCollected: () => void;
	onExpire: () => void;
}

export const GrowingFeed = ({ position, fishRef, isGameOver, active, onCollected, onExpire }: GrowingFeedProps) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(1);
	const [isVisible, setIsVisible] = useState(false);
	const isShrinking = useRef(false);
	const fishScale = useFishStore((s) => s.fishScale);
	const activeRef = useRef(false);
	const visibleRef = useRef(false);
	const growTimer = useRef(0);
	const waitBeforeShrink = 3;

	useEffect(() => {
		if (!active) return;

		activeRef.current = true;
		visibleRef.current = true;
		setIsVisible(true);
		scaleRef.current = 1;
		isShrinking.current = false;
		growTimer.current = 0;

		if (meshRef.current) {
			meshRef.current.scale.setScalar(scaleRef.current);
			meshRef.current.position.set(...position);
		}
	}, [active, position]);

	useFrame((_, delta) => {
		if (!fishRef.current || !meshRef.current || !activeRef.current || isGameOver) return;

		const mesh = meshRef.current;
		const fish = fishRef.current;

		// 작아진 후 소멸
		if (isShrinking.current) {
			scaleRef.current = Math.max(0, scaleRef.current - DECREASE_FEED_SPEED);
			mesh.scale.setScalar(scaleRef.current);
			if (scaleRef.current <= 0.01) {
				activeRef.current = false;
				visibleRef.current = false;
				setIsVisible(false);
				onExpire();
			}
			return;
		}

		growTimer.current += delta;
		if (growTimer.current >= waitBeforeShrink) {
			isShrinking.current = true;
		}

		// 충돌 계산
		const distSq = mesh.position.distanceToSquared(fish.position);
		const threshold = fishScale * 1.5;
		if (distSq < threshold * threshold && visibleRef.current) {
			activeRef.current = false;
			visibleRef.current = false;
			setIsVisible(false);
			scaleRef.current = 0;

			useFishStore.setState((prev) => ({
				fishScale: parseFloat((prev.fishScale + 0.05).toFixed(2)),
				fishSpeed: Math.max(prev.fishSpeed - 0.5, 10),
			}));

			onCollected();
		}
	});

	return (
		<mesh ref={meshRef} visible={isVisible}>
			<sphereGeometry args={[0.6, 16, 16]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};
