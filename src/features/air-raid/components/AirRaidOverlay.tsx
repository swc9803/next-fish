import {
	COIN_SLOT_COST,
	getUpgradeCost,
	META_SLOT_BONUS_LABELS,
	META_SLOT_BONUS_ORDER,
	META_UPGRADE_DEFINITIONS,
	META_UPGRADE_ORDER,
	STAT_SLOT_COST,
} from "../core/meta";
import { AUGMENTS } from "../core/augments";
import type { GameMode, HudState, MetaProgress, MetaUpgradeId, SlotSpinResult } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidOverlayProps = {
	hud: HudState;
	metaProgress: MetaProgress;
	mode: GameMode;
	onBuyUpgrade: (upgradeId: MetaUpgradeId) => void;
	onCoinSlot: () => void;
	onResume: () => void;
	onStart: () => void;
	onStatSlot: () => void;
	slotResult: SlotSpinResult | null;
};

const formatCoinDelta = (deltaCoins?: number) => {
	if (!deltaCoins) return "±0";
	return deltaCoins > 0 ? `+${deltaCoins}` : `${deltaCoins}`;
};

export const AirRaidOverlay = ({
	hud,
	metaProgress,
	mode,
	onBuyUpgrade,
	onCoinSlot,
	onResume,
	onStart,
	onStatSlot,
	slotResult,
}: AirRaidOverlayProps) => {
	if (mode === "playing" || mode === "augment" || mode === "stage-select") return null;

	const startLabel = mode === "gameover" ? "재출격" : "작전 개시";
	const title = mode === "gameover" ? "선체 파손" : mode === "paused" ? "작전 정지" : "심해 출격 대기";
	const showMetaPanel = mode === "ready" || mode === "gameover";
	const lastAugment = hud.lastAugmentId ? AUGMENTS[hud.lastAugmentId] : null;
	const slotBonusSummary = META_SLOT_BONUS_ORDER.filter((bonusId) => metaProgress.slotBonuses[bonusId] > 0)
		.map((bonusId) => `${META_SLOT_BONUS_LABELS[bonusId]} +${metaProgress.slotBonuses[bonusId]}`)
		.join(" · ");

	return (
		<section className={styles.overlay}>
			<div className={styles.panel}>
				<p className={styles.kicker}>Mission Briefing</p>
				<h1>{title}</h1>
				<p className={styles.copy}>
					심해 균열이 열렸습니다. 적성 생물을 격파해 코어 진주를 회수하고, 전투 중 발견한 유물로 무장을 즉시 개조하세요.
					귀환 후에는 인양 주화로 다음 잠수를 준비합니다.
				</p>
				<div className={styles.missionList}>
					<span>CORE PEARL</span>
					<span>ORBIT SHELLS</span>
					<span>RELIC DRAFT</span>
				</div>

				{mode === "gameover" && (
					<div className={styles.rewardLine}>
						<span>KILLS {hud.defeatedEnemies}</span>
						<span>WAVE {hud.wave}</span>
						<span>MAX COMBO x{hud.maxCombo}</span>
						<span>SALVAGE +{hud.earnedCoins}</span>
					</div>
				)}

				{mode === "gameover" && (
					<div className={styles.reportGrid} aria-label="전투 리포트">
						<span>
							<b>MISSIONS</b>
							<strong>{hud.missionsCompleted}</strong>
						</span>
						<span>
							<b>BOSS DMG</b>
							<strong>{Math.round(hud.bossDamageDealt).toLocaleString()}</strong>
						</span>
						<span>
							<b>SUPPLY</b>
							<strong>{hud.suppliesCollected}</strong>
						</span>
						<span>
							<b>HITS TAKEN</b>
							<strong>{hud.damageTaken}</strong>
						</span>
						{lastAugment && (
							<span data-wide="true">
								<b>LAST RELIC</b>
								<strong>{lastAugment.title}</strong>
							</span>
						)}
					</div>
				)}

				<div className={styles.actions}>
					<button type="button" onClick={onStart}>
						{startLabel}
					</button>
					{mode === "paused" && (
						<button type="button" onClick={onResume}>
							계속하기
						</button>
					)}
				</div>
			</div>

			{showMetaPanel && (
				<div className={styles.metaPanel}>
					<div className={styles.metaHeader}>
						<p className={styles.kicker}>Reef Dock</p>
						<strong>SALVAGE {metaProgress.coins.toLocaleString()}</strong>
					</div>

					<div className={styles.slotPanel}>
						<button type="button" className={styles.slotMachine} disabled={metaProgress.coins < COIN_SLOT_COST} onClick={onCoinSlot}>
							<span>Salvage Dive</span>
							<strong>난파선 인양</strong>
							<small>위험한 잔해를 뒤져 추가 주화를 노립니다. 빈손으로 돌아올 수도 있습니다.</small>
							<b>{COIN_SLOT_COST} SALVAGE</b>
						</button>
						<button type="button" className={styles.slotMachine} disabled={metaProgress.coins < STAT_SLOT_COST} onClick={onStatSlot}>
							<span>Mutator Pod</span>
							<strong>변이 코어</strong>
							<small>불안정한 코어를 장착합니다. 작은 진화부터 대형 변이까지 섞여 있습니다.</small>
							<b>{STAT_SLOT_COST} SALVAGE</b>
						</button>
					</div>

					{slotResult && (
						<div className={styles.slotResult} data-kind={slotResult.kind}>
							<span>{slotResult.title}</span>
							<strong>{slotResult.description}</strong>
							{slotResult.kind === "coin" && <small>SALVAGE {formatCoinDelta(slotResult.deltaCoins)}</small>}
							{slotResult.kind === "stat" && slotResult.bonusId && (
								<small>
									{META_SLOT_BONUS_LABELS[slotResult.bonusId]} CORE +{metaProgress.slotBonuses[slotResult.bonusId]}
								</small>
							)}
						</div>
					)}

					{slotBonusSummary && <p className={styles.slotSummary}>장착된 변이: {slotBonusSummary}</p>}

					<div className={styles.metaGrid}>
						{META_UPGRADE_ORDER.map((upgradeId) => {
							const definition = META_UPGRADE_DEFINITIONS[upgradeId];
							const level = metaProgress.upgrades[upgradeId];
							const cost = getUpgradeCost(upgradeId, level);
							const isMaxed = cost === null;
							const canBuy = cost !== null && metaProgress.coins >= cost;

							return (
								<button
									key={upgradeId}
									type="button"
									className={styles.metaUpgrade}
									disabled={!canBuy}
									onClick={() => onBuyUpgrade(upgradeId)}
								>
									<span>
										Lv {level}/{definition.maxLevel}
									</span>
									<strong>{definition.title}</strong>
									<small>{definition.description}</small>
									<b>{isMaxed ? "MAX" : `${cost?.toLocaleString()} SALVAGE`}</b>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</section>
	);
};
