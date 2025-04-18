import { useEffect, useRef, useState } from "react";
import { Mesh, Object3D, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useFishStore } from "@/store/useFishStore";

type Vec3 = [number, number, number];

interface GrowingSphereProps {
	position: Vec3;
	onCollected: () => void;
	fishRef: React.RefObject<Object3D>;
}

export const GrowingSphere = ({ position, onCollected, fishRef }: GrowingSphereProps) => {
	const ref = useRef<Mesh>(null);
	const [collected, setCollected] = useState(false);
	const { fishScale, setFishScale } = useFishStore();

	useEffect(() => {
		if (!ref.current || collected) return;
		const timeout = setTimeout(() => {
			gsap.to(ref.current!.scale, {
				x: 0,
				y: 0,
				z: 0,
				duration: 0.5,
				onComplete: onCollected,
			});
		}, 5000);
		return () => clearTimeout(timeout);
	}, [collected, onCollected]);

	useFrame(() => {
		if (collected || !ref.current || !fishRef.current) return;

		const dist = ref.current.position.distanceTo(fishRef.current.position);
		if (dist < 3) {
			setCollected(true);
			const animateCollection = async () => {
				await gsap.to(ref.current!.scale, {
					x: 2,
					y: 2,
					z: 2,
					duration: 0.3,
				});

				await gsap.to(ref.current!.scale, {
					x: 0,
					y: 0,
					z: 0,
					duration: 0.5,
				});

				onCollected();
				setFishScale((prev) => Math.min(prev + 0.2, 5));
			};

			if (dist < 3) {
				setCollected(true);
				animateCollection();
			}
		}
	});

	return (
		<mesh ref={ref} position={position}>
			<sphereGeometry args={[1, 32, 32]} />
			<meshStandardMaterial color="limegreen" />
		</mesh>
	);
};
