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
		name: "car name 0",
		description: "0 빨강",
		url: "https://lotteriafont.com/chobddag",
		price: 0,
		range: 0,
	},
	{
		imagePaths: ["images/gallery2-1.jpg", "images/gallery2-2.jpg", "images/gallery2-3.jpg"],
		name: "car name 1",
		description: "1 주황",
		url: "https://groot.co.kr/works",
		price: 1,
		range: 1,
	},
	{
		imagePaths: ["images/gallery3-1.jpg", "images/gallery3-2.jpg", "images/gallery3-3.jpg"],
		name: "car name 2",
		description: "2 노랑",
		url: "https://amazing-prototype.firebaseapp.com",
		price: 2,
		range: 2,
	},
	{
		imagePaths: ["images/gallery4-1.jpg", "images/gallery4-2.jpg", "images/gallery4-3.jpg"],
		name: "car name 3",
		description: "3 초록",
		url: "https://a-perspective-magazine.com/main",
		price: 3,
		range: 3,
	},
	{
		imagePaths: ["images/gallery5-1.jpg", "images/gallery5-2.jpg", "images/gallery5-3.jpg"],
		name: "car name 4",
		description: "4 파랑",
		url: "https://sung-gallery.firebaseapp.com",
		price: 4,
		range: 4,
	},
	{
		imagePaths: ["images/gallery6-1.jpg", "images/gallery6-2.jpg", "images/gallery6-3.jpg"],
		name: "car name 5",
		description: "5 보라",
		url: "https://lab.ddungsang.com/wemix2022/phone/dist/?auth=QX7UD931",
		price: 5,
		range: 5,
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
