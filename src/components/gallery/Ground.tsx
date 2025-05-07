import { MeshReflectorMaterial } from "@react-three/drei";

export const Ground = ({ positionY }) => {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, positionY, 0]}>
			<circleGeometry args={[20, 16]} />
			<MeshReflectorMaterial
				blur={[50, 5]}
				resolution={512}
				mixBlur={0.9}
				mixStrength={15}
				roughness={0.7}
				depthScale={0.8}
				minDepthThreshold={0.4}
				maxDepthThreshold={1.2}
				color={"#0087E2"}
				metalness={0.2}
			/>
		</mesh>
	);
};
