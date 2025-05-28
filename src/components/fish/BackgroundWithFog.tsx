import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Color, FogExp2 } from "three";

interface BackgroundWithFogProps {
	backgroundColor: string;
	fogColor: string;
	fogDensity: number;
}

export const BackgroundWithFog = ({ backgroundColor, fogColor, fogDensity }: BackgroundWithFogProps) => {
	const { scene } = useThree();
	const initialized = useRef(false);

	useEffect(() => {
		if (!scene || initialized.current) return;

		scene.background = new Color(backgroundColor);
		scene.fog = new FogExp2(new Color(fogColor), fogDensity);

		initialized.current = true;
	}, [scene, backgroundColor, fogColor, fogDensity]);

	useEffect(() => {
		if (!scene || !initialized.current) return;

		if (scene.background instanceof Color) {
			scene.background.set(backgroundColor);
		}
		if (scene.fog instanceof FogExp2) {
			scene.fog.color.set(fogColor);
			scene.fog.density = fogDensity;
		}
	}, [scene, backgroundColor, fogColor, fogDensity]);

	return null;
};
