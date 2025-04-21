"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import gsap from "gsap";

import fragment from "@/shaders/fragment.glsl";
import vertex from "@/shaders/vertex.glsl";

function SceneContent({ renderTarget }) {
	const meshRef = useRef();
	const cubeRef = useRef();
	const { size, gl, camera } = useThree();

	const texture1 = useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#000000";
		ctx.font = "bold 80px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
		return new THREE.CanvasTexture(canvas);
	}, []);

	const uniforms = useMemo(
		() => ({
			time: { value: 0 },
			progress: { value: 0 },
			width: { value: 0.35 },
			radius: { value: 0.9 },
			texture1: { value: texture1 },
			texture2: { value: renderTarget.texture },
			resolution: { value: new THREE.Vector4() },
		}),
		[texture1, renderTarget.texture]
	);

	useEffect(() => {
		const timeout = setTimeout(() => {
			gsap.to(uniforms.progress, {
				value: 1,
				duration: 1.5,
				ease: "power2.out",
			});
		}, 1000);
		return () => clearTimeout(timeout);
	}, [uniforms]);

	useFrame(() => {
		uniforms.time.value += 0.05;

		const cubeScene = new THREE.Scene();
		const cubeCam = new THREE.PerspectiveCamera(70, size.width / size.height, 0.001, 1000);
		cubeCam.position.z = 2;
		cubeScene.add(cubeRef.current);
		gl.setRenderTarget(renderTarget);
		gl.render(cubeScene, cubeCam);
		gl.setRenderTarget(null);

		camera.aspect = size.width / size.height;
		camera.updateProjectionMatrix();

		const imageAspect = 512 / 1024;
		const a1 = size.height / size.width > imageAspect ? (size.width / size.height) * imageAspect : 1;
		const a2 = size.height / size.width > imageAspect ? 1 : size.height / size.width / imageAspect;
		uniforms.resolution.value.set(size.width, size.height, a1, a2);

		const dist = camera.position.z;
		const fov = (camera.fov * Math.PI) / 180;
		const planeHeight = 2 * Math.tan(fov / 2) * dist;
		if (meshRef.current) {
			meshRef.current.scale.set(planeHeight * camera.aspect, planeHeight, 1);
		}
	});

	return (
		<>
			<mesh ref={cubeRef} position={[0, 0.5, 0]} rotation={[Math.PI / 4, 0, 0]}>
				<boxGeometry args={[1, 1, 1]} />
				<meshNormalMaterial />
			</mesh>

			<mesh ref={meshRef}>
				<planeGeometry args={[1, 1]} />
				<shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={THREE.DoubleSide} />
			</mesh>
		</>
	);
}

export default function Page() {
	const renderTarget = useMemo(() => new THREE.WebGLRenderTarget(1024, 512), []);

	return (
		<Canvas>
			<PerspectiveCamera makeDefault fov={70} position={[0, 0, 2]} />
			<SceneContent renderTarget={renderTarget} />
		</Canvas>
	);
}
