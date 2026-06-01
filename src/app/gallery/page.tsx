"use client";

import { Canvas } from "@react-three/fiber";
import { PCFShadowMap } from "three";
import { Experience } from "@/components/gallery/Experience";
import { Overlay } from "@/components/gallery/Overlay";
import { IntroOverlay } from "@/components/gallery/IntroOverlay";

const Gallery = () => {
	return (
		<>
			<IntroOverlay />

			<Overlay />

			<Canvas shadows={{ type: PCFShadowMap }} camera={{ position: [0, 0, 5], fov: 30 }}>
				<Experience />
			</Canvas>
		</>
	);
};

export default Gallery;
