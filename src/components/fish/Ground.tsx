import { RefObject, useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { Mesh, RepeatWrapping } from "three";

import { isWebpSupported } from "@/utils/isWebpSupported";

interface PlaneProps {
	planeRef: RefObject<Mesh | null>;
	onLoaded: () => void;
}

export const Ground = ({ planeRef, onLoaded }: PlaneProps) => {
	const ext = useMemo(() => (isWebpSupported() ? "webp" : "jpg"), []);
	const texturePaths = useMemo(
		() => [
			`/textures/sand3/aerial_beach_01_diff_1k.${ext}`,
			`/textures/sand3/aerial_beach_01_nor_gl_1k.${ext}`,
			`/textures/sand3/aerial_beach_01_rough_1k.${ext}`,
		],
		[ext]
	);

	const [colorMap, normalMap, roughnessMap] = useTexture(texturePaths);
	const didNotify = useRef(false);

	useEffect(() => {
		if (!didNotify.current) {
			onLoaded();
			didNotify.current = true;
		}
	}, [onLoaded]);

	// 메모리 해제
	useEffect(() => {
		return () => {
			[colorMap, normalMap, roughnessMap].forEach((tex) => tex.dispose());
		};
	}, [colorMap, normalMap, roughnessMap]);

	useMemo(() => {
		[colorMap, normalMap, roughnessMap].forEach((tex) => {
			tex.wrapS = tex.wrapT = RepeatWrapping;
			tex.repeat.set(20, 4);
		});
	}, [colorMap, normalMap, roughnessMap]);

	return (
		<mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
			<planeGeometry args={[350, 70]} />
			<meshStandardMaterial map={colorMap} normalMap={normalMap} roughnessMap={roughnessMap} roughness={1} metalness={0} />
		</mesh>
	);
};
