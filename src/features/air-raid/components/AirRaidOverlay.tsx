import type { GameMode } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidOverlayProps = {
	mode: GameMode;
	onResume: () => void;
	onStart: () => void;
};

export const AirRaidOverlay = ({ mode, onResume, onStart }: AirRaidOverlayProps) => {
	if (mode === "playing" || mode === "augment") return null;

	const startLabel = mode === "gameover" ? "다시 출격" : "출격";
	const title = mode === "gameover" ? "작전 실패" : mode === "paused" ? "일시 정지" : "비행 준비";

	return (
		<section className={styles.overlay}>
			<div className={styles.panel}>
				<p className={styles.kicker}>Sky 1945</p>
				<h1>{title}</h1>
				<p className={styles.copy}>방향키 또는 WASD로 이동하고, 모바일에서는 기체를 드래그하세요. 사격은 자동으로 진행됩니다.</p>
				<div className={styles.actions}>
					<button type="button" onClick={onStart}>
						{startLabel}
					</button>
					{mode === "paused" && (
						<button type="button" onClick={onResume}>
							계속하기
						</button>
					)}
				</div>
			</div>
		</section>
	);
};
