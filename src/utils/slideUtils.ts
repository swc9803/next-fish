import { useTexture } from "@react-three/drei";

export interface slideInfo {
	imagePaths: string[];
	name: string;
	description: string;
	url: string;
}

export const slideArray: slideInfo[] = [
	{
		imagePaths: ["images/gallery1-1.jpg", "images/gallery1-2.jpg", "images/gallery1-3.jpg"],
		name: "RIOT GAMES 이벤트 페이지",
		description: "RIOT GAMES의 발로란트와 전략적 팀 전투(TFT) 이벤트 페이지 퍼블리싱 담당, 게임과 이벤트 컨셉에 맞춘 UI 구성과 모션 구현",
		url: "https://groot.co.kr/works",
	},
	{
		imagePaths: ["images/gallery2-1.jpg", "images/gallery2-2.jpg", "images/gallery2-3.jpg"],
		name: "롯데리아 신규 폰트 런칭 페이지",
		description: "롯데리아 신규 폰트 런칭 페이지 퍼블리싱 담당, 브랜드 아이덴티티를 반영한 디자인과 모션 구현",
		url: "https://lotteriafont.com/chobddag",
	},
	{
		imagePaths: ["images/gallery3-1.jpg", "images/gallery3-2.jpg", "images/gallery3-3.jpg"],
		name: "에스테틱 브랜드 소개 사이트",
		description: "에스테틱 브랜드 소개 웹사이트 퍼블리싱 및 프론트엔드 담당, 반응형 구현과 모션 중심 구성",
		url: "https://amazing-prototype.firebaseapp.com",
	},
	{
		imagePaths: ["images/gallery4-1.jpg", "images/gallery4-2.jpg", "images/gallery4-3.jpg"],
		name: "디지털 매거진 사이트",
		description: "Volvo 자회사 Polestar의 브랜드 매거진 사이트 퍼블리싱 담당, 반응형 구조와 디테일한 UI 구현 중심",
		url: "https://a-perspective-magazine.com/main",
	},
	{
		imagePaths: ["images/gallery5-1.jpg", "images/gallery5-2.jpg", "images/gallery5-3.jpg"],
		name: "Creative Studies",
		description: "다양한 시도를 담은 개인 실험 공간, 애니메이션 아이디어를 지속적으로 업데이트 중",
		url: "https://sung-gallery.firebaseapp.com",
	},
	{
		imagePaths: ["images/gallery6-1.jpg", "images/gallery6-2.jpg", "images/gallery6-3.jpg"],
		name: "WEMIX 실시간 콘텐츠 디스플레이 UI",
		description: "코엑스와 DDP에 설치된 스크린에 실시간으로 사용자 조작에 따라 변경되는 스크린 디스플레이 페이지, 전시 환경에 맞춘 조작 UI 구현",
		url: "https://lab.ddungsang.com/wemix2022/phone/dist/?auth=QX7UD931",
	},
];

slideArray.forEach((slide) => useTexture.preload(slide.imagePaths));

export const getSlidePosition = (slideIndex: number, radius: number) => {
	const angleInRadians = -(2 * Math.PI * slideIndex) / slideArray.length;
	const x = radius * Math.sin(angleInRadians);
	const z = radius * Math.cos(angleInRadians);

	return { x, z, angleInRadians };
};
