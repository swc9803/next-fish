"use client";

import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "@/components/gallery/Experience";
import { Overlay } from "@/components/gallery/Overlay";
import { JSX } from "react";
import { Stats } from "@react-three/drei";

const Gallery = (): JSX.Element => {
	return (
		<>
			<Leva />
			<Overlay />
			<Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
				<Stats />
				<color attach="background" args={["#ececec"]} />
				<Experience />
			</Canvas>
		</>
	);
};

export default Gallery;
