import { memo, useCallback } from "react";
import { useFishStore } from "@/store/useFishStore";

const FishConfigComponent = () => {
	const fishSpeed = useFishStore((s) => s.fishSpeed);
	const fishScale = useFishStore((s) => s.fishScale);
	const setFishSpeed = useFishStore((s) => s.setFishSpeed);
	const setFishScale = useFishStore((s) => s.setFishScale);

	const backgroundColor = useFishStore((s) => s.backgroundColor);
	const fogColor = useFishStore((s) => s.fogColor);
	const fogDensity = useFishStore((s) => s.fogDensity);
	const setBackgroundColor = useFishStore((s) => s.setBackgroundColor);
	const setFogColor = useFishStore((s) => s.setFogColor);
	const setFogDensity = useFishStore((s) => s.setFogDensity);

	const handleSpeedChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = Number(e.target.value);
			if (!isNaN(val)) setFishSpeed(val);
		},
		[setFishSpeed]
	);

	const handleScaleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = Number(e.target.value);
			if (!isNaN(val)) setFishScale(val);
		},
		[setFishScale]
	);

	return (
		<div className="fish_config">
			<div>
				<label>Fish Speed:</label>
				<input type="number" value={fishSpeed} onChange={handleSpeedChange} min={10} max={200} />
			</div>
			<div>
				<label>Fish Scale:</label>
				<input type="number" value={fishScale} onChange={handleScaleChange} min={0.1} max={10} step={0.1} />
			</div>
			<div>
				<label>Background Color:</label>
				<input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
			</div>
			<div>
				<label>Fog Color:</label>
				<input type="color" value={fogColor} onChange={(e) => setFogColor(e.target.value)} />
			</div>
			<div>
				<label>Fog Density:</label>
				<input type="number" value={fogDensity} onChange={(e) => setFogDensity(Number(e.target.value))} min={0.001} max={1} step={0.001} />
			</div>
		</div>
	);
};

export const FishConfig = memo(FishConfigComponent);
