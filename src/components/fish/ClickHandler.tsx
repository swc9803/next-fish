import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector2, Vector3, Raycaster, Mesh, Object3D } from "three";
import gsap from "gsap";
import { useFishStore } from "@/store/useFishStore";

interface ClickHandlerProps {
	fishRef: React.RefObject<Object3D>;
	planeRef: React.RefObject<Mesh>;
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
	const [isClicked, setIsClicked] = useState(false);
	const fishSpeed = useFishStore((state) => state.fishSpeed);
	const fishScaleRef = useRef(useFishStore.getState().fishScale);

	// ground, grid 바깥 클릭 제한
	const clampToBounds = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
	const getClampedPlaneCoords = (x: number, z: number) => {
		const halfPlaneX = 350 / 2;
		const halfPlaneZ = 70 / 2;
		const margin = fishScaleRef.current * 2.5;

		return {
			x: clampToBounds(x, -halfPlaneX + margin, halfPlaneX - margin),
			z: clampToBounds(z, -halfPlaneZ + margin, halfPlaneZ - margin),
		};
	};

	useEffect(() => {
		const canvas = gl.domElement;

		const updateMouse = (e: MouseEvent) => {
			mouse.current.x = (e.clientX / canvas.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
		};

		const onPointerDown = (e: MouseEvent) => {
			setIsClicked(true);
			updateMouse(e);
		};

		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", updateMouse);
		window.addEventListener("pointerup", () => setIsClicked(false));

		return () => {
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", updateMouse);
			window.removeEventListener("pointerup", () => setIsClicked(false));
		};
	}, [gl]);

	useFrame(() => {
		if (isGameOver || !isClicked || !fishRef.current || !planeRef.current) return;

		raycaster.current.setFromCamera(mouse.current, camera);
		const intersects = raycaster.current.intersectObject(planeRef.current);

		if (intersects.length > 0) {
			const point = intersects[0].point;
			let targetX = point.x;
			let targetZ = point.z;

			if (isInBombZone) {
				targetX = clampToBounds(point.x, GRID_CENTER.x - GRID_SIZE_X / 2 + 1, GRID_CENTER.x + GRID_SIZE_X / 2 - 1);
				targetZ = clampToBounds(point.z, GRID_CENTER.z - GRID_SIZE_Z / 2 + 1, GRID_CENTER.z + GRID_SIZE_Z / 2 - 1);
			} else {
				const clamped = getClampedPlaneCoords(point.x, point.z);
				targetX = clamped.x;
				targetZ = clamped.z;
			}

			const distance = fishRef.current.position.distanceTo(new Vector3(targetX, point.y, targetZ));
			const duration = distance / fishSpeed;

			const target = new Vector3(targetX, fishRef.current.position.y, targetZ);
			fishRef.current.lookAt(target);

			gsap.killTweensOf(fishRef.current.position);
			gsap.to(fishRef.current.position, {
				x: targetX,
				z: targetZ,
				duration,
			});
		}
	});

	return null;
};
