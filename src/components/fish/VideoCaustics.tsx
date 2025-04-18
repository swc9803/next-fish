import { useVideoTexture } from "@react-three/drei";

export const VideoCaustics = () => {
	const videoTexture = useVideoTexture("/videos/caustics.mp4");

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={10}>
			<planeGeometry args={[350, 70]} />
			<meshBasicMaterial map={videoTexture} transparent opacity={0.3} depthWrite={false} depthTest={false} />
		</mesh>
	);
};
