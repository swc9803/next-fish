import Link from "next/link";

import { WEAPON_LABELS } from "../core/augments";
import type { HudState } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidHudProps = {
	hud: HudState;
};

export const AirRaidHud = ({ hud }: AirRaidHudProps) => {
	const experiencePercent = Math.min(100, Math.round((hud.experience / hud.nextExperience) * 100));
	const hullPercent = Math.min(100, Math.round((hud.lives / hud.maxLives) * 100));
	const hullSegments = Array.from({ length: hud.maxLives }, (_, index) => index < hud.lives);

	return (
		<div className={styles.topBar}>
			<Link className={styles.backLink} href="/game">
				ARSENAL
			</Link>
			<div className={styles.stats} aria-label="게임 상태">
				<span className={styles.statCell} data-tone="score">
					<b>SCORE</b>
					<strong>{hud.score.toLocaleString()}</strong>
					<small>BEST {hud.highScore.toLocaleString()}</small>
				</span>
				<span className={styles.statCell} data-tone="danger">
					<b>WAVE</b>
					<strong>{hud.wave}</strong>
					<small>{hud.stageTitle}</small>
				</span>
				<span className={styles.statCell} data-tone="stage">
					<b>STAGE</b>
					<strong>{hud.stageBoss}</strong>
					<small>{hud.combo > 1 ? `COMBO x${hud.combo}` : "BOSS ROUTE"}</small>
				</span>
				<span className={styles.statCell} data-tone="vital">
					<b>HULL</b>
					<strong>
						{hud.lives}/{hud.maxLives}
					</strong>
					<i className={styles.hullMeter} aria-hidden="true">
						<em style={{ width: `${hullPercent}%` }} />
					</i>
					<small className={styles.hullFooter}>
						<span className={styles.hullPips} aria-label={`Hull ${hud.lives} of ${hud.maxLives}`}>
							{hullSegments.map((filled, index) => (
								<span key={index} data-filled={filled} />
							))}
						</span>
						<span>PWR {hud.power}</span>
					</small>
				</span>
				<span className={`${styles.statCell} ${styles.expCell}`} data-tone="xp">
					<b>DEPTH</b>
					<strong>Lv {hud.experienceLevel}</strong>
					<i aria-hidden="true">
						<em style={{ width: `${experiencePercent}%` }} />
					</i>
				</span>
				<span className={styles.statCell} data-tone="weapon">
					<b>WEAPON</b>
					<strong>{WEAPON_LABELS[hud.weapon]}</strong>
					<small>{hud.augmentCount} RELICS</small>
				</span>
				{hud.damageBonusPercent > 0 && <span className={styles.bonusChip}>DMG +{hud.damageBonusPercent}%</span>}
				{hud.fireRateBonusPercent > 0 && <span className={styles.bonusChip}>FIRE +{hud.fireRateBonusPercent}%</span>}
				{hud.speedBonusPercent > 0 && <span className={styles.bonusChip}>SPD +{hud.speedBonusPercent}%</span>}
				{hud.magnetBonusPercent > 0 && <span className={styles.bonusChip}>PULL +{hud.magnetBonusPercent}%</span>}
				{hud.reloadBonusPercent > 0 && <span className={styles.bonusChip}>LOAD +{hud.reloadBonusPercent}%</span>}
				{hud.shieldMaxCharges > 0 && <span className={styles.bonusChip}>SHELL {hud.shieldCharges}/{hud.shieldMaxCharges}</span>}
				{hud.petCount > 0 && (
					<span className={styles.bonusChip}>
						ORBIT {hud.petCount} / Lv {hud.petLevelTotal}
					</span>
				)}
				{hud.earnedCoins > 0 && <span className={styles.bonusChip}>SALVAGE +{hud.earnedCoins}</span>}
				{hud.laserFocus > 0 && <span className={styles.bonusChip}>FOCUS {hud.laserFocus}</span>}
				{hud.projectileChaos > 0 && <span className={styles.bonusChip}>DRIFT {Math.round(hud.projectileChaos * 10)}</span>}
				{hud.bossSkills.length > 0 && <span className={styles.bonusChip}>BOSS SKILL {hud.bossSkills.length}</span>}
			</div>
		</div>
	);
};
