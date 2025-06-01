import { memo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, Material } from "three";

interface DecorationProps {
	modelPath: string;
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: number;
	onLoaded?: () => void;
}

export const DecorationModelComponent = ({ modelPath, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, onLoaded }: DecorationProps) => {
	const { scene } = useGLTF(modelPath);

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

	return <primitive object={scene} position={position} rotation={rotation} scale={[scale, scale, scale]} />;
};

export const DecorationModel = memo(DecorationModelComponent);
