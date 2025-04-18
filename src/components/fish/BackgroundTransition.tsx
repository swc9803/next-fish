import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color, FogExp2 } from "three";
import gsap from "gsap";

interface BackgroundTransitionProps {
	darkMode: boolean;
}

// 다크모드 시 배경 트렌지션
export const BackgroundTransition = ({ darkMode }: BackgroundTransitionProps) => {
	const { scene } = useThree();

	useEffect(() => {
		if (!scene.background || !(scene.background instanceof Color)) {
			scene.background = new Color(darkMode ? "#0b0b0b" : "#0c6ceb");
		}
		if (!scene.fog) {
			scene.fog = new FogExp2(new Color(darkMode ? "#111111" : "#00bfff"), 0.02);
		}
	}, []);

	useEffect(() => {
		const targetBg = new Color(darkMode ? "#0b0b0b" : "#0c6ceb");
		const targetFog = new Color(darkMode ? "#111111" : "#00bfff");

		gsap.to(scene.background as Color, {
			r: targetBg.r,
			g: targetBg.g,
			b: targetBg.b,
			duration: 0.7,
			ease: "power2.inOut",
		});

		gsap.to(scene.fog!.color, {
			r: targetFog.r,
			g: targetFog.g,
			b: targetFog.b,
			duration: 0.7,
			ease: "power2.inOut",
		});
	}, [darkMode]);

	return null;
};
