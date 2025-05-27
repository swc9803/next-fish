import { useEffect, useRef, RefObject } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector2, Vector3, Raycaster, Mesh, Object3D } from "three";
import gsap from "gsap";
import { useFishStore } from "@/store/useFishStore";

interface ClickHandlerProps {
	fishRef: RefObject<Object3D>;
	planeRef: RefObject<Mesh>;
	isInBombZone: boolean;
	isGameOver: boolean;
}

const GRID_CENTER = new Vector3(-50, 0, 0);
const GRID_SIZE_X = 42;
const GRID_SIZE_Z = 42;

export const ClickHandler = ({ fishRef, planeRef, isInBombZone, isGameOver }: ClickHandlerProps) => {
	const { camera, gl } = useThree();
	const raycaster = useRef(new Raycaster());
	const mouse = useRef(new Vector2());
	const isClicked = useRef(false);
	const fishSpeed = useFishStore((s) => s.fishSpeed);
	const fishScaleRef = useRef(useFishStore.getState().fishScale);

	// ground, grid 바깥 클릭 제한
	const clampToBounds = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

	const getClampedPlaneCoords = (x: number, z: number) => {
		const halfPlaneX = 175;
		const halfPlaneZ = 35;
		const margin = fishScaleRef.current * 2.5;
		return {
			x: clampToBounds(x, -halfPlaneX + margin, halfPlaneX - margin),
			z: clampToBounds(z, -halfPlaneZ + margin, halfPlaneZ - margin),
		};
	};

	useEffect(() => {
		const canvas = gl.domElement;

		const updateMouse = (e: PointerEvent) => {
			mouse.current.x = (e.clientX / canvas.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
		};

		const onPointerDown = (e: PointerEvent) => {
			isClicked.current = true;
			updateMouse(e);
		};

		const onPointerUp = () => {
			isClicked.current = false;
		};

		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", updateMouse);
		window.addEventListener("pointerup", onPointerUp);

		return () => {
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", updateMouse);
			window.removeEventListener("pointerup", onPointerUp);
		};
	}, [gl]);

	useFrame(() => {
		if (!isClicked.current || isGameOver || !fishRef.current || !planeRef.current) return;

		raycaster.current.setFromCamera(mouse.current, camera);
		const intersects = raycaster.current.intersectObject(planeRef.current);
		if (!intersects.length) return;

		const point = intersects[0].point;
		let { x: targetX, z: targetZ } = point;

		if (isNaN(targetX) || isNaN(targetZ)) return;

		if (isInBombZone) {
			targetX = clampToBounds(targetX, GRID_CENTER.x - GRID_SIZE_X / 2 + 1, GRID_CENTER.x + GRID_SIZE_X / 2 - 1);
			targetZ = clampToBounds(targetZ, GRID_CENTER.z - GRID_SIZE_Z / 2 + 1, GRID_CENTER.z + GRID_SIZE_Z / 2 - 1);
		} else {
			const clamped = getClampedPlaneCoords(targetX, targetZ);
			targetX = clamped.x;
			targetZ = clamped.z;
		}

		const fish = fishRef.current;
		const currentPos = fish.position;
		const targetPos = new Vector3(targetX, currentPos.y, targetZ);
		const distance = currentPos.distanceTo(targetPos);

		fish.lookAt(targetPos);
		gsap.killTweensOf(fish.position);
		gsap.to(fish.position, { x: targetX, z: targetZ, duration: distance / fishSpeed });
	});

	return null;
};
