import { useFishStore } from "@/store/useFishStore";

export const FishConfig = () => {
	const { backgroundColor, setBackgroundColor, fogColor, setFogColor, fishSpeed, fishScale, fogDensity, setFishSpeed, setFishScale, setFogDensity } =
		useFishStore();

	return (
		<div className="fish_config">
			<div>
				<label>Fish Speed:</label>
				<input type="number" value={fishSpeed} onChange={(e) => setFishSpeed(Number(e.target.value))} min={10} max={200} />
			</div>
			<div>
				<label>Fish Scale:</label>
				<input type="number" value={fishScale} onChange={(e) => setFishScale(Number(e.target.value))} min={0.1} max={10} step={0.1} />
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
