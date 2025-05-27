import { useEffect, useRef, useState } from "react";
import { VideoTexture, LinearFilter, RGBFormat, Mesh } from "three";

export const VideoCaustics = ({ onLoaded }: { onLoaded: () => void }) => {
	const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
	const meshRef = useRef<Mesh>(null);

	useEffect(() => {
		if (!videoTexture?.image) return;

		const video = videoTexture.image;
		if (!(video instanceof HTMLVideoElement)) return;

		const onCanPlay = () => {
			video.removeEventListener("canplaythrough", onCanPlay);
		};

		video.addEventListener("canplaythrough", onCanPlay);
		return () => {
			video.removeEventListener("canplaythrough", onCanPlay);
		};
	}, [videoTexture]);

	// 비디오 초기화 및 텍스처 생성
	useEffect(() => {
		const video = document.createElement("video");
		video.src = "/videos/caustics.mp4";
		video.crossOrigin = "anonymous";
		video.loop = true;
		video.muted = true;
		video.autoplay = true;
		video.playsInline = true;

		let texture: VideoTexture;

		const handleCanPlay = () => {
			texture = new VideoTexture(video);
			texture.minFilter = LinearFilter;
			texture.magFilter = LinearFilter;
			texture.format = RGBFormat;
			setVideoTexture(texture);
			onLoaded();
			video.removeEventListener("canplay", handleCanPlay);
		};

		const tryPlay = () => {
			const playPromise = video.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.warn(error);
				});
			}
		};

		video.addEventListener("canplay", handleCanPlay);
		requestAnimationFrame(tryPlay);

		return () => {
			video.pause();
			video.removeAttribute("src");
			video.load();
			if (texture) texture.dispose();
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
