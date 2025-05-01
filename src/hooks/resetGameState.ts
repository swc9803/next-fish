import { Object3D } from "three";
import { useFishStore } from "@/store/useFishStore";

export type Feed = { id: string; position: [number, number, number] };

export const resetGameState = (
	fishRef: React.RefObject<Object3D>,
	setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>,
	setIsInBombZone: React.Dispatch<React.SetStateAction<boolean>>,
	setBombActive: React.Dispatch<React.SetStateAction<boolean>>,
	setScore: (value: number) => void,
	setCountdown: React.Dispatch<React.SetStateAction<number | null>>,
	setFeeds: React.Dispatch<React.SetStateAction<Feed[]>>
) => {
	if (fishRef.current) {
		fishRef.current.position.set(0, 1, 0);
	}
	setIsGameOver(false);
	setIsInBombZone(false);
	setBombActive(false);
	setScore(0);
	setCountdown(null);
	setFeeds([]);
	useFishStore.getState().setFishScale(1);
	useFishStore.getState().setFishSpeed(20);
};
