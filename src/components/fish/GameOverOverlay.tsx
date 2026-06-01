interface GameOverOverlayProps {
	canRestart: boolean;
	onReset: () => void;
}

export const GameOverOverlay = ({ canRestart, onReset }: GameOverOverlayProps) => {
	return (
		<div onClick={onReset} className="gameover_overlay">
			<h1>YOU&apos;RE COOKED</h1>
			<p className={canRestart ? "show" : ""}>Click the screen to restart</p>
		</div>
	);
};
