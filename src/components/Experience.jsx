"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { Vector2, Vector3, Raycaster, BoxGeometry } from "three";
import { useFishStore } from "@/store/useFishStore";

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
				<input type="number" value={fishSpeed} onChange={(e) => setFishSpeed(Number(e.target.value))} min="10" max="200" />
			</div>
			<div>
				<label>Fish Scale: </label>
				<input type="number" value={fishScale} onChange={(e) => setFishScale(Number(e.target.value))} min="0.1" max="10" step="0.1" />
			</div>
			<button onClick={toggleDarkMode} type="button">
				{darkMode ? "Set LightMode" : "Set DarkMode"}
			</button>
		</div>
	);
};

const FishModel = ({ fishRef, sphereRefs }) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const [isNearSphere, setIsNearSphere] = useState([false, false, false, false]);
	const [showHitBox, setShowHitBox] = useState(false);
	const hitBoxRef = useRef();

	const { fishColor, fishScale } = useFishStore();

	useEffect(() => {
		const toggleHitBox = (e) => {
			if (e.key === "d") {
				setShowHitBox((prev) => !prev);
			}
		};
		window.addEventListener("keydown", toggleHitBox);
		return () => window.removeEventListener("keydown", toggleHitBox);
	}, []);

	scene.traverse((child) => {
		if (child.isMesh) {
			child.castShadow = true;
			child.material.color.set(fishColor);
		}
	});

	useFrame(() => {
		if (fishRef.current) {
			fishRef.current.scale.set(fishScale, fishScale, fishScale);

			if (hitBoxRef.current) {
				hitBoxRef.current.position.copy(fishRef.current.position);
				hitBoxRef.current.scale.set(fishScale * 2, fishScale * 2, fishScale * 2);
			}

			const fishPosition = fishRef.current.position;
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

const Plane = ({ planeRef }) => (
	<mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
		<planeGeometry args={[350, 70]} />
		<meshPhongMaterial color={0x00bfff} />
	</mesh>
);

const Sphere = ({ sphereRef, position }) => (
	<mesh ref={sphereRef} position={position} castShadow>
		<sphereGeometry args={[1, 32, 32]} />
		<meshStandardMaterial color="skyblue" />
	</mesh>
);

const ClickHandler = ({ fishRef, planeRef }) => {
	const { camera, gl } = useThree();
	const raycaster = useRef(new Raycaster());
	const mouse = useRef(new Vector2());
	const [isClicked, setIsClicked] = useState(false);
	const fishSpeed = useFishStore((state) => state.fishSpeed);

	useEffect(() => {
		const canvas = gl.domElement;

		const updateMousePosition = (e) => {
			mouse.current.x = (e.clientX / canvas.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / canvas.clientHeight) * 2 + 1;
		};

		canvas.addEventListener("mousedown", (e) => {
			setIsClicked(true);
			updateMousePosition(e);
		});
		canvas.addEventListener("mousemove", updateMousePosition);
		window.addEventListener("mouseup", () => setIsClicked(false));

		return () => {
			canvas.removeEventListener("mousedown", updateMousePosition);
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
};

const Grid = ({ fishRef }) => {
	const fishScale = useFishStore((state) => state.fishScale);
	const cellSize = 6;
	const [activeCell, setActiveCell] = useState(null);

	const cells = [];
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
					const fishPos = fishRef.current.position;
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
	const sphereRefs = [useRef(), useRef(), useRef(), useRef()];
	const fishRef = useRef();
	const planeRef = useRef();
	const darkMode = useFishStore((state) => state.darkMode);

	const spherePositions = [
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
