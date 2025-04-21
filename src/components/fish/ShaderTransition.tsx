"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector4, WebGLRenderTarget, CanvasTexture } from "three";
import * as THREE from "three";
import gsap from "gsap";
import { useProgress } from "@react-three/drei";

// shaders
import vertex from "@/shaders/vertex.glsl";
import fragment from "@/shaders/fragment.glsl";

interface ShaderTransitionProps {
	renderTarget: WebGLRenderTarget;
	loadingComplete: boolean;
	onFinish: () => void;
}

export default function ShaderTransition({ renderTarget, loadingComplete, onFinish }: ShaderTransitionProps) {
	const meshRef = useRef<Mesh>(null);
	const { size } = useThree();
	const { progress, item } = useProgress();

	const [canvasTexture, setCanvasTexture] = useState<CanvasTexture>(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		return new THREE.CanvasTexture(canvas);
	});

	useEffect(() => {
		if (item) {
			console.log(`Load ${item}`);
		}
	}, [item]);

	// 텍스처에 텍스트와 퍼센트 그리기
	const updateCanvas = (progress: number) => {
		const canvas = canvasTexture.image as HTMLCanvasElement;
		const ctx = canvas.getContext("2d")!;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// 배경 그라디언트
		const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, "rgba(131, 58, 180, 1)");
		gradient.addColorStop(0.5, "rgba(253, 29, 29, 1)");
		gradient.addColorStop(1, "rgba(252, 176, 69, 1)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// "Loading..." 텍스트
		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 80px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2 - 50);

		// 퍼센트 텍스트
		const paddedProgress = `${Math.floor(progress)}%`;
		ctx.font = "bold 60px sans-serif";
		ctx.fillText(paddedProgress, canvas.width / 2, canvas.height / 2 + 40);

		canvasTexture.needsUpdate = true;
	};

	useEffect(() => {
		updateCanvas(progress);
	}, [progress]);

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
		if (!loadingComplete) return;
		const timeout = setTimeout(() => {
			gsap.to(uniforms.progress, {
				value: 1,
				duration: 2,
				ease: "power2.out",
				onComplete: onFinish,
			});
		}, 500);
		return () => clearTimeout(timeout);
	}, [loadingComplete, uniforms.progress, onFinish]);

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
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={THREE.DoubleSide} />
		</mesh>
	);
}
