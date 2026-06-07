import { AUGMENT_ATTRIBUTE_LABELS, AUGMENTS, RARITY_LABELS } from "../core/augments";
import type { AugmentId, AugmentRarity, GameMode } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidAugmentOverlayProps = {
	choices: AugmentId[];
	augmentStacks: Partial<Record<AugmentId, number>>;
	mode: GameMode;
	onSelect: (augmentId: AugmentId) => void;
};

const RARITY_RANK: Record<AugmentRarity, number> = {
	common: 0,
	rare: 1,
	unique: 2,
	legendary: 3,
};

const getStackLabel = (currentStacks: number, maxStacks?: number) => {
	if (!maxStacks || maxStacks <= 1) return "획득";
	if (currentStacks <= 0) return "신규";
	if (currentStacks + 1 >= maxStacks) return "최종 진화";
	return `강화 ${currentStacks + 1}`;
};

export const AirRaidAugmentOverlay = ({ choices, augmentStacks, mode, onSelect }: AirRaidAugmentOverlayProps) => {
	if (mode !== "augment") return null;

	const highestRarity = choices.reduce<AugmentRarity>((highest, augmentId) => {
		const rarity = AUGMENTS[augmentId].rarity;
		return RARITY_RANK[rarity] > RARITY_RANK[highest] ? rarity : highest;
	}, "common");

	return (
		<section className={styles.augmentOverlay} data-draft-rarity={highestRarity}>
			<div className={styles.augmentHeader}>
				<p className={styles.kicker}>유물 선택</p>
				<h1>심해 유물 선택</h1>
			</div>

			<div className={styles.augmentGrid}>
				{choices.map((augmentId) => {
					const augment = AUGMENTS[augmentId];
					const attribute = augment.attribute ? AUGMENT_ATTRIBUTE_LABELS[augment.attribute] : null;
					const currentStacks = augmentStacks[augmentId] ?? 0;
					const maxStacks = augment.maxStacks ?? 1;
					const nextStack = Math.min(maxStacks, currentStacks + 1);
					return (
						<button
							key={augment.id}
							type="button"
							className={styles.augmentCard}
							data-attribute={augment.attribute ?? "none"}
							data-rarity={augment.rarity}
							onClick={() => onSelect(augment.id)}
						>
							<i className={styles.rarityFlare} aria-hidden="true">
								<em />
								<em />
								<em />
								<em />
							</i>
							<div className={styles.augmentMeta}>
								<span>{RARITY_LABELS[augment.rarity]}</span>
								{attribute && (
									<span className={styles.attributeBadge}>
										<i>{attribute.icon}</i>
										{attribute.label}
									</span>
								)}
								<span>{getStackLabel(currentStacks, augment.maxStacks)}</span>
							</div>
							<b>{augment.title}</b>
							<strong>{augment.description}</strong>
							{maxStacks > 1 && (
								<div className={styles.stackTrack} aria-label={`${augment.title} ${nextStack}/${maxStacks}단계`}>
									{Array.from({ length: maxStacks }, (_, index) => (
										<i key={index} data-filled={index < nextStack} />
									))}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</section>
	);
};
