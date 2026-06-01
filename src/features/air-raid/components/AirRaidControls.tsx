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
	const bladeLabel = chargeUnlocked ? `Charge ${Math.round(chargeRatio * 100)}%` : "Blade";

	return (
		<div className={styles.controls}>
			<button type="button" onClick={onTogglePause}>
				{mode === "paused" ? "Resume" : "Pause"}
			</button>
			<button
				type="button"
				disabled={!meleeUnlocked}
				onPointerCancel={onMeleeUp}
				onPointerDown={onMeleeDown}
				onPointerLeave={onMeleeUp}
				onPointerUp={onMeleeUp}
			>
				{meleeUnlocked ? bladeLabel : "Blade Locked"}
			</button>
			<button type="button" onClick={onRestart}>
				Restart
			</button>
		</div>
	);
};
