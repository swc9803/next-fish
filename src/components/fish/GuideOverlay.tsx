import { Canvas } from "@react-three/fiber";

import { GuideShader } from "./GuideShader";

interface GuideOverlayProps {
	isVisible: boolean;
	onFinish: () => void;
}

export const GuideOverlay = ({ isVisible, onFinish }: GuideOverlayProps) => {
	return (
		<div className={`guide_overlay ${isVisible ? "show" : ""}`}>
			<Canvas
				orthographic
				camera={{ zoom: 1, position: [0, 0, 100] }}
				gl={{
					alpha: true,
					depth: false,
					stencil: false,
					antialias: false,
					preserveDrawingBuffer: false,
					powerPreference: "low-power",
					failIfMajorPerformanceCaveat: false,
				}}
				onCreated={({ gl }) => {
					gl.getContext().canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
				}}
			>
				<GuideShader onFinish={onFinish} />
			</Canvas>
		</div>
	);
};
