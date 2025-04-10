"use client";

import styles from "./Overlay.module.scss";
import { JSX, useEffect, useState } from "react";
import { slideArray } from "./Experience";
import { useGallerySlide } from "@/store/useGallerySlide";

export const Overlay = (): JSX.Element | null => {
	const { slide, setSlide, freemode, setFreemode, focusIndex, setFocusIndex, isSliding } = useGallerySlide();

	const [visible, setVisible] = useState(false);
	const [fadeIn, setFadeIn] = useState(false);

	const [shouldRender, setShouldRender] = useState(true);

	useEffect(() => {
		if (!freemode) {
			setVisible(false);
			const timeout = setTimeout(() => setVisible(true), 2600);
			return () => clearTimeout(timeout);
		}
	}, [slide, freemode]);

	useEffect(() => {
		if (!freemode) return;

		if (focusIndex !== null) {
			setShouldRender(true);
			setFadeIn(false);
			const timeout = setTimeout(() => setFadeIn(true), 50);
			return () => clearTimeout(timeout);
		}

		setFadeIn(false);
		const timeout = setTimeout(() => setShouldRender(false), 500);
		return () => clearTimeout(timeout);
	}, [freemode, focusIndex]);

	const activeSlideIndex = focusIndex !== null ? focusIndex : slide;

	const showOverlay = (!freemode && visible) || (freemode && focusIndex !== null && fadeIn);
	const overlayClass = `${styles.overlay} ${showOverlay ? styles.visible : ""}`;

	if (!shouldRender && freemode) return null;

	return (
		<div className={overlayClass}>
			<svg className={styles.logo} viewBox="0 0 342 35" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M0 .1a9.7 9.7 0 0 0 7 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 0 0 7-7H0zm238.6 0h-6.8v34.8H263a9.7 9.7 0 0 0 6-6.8h-30.3V0zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 0 0-8.7 7h39.9v-21h-31.2v-7h24zm116.2 28h6.7v-14h24.6v14h6.7v-21h-38zM85.3 7h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 13.8h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 14.1h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zM308.5 7h26a9.9 9.9 0 0 0 7-7h-40a9.9 9.9 0 0 0 7 7z"
					fill="currentColor"
				/>
			</svg>

			{/* 뒤로가기 버튼 */}
			{freemode && focusIndex !== null && (
				<div className={styles.backButton}>
					<button
						onClick={() => {
							setFocusIndex(null);
							setFreemode(true);
						}}
						aria-label="뒤로가기 버튼"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M6 12l4-4M6 12l4 4" />
						</svg>
						<span>뒤로가기</span>
					</button>
				</div>
			)}

			{/* 슬라이드 모드 네비게이션 */}
			{!freemode && (
				<div className={styles.navigation}>
					<button onClick={() => setSlide(slide > 0 ? slide - 1 : slideArray.length - 1)} aria-label="이전 슬라이드 버튼" disabled={isSliding}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
						</svg>
					</button>
					<button onClick={() => setSlide(slide < slideArray.length - 1 ? slide + 1 : 0)} aria-label="다음 슬라이드 버튼" disabled={isSliding}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
						</svg>
					</button>
				</div>
			)}

			<div className={styles.freemodeToggle}>
				<button onClick={() => setFreemode(!freemode)}>{freemode ? "슬라이드 모드" : "자유 모드"}로 변경</button>
			</div>

			<div className={styles.content}>
				<h1>{slideArray[activeSlideIndex].name}</h1>
				<p>{slideArray[activeSlideIndex].description}</p>
				<div className={styles.info}>
					<div className={styles["info-block"]}>
						<div className={styles["info-content"]}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
							</svg>
							<p>${slideArray[activeSlideIndex].price.toLocaleString()}</p>
						</div>
						<p className={styles["info-text"]}>After Federal Tax Credit</p>
					</div>
				</div>
			</div>
		</div>
	);
};
