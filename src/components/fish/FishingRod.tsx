import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Object3D } from "three";

useGLTF.preload("/models/fishing_rod.glb");

export const FishingRod = () => {
	const { scene } = useGLTF("/models/fishing_rod.glb");
	const rodRef = useRef<Object3D>(null);

	return <primitive ref={rodRef} object={scene} position={[2, 2, 2]} />;
};
