"use client";

import { useLightTransition } from "@/hooks/useLightTransition";

interface HoverLightProps {
	totalRadius: number;
}

export const HoverLight = ({ totalRadius }: HoverLightProps) => {
	const { bloomRef, lightRef } = useLightTransition(totalRadius);

	return (
		<group ref={bloomRef}>
			<pointLight ref={lightRef} position={[0, 0, -1]} intensity={30} distance={5} color="#ffffff" />
		</group>
	);
};
