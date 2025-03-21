"use client";

import {
	AccumulativeShadows,
	Environment,
	Lightformer,
	OrbitControls,
	PerspectiveCamera,
	RandomizedLight,
	Sphere,
	useGLTF,
	useAnimations,
} from "@react-three/drei";

import { LoopOnce, Mesh, Group, AnimationClip, BackSide } from "three";
import { JSX, useEffect, useRef } from "react";
import { DEG2RAD } from "three/src/math/MathUtils";

import { ModelInfo } from "./Experience";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
	scene: Group;
	animations: AnimationClip[];
};

interface SceneProps extends ModelInfo {}

export const Scene = ({ mainColor, path }: SceneProps): JSX.Element => {
	const group = useRef<Group>(null);
	const { scene, animations } = useGLTF(path) as GLTFResult;
	const { actions } = useAnimations(animations, group);

	useEffect(() => {
		scene.traverse((child) => {
			if ((child as Mesh).isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});

		if (actions && Object.keys(actions).length > 0) {
			setTimeout(() => {
				const action = actions[Object.keys(actions)[1]];
				action.setLoop(LoopOnce, 1);
				action.clampWhenFinished = true;
				action.play();
			}, 4000);
		}
	}, [scene, actions]);

	const ratioScale = Math.min(1.2, Math.max(0.5, window.innerWidth / 1920));

	return (
		<>
			<color attach="background" args={["#ffffff"]} />
			<group ref={group} dispose={null}>
				<PerspectiveCamera makeDefault position={[3, 3, 8]} near={0.5} />
				<OrbitControls autoRotate enablePan={false} maxPolarAngle={DEG2RAD * 75} minDistance={6} maxDistance={10} autoRotateSpeed={0.5} />
				<primitive object={scene} scale={ratioScale * 0.03} />
				<ambientLight intensity={0.1} color="pink" />
				<AccumulativeShadows frames={100} alphaTest={0.9} scale={30} position={[0, -0.005, 0]} color="pink" opacity={0.8}>
					<RandomizedLight amount={4} radius={9} intensity={0.8} ambient={0.25} position={[10, 5, 15]} />
					<RandomizedLight amount={4} radius={5} intensity={0.5} position={[-5, 5, 15]} bias={0.001} />
				</AccumulativeShadows>
				<Environment blur={0.8} background>
					<Sphere scale={15}>
						<meshBasicMaterial color={mainColor} side={BackSide} />
					</Sphere>
					<Lightformer position={[5, 0, -5]} form="rect" intensity={1} color="red" scale={3} target={[0, 0, 0]} />
					<Lightformer position={[-5, 0, 1]} form="circle" intensity={1} color="green" scale={[2, 5, 1]} target={[0, 0, 0]} />
					<Lightformer position={[0, 5, -2]} form="ring" intensity={0.5} color="orange" scale={[10, 5, 1]} target={[0, 0, 0]} />
					<Lightformer position={[0, 0, 5]} form="rect" intensity={1} color="purple" scale={[10, 5, 1]} target={[0, 0, 0]} />
				</Environment>
			</group>
		</>
	);
};

useGLTF.preload("/models/gallery/cybertruck_scene.glb");
useGLTF.preload("/models/gallery/model3_scene.glb");
useGLTF.preload("/models/gallery/chest.glb");
