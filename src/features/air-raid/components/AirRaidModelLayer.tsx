"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { memo, type RefObject, useEffect, useMemo, useRef } from "react";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
	AnimationMixer,
	Box3,
	Color,
	LoopRepeat,
	Mesh,
	MeshStandardMaterial,
	OrthographicCamera,
	type AnimationAction,
	type Group,
	type Object3D,
	Vector3,
} from "three";

import { useFishStore } from "@/store/useFishStore";
import styles from "../AirRaidGame.module.scss";
import type { GameState, Layout } from "../core/types";

type AirRaidModelLayerProps = {
	stateRef: RefObject<GameState | null>;
	layoutRef: RefObject<Layout>;
};

const FISH_MODEL_PATH = "/models/fish.glb";
const SHELL_MODEL_PATHS = ["/models/decoration/shell1.glb", "/models/decoration/shell2.glb", "/models/decoration/seastar.glb"];
const MAX_ORBIT_WEAPONS = 5;
const BASE_FISH_ROTATION_X = -Math.PI * 0.5;
const BASE_FISH_ROTATION_Z = 0;
const ORBIT_WEAPON_BASE_VISUAL_SIZE = 12;
const ORBIT_WEAPON_LEVEL_VISUAL_SIZE = 1.45;
const ORBIT_WEAPON_MAX_VISUAL_SIZE = 20;
const ORBIT_WEAPON_DEPTH_VISUAL_SCALE = 0.12;

const getModelSize = (object: Object3D) => {
	const box = new Box3().setFromObject(object);
	const size = new Vector3();
	box.getSize(size);
	return Math.max(size.x, size.y, size.z, 1);
};

const centerObject = (object: Object3D) => {
	const box = new Box3().setFromObject(object);
	const center = new Vector3();
	box.getCenter(center);
	object.position.sub(center);
};

const ModelPrimitive = memo(({ path, normalize = false }: { path: string; normalize?: boolean }) => {
	const { scene } = useGLTF(path);
	const object = useMemo(() => {
		const clone = cloneSkeleton(scene);
		centerObject(clone);
		if (normalize) clone.scale.setScalar(1 / getModelSize(clone));
		clone.traverse((child) => {
			if (child instanceof Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		return clone;
	}, [normalize, scene]);

	return <primitive object={object} />;
});

ModelPrimitive.displayName = "ModelPrimitive";

const AnimatedFishModel = memo(({ timeScaleRef }: { timeScaleRef: RefObject<number> }) => {
	const { scene, animations } = useGLTF(FISH_MODEL_PATH);
	const fishColor = useFishStore((state) => state.fishColor);
	const object = useMemo(() => {
		const clone = cloneSkeleton(scene);
		centerObject(clone);
		return clone;
	}, [scene]);
	const mixerRef = useRef<AnimationMixer | null>(null);
	const swimActionRef = useRef<AnimationAction | null>(null);
	const materialsRef = useRef<MeshStandardMaterial[]>([]);

	useEffect(() => {
		const materials: MeshStandardMaterial[] = [];
		object.traverse((child) => {
			if (child instanceof Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				const materialsToCheck = Array.isArray(child.material) ? child.material : [child.material];
				materials.push(...materialsToCheck.filter((material): material is MeshStandardMaterial => material instanceof MeshStandardMaterial));
			}
		});
		materialsRef.current = materials;
	}, [object]);

	useEffect(() => {
		const nextColor = new Color(fishColor);
		for (const material of materialsRef.current) {
			material.color.copy(nextColor);
			material.needsUpdate = true;
		}
	}, [fishColor]);

	useEffect(() => {
		const mixer = new AnimationMixer(object);
		const swimClip = animations.find((clip) => clip.name.toLowerCase().includes("swim")) ?? animations[0];
		if (swimClip) {
			const action = mixer.clipAction(swimClip);
			action.setLoop(LoopRepeat, Infinity);
			action.play();
			swimActionRef.current = action;
		}
		mixerRef.current = mixer;

		return () => {
			mixer.stopAllAction();
			mixer.uncacheRoot(object);
			mixerRef.current = null;
			swimActionRef.current = null;
		};
	}, [animations, object]);

	useFrame((_, delta) => {
		if (swimActionRef.current) swimActionRef.current.timeScale = timeScaleRef.current;
		mixerRef.current?.update(delta);
	});

	return <primitive object={object} />;
});

AnimatedFishModel.displayName = "AnimatedFishModel";

const OceanModelScene = ({ stateRef, layoutRef }: AirRaidModelLayerProps) => {
	const fishGroupRef = useRef<Group>(null);
	const weaponRefs = useRef<Array<Group | null>>([]);
	const { scene: fishScene } = useGLTF(FISH_MODEL_PATH);
	const { camera } = useThree();
	const fishModelSize = useMemo(() => getModelSize(fishScene), [fishScene]);
	const fishScale = useFishStore((state) => state.fishScale);
	const previousPlayerRef = useRef({ x: 0, y: 0, initialized: false });
	const modelInitializedRef = useRef(false);
	const animationTimeScaleRef = useRef(0.35);
	const scaleVectorRef = useRef(new Vector3());
	const targetPositionRef = useRef(new Vector3());

	const syncCameraToLayout = () => {
		if (!(camera instanceof OrthographicCamera)) return;

		const layout = layoutRef.current;
		if (camera.right === layout.width / 2 && camera.top === layout.height / 2 && camera.zoom === 1) return;

		camera.left = -layout.width / 2;
		camera.right = layout.width / 2;
		camera.top = layout.height / 2;
		camera.bottom = -layout.height / 2;
		camera.zoom = 1;
		camera.near = 0.1;
		camera.far = 2000;
		camera.position.set(0, 0, 1000);
		camera.lookAt(0, 0, 0);
		camera.updateProjectionMatrix();
	};

	const toScenePoint = (x: number, y: number, depth = 0) => {
		const layout = layoutRef.current;
		const screenX = layout.offsetX + x * layout.scale;
		const screenY = layout.offsetY + y * layout.scale;

		return {
			x: screenX - layout.width / 2,
			y: layout.height / 2 - screenY,
			z: depth,
			pixelUnit: layout.scale,
		};
	};

	useFrame((_, delta) => {
		syncCameraToLayout();

		const state = stateRef.current;
		const fishGroup = fishGroupRef.current;
		if (!state || !fishGroup) return;

		const previousPlayer = previousPlayerRef.current;
		if (!previousPlayer.initialized) {
			previousPlayer.x = state.player.x;
			previousPlayer.y = state.player.y;
			previousPlayer.initialized = true;
		}

		const velocityX = (state.player.x - previousPlayer.x) / Math.max(delta, 0.001);
		const velocityY = (state.player.y - previousPlayer.y) / Math.max(delta, 0.001);
		const movementSpeed = Math.hypot(velocityX, velocityY);
		previousPlayer.x = state.player.x;
		previousPlayer.y = state.player.y;

		const playerPoint = toScenePoint(state.player.x, state.player.y, 12);
		const visualFishScale = Math.min(1.18, Math.max(0.92, 0.98 + (fishScale - 1) * 0.08));
		const gameFishScale = ((state.player.radius * 3.6 * playerPoint.pixelUnit) / fishModelSize) * visualFishScale;
		const swimTilt = Math.sin(state.time * 6) * 0.1;
		const chargeLift = state.player.isCharging ? Math.min(state.player.meleeCharge, 1) * 0.03 : 0;
		const targetPosition = targetPositionRef.current.set(playerPoint.x, playerPoint.y + chargeLift * 48 * playerPoint.pixelUnit, playerPoint.z);
		const movementBank = Math.max(-1, Math.min(1, velocityX / 420));
		const movementPitch = Math.max(-1, Math.min(1, -velocityY / 420));
		const targetRotationX = BASE_FISH_ROTATION_X + movementPitch * 0.18 + swimTilt;
		const targetRotationY = movementBank * 0.34;
		const targetRotationZ = BASE_FISH_ROTATION_Z + movementBank * 0.28 + Math.sin(state.time * 4.2) * 0.05;

		fishGroup.visible = state.mode !== "ready";
		if (!modelInitializedRef.current) {
			fishGroup.position.copy(targetPosition);
			fishGroup.scale.setScalar(gameFishScale);
			fishGroup.rotation.set(targetRotationX, targetRotationY, targetRotationZ);
			modelInitializedRef.current = true;
		} else {
			fishGroup.position.copy(targetPosition);
			fishGroup.scale.lerp(scaleVectorRef.current.set(gameFishScale, gameFishScale, gameFishScale), Math.min(1, delta * 12));
			fishGroup.rotation.x += (targetRotationX - fishGroup.rotation.x) * Math.min(1, delta * 10);
			fishGroup.rotation.y += (targetRotationY - fishGroup.rotation.y) * Math.min(1, delta * 10);
			fishGroup.rotation.z += (targetRotationZ - fishGroup.rotation.z) * Math.min(1, delta * 10);
		}
		animationTimeScaleRef.current += (Math.min(1.45, 0.25 + movementSpeed * 0.0032) - animationTimeScaleRef.current) * Math.min(1, delta * 8);

		for (let i = 0; i < MAX_ORBIT_WEAPONS; i++) {
			const weaponGroup = weaponRefs.current[i];
			if (!weaponGroup) continue;

			const pet = state.pets[i];
			weaponGroup.visible = Boolean(pet) && state.mode !== "ready";
			if (!pet) continue;

			const angle = state.time * (1.55 + pet.level * 0.08) + pet.phase;
			const radiusPx = 35 + Math.min(4, pet.level) * 4 + Math.sin(state.time * 3 + pet.phase) * 2;
			const depth = Math.sin(angle);
			const orbitX = state.player.x + Math.cos(angle) * radiusPx;
			const orbitY = state.player.y + Math.sin(angle) * radiusPx * 0.72;
			const point = toScenePoint(orbitX, orbitY, 15 + depth * 5 + i * 0.2);
			const shellSize = Math.min(ORBIT_WEAPON_MAX_VISUAL_SIZE, ORBIT_WEAPON_BASE_VISUAL_SIZE + pet.level * ORBIT_WEAPON_LEVEL_VISUAL_SIZE);
			const shellScale = shellSize * point.pixelUnit * (1 + depth * ORBIT_WEAPON_DEPTH_VISUAL_SCALE);

			weaponGroup.position.set(point.x, point.y, point.z);
			weaponGroup.scale.setScalar(shellScale);
			weaponGroup.rotation.set(0.85 + Math.sin(angle) * 0.22, angle * 0.48, -angle * 1.18);
		}
	});

	return (
		<>
			<ambientLight intensity={1.1} />
			<hemisphereLight args={["#b8f7ff", "#083345", 1.6]} />
			<directionalLight position={[2, 5, 8]} intensity={2.4} />
			<pointLight position={[-3, -4, 9]} color="#7df8ff" intensity={1.6} distance={9} />
			<group ref={fishGroupRef} visible={false}>
				<AnimatedFishModel timeScaleRef={animationTimeScaleRef} />
			</group>
			{Array.from({ length: MAX_ORBIT_WEAPONS }, (_, index) => (
				<group
					key={index}
					visible={false}
					ref={(node) => {
						weaponRefs.current[index] = node;
					}}
				>
					<ModelPrimitive path={SHELL_MODEL_PATHS[index % SHELL_MODEL_PATHS.length]} normalize />
				</group>
			))}
		</>
	);
};

export const AirRaidModelLayer = ({ stateRef, layoutRef }: AirRaidModelLayerProps) => {
	return (
		<div className={styles.modelLayer} aria-hidden="true">
			<Canvas
				orthographic
				camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 2000 }}
				dpr={[1, 1.5]}
				gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
			>
				<OceanModelScene stateRef={stateRef} layoutRef={layoutRef} />
			</Canvas>
		</div>
	);
};

useGLTF.preload(FISH_MODEL_PATH);
for (const path of SHELL_MODEL_PATHS) {
	useGLTF.preload(path);
}
