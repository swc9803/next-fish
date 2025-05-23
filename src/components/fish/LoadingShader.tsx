import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, WebGLRenderTarget, CanvasTexture } from "three";
import gsap from "gsap";

import vertex from "@/shaders/loadingVertex.glsl";
import fragment from "@/shaders/loadingFragment.glsl";

interface LoadingShaderProps {
	renderTarget: WebGLRenderTarget;
	loadingComplete: boolean;
}

export const LoadingShader = ({ renderTarget, loadingComplete }: LoadingShaderProps) => {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();

	const canvasTexture = useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		const ctx = canvas.getContext("2d");
		if (!ctx) return new CanvasTexture(canvas);

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#ffffff";
		ctx.font = "normal 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);

		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}, []);

	const uniforms = useMemo(
		() => ({
			time: { value: 0 },
			progress: { value: 0 },
			width: { value: 0.35 },
			radius: { value: 0.9 },
			texture1: { value: canvasTexture },
			texture2: { value: renderTarget.texture },
			resolution: { value: new Vector4() },
		}),
		[canvasTexture, renderTarget.texture]
	);

	useEffect(() => {
		let tween: gsap.core.Tween | null = null;
		if (loadingComplete) {
			const timeout = setTimeout(() => {
				tween = gsap.to(uniforms.progress, {
					value: 1,
					duration: 1.7,
					ease: "none",
				});
			}, 500);
			return () => {
				clearTimeout(timeout);
				if (tween) tween.kill();
			};
		}
	}, [loadingComplete, uniforms.progress]);

	useEffect(() => {
		return () => {
			canvasTexture.dispose();
			if (meshRef.current) {
				meshRef.current.geometry?.dispose();
				if (Array.isArray(meshRef.current.material)) {
					meshRef.current.material.forEach((m) => m.dispose());
				} else {
					meshRef.current.material?.dispose();
				}
			}
		};
	}, [canvasTexture]);

	useFrame(() => {
		uniforms.time.value += 0.05;

		const aspect = size.height / size.width;
		const imageAspect = 512 / 1024;
		const a1 = aspect > imageAspect ? (size.width / size.height) * imageAspect : 1;
		const a2 = aspect > imageAspect ? 1 : aspect / imageAspect;

		uniforms.resolution.value.set(size.width, size.height, a1, a2);
		if (meshRef.current) {
			meshRef.current.scale.set(size.width, size.height, 1);
		}
	});

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
		</mesh>
	);
};
