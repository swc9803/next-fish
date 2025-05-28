import { useEffect } from "react";
import { Mesh, MeshStandardMaterial } from "three";
import gsap from "gsap";

export function useDeathPositionGrow({
	isGameOver,
	hitTilesRef,
	meshRefs,
	blinkTweens,
}: {
	isGameOver: boolean;
	hitTilesRef: React.RefObject<number[]>;
	meshRefs: React.RefObject<Mesh[]>;
	blinkTweens: React.RefObject<gsap.core.Tween[]>;
}) {
	useEffect(() => {
		if (!isGameOver) return;

		hitTilesRef.current.forEach((index) => {
			const mesh = meshRefs.current[index];
			if (!mesh) return;

			const material = mesh.material as MeshStandardMaterial;

			const tween = gsap.to(material.color, {
				r: 1,
				g: 0,
				b: 0,
				duration: 0.4,
				yoyo: true,
				repeat: -1,
				ease: "power1.inOut",
			});

			blinkTweens.current.push(tween);
		});

		// cleanup: tween 제거
		return () => {
			blinkTweens.current.forEach((t) => t.kill());
			blinkTweens.current = [];
		};
	}, [isGameOver, hitTilesRef, meshRefs, blinkTweens]);
}
