"use client";

import { MeshReflectorMaterial } from "@react-three/drei";

export const Ground = ({ positionY }) => {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, positionY, 0]}>
			<circleGeometry args={[20, 16]} />
			<MeshReflectorMaterial
				blur={[100, 10]}
				resolution={512}
				mixBlur={0.9}
				mixStrength={15}
				roughness={1}
				depthScale={0.8}
				minDepthThreshold={0.4}
				maxDepthThreshold={1.2}
				color={"#575757"}
				metalness={0.2}
			/>
		</mesh>
	);
};
