"use client";

import { Canvas } from "@react-three/fiber";

import { Experience } from "@/components/gallery/Experience";
import { Overlay } from "@/components/gallery/Overlay";

const Gallery = () => {
	return (
		<>
			<Overlay />
			<Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
				<color attach="background" args={["#222222"]} />
				<Experience />
			</Canvas>
		</>
	);
};

export default Gallery;
