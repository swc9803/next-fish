"use client";

import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "@/components/gallery/Experience.jsx";
import { Overlay } from "@/components/gallery/Overlay.jsx";

const Gallery = () => {
	return (
		<>
			<Leva />
			<Overlay />
			<Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
				<color attach="background" args={["#ececec"]} />
				<Experience />
			</Canvas>
		</>
	);
};

export default Gallery;
