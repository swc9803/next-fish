import { AUGMENTS } from "../core/augments";
import type { AugmentId, GameMode } from "../core/types";
import styles from "../AirRaidGame.module.scss";

type AirRaidAugmentOverlayProps = {
	choices: AugmentId[];
	mode: GameMode;
	onSelect: (augmentId: AugmentId) => void;
};

export const AirRaidAugmentOverlay = ({ choices, mode, onSelect }: AirRaidAugmentOverlayProps) => {
	if (mode !== "augment") return null;

	return (
		<section className={styles.augmentOverlay}>
			<div className={styles.augmentHeader}>
				<p className={styles.kicker}>Augment</p>
				<h1>증강 선택</h1>
			</div>

			<div className={styles.augmentGrid}>
				{choices.map((augmentId) => {
					const augment = AUGMENTS[augmentId];
					return (
						<button key={augment.id} type="button" className={styles.augmentCard} onClick={() => onSelect(augment.id)}>
							<span>{augment.title}</span>
							<strong>{augment.description}</strong>
							<small>{augment.flavor}</small>
						</button>
					);
				})}
			</div>
		</section>
	);
};
