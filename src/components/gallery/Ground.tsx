"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { JSX } from "react";

export const Ground = (): JSX.Element => {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
			<planeGeometry args={[50, 50]} />
			<MeshReflectorMaterial
				blur={[300, 100]}
				resolution={2048}
				mixBlur={1}
				mixStrength={80}
				roughness={1}
				depthScale={1.2}
				minDepthThreshold={0.4}
				maxDepthThreshold={1.4}
				color="#111111"
				metalness={0.5}
			/>
		</mesh>
	);
};
