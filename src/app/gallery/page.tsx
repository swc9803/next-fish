"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { Experience } from "@/components/gallery/Experience";
import { Overlay } from "@/components/gallery/Overlay";
import { IntroOverlay } from "@/components/gallery/IntroOverlay";

const Gallery = () => {
	const [showIntro, setShowIntro] = useState(true);
	const [startIntroAnim, setStartIntroAnim] = useState(false);

	return (
		<>
			{showIntro && (
				<IntroOverlay
					onFinish={() => {
						setShowIntro(false);
						setStartIntroAnim(true);
					}}
				/>
			)}

			<Overlay />

			<Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
				<color attach="background" args={["#222222"]} />
				<Experience startIntro={startIntroAnim} />
			</Canvas>
		</>
	);
};

export default Gallery;
