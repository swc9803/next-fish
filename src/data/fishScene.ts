export const BOMB_ZONE_POSITION_X = -75;

export const DECORATION_MODELS = [
	{ key: "shell2", path: "/models/decoration/shell2.glb", scale: 2, position: [10, 0, 12], rotation: [0, 0, Math.PI / 2] },
	{ key: "seaweed1", path: "/models/decoration/seaweed1.glb", scale: 2.5, position: [35, 0.5, 27] },
	{ key: "seaweed2", path: "/models/decoration/seaweed2.glb", scale: 0.3, position: [-49, 0.5, 30] },
	{ key: "coral1", path: "/models/decoration/coral1.glb", scale: 0.5, position: [5, 0.5, 32] },
	{ key: "coral2", path: "/models/decoration/coral2.glb", scale: 4, position: [37, 0.5, -16] },
	{ key: "seastar", path: "/models/decoration/seastar.glb", scale: 3, position: [20, 0.5, -17] },
	{ key: "seaspike", path: "/models/decoration/seaspike.glb", scale: 0.6, position: [-2, 0.5, -25], rotation: [0, Math.PI / 4, 0] },
	{ key: "sushi", path: "/models/decoration/sushi.glb", scale: 4, position: [-135, 0.5, -20], rotation: [0, Math.PI / 1.5, 0] },
	{ key: "crab", path: "/models/decoration/crab.glb", scale: 7, position: [-35, 0.5, -27], rotation: [0, Math.PI / 8, 0] },
] as const;

export type DecorationKey = (typeof DECORATION_MODELS)[number]["key"];
export type DecorationLoadedFlags = Record<DecorationKey, boolean>;

export const createDecorationLoadedFlags = (): DecorationLoadedFlags =>
	DECORATION_MODELS.reduce((flags, item) => {
		flags[item.key] = false;
		return flags;
	}, {} as DecorationLoadedFlags);

export const TALKATIVE_MODELS = [
	{
		modelPath: "/models/fish_logo.glb",
		modelPosition: [-40, 0.5, -10],
		bubblePosition: [-41, 1, -15],
		text: "왼쪽 지형은 여러 게임들을 즐길 수 있는 곳 입니다.",
	},
	{
		modelPath: "/models/fish_car.glb",
		modelPosition: [35, 0.5, 0],
		bubblePosition: [36, 1, -5],
		text: "오른쪽으로 이동하면 프로젝트들을 보실 수 있습니다.",
	},
	{
		modelPath: "/models/fish_game.glb",
		modelPosition: [-18, 0.5, 16],
		bubblePosition: [-19, 1, 11],
		text: "각 로고에 다가가면 사이트가 열립니다.",
	},
	{
		modelPath: "/models/update.glb",
		modelPosition: [-125, 0.5, 10],
		bubblePosition: [-126, 1, 5],
		text: "곧 게임이 추가될 예정입니다!",
	},
] as const;

export const ROUTER_LOGOS = [
	{
		id: "github",
		url: "https://github.com/swc9803",
		modelPath: "/models/github.glb",
		position: [-10, 0.5, 25],
	},
	{
		id: "codepen",
		url: "https://codepen.io/swc9803/pens/public",
		modelPath: "/models/codepen.glb",
		position: [0, 0.5, 25],
	},
	{
		id: "email",
		url: "mailto:swc9803@gmail.com",
		modelPath: "/models/email.glb",
		position: [10, 0.5, 25],
	},
	{
		id: "gallery",
		url: "/gallery",
		modelPath: "/models/car.glb",
		position: [35, 0.5, 7],
		isInternal: true,
	},
] as const;
