import type { CSSProperties } from "react";

import { BOSS_SKILLS } from "../core/stages";
import type { BossSkillId, GameMode } from "../core/types";
import styles from "./AirRaidControls.module.scss";

type AirRaidControlsProps = {
	bossSkillCooldowns: Record<BossSkillId, number>;
	bossSkills: BossSkillId[];
	chargeRatio: number;
	chargeUnlocked: boolean;
	meleeUnlocked: boolean;
	mode: GameMode;
	onBossSkill: (skillId: BossSkillId) => void;
	onMeleeDown: () => void;
	onMeleeUp: () => void;
	onRestart: () => void;
	onTogglePause: () => void;
};

export const AirRaidControls = ({
	bossSkillCooldowns,
	bossSkills,
	chargeRatio,
	chargeUnlocked,
	meleeUnlocked,
	mode,
	onBossSkill,
	onMeleeDown,
	onMeleeUp,
	onRestart,
	onTogglePause,
}: AirRaidControlsProps) => {
	const finLabel = chargeUnlocked ? `CHARGE ${Math.round(chargeRatio * 100)}%` : "FIN SLASH";

	return (
		<div className={styles.controlDock}>
			{bossSkills.length > 0 && (
				<div className={styles.bossSkillBar}>
					{bossSkills.map((skillId) => {
						const skill = BOSS_SKILLS[skillId];
						const cooldown = bossSkillCooldowns[skillId] ?? 0;
						const disabled = mode !== "playing" || cooldown > 0;

						return (
							<button
								key={skillId}
								type="button"
								className={styles.bossSkillButton}
								disabled={disabled}
								style={{ "--skill-color": skill.color } as CSSProperties}
								onClick={() => onBossSkill(skillId)}
							>
								<span>{skill.shortTitle}</span>
								<strong>{cooldown > 0 ? `${cooldown.toFixed(1)}s` : "READY"}</strong>
							</button>
						);
					})}
				</div>
			)}

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
					{meleeUnlocked ? finLabel : "FIN LOCKED"}
				</button>
				<button type="button" onClick={onRestart}>
					REDEPLOY
				</button>
			</div>
		</div>
	);
};
