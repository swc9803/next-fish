"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";

import { LoadingShader } from "@/components/fish/LoadingShader";
import styles from "./page.module.scss";

const Experience = dynamic(() => import("@/components/fish/Experience").then((mod) => mod.default), { ssr: false });
const LOADING_START_FALLBACK_DELAY = 7000;
const LOADING_OVERLAY_REMOVE_DELAY = 2100;

const Home = () => {
	const [loadingComplete, setLoadingComplete] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);
	const fallbackTimeoutRef = useRef(null);
	const stabilizationFrameRef = useRef(null);
	const forceFadeOutTimeoutRef = useRef(null);
	const removeLoadingTimeoutRef = useRef(null);

	useEffect(() => {
		const setAppHeight = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};
		setAppHeight();
		window.addEventListener("resize", setAppHeight);
		return () => window.removeEventListener("resize", setAppHeight);
	}, []);

	useEffect(() => {
		return () => {
			if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
			if (stabilizationFrameRef.current) cancelAnimationFrame(stabilizationFrameRef.current);
			if (forceFadeOutTimeoutRef.current) clearTimeout(forceFadeOutTimeoutRef.current);
			if (removeLoadingTimeoutRef.current) clearTimeout(removeLoadingTimeoutRef.current);
		};
	}, []);

	useEffect(() => {
		if (fadeOut) return;

		forceFadeOutTimeoutRef.current = setTimeout(() => {
			setFadeOut(true);
		}, LOADING_START_FALLBACK_DELAY);

		return () => {
			if (forceFadeOutTimeoutRef.current) clearTimeout(forceFadeOutTimeoutRef.current);
		};
	}, [fadeOut]);

	useEffect(() => {
		if (!fadeOut || loadingComplete) return;

		removeLoadingTimeoutRef.current = setTimeout(() => {
			setLoadingComplete(true);
		}, LOADING_OVERLAY_REMOVE_DELAY);

		return () => {
			if (removeLoadingTimeoutRef.current) clearTimeout(removeLoadingTimeoutRef.current);
		};
	}, [fadeOut, loadingComplete]);

	const handleExperienceReady = useCallback(() => {
		let frameCount = 0;
		if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
		if (stabilizationFrameRef.current) cancelAnimationFrame(stabilizationFrameRef.current);
		if (forceFadeOutTimeoutRef.current) clearTimeout(forceFadeOutTimeoutRef.current);

		fallbackTimeoutRef.current = setTimeout(() => setFadeOut(true), 500);

		const waitForStabilization = () => {
			frameCount++;
			if (frameCount > 3) {
				setFadeOut(true);
				if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
			} else {
				stabilizationFrameRef.current = requestAnimationFrame(waitForStabilization);
			}
		};
		stabilizationFrameRef.current = requestAnimationFrame(waitForStabilization);
	}, []);

	return (
		<div className={styles.container}>
			<main>
				<Experience onReady={handleExperienceReady} startAnimation={fadeOut} />

				{!loadingComplete && (
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
								gl.setClearColor(0x000000, 0);
								gl.getContext().canvas.addEventListener("webglcontextlost", (e) => {
									e.preventDefault();
								});
							}}
						>
							<LoadingShader
								loadingComplete={fadeOut}
								onFinish={() => {
									setLoadingComplete(true);
								}}
							/>
						</Canvas>
					</div>
				)}
			</main>
		</div>
	);
};

export default Home;
