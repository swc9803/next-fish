import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group, PointLight } from "three";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);

export const useLightTransition = () => {
	const bloomRef = useRef<Group>(null);
	const lightRef = useRef<PointLight>(null);

	const startPos = useRef<Vector3 | null>(null);
	const targetPos = useRef<Vector3 | null>(null);
	const elapsed = useRef(0);
	const LIGHT_MOVE_DURATION = 1.7;

	useFrame((_, delta) => {
		const light = lightRef.current;
		const start = startPos.current;
		const target = targetPos.current;

		if (!light || !start || !target) return;

		elapsed.current += delta;
		const t = Math.min(elapsed.current / LIGHT_MOVE_DURATION, 1);
		const easedT = easeOut(t);

		light.position.lerpVectors(start, target, easedT);

		if (t >= 1) {
			light.position.copy(target);
			startPos.current = null;
			targetPos.current = null;
			elapsed.current = 0;
		}
	});

	const setTarget = (v: Vector3) => {
		const light = lightRef.current;
		if (!light) return;

		if (targetPos.current && targetPos.current.distanceTo(v) < 0.001) return;

		startPos.current = light.position.clone();
		targetPos.current = v.clone();
		elapsed.current = 0;
	};

	return {
		bloomRef,
		lightRef,
		setTarget,
	};
};
