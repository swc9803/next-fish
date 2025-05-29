import { RefObject, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Object3D } from "three";
import { useFishStore } from "@/store/useFishStore";

const DECREASE_FEED_SPEED = 0.05;
const WAIT_BEFORE_SHRINK = 3;

interface GrowingFeedProps {
	fishRef: RefObject<Object3D | null>;
	position: [number, number, number];
	isGameOver: boolean;
	active: boolean;
	onCollected: () => void;
	onExpire: () => void;
}

export const GrowingFeed = ({ position, fishRef, isGameOver, active, onCollected, onExpire }: GrowingFeedProps) => {
	const meshRef = useRef<Mesh>(null);
	const scaleRef = useRef(1);
	const isShrinking = useRef(false);
	const growTimer = useRef(0);
	const activeRef = useRef(false);
	const visibleRef = useRef(false);
	const fishScale = useFishStore((s) => s.fishScale);

	useEffect(() => {
		if (!active) return;

		activeRef.current = true;
		visibleRef.current = true;
		scaleRef.current = 1;
		isShrinking.current = false;
		growTimer.current = 0;

		if (meshRef.current) {
			meshRef.current.scale.setScalar(1);
			meshRef.current.position.set(...position);
			meshRef.current.visible = true;
		}
	}, [active, position]);

	useFrame((_, delta) => {
		if (!activeRef.current || !meshRef.current || isGameOver || !fishRef.current) return;

		const mesh = meshRef.current;
		const fish = fishRef.current;

		// 작아진 후 소멸
		if (isShrinking.current) {
			scaleRef.current = Math.max(0, scaleRef.current - DECREASE_FEED_SPEED);
			mesh.scale.setScalar(scaleRef.current);
			if (scaleRef.current <= 0.01) {
				activeRef.current = false;
				visibleRef.current = false;
				mesh.visible = false;
				onExpire();
			}
			return;
		}

		growTimer.current += delta;
		if (growTimer.current >= WAIT_BEFORE_SHRINK) {
			isShrinking.current = true;
		}

		// 충돌 계산
		const distSq = mesh.position.distanceToSquared(fish.position);
		const threshold = fishScale * 1.5;
		if (distSq < threshold * threshold && visibleRef.current) {
			activeRef.current = false;
			visibleRef.current = false;
			mesh.visible = false;

			const store = useFishStore.getState();
			store.setFishScale((prev) => parseFloat((prev + 0.05).toFixed(2)));
			store.setFishSpeed((prev) => Math.max(prev - 0.5, 10));

			onCollected();
		}
	});

	return (
		<mesh ref={meshRef} visible={false}>
			<sphereGeometry args={[0.6, 16, 16]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};
