import { useEffect, useRef, memo } from "react";
import { useThree } from "@react-three/fiber";
import { Color, FogExp2 } from "three";
import gsap from "gsap";

interface BackgroundWithFogProps {
	backgroundColor: string;
	fogColor: string;
	fogDensity: number;
}

export const BackgroundWithFog = memo(({ backgroundColor, fogColor, fogDensity }: BackgroundWithFogProps) => {
	const { scene } = useThree();
	const initialized = useRef(false);

	useEffect(() => {
		// 초기 환경 설정 ( 제거 필요 )
		if (!initialized.current) {
			if (!(scene.background instanceof Color)) {
				scene.background = new Color(backgroundColor);
			}
			if (!scene.fog) {
				scene.fog = new FogExp2(new Color(fogColor), fogDensity);
			}
			initialized.current = true;
		}

		if (scene.fog instanceof FogExp2) {
			scene.fog.density = fogDensity;
		}

		const bgColor = new Color(backgroundColor);
		const fogClr = new Color(fogColor);

		if (scene.background instanceof Color) {
			gsap.to(scene.background, {
				r: bgColor.r,
				g: bgColor.g,
				b: bgColor.b,
				duration: 0.7,
				ease: "power2.inOut",
			});
		}

		if (scene.fog?.color) {
			gsap.to(scene.fog.color, {
				r: fogClr.r,
				g: fogClr.g,
				b: fogClr.b,
				duration: 0.7,
				ease: "power2.inOut",
			});
		}
	}, [scene, backgroundColor, fogColor, fogDensity]);

	return null;
});
