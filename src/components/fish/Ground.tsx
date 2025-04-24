import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { Mesh, RepeatWrapping } from "three";
import { isWebPSupported } from "@/utils/isWebPSupported";

type RefMesh = React.RefObject<Mesh>;

interface PlaneProps {
	planeRef: RefMesh;
}

export const Ground = ({ planeRef }: PlaneProps) => {
	const ext = useMemo(() => (isWebPSupported() ? "webp" : "jpg"), []);
	const texturePaths = useMemo(
		() => [
			`/textures/sand3/aerial_beach_01_diff_1k.${ext}`,
			`/textures/sand3/aerial_beach_01_nor_gl_1k.${ext}`,
			`/textures/sand3/aerial_beach_01_rough_1k.${ext}`,
		],
		[ext]
	);

	const [colorMap, normalMap, roughnessMap] = useTexture(texturePaths);

	useMemo(() => {
		[colorMap, normalMap, roughnessMap].forEach((tex) => {
			tex.wrapS = tex.wrapT = RepeatWrapping;
			tex.repeat.set(20, 4); // planeGeometry args 비율에 맞춰 수정
		});
	}, [colorMap, normalMap, roughnessMap]);

	const geometry = useMemo(() => <planeGeometry args={[350, 70]} />, []);
	const material = useMemo(
		() => <meshStandardMaterial map={colorMap} normalMap={normalMap} roughnessMap={roughnessMap} roughness={1} metalness={0} />,
		[colorMap, normalMap, roughnessMap]
	);

	return (
		<mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
			{geometry}
			{material}
		</mesh>
	);
};
