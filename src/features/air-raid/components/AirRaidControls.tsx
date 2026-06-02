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
	const finLabel = chargeUnlocked ? `차지 ${Math.round(chargeRatio * 100)}%` : "지느러미";

	return (
		<div className={styles.controls}>
			<button type="button" onClick={onTogglePause}>
				{mode === "paused" ? "RESUME" : "PAUSE"}
			</button>
			<button
				type="button"
				disabled={!meleeUnlocked}
				onPointerCancel={onMeleeUp}
				onPointerDown={onMeleeDown}
				onPointerLeave={onMeleeUp}
				onPointerUp={onMeleeUp}
			>
				{meleeUnlocked ? finLabel : "지느러미 잠김"}
			</button>
			<button type="button" onClick={onRestart}>
				REDEPLOY
			</button>
		</div>
	);
};
