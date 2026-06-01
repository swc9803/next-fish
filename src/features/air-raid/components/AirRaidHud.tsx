import Link from "next/link";

import { WEAPON_LABELS } from "../core/augments";
import type { HudState } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidHudProps = {
	hud: HudState;
};

export const AirRaidHud = ({ hud }: AirRaidHudProps) => {
	return (
		<div className={styles.topBar}>
			<Link className={styles.backLink} href="/game">
				Game
			</Link>
			<div className={styles.stats} aria-label="게임 상태">
				<span>Score {hud.score.toLocaleString()}</span>
				<span>Best {hud.highScore.toLocaleString()}</span>
				<span>Wave {hud.wave}</span>
				<span>Life {hud.lives}</span>
				<span>Power {hud.power}</span>
				<span>{WEAPON_LABELS[hud.weapon]}</span>
				{hud.laserFocus > 0 && <span>Focus {hud.laserFocus}</span>}
				{hud.projectileChaos > 0 && <span>Drift {Math.round(hud.projectileChaos * 10)}</span>}
				<span>Aug {hud.augmentCount}</span>
			</div>
		</div>
	);
};
