"use client";

import styles from "./Overlay.module.scss";

import { useEffect, useState } from "react";
import { modelInfo } from "./Experience";

export const Overlay = ({ slide, setSlide }) => {
	const [displaySlide, setDisplaySlide] = useState(slide);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		setTimeout(() => {
			setVisible(true);
		}, 1000);
	}, []);

	useEffect(() => {
		setVisible(false);
		setTimeout(() => {
			setDisplaySlide(slide);
			setVisible(true);
		}, 2600);
	}, [slide]);

	return (
		<>
			<div className={`${styles.overlay} ${visible ? "" : styles.hidden}`}>
				<svg className={styles.logo} viewBox="0 0 342 35" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0 .1a9.7 9.7 0 0 0 7 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 0 0 7-7H0zm238.6 0h-6.8v34.8H263a9.7 9.7 0 0 0 6-6.8h-30.3V0zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 0 0-8.7 7h39.9v-21h-31.2v-7h24zm116.2 28h6.7v-14h24.6v14h6.7v-21h-38zM85.3 7h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 13.8h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 14.1h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zM308.5 7h26a9.6 9.6 0 0 0 7-7h-40a9.6 9.6 0 0 0 7 7z"
						fill="currentColor"
					/>
				</svg>

				<div className={styles.navigation}>
					<button onClick={() => setSlide((prev) => (prev - 1 + modelInfo.length) % modelInfo.length)} disabled={!visible}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
						</svg>
					</button>

					<button onClick={() => setSlide((prev) => (prev + 1) % modelInfo.length)} disabled={!visible}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
						</svg>
					</button>
				</div>

				<div className={styles.content}>
					<h1>{modelInfo[displaySlide].name}</h1>
					<p>{modelInfo[displaySlide].description}</p>

					<div className={styles.info}>
						<div className={styles["info-block"]}>
							<div className={styles["info-content"]}>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
									<path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
								</svg>
								<p>${modelInfo[displaySlide].price.toLocaleString()}</p>
							</div>
							<p className={styles["info-text"]}>After Federal Tax Credit</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
