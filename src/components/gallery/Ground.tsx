"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { JSX } from "react";

export const Ground = (): JSX.Element => {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]}>
			<circleGeometry args={[20, 32]} />
			<MeshReflectorMaterial
				blur={[100, 50]}
				resolution={512}
				mixBlur={0.8}
				mixStrength={15}
				roughness={1}
				depthScale={0.9}
				minDepthThreshold={0.4}
				maxDepthThreshold={1.2}
				color="#111111"
				metalness={0.2}
			/>
		</mesh>
	);
};
