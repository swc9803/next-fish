import { useEffect, useRef, useState, type CSSProperties } from "react";

import { BOSS_SKILLS, STAGES } from "../core/stages";
import type { BossSkillId, GameMode, StageChoice, StageKind } from "../core/types";
import styles from "./AirRaidStageSelectOverlay.module.scss";

type AirRaidStageSelectOverlayProps = {
	bossSkills: BossSkillId[];
	choices: StageChoice[];
	mode: GameMode;
	pendingBossSkill: BossSkillId | null;
	onSelect: (stage: StageKind) => void;
};

export const AirRaidStageSelectOverlay = ({ bossSkills, choices, mode, pendingBossSkill, onSelect }: AirRaidStageSelectOverlayProps) => {
	const [selectedStage, setSelectedStage] = useState<StageKind | null>(null);
	const travelTimerRef = useRef<number | null>(null);

	useEffect(() => {
		if (mode !== "stage-select") setSelectedStage(null);
		return () => {
			if (travelTimerRef.current) {
				window.clearTimeout(travelTimerRef.current);
				travelTimerRef.current = null;
			}
		};
	}, [mode]);

	if (mode !== "stage-select") return null;

	const pendingSkill = pendingBossSkill ? BOSS_SKILLS[pendingBossSkill] : null;
	const isTravelling = selectedStage !== null;

	const handleSelect = (stage: StageKind) => {
		if (isTravelling) return;
		setSelectedStage(stage);
		travelTimerRef.current = window.setTimeout(() => {
			onSelect(stage);
			travelTimerRef.current = null;
		}, 820);
	};

	return (
		<section className={styles.stageRouteOverlay} data-travelling={isTravelling}>
			<div className={styles.routeHeader}>
				<p className={styles.kicker}>보스 코어 회수</p>
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
							data-selected={selectedStage === choice.id}
							data-weak={isWeak}
							style={{ "--route-color": stage.palette.accent } as CSSProperties}
							onClick={() => handleSelect(choice.id)}
						>
							<span className={styles.routeDirection}>{choice.direction}시</span>
							<b>{choice.title}</b>
							<strong>{choice.routeTitle}</strong>
							<small>{choice.description}</small>
							<small>{choice.routeDescription}</small>
							<i>위협: {stage.threat}</i>
							<i>보스: {choice.boss}</i>
							<em>보상: {rewardSkill.title}</em>
							{weaknessSkill && <mark>{isWeak ? `${weaknessSkill.title} 상성 우위` : `${weaknessSkill.title} 필요`}</mark>}
						</button>
					);
				})}
			</div>
			<div className={styles.travelVeil} aria-hidden="true">
				<span />
			</div>
		</section>
	);
};
