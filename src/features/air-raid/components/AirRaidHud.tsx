import Link from "next/link";

import { WEAPON_LABELS } from "../core/augments";
import { STAGE_ROUTE_MODIFIERS } from "../core/stages";
import type { HudState } from "../core/types";
import styles from "./AirRaidHud.module.scss";

type AirRaidHudProps = {
	hud: HudState;
};

export const AirRaidHud = ({ hud }: AirRaidHudProps) => {
	const experiencePercent = Math.min(100, Math.round((hud.experience / hud.nextExperience) * 100));
	const hullPercent = Math.min(100, Math.round((hud.lives / hud.maxLives) * 100));
	const hullSegments = Array.from({ length: hud.maxLives }, (_, index) => index < hud.lives);
	const mission = hud.stageMission;
	const missionProgress =
		mission && mission.kind === "survive"
			? `${Math.ceil(Math.max(0, mission.target - mission.progress))}초`
			: mission
				? `${Math.floor(mission.progress)}/${mission.target}`
				: "";
	const routeTitle = STAGE_ROUTE_MODIFIERS[hud.routeModifier].title;
	const weaponLevelLabel = hud.weaponLevel > 1 ? ` ${hud.weaponLevel}단계` : "";

	return (
		<div className={styles.topBar}>
			<Link className={styles.backLink} href="/game">
				격납고
			</Link>
			<div className={styles.stats} aria-label="게임 상태">
				<span className={styles.statCell} data-tone="score">
					<b>점수</b>
					<strong>{hud.score.toLocaleString()}</strong>
					<small>최고 {hud.highScore.toLocaleString()}</small>
				</span>
				<span className={styles.statCell} data-tone="danger">
					<b>웨이브</b>
					<strong>{hud.wave}</strong>
					<small>{hud.stageTitle}</small>
				</span>
				<span className={styles.statCell} data-tone="stage">
					<b>보스</b>
					<strong>{hud.stageBoss}</strong>
					<small>{hud.combo > 1 ? `콤보 x${hud.combo}` : "보스 항로"}</small>
				</span>
				<span className={styles.statCell} data-tone="vital">
					<b>내구도</b>
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
						<span>화력 {hud.power}</span>
					</small>
				</span>
				<span className={`${styles.statCell} ${styles.expCell}`} data-tone="xp">
					<b>성장</b>
					<strong>{hud.experienceLevel}레벨</strong>
					<i aria-hidden="true">
						<em style={{ width: `${experiencePercent}%` }} />
					</i>
				</span>
				<span className={styles.statCell} data-tone="weapon">
					<b>무기</b>
					<strong>
						{WEAPON_LABELS[hud.weapon]}
						{weaponLevelLabel}
					</strong>
					<small>유물 {hud.augmentCount}개</small>
				</span>
				<span className={styles.bonusChip}>
					<small>항로</small>
					<b>{routeTitle}</b>
				</span>
				{mission && (
					<span className={styles.bonusChip}>
						<small>임무</small>
						<b>{mission.completed ? "완료" : mission.failed ? "실패" : `${mission.title} ${missionProgress}`}</b>
					</span>
				)}
				{hud.damageBonusPercent > 0 && (
					<span className={styles.bonusChip}>
						<small>공격력</small>
						<b>+{hud.damageBonusPercent}%</b>
					</span>
				)}
				{hud.fireRateBonusPercent > 0 && (
					<span className={styles.bonusChip}>
						<small>연사</small>
						<b>+{hud.fireRateBonusPercent}%</b>
					</span>
				)}
				{hud.speedBonusPercent > 0 && (
					<span className={styles.bonusChip}>
						<small>속도</small>
						<b>+{hud.speedBonusPercent}%</b>
					</span>
				)}
				{hud.magnetBonusPercent > 0 && (
					<span className={styles.bonusChip}>
						<small>회수</small>
						<b>+{hud.magnetBonusPercent}%</b>
					</span>
				)}
				{hud.reloadBonusPercent > 0 && (
					<span className={styles.bonusChip}>
						<small>장전</small>
						<b>+{hud.reloadBonusPercent}%</b>
					</span>
				)}
				{hud.rewardMultiplier > 1.05 && (
					<span className={styles.bonusChip}>
						<small>보상</small>
						<b>x{hud.rewardMultiplier.toFixed(2)}</b>
					</span>
				)}
				{hud.threatMultiplier > 1.05 && (
					<span className={styles.bonusChip}>
						<small>위험도</small>
						<b>x{hud.threatMultiplier.toFixed(2)}</b>
					</span>
				)}
				{hud.shieldMaxCharges > 0 && (
					<span className={styles.bonusChip}>
						<small>보호막</small>
						<b>{hud.shieldCharges}/{hud.shieldMaxCharges}</b>
					</span>
				)}
				{hud.petCount > 0 && (
					<span className={styles.bonusChip}>
						<small>조개</small>
						<b>
							{hud.petCount}개 / 총 {hud.petLevelTotal}레벨
						</b>
					</span>
				)}
				{hud.earnedCoins > 0 && (
					<span className={styles.bonusChip}>
						<small>인양</small>
						<b>+{hud.earnedCoins}</b>
					</span>
				)}
				{hud.suppliesCollected > 0 && (
					<span className={styles.bonusChip}>
						<small>보급</small>
						<b>{hud.suppliesCollected}회</b>
					</span>
				)}
				{hud.laserFocus > 0 && (
					<span className={styles.bonusChip}>
						<small>집중</small>
						<b>{hud.laserFocus}</b>
					</span>
				)}
				{hud.projectileChaos > 0 && (
					<span className={styles.bonusChip}>
						<small>탄퍼짐</small>
						<b>{Math.round(hud.projectileChaos * 10)}</b>
					</span>
				)}
				{hud.bossSkills.length > 0 && (
					<span className={styles.bonusChip}>
						<small>보스 스킬</small>
						<b>{hud.bossSkills.length}개</b>
					</span>
				)}
			</div>
		</div>
	);
};
