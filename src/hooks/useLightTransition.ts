"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group, PointLight } from "three";

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

export const useLightTransition = () => {
	const bloomRef = useRef<Group>(null);
	const lightRef = useRef<PointLight>(null);

	const startPos = useRef<Vector3 | null>(null);
	const targetPos = useRef<Vector3 | null>(null);
	const progress = useRef<number>(0);
	const duration = 0.7;
	let elapsed = 0;

	useFrame((_, delta) => {
		if (!lightRef.current || !targetPos.current || !startPos.current) return;

		elapsed += delta;
		progress.current = Math.min(elapsed / duration, 1);

		const eased = easeOutQuad(progress.current);
		lightRef.current.position.lerpVectors(startPos.current, targetPos.current, eased);

		if (progress.current >= 1) {
			startPos.current = targetPos.current.clone();
			targetPos.current = null;
			progress.current = 0;
			elapsed = 0;
		}
	});

	const setTarget = (v: Vector3) => {
		if (!lightRef.current) return;

		startPos.current = lightRef.current.position.clone();
		targetPos.current = v.clone();
		progress.current = 0;
		elapsed = 0;
	};

	return {
		bloomRef,
		lightRef,
		setTarget,
	};
};
