"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders/particleShader";

function AnimatedParticles() {
	const meshRef = useRef();
	const count = 1000;
	const phaseDuration = 5;

	const { positions, targetPositions } = useMemo(() => {
		const positions = new Float32Array(count * 3);
		const targetPositions = {
			torus: new Float32Array(count * 3),
			box: new Float32Array(count * 3),
			dodecahedron: new Float32Array(count * 3),
		};

		for (let i = 0; i < count * 3; i++) {
			positions[i] = (Math.random() - 0.5) * 10;
		}

		const geometries = {
			torus: new THREE.TorusGeometry(3, 1, 16, 32),
			box: new THREE.BoxGeometry(4, 4, 4, 10, 10, 10),
			dodecahedron: new THREE.DodecahedronGeometry(3, 1),
		};

		Object.keys(geometries).forEach((key) => {
			const positionArray = geometries[key].attributes.position.array;
			const availableCount = Math.min(count, positionArray.length / 3);

			for (let i = 0; i < availableCount * 3; i++) {
				targetPositions[key][i] = positionArray[i];
			}

			for (let i = availableCount * 3; i < count * 3; i++) {
				targetPositions[key][i] = (Math.random() - 0.5) * 10;
			}

			geometries[key].dispose();
		});

		return { positions, targetPositions };
	}, [count]);

	useFrame(({ clock }) => {
		const time = clock.getElapsedTime();
		const progress = Math.sin((time / phaseDuration) * Math.PI * 2) * 0.5 + 0.5;

		const phaseIndex = Math.floor(time / phaseDuration) % 3;
		const nextPhaseIndex = (phaseIndex + 1) % 3;
		const phaseKeys = ["torus", "box", "dodecahedron"];

		if (meshRef.current) {
			meshRef.current.material.uniforms.uTime.value = progress;
			const currentTarget = targetPositions[phaseKeys[phaseIndex]];
			const nextTarget = targetPositions[phaseKeys[nextPhaseIndex]];

			const interpolatedPositions = new Float32Array(count * 3);
			for (let i = 0; i < count * 3; i++) {
				interpolatedPositions[i] = THREE.MathUtils.lerp(currentTarget[i], nextTarget[i], progress);
			}

			meshRef.current.geometry.setAttribute("targetPosition", new THREE.BufferAttribute(interpolatedPositions, 3));
		}
	});

	return (
		<points ref={meshRef}>
			<bufferGeometry attach="geometry">
				<bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
			</bufferGeometry>
			<shaderMaterial attach="material" vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={{ uTime: { value: 0 } }} />
		</points>
	);
}

export default function ParticleScene() {
	return (
		<Canvas camera={{ position: [0, 0, 10] }} style={{ background: "black" }}>
			<OrbitControls enableZoom={true} enablePan={false} />

			<fog attach="fog" args={["black", 10, 30]} />

			<AnimatedParticles />
		</Canvas>
	);
}
