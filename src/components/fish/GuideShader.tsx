import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, CanvasTexture } from "three";
import gsap from "gsap";

import vertex from "@/shaders/guideVertex.glsl";
import fragment from "@/shaders/guideFragment.glsl";

interface GuideShaderProps {
	onFinish: () => void;
}

export const GuideShader = ({ onFinish }: GuideShaderProps) => {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();
	const [clicked, setClicked] = useState(false);

	const texture: CanvasTexture = useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		const ctx = canvas.getContext("2d")!;

		// 반투명 배경
		ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// 텍스트
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 36px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Click the screen to move the fish!", canvas.width / 2, canvas.height / 2);

		// 커서 SVG처럼 도형 그리기 (예시)
		ctx.beginPath();
		ctx.moveTo(512 - 50, 256 + 80);
		ctx.lineTo(512 - 20, 256 + 20);
		ctx.lineTo(512, 256 + 60);
		ctx.lineTo(512 - 50, 256 + 80);
		ctx.fillStyle = "#fff";
		ctx.fill();

		const tex = new CanvasTexture(canvas);
		tex.needsUpdate = true;
		return tex;
	}, []);

	const uniforms = useMemo(
		() => ({
			time: { value: 0 },
			progress: { value: 0 },
			texture1: { value: texture },
			resolution: { value: new Vector4() },
		}),
		[texture]
	);

	useEffect(() => {
		return () => {
			texture.dispose();
			meshRef.current?.geometry?.dispose();
			if (Array.isArray(meshRef.current?.material)) {
				meshRef.current.material.forEach((m) => m.dispose());
			} else {
				meshRef.current?.material?.dispose();
			}
		};
	}, [texture]);

	useEffect(() => {
		if (!clicked) return;
		gsap.to(uniforms.progress, {
			value: 1,
			duration: 2,
			ease: "power2.inOut",
			onComplete: onFinish,
		});
	}, [clicked, uniforms.progress, onFinish]);

	useFrame(() => {
		uniforms.time.value += 0.05;
		const aspect = size.height / size.width;
		const imageAspect = 512 / 1024;
		const a1 = aspect > imageAspect ? (size.width / size.height) * imageAspect : 1;
		const a2 = aspect > imageAspect ? 1 : aspect / imageAspect;
		uniforms.resolution.value.set(size.width, size.height, a1, a2);

		meshRef.current?.scale.set(size.width, size.height, 1);
	});

	return (
		<mesh ref={meshRef} position={[0, 0, 0]} onClick={() => setClicked(true)}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
		</mesh>
	);
};
