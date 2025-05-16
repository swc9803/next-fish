import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, WebGLRenderTarget, CanvasTexture } from "three";
import * as THREE from "three";
import gsap from "gsap";

// shaders
import vertex from "@/shaders/vertex.glsl";
import fragment from "@/shaders/fragment.glsl";

interface ShaderTransitionProps {
	renderTarget: WebGLRenderTarget;
	loadingComplete: boolean;
	onFinish: () => void;
}

export const ShaderTransition = ({ renderTarget, loadingComplete, onFinish }: ShaderTransitionProps) => {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();

	const texture1: CanvasTexture = useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		const ctx = canvas.getContext("2d")!;

		// 임시 배경
		const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, "rgba(131, 58, 180, 1)");
		gradient.addColorStop(0.5, "rgba(253, 29, 29, 1)");
		gradient.addColorStop(1, "rgba(252, 176, 69, 1)");

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// 텍스트 설정
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 80px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}, []);

	const uniforms = useMemo(
		() => ({
			time: { value: 0 },
			progress: { value: 0 },
			width: { value: 0.35 },
			radius: { value: 0.9 },
			texture1: { value: texture1 },
			texture2: { value: renderTarget.texture },
			resolution: { value: new Vector4() },
		}),
		[texture1, renderTarget.texture]
	);

	// 메모리 해제
	useEffect(() => {
		return () => {
			texture1.dispose();
			meshRef.current?.geometry?.dispose();
			if (Array.isArray(meshRef.current?.material)) {
				meshRef.current.material.forEach((m) => m.dispose());
			} else {
				meshRef.current?.material?.dispose();
			}
		};
	}, [texture1]);

	useEffect(() => {
		if (!loadingComplete) return;
		const timeout = setTimeout(() => {
			gsap.to(uniforms.progress, {
				value: 1,
				duration: 1.7,
				ease: "power2.out",
				onComplete: onFinish,
			});
		}, 500);
		return () => clearTimeout(timeout);
	}, [loadingComplete, uniforms.progress, onFinish]);

	useFrame(() => {
		uniforms.time.value += 0.05;

		const aspect = size.height / size.width;
		const imageAspect = 512 / 1024; // aspect 수정?
		const a1 = aspect > imageAspect ? (size.width / size.height) * imageAspect : 1;
		const a2 = aspect > imageAspect ? 1 : aspect / imageAspect;

		uniforms.resolution.value.set(size.width, size.height, a1, a2);

		meshRef.current?.scale.set(size.width, size.height, 1);
	});

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
		</mesh>
	);
};
