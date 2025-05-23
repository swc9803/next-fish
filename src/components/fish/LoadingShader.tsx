import { useRef, useMemo, useEffect, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, WebGLRenderTarget, CanvasTexture } from "three";

import vertex from "@/shaders/loadingVertex.glsl";
import fragment from "@/shaders/loadingFragment.glsl";

interface LoadingShaderProps {
	renderTarget: WebGLRenderTarget;
	loadingComplete: boolean;
	onFinish: () => void;
}

export const LoadingShader = memo(({ renderTarget, loadingComplete, onFinish }: LoadingShaderProps) => {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();

	const canvasTexture = useMemo(() => {
		const DPR = Math.min(window.devicePixelRatio || 1, 2);
		const width = size.width * DPR;
		const height = size.height * DPR;

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d")!;
		ctx.scale(DPR, DPR);

		ctx.clearRect(0, 0, size.width, size.height);
		ctx.fillStyle = "#ffffff";
		ctx.font = size.width <= 768 ? "normal 24px sans-serif" : "normal 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Loading...", size.width / 2, size.height / 2);

		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}, [size]);

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
		if (loadingComplete) {
			let raf: number;
			const DELAY = 500;
			const DURATION = 1700;
			const steps = DURATION / (1000 / 60);
			let frame = 0;

			const animate = () => {
				frame++;
				const next = Math.min(frame / steps, 1);
				uniforms.progress.value = next;
				if (next < 1) raf = requestAnimationFrame(animate);
				else onFinish();
			};

			const timeout = setTimeout(() => {
				raf = requestAnimationFrame(animate);
			}, DELAY);

			return () => {
				clearTimeout(timeout);
				cancelAnimationFrame(raf);
			};
		}
	}, [loadingComplete, uniforms.progress, onFinish]);

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
		const imageAspect = size.height / size.width;
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
});
