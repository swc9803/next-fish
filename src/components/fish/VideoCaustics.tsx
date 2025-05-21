import { useEffect, useRef, useState } from "react";
import { VideoTexture, LinearFilter, RGBFormat, Mesh } from "three";

export const VideoCaustics = () => {
	const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
	const meshRef = useRef<Mesh>(null);

	useEffect(() => {
		if (!videoTexture || !videoTexture.image) return;

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

		const tryPlay = () => {
			const playPromise = video.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.warn(error);
				});
			}
		};

		const handleCanPlay = () => {
			const texture = new VideoTexture(video);
			texture.minFilter = LinearFilter;
			texture.magFilter = LinearFilter;
			texture.format = RGBFormat;
			setVideoTexture(texture);
			video.removeEventListener("canplay", handleCanPlay);
		};

		video.addEventListener("canplay", handleCanPlay);
		requestAnimationFrame(tryPlay);

		return () => {
			video.pause();
			video.removeAttribute("src");
			video.load();
			if (videoTexture) {
				videoTexture.dispose();
			}
		};
	}, []);

	return (
		videoTexture && (
			<mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={10}>
				<planeGeometry args={[350, 70]} />
				<meshBasicMaterial map={videoTexture} transparent opacity={0.3} depthWrite={false} depthTest={false} />
			</mesh>
		)
	);
};
