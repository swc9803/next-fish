import { useFishStore } from "@/store/useFishStore";

export type Feed = { id: string; position: [number, number, number] };

export const resetGameState = (
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>,
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>,
	setBombActive: React.Dispatch<React.SetStateAction<boolean>>,
	setFeeds: React.Dispatch<React.SetStateAction<Feed[]>>
) => {
	setIsGameOver(false);
	setIsInBombZone(false);
	setBombActive(false);
	setFeeds([]);
	useFishStore.getState().setFishScale(1);
	useFishStore.getState().setFishSpeed(20);
};
