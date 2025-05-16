import { useVideoTexture } from "@react-three/drei";
import { useEffect } from "react";

export const VideoCaustics = () => {
	const videoTexture = useVideoTexture("/videos/caustics.mp4");

	// 메모리 해제
	useEffect(() => {
		return () => {
			videoTexture.dispose();
		};
	}, [videoTexture]);

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={10}>
			<planeGeometry args={[350, 70]} />
			<meshBasicMaterial map={videoTexture} transparent opacity={0.3} depthWrite={false} depthTest={false} />
		</mesh>
	);
};
