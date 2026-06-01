import { useEffect, useRef, useState, memo } from "react";
import { VideoTexture, LinearFilter, RGBFormat, Mesh } from "three";

const VideoCausticsComponent = ({ onLoaded }: { onLoaded: () => void }) => {
	const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
	const meshRef = useRef<Mesh>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const textureRef = useRef<VideoTexture | null>(null);
	const didLoadRef = useRef(false);

	useEffect(() => {
		const video = document.createElement("video");
		video.src = "/videos/caustics.mp4";
		video.crossOrigin = "anonymous";
		video.loop = true;
		video.muted = true;
		video.playsInline = true;
		videoRef.current = video;
		let fallback: ReturnType<typeof setTimeout> | null = null;

		const notifyLoaded = () => {
			if (didLoadRef.current) return false;
			didLoadRef.current = true;
			onLoaded();
			return true;
		};

		const handleCanPlay = async () => {
			if (didLoadRef.current) return;

			try {
				await video.play();
				const texture = new VideoTexture(video);
				texture.minFilter = LinearFilter;
				texture.magFilter = LinearFilter;
				texture.format = RGBFormat;
				textureRef.current = texture;
				setVideoTexture(texture);
			} catch {
				// Caustics are decorative, so a video autoplay failure should not block the scene.
			} finally {
				notifyLoaded();
				if (fallback) clearTimeout(fallback);
			}
			video.removeEventListener("canplaythrough", handleCanPlay);
		};

		video.addEventListener("canplaythrough", handleCanPlay);
		fallback = setTimeout(() => {
			notifyLoaded();
			video.removeEventListener("canplaythrough", handleCanPlay);
		}, 2500);

		if (video.readyState >= 3) {
			handleCanPlay();
		}

		return () => {
			didLoadRef.current = false;
			if (fallback) clearTimeout(fallback);
			video.pause();
			video.removeAttribute("src");
			video.load();
			textureRef.current?.dispose();
		};
	}, [onLoaded]);

	return (
		videoTexture && (
			<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[-45, 0.01, 0]} renderOrder={10}>
				<planeGeometry args={[210, 70]} />
				<meshBasicMaterial map={videoTexture} transparent opacity={0.2} depthWrite={false} depthTest={false} />
			</mesh>
		)
	);
};

export const VideoCaustics = memo(VideoCausticsComponent);
