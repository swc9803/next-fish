"use client";

import { JSX } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { slideArray } from "@/utils/slideUtils";
import { Slides } from "./Slides";
import { HoverLight } from "./HoverLight";
import { CameraHandler } from "./CameraHandler";

export const Experience = (): JSX.Element => {
	const { viewport, camera, size } = useThree();
	const aspectRatio = size.width / size.height;
	const fieldOfView = "fov" in camera ? (camera.fov * Math.PI) / 180 : (75 * Math.PI) / 180;
	const cameraRadius = viewport.height / (2 * Math.tan(fieldOfView / 2));
	const slideSpacing = viewport.width * 2.8;
	const totalRadius = (slideSpacing * slideArray.length) / (2 * Math.PI);

	return (
		<>
			<ambientLight intensity={0.2} />
			<Environment preset="city" />

			<CameraHandler cameraRadius={cameraRadius} totalRadius={totalRadius} />
			<HoverLight totalRadius={totalRadius} cameraRadius={cameraRadius} />
			<Slides totalRadius={totalRadius} aspectRatio={aspectRatio} cameraRadius={cameraRadius} />

			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
				<planeGeometry args={[50, 50]} />
				<MeshReflectorMaterial
					blur={[300, 100]}
					resolution={2048}
					mixBlur={1}
					mixStrength={80}
					roughness={1}
					depthScale={1.2}
					minDepthThreshold={0.4}
					maxDepthThreshold={1.4}
					color="#111111"
					metalness={0.5}
				/>
			</mesh>

			<color attach="background" args={["#222222"]} />
		</>
	);
};
