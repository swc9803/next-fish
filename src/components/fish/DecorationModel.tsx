import { memo, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, Material, Object3D } from "three";
import gsap from "gsap";

interface DecorationProps {
	modelPath: string;
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: number;
	onLoaded?: () => void;
	modelKey?: string;
}

export const DecorationModelComponent = ({
	modelPath,
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	scale = 1,
	onLoaded,
	modelKey,
}: DecorationProps) => {
	const { scene } = useGLTF(modelPath);
	const ref = useRef<Object3D>(null);

	useEffect(() => {
		onLoaded?.();
	}, [onLoaded]);

	useEffect(() => {
		scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
	}, [scene]);

	useEffect(() => {
		if (modelKey === "seastar" && ref.current) {
			const tween = gsap.to(ref.current.position, {
				x: `+=5`,
				duration: 8,
				repeat: -1,
				yoyo: true,
				ease: "sine.inOut",
			});
			return () => {
				tween.kill();
			};
		}
	}, [modelKey]);

	useEffect(() => {
		return () => {
			scene.traverse((child) => {
				if ((child as Mesh).isMesh) {
					const mesh = child as Mesh;
					mesh.geometry?.dispose();
					const material = mesh.material;
					if (Array.isArray(material)) {
						material.forEach((m: Material) => m.dispose());
					} else {
						material?.dispose();
					}
				}
			});
		};
	}, [scene]);

	return <primitive ref={ref} object={scene} position={position} rotation={rotation} scale={[scale, scale, scale]} />;
};

export const DecorationModel = memo(DecorationModelComponent);
