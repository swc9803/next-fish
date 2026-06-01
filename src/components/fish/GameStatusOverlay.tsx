import { RefObject } from "react";

interface GameStatusOverlayProps {
	countdown: number | null;
	countdownRef: RefObject<HTMLParagraphElement | null>;
	isGameOver: boolean;
	isInBombZone: boolean;
	score: number;
	showClearText: boolean;
}

export const GameStatusOverlay = ({ countdown, countdownRef, isGameOver, isInBombZone, score, showClearText }: GameStatusOverlayProps) => {
	const visible = countdown !== null || showClearText || isInBombZone || isGameOver;
	if (!visible) return null;

	return (
		<div className="game_overlay">
			{countdown !== null && countdown > 0 && (
				<p ref={countdownRef} className="countdown number">
					{countdown}
				</p>
			)}
			{countdown === 0 && (
				<p ref={countdownRef} className="countdown start">
					START!
				</p>
			)}
			{showClearText && (
				<p ref={countdownRef} className="countdown clear">
					CLEAR!
				</p>
			)}
			{(isInBombZone || isGameOver) && <p className="score">Score: {score}</p>}
		</div>
	);
};
