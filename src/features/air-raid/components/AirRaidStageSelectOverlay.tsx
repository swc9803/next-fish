import type { CSSProperties } from "react";

import { BOSS_SKILLS, STAGES } from "../core/stages";
import type { BossSkillId, GameMode, StageChoice, StageKind } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidStageSelectOverlayProps = {
	bossSkills: BossSkillId[];
	choices: StageChoice[];
	mode: GameMode;
	pendingBossSkill: BossSkillId | null;
	onSelect: (stage: StageKind) => void;
};

export const AirRaidStageSelectOverlay = ({ bossSkills, choices, mode, pendingBossSkill, onSelect }: AirRaidStageSelectOverlayProps) => {
	if (mode !== "stage-select") return null;

	const pendingSkill = pendingBossSkill ? BOSS_SKILLS[pendingBossSkill] : null;

	return (
		<section className={styles.stageRouteOverlay}>
			<div className={styles.routeHeader}>
				<p className={styles.kicker}>Boss Skill Acquired</p>
				<h1>{pendingSkill?.title ?? "해역 제압"}</h1>
				<p>{pendingSkill?.description ?? "보스 코어를 회수했습니다. 다음 침투 경로를 선택하세요."}</p>
				<div className={styles.skillRack} aria-label="보유 보스 스킬">
					{bossSkills.map((skillId) => {
						const skill = BOSS_SKILLS[skillId];
							return (
								<span key={skill.id} style={{ "--skill-color": skill.color } as CSSProperties}>
									{skill.shortTitle}
								</span>
							);
					})}
				</div>
			</div>

			<div className={styles.routeGrid}>
				{choices.map((choice) => {
					const stage = STAGES[choice.id];
					const rewardSkill = BOSS_SKILLS[choice.rewardSkill];
					const weaknessSkill = choice.weaknessSkill ? BOSS_SKILLS[choice.weaknessSkill] : null;
					const isWeak = Boolean(choice.weaknessSkill && bossSkills.includes(choice.weaknessSkill));

					return (
						<button
							key={choice.id}
							type="button"
							className={styles.routeChoice}
							data-direction={choice.direction}
							data-weak={isWeak}
							style={{ "--route-color": stage.palette.accent } as CSSProperties}
							onClick={() => onSelect(choice.id)}
						>
							<span className={styles.routeDirection}>{choice.direction}</span>
							<b>{choice.title}</b>
							<strong>{stage.threat}</strong>
							<small>{choice.description}</small>
							<i>보스: {choice.boss}</i>
							<em>보상: {rewardSkill.title}</em>
							{weaknessSkill && <mark>{isWeak ? `${weaknessSkill.title} 상성 우위` : `${weaknessSkill.title} 필요`}</mark>}
						</button>
					);
				})}
			</div>
		</section>
	);
};
