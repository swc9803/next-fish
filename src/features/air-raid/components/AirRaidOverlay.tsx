import {
	COIN_SLOT_COST,
	getUpgradeCost,
	META_SLOT_BONUS_LABELS,
	META_SLOT_BONUS_ORDER,
	META_UPGRADE_DEFINITIONS,
	META_UPGRADE_ORDER,
	STAT_SLOT_COST,
} from "../core/meta";
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
	if (mode === "playing" || mode === "augment") return null;

	const startLabel = mode === "gameover" ? "다시 출격" : "출격";
	const title = mode === "gameover" ? "작전 실패" : mode === "paused" ? "일시 정지" : "비행 준비";
	const showMetaPanel = mode === "ready" || mode === "gameover";
	const slotBonusSummary = META_SLOT_BONUS_ORDER.filter((bonusId) => metaProgress.slotBonuses[bonusId] > 0)
		.map((bonusId) => `${META_SLOT_BONUS_LABELS[bonusId]} +${metaProgress.slotBonuses[bonusId]}`)
		.join(" · ");

	return (
		<section className={styles.overlay}>
			<div className={styles.panel}>
				<p className={styles.kicker}>Sky 1945</p>
				<h1>{title}</h1>
				<p className={styles.copy}>
					적을 격추하면 경험치가 떨어지고, 기체로 먹어 레벨업하면 런 증강을 선택합니다. 영구 능력치는 출격 전에 주화로
					강화합니다.
				</p>

				{mode === "gameover" && (
					<div className={styles.rewardLine}>
						<span>격추 {hud.defeatedEnemies}</span>
						<span>웨이브 {hud.wave}</span>
						<span>획득 주화 +{hud.earnedCoins}</span>
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
						<p className={styles.kicker}>Hangar</p>
						<strong>보유 주화 {metaProgress.coins.toLocaleString()}</strong>
					</div>

					<div className={styles.slotPanel}>
						<button type="button" className={styles.slotMachine} disabled={metaProgress.coins < COIN_SLOT_COST} onClick={onCoinSlot}>
							<span>Coin Slot</span>
							<strong>주화 슬롯</strong>
							<small>{COIN_SLOT_COST} 주화로 손실부터 잭팟까지 노립니다.</small>
							<b>{COIN_SLOT_COST} 주화</b>
						</button>
						<button type="button" className={styles.slotMachine} disabled={metaProgress.coins < STAT_SLOT_COST} onClick={onStatSlot}>
							<span>Stat Slot</span>
							<strong>랜덤 능력치 슬롯</strong>
							<small>싼 가격으로 무작위 능력치를 얻습니다. 저효율과 고효율이 섞여 있습니다.</small>
							<b>{STAT_SLOT_COST} 주화</b>
						</button>
					</div>

					{slotResult && (
						<div className={styles.slotResult} data-kind={slotResult.kind}>
							<span>{slotResult.title}</span>
							<strong>{slotResult.description}</strong>
							{slotResult.kind === "coin" && <small>주화 변화 {formatCoinDelta(slotResult.deltaCoins)}</small>}
							{slotResult.kind === "stat" && slotResult.bonusId && (
								<small>
									{META_SLOT_BONUS_LABELS[slotResult.bonusId]} 누적 +{metaProgress.slotBonuses[slotResult.bonusId]}
								</small>
							)}
						</div>
					)}

					{slotBonusSummary && <p className={styles.slotSummary}>슬롯 보너스: {slotBonusSummary}</p>}

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
									<b>{isMaxed ? "MAX" : `${cost?.toLocaleString()} 주화`}</b>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</section>
	);
};
