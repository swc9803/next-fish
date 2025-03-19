"use client";

import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "@/components/gallery/Experience.jsx";
import { Overlay } from "@/components/gallery/Overlay.jsx";
import { useState } from "react";

function Gallery() {
	const [slide, setSlide] = useState(0);

	return (
		<>
			<Leva />
			<Overlay slide={slide} setSlide={setSlide} />
			<Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
				<color attach="background" args={["#ececec"]} />
				<Experience slide={slide} />
			</Canvas>
		</>
	);
}

export default Gallery;
