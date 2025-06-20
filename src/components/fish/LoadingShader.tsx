import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, WebGLRenderTarget, CanvasTexture } from "three";

import vertex from "@/shaders/loadingVertex.glsl";
import fragment from "@/shaders/loadingFragment.glsl";

interface LoadingShaderProps {
	renderTarget: WebGLRenderTarget | null;
	loadingComplete: boolean;
	onFinish: () => void;
}

export const LoadingShader = ({ renderTarget, loadingComplete, onFinish }: LoadingShaderProps) => {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();

	const canvasTexture = useMemo(() => {
		const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
		const width = size.width * DPR;
		const height = size.height * DPR;

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d")!;
		ctx.scale(DPR, DPR);
		ctx.clearRect(0, 0, size.width, size.height);

		ctx.fillStyle = "#ffffff";
		ctx.font = size.width <= 768 ? "bold 24px sans-serif" : "bold 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
		ctx.shadowBlur = 6;
		ctx.fillText("Loading...", size.width / 2, size.height / 2);

		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}, [size.width, size.height]);

	const uniforms = useMemo(
		() => ({
			time: { value: 0 },
			progress: { value: 0 },
			width: { value: 0.35 },
			radius: { value: 1.4 },
			texture1: { value: canvasTexture },
			texture2: { value: renderTarget?.texture ?? null },
			resolution: { value: new Vector4() },
		}),
		[canvasTexture, renderTarget?.texture]
	);

	const progressRef = useRef(0);
	const isAnimatingOut = useRef(false);

	useEffect(() => {
		if (!loadingComplete || isAnimatingOut.current || !renderTarget) return;

		isAnimatingOut.current = true;
		const DURATION = 1700;
		const startTime = performance.now();

		const animateOut = (now: number) => {
			const elapsed = now - startTime;
			const next = Math.min(elapsed / DURATION, 1);
			uniforms.progress.value = next;
			progressRef.current = next;

			if (next < 1) {
				requestAnimationFrame(animateOut);
			} else {
				onFinish();
			}
		};

		requestAnimationFrame(animateOut);
	}, [loadingComplete, uniforms.progress, onFinish, renderTarget]);

	useEffect(() => {
		const mesh = meshRef.current;

		return () => {
			canvasTexture.dispose();
			if (mesh) {
				mesh.geometry?.dispose();
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach((m) => m.dispose());
				} else {
					mesh.material?.dispose();
				}
			}
		};
	}, [canvasTexture]);

	useFrame((_, delta) => {
		if (!renderTarget) return;

		uniforms.time.value += delta;

		const aspect = size.height / size.width;
		const imageAspect = size.height / size.width;
		const a1 = aspect > imageAspect ? (size.width / size.height) * imageAspect : 1;
		const a2 = aspect > imageAspect ? 1 : aspect / imageAspect;

		uniforms.resolution.value.set(size.width, size.height, a1, a2);
		meshRef.current?.scale.set(size.width, size.height, 1);
	});

	if (!renderTarget || !uniforms.texture2.value) return null;

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
		</mesh>
	);
};
