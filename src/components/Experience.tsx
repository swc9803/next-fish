"use client";

// library
import { Suspense, useRef, useState, useEffect, JSX } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Vector2, Vector3, Raycaster, BoxGeometry, Mesh, Object3D, MeshStandardMaterial } from "three";
import gsap from "gsap";

// store
import { useFishStore } from "@/store/useFishStore";

type RefMesh = React.RefObject<Mesh>;
type RefAny = React.RefObject<Object3D>;
type Vec3 = [number, number, number];

const FishConfig = () => {
	const { fishColor, fishSpeed, fishScale, darkMode, setFishColor, setFishSpeed, setFishScale, toggleDarkMode } = useFishStore();

	return (
		<div className={`fish_config ${darkMode ? "dark" : ""}`}>
			<div>
				<label>Fish Color: </label>
				<input type="color" value={fishColor} onChange={(e) => setFishColor(e.target.value)} />
			</div>
			<div>
				<label>Fish Speed: </label>
				<input type="number" value={fishSpeed} onChange={(e) => setFishSpeed(Number(e.target.value))} min={10} max={200} />
			</div>
			<div>
				<label>Fish Scale: </label>
				<input type="number" value={fishScale} onChange={(e) => setFishScale(Number(e.target.value))} min={0.1} max={10} step={0.1} />
			</div>
			<button onClick={toggleDarkMode} type="button">
				{darkMode ? "Set LightMode" : "Set DarkMode"}
			</button>
		</div>
	);
};

interface FishModelProps {
	fishRef: RefAny;
	sphereRefs: RefMesh[];
}

const FishModel = ({ fishRef, sphereRefs }: FishModelProps) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const [isNearSphere, setIsNearSphere] = useState<boolean[]>([false, false, false, false]);
	const [showHitBox, setShowHitBox] = useState(false);
	const hitBoxRef = useRef<Mesh>(null);

	const { fishColor, fishScale } = useFishStore();

	useEffect(() => {
		const toggleHitBox = (e: KeyboardEvent) => {
			if (e.key === "d") setShowHitBox((prev) => !prev);
		};

		window.addEventListener("keydown", toggleHitBox);
		return () => window.removeEventListener("keydown", toggleHitBox);
	}, []);

	scene.traverse((child) => {
		if (!(child instanceof Mesh)) return;
		if (child.name !== "Mesh") return;

		child.castShadow = true;

		const material = child.material;
		if (Array.isArray(material)) {
			material.forEach((mat) => {
				if (mat instanceof MeshStandardMaterial && mat.color) {
					mat.color.set(fishColor);
				}
			});
		} else if (material instanceof MeshStandardMaterial && material.color) {
			material.color.set(fishColor);
		}
	});

	useFrame(() => {
		if (fishRef.current) {
			fishRef.current.scale.set(fishScale, fishScale, fishScale);

			if (hitBoxRef.current) {
				hitBoxRef.current.position.copy(fishRef.current.position);
				hitBoxRef.current.scale.set(fishScale * 2, fishScale * 2, fishScale * 2);
			}

			const fishPosition = fishRef.current.position as Vector3;

			sphereRefs.forEach((sphereRef, index) => {
				if (sphereRef.current) {
					const distance = fishPosition.distanceTo(sphereRef.current.position);
					if (distance < 5 && !isNearSphere[index]) {
						gsap.to(sphereRef.current.scale, { x: 2, y: 2, z: 2, duration: 0.5 });
						setIsNearSphere((prev) => {
							const next = [...prev];
							next[index] = true;
							return next;
						});
					} else if (distance >= 5 && isNearSphere[index]) {
						gsap.to(sphereRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
						setIsNearSphere((prev) => {
							const next = [...prev];
							next[index] = false;
							return next;
						});
					}
				}
			});

			camera.position.set(fishPosition.x, 17, fishPosition.z + 14);
			camera.lookAt(fishPosition);
		}
	});

	return (
		<>
			<primitive ref={fishRef} object={scene} position={[0, 1, 0]} castShadow />
			{showHitBox && (
				<mesh ref={hitBoxRef}>
					<boxGeometry args={[1, 1, 1]} />
					<meshBasicMaterial color="red" wireframe transparent opacity={0.5} />
				</mesh>
			)}
		</>
	);
};

interface PlaneProps {
	planeRef: RefMesh;
}

const Plane = ({ planeRef }: PlaneProps) => (
	<mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
		<planeGeometry args={[350, 70]} />
		<meshPhongMaterial color={0x00bfff} />
	</mesh>
);

interface SphereProps {
	sphereRef: RefMesh;
	position: Vec3;
}

const Sphere = ({ sphereRef, position }: SphereProps) => (
	<mesh ref={sphereRef} position={position} castShadow>
		<sphereGeometry args={[1, 32, 32]} />
		<meshStandardMaterial color="skyblue" />
	</mesh>
);

interface ClickHandlerProps {
	fishRef: RefAny;
	planeRef: RefMesh;
}

const ClickHandler = ({ fishRef, planeRef }: ClickHandlerProps): JSX.Element => {
	const { camera, gl } = useThree();
	const raycaster = useRef(new Raycaster());
	const mouse = useRef(new Vector2());
	const [isClicked, setIsClicked] = useState(false);
	const fishSpeed = useFishStore((state) => state.fishSpeed);

	useEffect(() => {
		const canvas = gl.domElement;

		const updateMousePosition = (e: MouseEvent) => {
			mouse.current.x = (e.clientX / canvas.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
		};

		const onMouseDown = (e: MouseEvent) => {
			setIsClicked(true);
			updateMousePosition(e);
		};

		canvas.addEventListener("mousedown", onMouseDown);
		canvas.addEventListener("mousemove", updateMousePosition);
		window.addEventListener("mouseup", () => setIsClicked(false));

		return () => {
			canvas.removeEventListener("mousedown", onMouseDown);
			canvas.removeEventListener("mousemove", updateMousePosition);
			window.removeEventListener("mouseup", () => setIsClicked(false));
		};
	}, [gl]);

	useFrame(() => {
		if (isClicked && fishRef.current && planeRef.current) {
			raycaster.current.setFromCamera(mouse.current, camera);
			const intersects = raycaster.current.intersectObject(planeRef.current);

			if (intersects.length > 0) {
				const point = intersects[0].point;
				const distance = fishRef.current.position.distanceTo(point);
				const duration = distance / fishSpeed;

				const target = new Vector3(point.x, fishRef.current.position.y, point.z);
				fishRef.current.lookAt(target);

				gsap.killTweensOf(fishRef.current.position);
				gsap.to(fishRef.current.position, {
					x: point.x,
					z: point.z,
					duration,
				});
			}
		}
	});
	return <></>;
};

interface GridProps {
	fishRef: RefAny;
}

const Grid = ({ fishRef }: GridProps) => {
	const fishScale = useFishStore((state) => state.fishScale);
	const cellSize = 6;
	const [activeCell, setActiveCell] = useState<number | null>(null);

	const cells: Vec3[] = [];
	for (let x = -3; x <= 3; x++) {
		for (let z = -3; z <= 3; z++) {
			cells.push([x * cellSize, 0.1, z * cellSize]);
		}
	}

	useEffect(() => {
		const interval = setInterval(() => {
			const randomIndex = Math.floor(Math.random() * cells.length);
			setActiveCell(randomIndex);

			setTimeout(() => {
				if (fishRef.current) {
					const fishPos = fishRef.current.position as Vector3;
					const cellPos = cells[randomIndex];
					const radius = cellSize / 2 + (fishScale * cellSize) / 4;

					const isHit = Math.abs(fishPos.x - cellPos[0]) < radius && Math.abs(fishPos.z - cellPos[2]) < radius;

					if (isHit) {
						console.log("hit");
					}
				}
				setActiveCell(null);
			}, 2000);
		}, 2500);

		return () => clearInterval(interval);
	}, [cells, fishRef, fishScale]);

	return cells.map((pos, i) => (
		<group key={i} position={pos}>
			<mesh>
				<boxGeometry args={[cellSize, 0.1, cellSize]} />
				<meshStandardMaterial color={activeCell === i ? "red" : "white"} />
			</mesh>
			<lineSegments>
				<edgesGeometry args={[new BoxGeometry(cellSize, 0.1, cellSize)]} />
				<lineBasicMaterial color="black" />
			</lineSegments>
		</group>
	));
};

const Experience = () => {
	const sphereRefs: RefMesh[] = [useRef(null), useRef(null), useRef(null), useRef(null)];
	const fishRef = useRef<Object3D>(null);
	const planeRef = useRef<Mesh>(null);
	const darkMode = useFishStore((state) => state.darkMode);

	const spherePositions: Vec3[] = [
		[30, 1, 0],
		[-30, 1, 0],
		[0, 1, 30],
		[0, 1, -30],
	];

	return (
		<>
			<Canvas shadows camera={{ position: [0, 17, 14], fov: 75 }}>
				<color attach="background" args={[darkMode ? "#0b0b0b" : "#0c6ceb"]} />
				<fogExp2 attach="fog" args={[darkMode ? "#111111" : "#00bfff", 0.02]} />
				<ambientLight color={0xffffff} intensity={0.8} />
				<directionalLight color={0xf8f8ff} intensity={4} position={[2, 1, 3]} castShadow />

				<Suspense fallback={null}>
					<FishModel fishRef={fishRef} sphereRefs={sphereRefs} />
					<Plane planeRef={planeRef} />
					<Grid fishRef={fishRef} />
					{sphereRefs.map((ref, i) => (
						<Sphere key={i} sphereRef={ref} position={spherePositions[i]} />
					))}
					<ClickHandler fishRef={fishRef} planeRef={planeRef} />
				</Suspense>
			</Canvas>

			<FishConfig />
		</>
	);
};

export default Experience;
