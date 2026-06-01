import { STORAGE_KEY } from "./constants";
import { createDefaultMetaProgress, getUpgradeCost, sanitizeMetaProgress, spinCoinSlot, spinStatSlot } from "./meta";
import type { MetaProgress, MetaUpgradeId, SlotSpinResult } from "./types";

const META_STORAGE_KEY = "next-fish-air-raid-meta-progress";

export const readHighScore = () => {
	if (typeof window === "undefined") return 0;
	return Number(window.localStorage.getItem(STORAGE_KEY) || 0);
};

export const writeHighScore = (score: number) => {
	window.localStorage.setItem(STORAGE_KEY, String(score));
};

export const readMetaProgress = (): MetaProgress => {
	if (typeof window === "undefined") return createDefaultMetaProgress();

	try {
		return sanitizeMetaProgress(JSON.parse(window.localStorage.getItem(META_STORAGE_KEY) || "null"));
	} catch {
		return createDefaultMetaProgress();
	}
};

export const writeMetaProgress = (progress: MetaProgress) => {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(sanitizeMetaProgress(progress)));
};

export const grantCoins = (amount: number) => {
	const progress = readMetaProgress();
	progress.coins += Math.max(0, Math.floor(amount));
	writeMetaProgress(progress);
	return progress;
};

export const buyMetaUpgrade = (upgradeId: MetaUpgradeId) => {
	const progress = readMetaProgress();
	const level = progress.upgrades[upgradeId];
	const cost = getUpgradeCost(upgradeId, level);

	if (cost === null || progress.coins < cost) return progress;

	progress.coins -= cost;
	progress.upgrades[upgradeId] = level + 1;
	writeMetaProgress(progress);
	return progress;
};

export const playCoinSlot = (): { progress: MetaProgress; result: SlotSpinResult } => {
	const { progress, result } = spinCoinSlot(readMetaProgress());
	writeMetaProgress(progress);
	return { progress, result };
};

export const playStatSlot = (): { progress: MetaProgress; result: SlotSpinResult } => {
	const { progress, result } = spinStatSlot(readMetaProgress());
	writeMetaProgress(progress);
	return { progress, result };
};
