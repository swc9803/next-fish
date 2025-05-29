import { useRef, useEffect, useMemo, RefObject, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D, Mesh, TorusGeometry, MeshBasicMaterial, Material } from "three";
import gsap from "gsap";

import { useTyping } from "@/hooks/useTyping";

const logoData: {
	id: string;
	url: string;
	modelPath: string;
	position: [number, number, number];
	isInternal?: boolean;
	text?: string;
}[] = [
	{
		id: "github",
		url: "https://github.com/swc9803",
		modelPath: "/models/github.glb",
		position: [-10, 0.5, 25],
	},
	{
		id: "codepen",
		url: "https://codepen.io/swc9803/pens/public",
		modelPath: "/models/codepen.glb",
		position: [0, 0.5, 25],
	},
	{
		id: "email",
		url: "mailto:swc9803@gmail.com",
		modelPath: "/models/email.glb",
		position: [10, 0.5, 25],
	},
	{
		id: "gallery",
		url: "/gallery",
		modelPath: "/models/fishing.glb",
		position: [20, 0.5, 10],
		isInternal: true,
		text: "갤러리로 이동",
	},
];

interface LogoProps {
	fishRef: RefObject<Object3D | null>;
	url: string;
	modelPath: string;
	position: [number, number, number];
	isInternal?: boolean;
	showGalleryOverlay?: () => void;
	text?: string;
	hideSpeechBubble?: boolean;
}

const LogoModel = ({ modelPath, position, url, fishRef, isInternal = false, showGalleryOverlay, text, hideSpeechBubble = false }: LogoProps) => {
	const { scene } = useGLTF(modelPath);
	const modelRef = useRef<Object3D>(null);
	const progressCircleRef = useRef<Mesh>(null);
	const progressRef = useRef(0);
	const triggeredRef = useRef(false);
	const prevArcRef = useRef<number | null>(null);
	const bubbleElemRef = useRef<HTMLDivElement>(null);

	const { camera } = useThree();

	const isFishingRod = modelPath.includes("fishing");
	const [visible, setVisible] = useState(false);
	const circleMaterial = useMemo(() => new MeshBasicMaterial({ color: "white" }), []);

	const DETECT_DISTANCE = 5;
	const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
	const bubblePosition: [number, number, number] = isMobile ? [-0.25, -0.5, -2.0] : [-0.25, 0.5, -1.5];

	const typedText = useTyping(text || "", visible, 150);

	useEffect(() => {
		if (progressCircleRef.current) {
			progressCircleRef.current.material = circleMaterial;
			progressCircleRef.current.rotation.set(Math.PI * -0.5, 0, Math.PI * 0.5);
		}
	}, [circleMaterial]);

	useEffect(() => {
		scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = true;
			}
		});
	}, [scene]);

	useFrame((_, delta) => {
		const ring = progressCircleRef.current;
		const model = modelRef.current;
		const fish = fishRef.current;
		if (!model || !fish || !ring) return;

		const dist = model.position.distanceTo(fish.position);
		const isNear = dist < DETECT_DISTANCE;

		setVisible((prev) => {
			if (prev !== isNear) {
				return isNear;
			}
			return prev;
		});

		if (bubbleElemRef.current) {
			bubbleElemRef.current.style.display = isNear && !hideSpeechBubble ? "block" : "none";
		}

		let progress = progressRef.current;
		if (isNear) {
			progress = Math.min(1, progress + delta / 4);
			if (progress >= 1 && !triggeredRef.current) {
				triggeredRef.current = true;

				if (isInternal && url === "/gallery") {
					fish.position.copy(model.position);
					fish.rotation.copy(model.rotation);
					fish.rotation.y = Math.PI / 2;
					fish.position.x -= 2;

					gsap.to([model.position, fish.position, camera.position], {
						y: "+=20",
						duration: 1.5,
					});
					showGalleryOverlay?.();
				} else {
					window.open(url, "_blank");
				}
			}
		} else {
			progress = Math.max(0, progress - delta / 1.5);
			if (progress < 1) triggeredRef.current = false;
		}

		progressRef.current = progress;

		const arc = -progress * Math.PI * 2;
		if (prevArcRef.current === null || Math.abs(arc - prevArcRef.current) > 0.01) {
			if (ring.geometry) ring.geometry.dispose();
			ring.geometry = new TorusGeometry(1.125, 0.05, 16, 64, arc);
			prevArcRef.current = arc;
		}
	});

	useEffect(() => {
		return () => {
			scene.traverse((child) => {
				if ((child as Mesh).isMesh) {
					const mesh = child as Mesh;
					mesh.geometry?.dispose();
					const material = mesh.material;
					if (Array.isArray(material)) {
						material.forEach((m: Material) => m.dispose());
					} else {
						material?.dispose();
					}
				}
			});
		};
	}, [scene]);

	return (
		<group ref={modelRef} position={position} scale={3.5}>
			<primitive object={scene} />
			<mesh ref={progressCircleRef} position={[0, 0.01, 0]} />
			{text && (
				<Html position={bubblePosition} distanceFactor={15} wrapperClass="prevent_click">
					<div className={`speech_bubble ${isFishingRod ? "rod" : ""}`} ref={bubbleElemRef}>
						{typedText}
					</div>
				</Html>
			)}
		</group>
	);
};

interface MoveRouterProps {
	fishRef: RefObject<Object3D | null>;
	showGalleryOverlay?: () => void;
	hideSpeechBubble?: boolean;
}

export const MoveRouter = ({ fishRef, showGalleryOverlay, hideSpeechBubble }: MoveRouterProps) => {
	return (
		<group>
			{logoData.map((logo) => (
				<LogoModel
					key={logo.id}
					url={logo.url}
					modelPath={logo.modelPath}
					position={logo.position}
					fishRef={fishRef}
					isInternal={logo.isInternal}
					showGalleryOverlay={showGalleryOverlay}
					text={logo.text}
					hideSpeechBubble={hideSpeechBubble}
				/>
			))}
		</group>
	);
};
