import {
	PLAYER_BOUNDS_PADDING_BOTTOM,
	PLAYER_BOUNDS_PADDING_TOP,
	PLAYER_HITBOX_HEAD_OFFSET_Y,
	PLAYER_HITBOX_RADIUS,
	WORLD_HEIGHT,
	WORLD_WIDTH,
} from "./constants";
import type { GameState } from "./types";

const ROUTE_PORTAL_Y = 46;
const ROUTE_SIDE_PORTAL_Y = 126;
const ROUTE_PORTAL_RADIUS = 42;

export const getPlayerHitbox = (state: GameState) => ({
	x: state.player.x,
	y: state.player.y - PLAYER_HITBOX_HEAD_OFFSET_Y,
	radius: PLAYER_HITBOX_RADIUS,
});

export const getStageRoutePosition = (index: number) => ({
	x: [88, WORLD_WIDTH / 2, WORLD_WIDTH - 88][index] ?? WORLD_WIDTH / 2,
	y: index === 1 ? ROUTE_PORTAL_Y : ROUTE_SIDE_PORTAL_Y,
	radius: ROUTE_PORTAL_RADIUS,
});

export const getPlayerMinY = (radius: number) => radius + PLAYER_BOUNDS_PADDING_TOP;

export const getPlayerMaxY = (radius: number) => WORLD_HEIGHT - radius - PLAYER_BOUNDS_PADDING_BOTTOM;

export const getPetShieldRadius = (level: number) => 18 + level * 3.2;
