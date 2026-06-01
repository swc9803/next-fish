import Link from "next/link";

import { WEAPON_LABELS } from "../core/augments";
import type { HudState } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidHudProps = {
	hud: HudState;
};

export const AirRaidHud = ({ hud }: AirRaidHudProps) => {
	const experiencePercent = Math.min(100, Math.round((hud.experience / hud.nextExperience) * 100));

	return (
		<div className={styles.topBar}>
			<Link className={styles.backLink} href="/game">
				게임 목록
			</Link>
			<div className={styles.stats} aria-label="게임 상태">
				<span>Lv {hud.experienceLevel} · EXP {experiencePercent}%</span>
				<span>점수 {hud.score.toLocaleString()}</span>
				<span>최고 {hud.highScore.toLocaleString()}</span>
				{hud.combo > 1 && <span>콤보 x{hud.combo}</span>}
				<span>웨이브 {hud.wave}</span>
				<span>목숨 {hud.lives}</span>
				<span>화력 {hud.power}</span>
				<span>{WEAPON_LABELS[hud.weapon]}</span>
				{hud.damageBonusPercent > 0 && <span>피해 +{hud.damageBonusPercent}%</span>}
				{hud.fireRateBonusPercent > 0 && <span>연사 +{hud.fireRateBonusPercent}%</span>}
				{hud.speedBonusPercent > 0 && <span>속도 +{hud.speedBonusPercent}%</span>}
				{hud.magnetBonusPercent > 0 && <span>자석 +{hud.magnetBonusPercent}%</span>}
				{hud.reloadBonusPercent > 0 && <span>재장전 +{hud.reloadBonusPercent}%</span>}
				{hud.shieldMaxCharges > 0 && <span>보호막 {hud.shieldCharges}/{hud.shieldMaxCharges}</span>}
				{hud.petCount > 0 && <span>펫 {hud.petCount} / Lv {hud.petLevelTotal}</span>}
				{hud.laserFocus > 0 && <span>초점 {hud.laserFocus}</span>}
				{hud.projectileChaos > 0 && <span>흔들림 {Math.round(hud.projectileChaos * 10)}</span>}
				<span>강화 {hud.augmentCount}</span>
			</div>
		</div>
	);
};
