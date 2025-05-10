import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Overlay.module.scss";
import { slideArray } from "@/utils/slideUtils";
import { useGallerySlide } from "@/store/useGallerySlide";

export const Overlay = () => {
	const { slide, focusIndex, freemode, isSliding, isIntroPlaying, setSlide, setFocusIndex, setFreemode } = useGallerySlide();

	const showOverlay = !freemode || (freemode && focusIndex !== null);
	const isOverlayDisabled = isSliding || isIntroPlaying;
	const [visibleSlide, setVisibleSlide] = useState(slide);
	const activeSlide = freemode && focusIndex !== null ? focusIndex : visibleSlide;

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

	useEffect(() => {
		if (!isIntroPlaying) {
			const timeout = setTimeout(() => {
				setVisibleSlide(slide);
			}, 500);
			return () => clearTimeout(timeout);
		}
	}, [isIntroPlaying, slide]);

	return (
		<div className={`${styles.overlay} ${showOverlay ? styles.show : ""} ${isOverlayDisabled ? styles.disabled : ""}`}>
			<button className={styles.view_toggle_button} onClick={handleToggleView} type="button">
				<div className={`${styles.switch} ${freemode ? styles.free : ""}`}>
					<div className={styles.knob} />
					<p className={styles.label}>{freemode ? "Free View" : "Slide View"}</p>
				</div>
			</button>

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

			{slideArray[activeSlide].logo && (
				<div className={styles.logo_wrapper}>
					<div className={styles.logo_background} />
					<Image className={styles.logo} src={slideArray[activeSlide].logo!} alt="로고" fill style={{ objectFit: "contain" }} />
				</div>
			)}

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
