import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Color, FogExp2 } from "three";
import gsap from "gsap";

interface BackgroundTransitionProps {
	darkMode: boolean;
}

export const BackgroundTransition = ({ darkMode }: BackgroundTransitionProps) => {
	const { scene } = useThree();
	const initialized = useRef(false);

	useEffect(() => {
		// 초기 설정
		if (!initialized.current) {
			if (!(scene.background instanceof Color)) {
				scene.background = new Color(darkMode ? "#0b0b0b" : "#0c6ceb");
			}
			if (!scene.fog) {
				scene.fog = new FogExp2(new Color(darkMode ? "#111111" : "#00bfff"), 0.02);
			}
			initialized.current = true;
		}

		// 다크모드 변경 애니메이션
		const bgColor = new Color(darkMode ? "#0b0b0b" : "#0c6ceb");
		const fogColor = new Color(darkMode ? "#111111" : "#00bfff");

		if (scene.background instanceof Color) {
			gsap.to(scene.background, {
				r: bgColor.r,
				g: bgColor.g,
				b: bgColor.b,
				duration: 0.7,
				ease: "power2.inOut",
			});
		}

		if (scene.fog && scene.fog.color) {
			gsap.to(scene.fog.color, {
				r: fogColor.r,
				g: fogColor.g,
				b: fogColor.b,
				duration: 0.7,
				ease: "power2.inOut",
			});
		}
	}, [scene, darkMode]);

	return null;
};
