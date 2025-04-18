import { useProgress } from "@react-three/drei";
import { useEffect } from "react";

export const LoadingOverlay = () => {
	const { progress, item } = useProgress();

	useEffect(() => {
		if (item) {
			console.log(`Load ${item}`);
		}
	}, [item]);

	const paddedProgress = String(Math.floor(progress)).padStart(3, " ");

	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				padding: "1rem 2rem",
				background: "rgba(0, 0, 0, 0.6)",
				color: "white",
				textAlign: "center",
				fontFamily: "monospace",
				fontSize: "1.5rem",
			}}
		>
			<p>Loading...</p>
			<p>{paddedProgress}%</p>
		</div>
	);
};
