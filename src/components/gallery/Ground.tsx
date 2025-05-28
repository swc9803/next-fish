import { useEffect, useRef } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";

export const Ground = ({ positionY }: { positionY: number }) => {
	const materialRef = useRef<any>(null);

	// 메모리 해제
	useEffect(() => {
		const material = materialRef.current;
		return () => {
			material?.dispose?.();
		};
	}, []);

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, positionY, 0]}>
			<circleGeometry args={[20, 16]} />
			<MeshReflectorMaterial
				ref={materialRef}
				blur={[50, 5]}
				resolution={512}
				mixBlur={0.9}
				mixStrength={13}
				roughness={0.7}
				depthScale={0.8}
				minDepthThreshold={0.4}
				maxDepthThreshold={1.2}
				color={"#0087E2"}
				metalness={0.1}
			/>
		</mesh>
	);
};
