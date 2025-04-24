import { useTexture } from "@react-three/drei";

export interface slideInfo {
	path: string;
	mainColor: string;
	name: string;
	description: string;
	url: string;
	price: number;
	range: number;
}

export const slideArray: slideInfo[] = [
	{
		path: "images/gallery1.png",
		mainColor: "#ff0000",
		name: "car name 1",
		description: "1 빨강",
		url: "https://www.google.com",
		price: 72000,
		range: 660,
	},
	{
		path: "images/gallery2.png",
		mainColor: "#ffa500",
		name: "car name 2",
		description: "2 주황",
		url: "https://www.google.com",
		price: 29740,
		range: 576,
	},
	{
		path: "images/gallery3.png",
		mainColor: "#ffff00",
		name: "car name 3",
		description: "3 노랑",
		url: "https://www.google.com",
		price: 150000,
		range: 800,
	},
	{
		path: "images/gallery4.png",
		mainColor: "#008000",
		name: "car name 4",
		description: "4 초록",
		url: "https://www.google.com",
		price: 95000,
		range: 500,
	},
	{
		path: "images/gallery5.png",
		mainColor: "#0000ff",
		name: "car name 5",
		description: "5 파랑",
		url: "https://www.google.com",
		price: 120000,
		range: 700,
	},
	{
		path: "images/gallery6.png",
		mainColor: "#800080",
		name: "car name 6",
		description: "6 보라",
		url: "https://www.google.com",
		price: 20000,
		range: 400,
	},
];

slideArray.forEach((slide) => useTexture.preload(slide.path));

export const getSlidePosition = (slideIndex: number, radius: number) => {
	const angleInRadians = -(2 * Math.PI * slideIndex) / slideArray.length;
	return {
		x: radius * Math.sin(angleInRadians),
		z: radius * Math.cos(angleInRadians),
		angleInRadians,
	};
};
