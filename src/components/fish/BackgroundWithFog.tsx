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
		const bgColor = new Color(backgroundColor);
		const fogClr = new Color(fogColor);

		// 최초 1회만 scene 배경, 안개 설정
		if (!initialized.current) {
			if (!(scene.background instanceof Color)) {
				scene.background = bgColor;
			} else {
				scene.background.copy(bgColor);
			}

			if (!scene.fog) {
				scene.fog = new FogExp2(fogClr, fogDensity);
			} else {
				scene.fog.color.copy(fogClr);
				if (scene.fog instanceof FogExp2) {
					scene.fog.density = fogDensity;
				}
			}

			initialized.current = true;
			return;
		}

		// 이후에는 값만 업데이트
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
