import { AUGMENTS, RARITY_LABELS } from "../core/augments";
import type { AugmentId, AugmentRarity, GameMode } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidAugmentOverlayProps = {
	choices: AugmentId[];
	mode: GameMode;
	onSelect: (augmentId: AugmentId) => void;
};

const RARITY_RANK: Record<AugmentRarity, number> = {
	common: 0,
	rare: 1,
	unique: 2,
	legendary: 3,
};

export const AirRaidAugmentOverlay = ({ choices, mode, onSelect }: AirRaidAugmentOverlayProps) => {
	if (mode !== "augment") return null;

	const highestRarity = choices.reduce<AugmentRarity>((highest, augmentId) => {
		const rarity = AUGMENTS[augmentId].rarity;
		return RARITY_RANK[rarity] > RARITY_RANK[highest] ? rarity : highest;
	}, "common");

	return (
		<section className={styles.augmentOverlay} data-draft-rarity={highestRarity}>
			<div className={styles.augmentHeader}>
				<p className={styles.kicker}>Relic Draft</p>
				<h1>심해 유물 선택</h1>
			</div>

			<div className={styles.augmentGrid}>
				{choices.map((augmentId) => {
					const augment = AUGMENTS[augmentId];
					return (
							<button
								key={augment.id}
								type="button"
								className={styles.augmentCard}
								data-rarity={augment.rarity}
								onClick={() => onSelect(augment.id)}
							>
								<i className={styles.rarityFlare} aria-hidden="true">
									<em />
									<em />
									<em />
									<em />
								</i>
								<span>{RARITY_LABELS[augment.rarity]}</span>
								<b>{augment.title}</b>
								<strong>{augment.description}</strong>
								<small>{augment.flavor}</small>
							</button>
					);
				})}
			</div>
		</section>
	);
};
