import { useFishStore } from "@/store/useFishStore";

export const FishColorPicker = () => {
	const fishColor = useFishStore((s) => s.fishColor);
	const setFishColor = useFishStore((s) => s.setFishColor);

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFishColor(e.target.value);
	};

	return (
		<div className="fish_color_picker">
			<label className="color_wrapper" style={{ backgroundColor: fishColor }}>
				<input type="color" value={fishColor} onChange={handleColorChange} />
			</label>
		</div>
	);
};
