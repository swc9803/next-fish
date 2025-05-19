import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Object3D } from "three";

const logoData: {
	id: string;
	url: string;
	modelPath: string;
	position: [number, number, number];
}[] = [
	{
		id: "github",
		url: "https://github.com/swc9803",
		modelPath: "/models/github.glb",
		position: [-7, 0.5, 20],
	},
	{
		id: "codepen",
		url: "https://codepen.io/swc9803/pens/public",
		modelPath: "/models/codepen.glb",
		position: [0, 0.5, 20],
	},
	{
		id: "email",
		url: "mailto:swc9803@gmail.com",
		modelPath: "/models/email.glb",
		position: [7, 0.5, 20],
	},
];

interface LogoProps {
	url: string;
	modelPath: string;
	position: [number, number, number];
	fishRef: React.RefObject<Object3D>;
}

const LogoModel = ({ modelPath, position }: LogoProps) => {
	const { scene } = useGLTF(modelPath);
	const ref = useRef<Object3D>(null);

	return <primitive ref={ref} object={scene} position={position} scale={3.5} />;
};

interface MoveRouterProps {
	fishRef: React.RefObject<Object3D>;
}

export const MoveRouter = ({ fishRef }: MoveRouterProps) => {
	return (
		<group>
			{logoData.map((logo) => (
				<LogoModel key={logo.id} url={logo.url} modelPath={logo.modelPath} position={logo.position} fishRef={fishRef} />
			))}
		</group>
	);
};

logoData.forEach((logo) => useGLTF.preload(logo.modelPath));
