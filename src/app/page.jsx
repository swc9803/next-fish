"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { WebGLRenderTarget } from "three";

import { LoadingShader } from "@/components/fish/LoadingShader";
import styles from "./page.module.scss";

const Experience = dynamic(() => import("@/components/fish/Experience"), { ssr: false });

const Home = () => {
	const [loadingComplete, setLoadingComplete] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);
	const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 512), []);

	const handleExperienceReady = () => {
		requestAnimationFrame(() => {
			setFadeOut(true);
			setTimeout(() => setLoadingComplete(true), 1700);
		});
	};

	return (
		<div className={styles.container}>
			<main>
				<Experience renderTarget={renderTarget} onReady={handleExperienceReady} />

				{!loadingComplete && (
					<div className={"loading_overlay"}>
						<Canvas
							orthographic
							camera={{ zoom: 1, position: [0, 0, 100] }}
							gl={{
								alpha: true,
								stencil: false,
								depth: false,
								antialias: false,
								preserveDrawingBuffer: false,
								powerPreference: "low-power",
								failIfMajorPerformanceCaveat: false,
							}}
							onCreated={({ gl }) => {
								gl.getContext().canvas.addEventListener("webglcontextlost", (e) => {
									e.preventDefault();
								});
							}}
						>
							<LoadingShader renderTarget={renderTarget} loadingComplete={fadeOut} />
						</Canvas>
					</div>
				)}
			</main>
		</div>
	);
};

export default Home;
