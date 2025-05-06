"use client";

import styles from "./Overlay.module.scss";
import { slideArray } from "@/utils/slideUtils";
import { useGallerySlide } from "@/store/useGallerySlide";

export const Overlay = () => {
	const { slide, focusIndex, freemode } = useGallerySlide();
	const { setSlide, setFocusIndex, setFreemode } = useGallerySlide.getState();
	const isSliding = useGallerySlide((state) => state.isSliding);
	const isIntroPlaying = useGallerySlide((state) => state.isIntroPlaying);

	const activeSlide = freemode && focusIndex !== null ? focusIndex : slide;
	const showOverlay = !freemode || (freemode && focusIndex !== null);
	const isOverlayDisabled = isSliding || isIntroPlaying;

	const handleToggleView = () => {
		if (freemode && focusIndex !== null) {
			setSlide(focusIndex);
		}
		setFocusIndex(null);
		setFreemode(!freemode);
	};

	const handleBack = () => {
		setFocusIndex(null);
		setFreemode(true);
	};

	const handlePrevSlide = () => {
		setSlide(slide > 0 ? slide - 1 : slideArray.length - 1);
	};

	const handleNextSlide = () => {
		setSlide(slide < slideArray.length - 1 ? slide + 1 : 0);
	};

	return (
		<div className={`${styles.overlay} ${showOverlay ? styles.show : ""} ${isOverlayDisabled ? styles.disabled : ""}`}>
			{/* 모드 토글 버튼 */}
			<button className={styles.view_toggle_button} onClick={handleToggleView} type="button">
				<div className={`${styles.switch} ${freemode ? styles.free : ""}`}>
					<div className={styles.knob} />
					<p className={styles.label}>{freemode ? "Free View" : "Slide View"}</p>
				</div>
			</button>

			{/* 뒤로가기 버튼 */}
			<button className={`${styles.back_button} ${freemode && focusIndex !== null ? styles.show : ""}`} onClick={handleBack} type="button">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<g clipPath="url(#clip0_1841_357)">
						<circle cx="9" cy="9" r="9" fill="white" fillOpacity="0.6" />
						<circle cx="9" cy="9" r="8.5" stroke="#111111" strokeOpacity="0.6" />
						<path
							d="M13 9.5C13.2761 9.5 13.5 9.27614 13.5 9C13.5 8.72386 13.2761 8.5 13 8.5V9.5ZM4.64645 8.64645C4.45118 8.84171 4.45118 9.15829 4.64645 9.35355L7.82843 12.5355C8.02369 12.7308 8.34027 12.7308 8.53553 12.5355C8.7308 12.3403 8.7308 12.0237 8.53553 11.8284L5.70711 9L8.53553 6.17157C8.7308 5.97631 8.7308 5.65973 8.53553 5.46447C8.34027 5.2692 8.02369 5.2692 7.82843 5.46447L4.64645 8.64645ZM13 8.5L5 8.5V9.5L13 9.5V8.5Z"
							fill="#111111"
						/>
					</g>
					<defs>
						<clipPath id="clip0_1841_357">
							<rect width="18" height="18" fill="white" />
						</clipPath>
					</defs>
				</svg>
			</button>

			<svg className={styles.logo} viewBox="0 0 342 35" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M0 .1a9.7 9.7 0 0 0 7 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 0 0 7-7H0zm238.6 0h-6.8v34.8H263a9.7 9.7 0 0 0 6-6.8h-30.3V0zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 0 0-8.7 7h39.9v-21h-31.2v-7h24zm116.2 28h6.7v-14h24.6v14h6.7v-21h-38zM85.3 7h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 13.8h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 14.1h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zM308.5 7h26a9.9 9.9 0 0 0 7-7h-40a9.9 9.9 0 0 0 7 7z"
					fill="currentColor"
				/>
			</svg>

			{/* 슬라이드 모드 네비게이션 */}
			{!freemode && (
				<div className={styles.slide_navigation}>
					<button onClick={handlePrevSlide} aria-label="previous slide button">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
						</svg>
					</button>
					<button onClick={handleNextSlide} aria-label="next slide button">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
						</svg>
					</button>
				</div>
			)}

			<div className={styles.content}>
				<h1>{slideArray[activeSlide].name}</h1>
				<p>{slideArray[activeSlide].description}</p>
			</div>
		</div>
	);
};
