import type { GameMode } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidControlsProps = {
	chargeRatio: number;
	chargeUnlocked: boolean;
	meleeUnlocked: boolean;
	mode: GameMode;
	onMeleeDown: () => void;
	onMeleeUp: () => void;
	onRestart: () => void;
	onTogglePause: () => void;
};

export const AirRaidControls = ({
	chargeRatio,
	chargeUnlocked,
	meleeUnlocked,
	mode,
	onMeleeDown,
	onMeleeUp,
	onRestart,
	onTogglePause,
}: AirRaidControlsProps) => {
	const bladeLabel = chargeUnlocked ? `차지 ${Math.round(chargeRatio * 100)}%` : "블레이드";

	return (
		<div className={styles.controls}>
			<button type="button" onClick={onTogglePause}>
				{mode === "paused" ? "계속" : "정지"}
			</button>
			<button
				type="button"
				disabled={!meleeUnlocked}
				onPointerCancel={onMeleeUp}
				onPointerDown={onMeleeDown}
				onPointerLeave={onMeleeUp}
				onPointerUp={onMeleeUp}
			>
				{meleeUnlocked ? bladeLabel : "블레이드 잠김"}
			</button>
			<button type="button" onClick={onRestart}>
				재시작
			</button>
		</div>
	);
};
