import { useEffect, useRef } from "react";
import { useFishStore } from "@/store/useFishStore";
import gsap from "gsap";
import { Color } from "three";

export const FishColorPicker = () => {
	const fishColor = useFishStore((s) => s.fishColor);
	const setFishColor = useFishStore((s) => s.setFishColor);

	const colorRef = useRef({ r: 0, g: 0, b: 0 });

	useEffect(() => {
		const initial = new Color(fishColor);
		colorRef.current = { r: initial.r, g: initial.g, b: initial.b };
	}, []);

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const targetColor = new Color(e.target.value);

		gsap.to(colorRef.current, {
			duration: 1,
			r: targetColor.r,
			g: targetColor.g,
			b: targetColor.b,
			onUpdate: () => {
				const { r, g, b } = colorRef.current;
				setFishColor(`#${new Color(r, g, b).getHexString()}`);
			},
			ease: "power2.out",
		});
	};

	return (
		<div className="fish_color_picker">
			<label className="color_wrapper" style={{ backgroundColor: fishColor }}>
				<input type="color" value={fishColor} onChange={handleColorChange} />
			</label>
		</div>
	);
};
