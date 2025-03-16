"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import * as THREE from "three";

// 폭피, 원바운드, 물고기키우기
// 액자 제거 및 갤러리룸 추가, 갤러리룸 벽에 닿으면 입장?

const FishConfig = ({ setFishColor, setFishSpeed, setFishScale }) => {
	const [colorInput, setColorInput] = useState("#ffffff");
	const [speedInput, setSpeedInput] = useState(30);
	const [scaleInput, setScaleInput] = useState(1);

	const handleColorChange = (e) => {
		setColorInput(e.target.value);
		setFishColor(e.target.value);
	};

	const handleSpeedChange = (e) => {
		const inputSpeed = e.target.value;
		const parsedSpeed = Number(inputSpeed);

		if (!isNaN(parsedSpeed)) {
			setSpeedInput(parsedSpeed);
			setFishSpeed(parsedSpeed);
		}
	};

	const handleScaleChange = (e) => {
		const inputScale = e.target.value;
		const parsedScale = Number(inputScale);

		if (!isNaN(parsedScale)) {
			setScaleInput(parsedScale);
			setFishScale(parsedScale);
		}
	};

	return (
		<div style={{ position: "absolute", bottom: 20, right: 20, background: "white", padding: "10px", borderRadius: "10px" }}>
			<div>
				<label>Fish Color: </label>
				<input type="color" value={colorInput} onChange={handleColorChange} />
			</div>
			<div>
				<label>Fish Speed: </label>
				<input type="number" value={speedInput.toString()} onChange={handleSpeedChange} min="10" max="200" />
			</div>
			<div>
				<label>Fish Scale: </label>
				<input type="number" value={scaleInput.toString()} onChange={handleScaleChange} min="0.1" max="10" step="0.1" />
			</div>
		</div>
	);
};

const FishModel = ({ fishRef, sphereRefs, fishColor, fishScale }) => {
	const { scene } = useGLTF("/models/fish.glb");
	const { camera } = useThree();
	const [isNearSphere, setIsNearSphere] = useState([false, false, false, false]);
	const [showHitBox, setShowHitBox] = useState(false);
	const hitBoxRef = useRef();

	useEffect(() => {
		// 디버그
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
				hitBoxRef.current.position.set(fishRef.current.position.x, fishRef.current.position.y, fishRef.current.position.z);
				hitBoxRef.current.scale.set(fishScale * 2, fishScale * 2, fishScale * 2);
			}

			const fishPosition = fishRef.current.position;

			sphereRefs.forEach((sphereRef, index) => {
				if (sphereRef.current) {
					const spherePosition = sphereRef.current.position;
					const distance = fishPosition.distanceTo(spherePosition);

					if (distance < 5 && !isNearSphere[index]) {
						gsap.to(sphereRef.current.scale, { x: 2, y: 2, z: 2, duration: 0.5 });
						setIsNearSphere((prevState) => {
							const newState = [...prevState];
							newState[index] = true;
							return newState;
						});
					} else if (distance >= 5 && isNearSphere[index]) {
						gsap.to(sphereRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
						setIsNearSphere((prevState) => {
							const newState = [...prevState];
							newState[index] = false;
							return newState;
						});
					}
				}
			});

			const cameraOffsetY = 17;
			const cameraOffsetZ = 14;

			camera.position.set(fishPosition.x, cameraOffsetY, fishPosition.z + cameraOffsetZ);
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

const Plane = ({ planeRef }) => {
	return (
		<mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
			<planeGeometry args={[350, 70]} />
			<meshPhongMaterial color={0x00bfff} />
		</mesh>
	);
};

const Sphere = ({ sphereRef, position }) => {
	return (
		<mesh ref={sphereRef} position={position} castShadow>
			<sphereGeometry args={[1, 32, 32]} />
			<meshStandardMaterial color="skyblue" />
		</mesh>
	);
};

const ClickHandler = ({ fishRef, planeRef, fishMoveSpeed }) => {
	const { camera, gl } = useThree();
	const raycaster = useRef(new THREE.Raycaster());
	const mouse = useRef(new THREE.Vector2());
	const [isClicked, setIsClicked] = useState(false);

	useEffect(() => {
		const handleMouseDown = (e) => {
			setIsClicked(true);
			updateMousePosition(e);
		};

		const handleMouseMove = (e) => {
			updateMousePosition(e);
		};

		const handleMouseUp = () => {
			setIsClicked(false);
		};

		const updateMousePosition = (e) => {
			mouse.current.x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;
		};

		const canvas = gl.domElement;
		canvas.addEventListener("mousedown", handleMouseDown);
		canvas.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			canvas.removeEventListener("mousedown", handleMouseDown);
			canvas.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [gl]);

	useFrame(() => {
		if (isClicked && fishRef.current && planeRef.current) {
			raycaster.current.setFromCamera(mouse.current, camera);
			const intersects = raycaster.current.intersectObject(planeRef.current);

			if (intersects.length > 0) {
				const intersectionPoint = intersects[0].point;

				const distance = fishRef.current.position.distanceTo(intersectionPoint);
				const duration = distance / fishMoveSpeed;

				const horizontalTarget = new THREE.Vector3(intersectionPoint.x, fishRef.current.position.y, intersectionPoint.z);
				fishRef.current.lookAt(horizontalTarget);

				gsap.killTweensOf(fishRef.current.position);
				gsap.to(fishRef.current.position, {
					x: intersectionPoint.x,
					z: intersectionPoint.z,
					duration: duration,
				});
			}
		}
	});
};

const Grid = ({ fishRef, fishScale }) => {
	const cellSize = 6;
	const cells = [];
	const [activeCell, setActiveCell] = useState(null);

	for (let x = -3; x <= 3; x++) {
		for (let z = -3; z <= 3; z++) {
			cells.push({
				position: [x * cellSize, 0.1, z * cellSize],
				color: "white",
			});
		}
	}

	useEffect(() => {
		const interval = setInterval(() => {
			const randomIndex = Math.floor(Math.random() * cells.length);
			setActiveCell(randomIndex);

			setTimeout(() => {
				if (fishRef.current) {
					const fishPosition = fishRef.current.position;
					const cellPosition = cells[randomIndex].position;

					const adjustedHitRadius = cellSize / 2 + (fishScale * cellSize) / 4;

					const isHit =
						Math.abs(fishPosition.x - cellPosition[0]) < adjustedHitRadius && Math.abs(fishPosition.z - cellPosition[2]) < adjustedHitRadius;

					if (isHit) {
						console.log("hit");
					}
				}
				setActiveCell(null);
			}, 2000);
		}, 2500);

		return () => clearInterval(interval);
	}, [cells, fishRef, fishScale]);

	return cells.map((cell, index) => (
		<group key={index} position={cell.position}>
			<mesh>
				<boxGeometry args={[cellSize, 0.1, cellSize]} />
				<meshStandardMaterial color={activeCell === index ? "red" : "white"} />
			</mesh>
			<lineSegments>
				<edgesGeometry args={[new THREE.BoxGeometry(cellSize, 0.1, cellSize)]} />
				<lineBasicMaterial color="black" />
			</lineSegments>
		</group>
	));
};

const Experience = () => {
	const sphereRefs = [useRef(), useRef(), useRef(), useRef()];
	const fishRef = useRef();
	const planeRef = useRef();
	const [fishColor, setFishColor] = useState("#ffffff");
	const [fishSpeed, setFishSpeed] = useState(50);
	const [fishScale, setFishScale] = useState(1);

	const spherePositions = [
		[30, 1, 0],
		[-30, 1, 0],
		[0, 1, 30],
		[0, 1, -30],
	];

	return (
		<>
			<Canvas shadows camera={{ position: [0, 17, 14], fov: 75 }}>
				<color attach="background" args={["#0c6ceb"]} />
				<fogExp2 attach="fog" args={["#00bfff", 0.02]} />

				<ambientLight color={0xffffff} intensity={0.8} />
				<directionalLight color={0xf8f8ff} intensity={4} position={[2, 1, 3]} castShadow />

				<Suspense fallback={null}>
					<FishModel fishRef={fishRef} sphereRefs={sphereRefs} fishColor={fishColor} fishScale={fishScale} />
					<Plane planeRef={planeRef} />
					<Grid fishRef={fishRef} fishScale={fishScale} />
					{sphereRefs.map((sphereRef, index) => (
						<Sphere key={index} sphereRef={sphereRef} position={spherePositions[index]} />
					))}
					<ClickHandler fishRef={fishRef} planeRef={planeRef} fishMoveSpeed={fishSpeed} />
				</Suspense>
			</Canvas>

			<FishConfig setFishColor={setFishColor} setFishSpeed={setFishSpeed} setFishScale={setFishScale} />
		</>
	);
};

export default Experience;
