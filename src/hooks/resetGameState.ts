import { Dispatch, SetStateAction } from "react";
import { useFishStore } from "@/store/useFishStore";

export type Feed = { id: string; position: [number, number, number] };

export const resetGameState = (
	setIsGameOver: Dispatch<SetStateAction<boolean>>,
	setIsInBombZone: Dispatch<SetStateAction<boolean>>,
	setBombActive: Dispatch<SetStateAction<boolean>>,
	setFeeds: Dispatch<SetStateAction<Feed[]>>
) => {
	setIsGameOver(false);
	setIsInBombZone(false);
	setBombActive(false);
	setFeeds([]);
	useFishStore.getState().setFishScale(1);
	useFishStore.getState().setFishSpeed(20);
};
