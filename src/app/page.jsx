"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { WebGLRenderTarget } from "three";

import { LoadingShader } from "@/components/fish/LoadingShader";
import styles from "./page.module.scss";

const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const Experience = dynamic(() => import("@/components/fish/Experience").then((mod) => mod.default), { ssr: false });

const Home = () => {
	const [loadingComplete, setLoadingComplete] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);

	const renderTarget = useMemo(() => {
		if (isIOS) return null;
		return new WebGLRenderTarget(1024, 512);
	}, []);

	useEffect(() => {
		const setAppHeight = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};
		setAppHeight();
		window.addEventListener("resize", setAppHeight);
		return () => window.removeEventListener("resize", setAppHeight);
	}, []);

	const handleExperienceReady = useCallback(() => {
		let frameCount = 0;
		const fallback = setTimeout(() => setFadeOut(true), 500); // ✅ fallback 추가

		const waitForStabilization = () => {
			frameCount++;
			if (frameCount > 3) {
				setFadeOut(true);
				clearTimeout(fallback);
			} else {
				requestAnimationFrame(waitForStabilization);
			}
		};
		requestAnimationFrame(waitForStabilization);
	}, []);

	return (
		<div className={styles.container}>
			<main>
				<Experience renderTarget={renderTarget} onReady={handleExperienceReady} startAnimation={fadeOut} />

				{!loadingComplete && renderTarget && (
					<div className="loading_overlay">
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
							<LoadingShader renderTarget={renderTarget} loadingComplete={fadeOut} onFinish={() => setLoadingComplete(true)} />
						</Canvas>
					</div>
				)}
			</main>
		</div>
	);
};

export default Home;
