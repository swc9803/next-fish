import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { disposeObject3D } from "@/utils/disposeThree";

export const SceneCleanup = () => {
	const { scene } = useThree();

	useEffect(() => {
		return () => disposeObject3D(scene);
	}, [scene]);

	return null;
};
