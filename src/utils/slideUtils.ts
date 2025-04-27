import { useTexture } from "@react-three/drei";

export interface slideInfo {
	imagePaths: string[];
	name: string;
	description: string;
	url: string;
	price: number;
	range: number;
}

export const slideArray: slideInfo[] = [
	{
		imagePaths: ["images/gallery1-1.jpg", "images/gallery1-2.jpg", "images/gallery1-3.jpg"],
		name: "car name 1",
		description: "1 빨강",
		url: "https://lotteriafont.com/chobddag",
		price: 72000,
		range: 660,
	},
	{
		imagePaths: ["images/gallery2-1.jpg", "images/gallery2-2.jpg", "images/gallery2-3.jpg"],
		name: "car name 2",
		description: "2 주황",
		url: "https://groot.co.kr/works",
		price: 29740,
		range: 576,
	},
	{
		imagePaths: ["images/gallery3-1.jpg", "images/gallery3-2.jpg", "images/gallery3-3.jpg"],
		name: "car name 3",
		description: "3 노랑",
		url: "https://amazing-prototype.firebaseapp.com",
		price: 150000,
		range: 800,
	},
	{
		imagePaths: ["images/gallery4-1.jpg", "images/gallery4-2.jpg", "images/gallery4-3.jpg"],
		name: "car name 4",
		description: "4 초록",
		url: "https://a-perspective-magazine.com/main",
		price: 95000,
		range: 500,
	},
	{
		imagePaths: ["images/gallery5-1.jpg", "images/gallery5-2.jpg", "images/gallery5-3.jpg"],
		name: "car name 5",
		description: "5 파랑",
		url: "https://sung-gallery.firebaseapp.com",
		price: 120000,
		range: 700,
	},
	{
		imagePaths: ["images/gallery6-1.jpg", "images/gallery6-2.jpg", "images/gallery6-3.jpg"],
		name: "car name 6",
		description: "6 보라",
		url: "https://lab.ddungsang.com/wemix2022/phone/dist/?auth=QX7UD931",
		price: 20000,
		range: 400,
	},
];

slideArray.forEach((slide) => useTexture.preload(slide.imagePaths));

export const getSlidePosition = (slideIndex: number, radius: number) => {
	const angleInRadians = -(2 * Math.PI * slideIndex) / slideArray.length;
	return {
		x: radius * Math.sin(angleInRadians),
		z: radius * Math.cos(angleInRadians),
		angleInRadians,
	};
};
