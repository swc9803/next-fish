import { useEffect, useRef, useState, memo } from "react";
import { VideoTexture, LinearFilter, RGBFormat, Mesh } from "three";

const VideoCausticsComponent = ({ onLoaded }: { onLoaded: () => void }) => {
	const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
	const meshRef = useRef<Mesh>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const textureRef = useRef<VideoTexture | null>(null);

	useEffect(() => {
		const video = document.createElement("video");
		video.src = "/videos/caustics.mp4";
		video.crossOrigin = "anonymous";
		video.loop = true;
		video.muted = true;
		video.playsInline = true;
		videoRef.current = video;

		const handleCanPlay = async () => {
			try {
				await video.play();
				const texture = new VideoTexture(video);
				texture.minFilter = LinearFilter;
				texture.magFilter = LinearFilter;
				texture.format = RGBFormat;
				textureRef.current = texture;
				setVideoTexture(texture);
				onLoaded();
			} catch (error) {
				console.warn(error);
			}
			video.removeEventListener("canplaythrough", handleCanPlay);
		};

		video.addEventListener("canplaythrough", handleCanPlay);

		if (video.readyState >= 3) {
			handleCanPlay();
		}

		return () => {
			video.pause();
			video.removeAttribute("src");
			video.load();
			textureRef.current?.dispose();
		};
	}, [onLoaded]);

	return (
		videoTexture && (
			<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={10}>
				<planeGeometry args={[350, 70]} />
				<meshBasicMaterial map={videoTexture} transparent opacity={0.3} depthWrite={false} depthTest={false} />
			</mesh>
		)
	);
};

export const VideoCaustics = memo(VideoCausticsComponent);
