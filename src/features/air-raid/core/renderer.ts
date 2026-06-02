import {
	MELEE_MAX_CHARGE,
	PLAYER_BULLET_MAX_VISUAL_RADIUS,
	PLAYER_BULLET_MIN_VISUAL_RADIUS,
	PLAYER_BULLET_VISUAL_SCALE,
	WORLD_HEIGHT,
	WORLD_WIDTH,
} from "./constants";
import { clamp, randomRange } from "./math";
import { getStagePalette } from "./stages";
import type { Bullet, CollectionEffect, ExperienceOrb, GameState, Layout, Particle, Pet, Plane, PowerUp, Slash } from "./types";

const drawFishSilhouette = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, fill: string, accent: string, isPlayer: boolean) => {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(scale, scale);

	if (!isPlayer) ctx.rotate(Math.PI);

	ctx.beginPath();
	ctx.ellipse(0, -1, 14, 27, 0, 0, Math.PI * 2);
	ctx.fillStyle = fill;
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(0, 27);
	ctx.lineTo(-17, 45);
	ctx.lineTo(0, 37);
	ctx.lineTo(17, 45);
	ctx.closePath();
	ctx.fillStyle = accent;
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(-11, 4);
	ctx.quadraticCurveTo(-30, 12, -19, 26);
	ctx.quadraticCurveTo(-10, 18, -7, 8);
	ctx.fillStyle = "rgba(255,255,255,0.28)";
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(11, 4);
	ctx.quadraticCurveTo(30, 12, 19, 26);
	ctx.quadraticCurveTo(10, 18, 7, 8);
	ctx.fill();

	ctx.strokeStyle = "rgba(255,255,255,0.5)";
	ctx.lineWidth = 1.5;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(5, -18, 2.7, 0, Math.PI * 2);
	ctx.fillStyle = isPlayer ? "#02202d" : "#fff0c0";
	ctx.fill();
	ctx.restore();
};

const drawBackground = (ctx: CanvasRenderingContext2D, state: GameState) => {
	const palette = getStagePalette(state.stage);
	const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
	gradient.addColorStop(0, palette.top);
	gradient.addColorStop(0.42, palette.mid);
	gradient.addColorStop(1, palette.bottom);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

	for (const bubble of state.stars) {
		ctx.globalAlpha = bubble.alpha * 0.75;
		ctx.strokeStyle = "rgba(189, 245, 255, 0.72)";
		ctx.lineWidth = Math.max(0.7, bubble.size * 0.35);
		ctx.beginPath();
		ctx.arc(bubble.x, bubble.y, bubble.size * 1.35, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.globalAlpha = 1;

	ctx.fillStyle = "rgba(169, 246, 255, 0.055)";
	for (let i = 0; i < 5; i++) {
		const y = (state.time * (18 + i * 8) + i * 138) % (WORLD_HEIGHT + 180) - 120;
		ctx.beginPath();
		ctx.ellipse(70 + i * 78, y, 58 + i * 8, 16 + i * 2, 0, 0, Math.PI * 2);
		ctx.ellipse(118 + i * 64, y + 8, 48, 13, 0, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.strokeStyle = `${palette.accent}22`;
	ctx.lineWidth = 1.2;
	for (let x = -80; x < WORLD_WIDTH + 140; x += 42) {
		ctx.beginPath();
		ctx.moveTo(x + Math.sin(state.time * 0.7 + x) * 14, 0);
		ctx.bezierCurveTo(x + 70, 180, x - 120, 430, x + 35, WORLD_HEIGHT);
		ctx.stroke();
	}

	const vignette = ctx.createRadialGradient(WORLD_WIDTH / 2, WORLD_HEIGHT * 0.5, 120, WORLD_WIDTH / 2, WORLD_HEIGHT * 0.5, WORLD_HEIGHT * 0.72);
	vignette.addColorStop(0, "rgba(0,0,0,0)");
	vignette.addColorStop(1, "rgba(0,0,0,0.36)");
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
};

const drawBullets = (ctx: CanvasRenderingContext2D, bullets: Bullet[]) => {
	for (const bullet of bullets) {
		const isPlayerBullet = bullet.from === "player";
		const visualRadius = isPlayerBullet
			? clamp(bullet.visualRadius ?? bullet.radius * PLAYER_BULLET_VISUAL_SCALE, PLAYER_BULLET_MIN_VISUAL_RADIUS, PLAYER_BULLET_MAX_VISUAL_RADIUS)
			: bullet.radius;
		const trailScale = isPlayerBullet ? 0.026 : 0.035;

		ctx.save();
		ctx.shadowColor = bullet.color;
		ctx.shadowBlur = isPlayerBullet ? 9 : 14;
		ctx.strokeStyle = bullet.color;
		ctx.globalAlpha = isPlayerBullet ? 0.26 : 0.48;
		ctx.lineWidth = visualRadius * (isPlayerBullet ? 0.65 : 1.15);
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(bullet.x, bullet.y);
		ctx.lineTo(bullet.x - bullet.vx * trailScale, bullet.y - bullet.vy * trailScale);
		ctx.stroke();
		ctx.globalAlpha = 1;
		ctx.fillStyle = bullet.color;
		ctx.beginPath();
		ctx.ellipse(bullet.x, bullet.y, visualRadius * (isPlayerBullet ? 0.86 : 1), visualRadius * (isPlayerBullet ? 1.12 : 2.1), 0, 0, Math.PI * 2);
		ctx.fill();
		if (isPlayerBullet) {
			ctx.fillStyle = "rgba(255,255,255,0.9)";
			ctx.beginPath();
			ctx.arc(bullet.x - visualRadius * 0.2, bullet.y - visualRadius * 0.24, Math.max(0.65, visualRadius * 0.22), 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}
};

const drawEnemies = (ctx: CanvasRenderingContext2D, enemies: Plane[]) => {
	for (const enemy of enemies) {
		const palette = getStagePalette(enemy.stage);
		const scale = enemy.kind === "boss" ? 1.38 : enemy.kind === "bomber" ? 0.83 : enemy.kind === "goldfish" ? 0.74 : enemy.kind === "ace" ? 0.69 : 0.62;
		const fill = enemy.kind === "boss" ? palette.bossFill : enemy.kind === "bomber" ? "#75543d" : enemy.kind === "goldfish" ? "#d99622" : enemy.kind === "ace" ? palette.enemyFill : "#566b7b";
		const accent = enemy.kind === "boss" ? palette.accent : enemy.kind === "goldfish" ? "#fff27a" : enemy.kind === "ace" ? "#ffe989" : palette.accent;

		if (enemy.kind === "goldfish") {
			ctx.save();
			ctx.globalAlpha = 0.36 + Math.sin(enemy.age * 12) * 0.12;
			ctx.shadowColor = "#fff27a";
			ctx.shadowBlur = 24;
			ctx.strokeStyle = "#fff27a";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}

		drawFishSilhouette(ctx, enemy.x, enemy.y, scale, fill, accent, false);

			if (enemy.kind === "boss") {
				ctx.save();
				ctx.globalAlpha = 0.35;
				ctx.strokeStyle = palette.accent;
			ctx.lineWidth = 2;
			for (let i = -2; i <= 2; i++) {
				ctx.beginPath();
				ctx.moveTo(enemy.x + i * 11, enemy.y + 32);
				ctx.quadraticCurveTo(enemy.x + i * 18, enemy.y + 56, enemy.x + i * 9 + Math.sin(enemy.age * 3 + i) * 9, enemy.y + 78);
				ctx.stroke();
			}
			ctx.restore();
		}

		if (enemy.kind === "boss") {
				const width = 110;
				ctx.fillStyle = "rgba(255,255,255,0.16)";
				ctx.fillRect(enemy.x - width / 2, enemy.y - 80, width, 5);
				ctx.fillStyle = palette.accent;
			ctx.fillRect(enemy.x - width / 2, enemy.y - 80, width * (enemy.hp / enemy.maxHp), 5);
		} else if (enemy.kind === "goldfish") {
			const width = enemy.radius * 2.4;
			const escapeRatio = enemy.escapeTime ? clamp(1 - enemy.age / enemy.escapeTime, 0, 1) : 1;
			ctx.fillStyle = "rgba(255,255,255,0.2)";
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 22, width, 3);
			ctx.fillStyle = "#fff27a";
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 22, width * escapeRatio, 3);
			ctx.fillStyle = "rgba(255,255,255,0.18)";
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 16, width, 3);
			ctx.fillStyle = "#ffd65c";
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 16, width * (enemy.hp / enemy.maxHp), 3);
		} else if (enemy.hp < enemy.maxHp) {
			const width = enemy.radius * 1.8;
			ctx.fillStyle = "rgba(255,255,255,0.18)";
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width, 3);
			ctx.fillStyle = accent;
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width * (enemy.hp / enemy.maxHp), 3);
		}
	}
};

const drawPlayer = (ctx: CanvasRenderingContext2D, state: GameState) => {
	const { player } = state;

	if (player.isCharging) {
		const chargeRatio = clamp(player.meleeCharge / MELEE_MAX_CHARGE, 0, 1);
		const barWidth = 42;
		const barHeight = 4;
		ctx.save();
		ctx.globalAlpha = 0.86;
		ctx.fillStyle = "rgba(6, 18, 30, 0.72)";
		ctx.fillRect(player.x - barWidth / 2, player.y - 45, barWidth, barHeight);
		ctx.fillStyle = chargeRatio > 0.75 ? "#fff27a" : "#8bf4ff";
		ctx.fillRect(player.x - barWidth / 2, player.y - 45, barWidth * chargeRatio, barHeight);
		ctx.restore();
	}

	if (state.shieldCharges > 0) {
		ctx.save();
		ctx.globalAlpha = 0.72;
		ctx.fillStyle = "#8bf4ff";
		for (let i = 0; i < state.shieldCharges; i++) {
			ctx.fillRect(player.x - 14 + i * 10, player.y + 25, 7, 3);
		}
		ctx.restore();
	}

	ctx.save();
	ctx.strokeStyle = "#ff4f6d";
	ctx.fillStyle = "#ff4f6d";
	ctx.lineWidth = 1.4;
	ctx.setLineDash([4, 3]);
	ctx.beginPath();
	ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
	ctx.stroke();
	ctx.setLineDash([]);
	ctx.beginPath();
	ctx.moveTo(player.x - 5, player.y);
	ctx.lineTo(player.x + 5, player.y);
	ctx.moveTo(player.x, player.y - 5);
	ctx.lineTo(player.x, player.y + 5);
	ctx.stroke();
	ctx.font = "7px sans-serif";
	ctx.fillText("HIT", player.x + player.radius + 3, player.y + 2);
	ctx.restore();
};

const drawSlashes = (ctx: CanvasRenderingContext2D, slashes: Slash[]) => {
	for (const slash of slashes) {
		const progress = 1 - slash.life / slash.maxLife;
		const alpha = clamp(slash.life / slash.maxLife, 0, 1);
		const start = -Math.PI * 0.92 + progress * 0.4;
		const end = -Math.PI * 0.08 + progress * 0.4;

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.lineCap = "round";
		ctx.shadowColor = slash.charge > 0.75 ? "#fff27a" : "#8bf4ff";
		ctx.shadowBlur = 22 + slash.charge * 28;
		ctx.strokeStyle = slash.charge > 0.75 ? "#fff27a" : "#8bf4ff";
		ctx.lineWidth = 8 + slash.charge * 14;
		ctx.beginPath();
		ctx.arc(slash.x, slash.y, slash.radius * (0.78 + progress * 0.16), start, end);
		ctx.stroke();
		ctx.strokeStyle = "rgba(255,255,255,0.85)";
		ctx.lineWidth = 2 + slash.charge * 3;
		ctx.beginPath();
		ctx.arc(slash.x, slash.y, slash.radius * (0.72 + progress * 0.16), start + 0.08, end - 0.08);
		ctx.stroke();
		ctx.restore();
	}
};

const drawPowerUps = (ctx: CanvasRenderingContext2D, powerUps: PowerUp[]) => {
	for (const powerUp of powerUps) {
		ctx.save();
		ctx.translate(powerUp.x, powerUp.y);
		ctx.rotate(powerUp.y * 0.04);
		ctx.shadowColor = powerUp.kind === "repair" ? "#9eff8f" : "#fff27a";
		ctx.shadowBlur = 18;
		ctx.fillStyle = powerUp.kind === "repair" ? "#9eff8f" : "#fff27a";
		ctx.beginPath();
		for (let i = 0; i < 8; i++) {
			const angle = (Math.PI * 2 * i) / 8;
			const radius = i % 2 === 0 ? 13 : 6;
			ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
};

const drawExperienceOrbs = (ctx: CanvasRenderingContext2D, experienceOrbs: ExperienceOrb[], time: number) => {
	for (const orb of experienceOrbs) {
		const pulse = 1 + Math.sin(time * 9 + orb.id) * 0.12;
		ctx.save();
		ctx.translate(orb.x, orb.y);
		ctx.scale(pulse, pulse);
		ctx.shadowColor = "#b6ff7a";
		ctx.shadowBlur = 12;
		ctx.fillStyle = "#b6ff7a";
		ctx.beginPath();
		ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "rgba(255,255,255,0.82)";
		ctx.beginPath();
		ctx.arc(-orb.radius * 0.25, -orb.radius * 0.25, Math.max(1.2, orb.radius * 0.28), 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
};

const drawCollectionEffects = (ctx: CanvasRenderingContext2D, effects: CollectionEffect[], time: number) => {
	for (const effect of effects) {
		const progress = clamp(1 - effect.life / effect.maxLife, 0, 1);
		const scale = Math.max(0.08, (1 - progress) ** 0.85);
		const color = effect.kind === "experience" ? "#b6ff7a" : effect.kind === "repair" ? "#9eff8f" : "#fff27a";
		const spin = time * 12 + effect.phase;

		ctx.save();
		ctx.translate(effect.x, effect.y);
		ctx.rotate(spin * 0.24);
		ctx.scale(scale, scale);
		ctx.globalAlpha = Math.max(0, 1 - progress * 0.55);
		ctx.shadowColor = color;
		ctx.shadowBlur = 18 * (1 - progress) + 8;
		ctx.fillStyle = color;

		if (effect.kind === "experience") {
			ctx.beginPath();
			ctx.arc(0, 0, effect.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = "rgba(255,255,255,0.86)";
			ctx.beginPath();
			ctx.arc(-effect.radius * 0.25, -effect.radius * 0.25, Math.max(1.2, effect.radius * 0.28), 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.beginPath();
			for (let i = 0; i < 8; i++) {
				const angle = (Math.PI * 2 * i) / 8;
				const radius = i % 2 === 0 ? effect.radius * 1.08 : effect.radius * 0.5;
				ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
			}
			ctx.closePath();
			ctx.fill();
		}

		ctx.restore();
	}
};

const drawPets = (ctx: CanvasRenderingContext2D, pets: Pet[], time: number) => {
	for (const pet of pets) {
		const pulse = 1 + Math.sin(time * 8 + pet.phase) * 0.08;

		ctx.save();
		ctx.translate(pet.x, pet.y);
		ctx.scale(pulse, pulse);
		ctx.shadowColor = pet.level >= 4 ? "#ffffff" : "#7cf8a8";
		ctx.shadowBlur = 14 + pet.level * 3;
		ctx.rotate(Math.sin(time * 3.4 + pet.phase) * 0.25);
		ctx.fillStyle = pet.level >= 4 ? "#f8fff3" : "#d9ffe8";
		ctx.strokeStyle = "rgba(255,255,255,0.72)";
		ctx.lineWidth = 1.4;

		ctx.beginPath();
		ctx.arc(0, 0, 11 + pet.level * 0.9, Math.PI, Math.PI * 2);
		ctx.quadraticCurveTo(9 + pet.level, 10, 0, 11 + pet.level * 0.5);
		ctx.quadraticCurveTo(-9 - pet.level, 10, -11 - pet.level * 0.9, 0);
		ctx.fill();
		ctx.stroke();

		for (let i = 0; i < pet.level; i++) {
			ctx.strokeStyle = `rgba(43, 160, 184, ${0.42 + i * 0.08})`;
			ctx.beginPath();
			ctx.arc(0, 3, 4 + i * 2.6, Math.PI * 1.08, Math.PI * 1.92);
			ctx.stroke();
		}

		ctx.fillStyle = pet.level >= 4 ? "#79f6ff" : "#8bf4ff";
		ctx.beginPath();
		ctx.arc(0, 3, 3.2 + pet.level * 0.35, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
};

const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
	for (const particle of particles) {
		ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
		ctx.fillStyle = particle.color;
		ctx.beginPath();
		ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
};

export const drawGame = (ctx: CanvasRenderingContext2D, state: GameState, layout: Layout, pixelRatio: number) => {
	ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	ctx.clearRect(0, 0, layout.width, layout.height);
	ctx.fillStyle = "#060a16";
	ctx.fillRect(0, 0, layout.width, layout.height);

	ctx.save();
	const shakeX = state.shake > 0 ? randomRange(-7, 7) * state.shake : 0;
	const shakeY = state.shake > 0 ? randomRange(-7, 7) * state.shake : 0;
	ctx.translate(layout.offsetX + shakeX, layout.offsetY + shakeY);
	ctx.scale(layout.scale, layout.scale);
	drawBackground(ctx, state);
	drawExperienceOrbs(ctx, state.experienceOrbs, state.time);
	drawPowerUps(ctx, state.powerUps);
	drawCollectionEffects(ctx, state.collectionEffects, state.time);
	drawBullets(ctx, state.bullets.filter((bullet) => bullet.from === "enemy"));
	drawEnemies(ctx, state.enemies);
	drawSlashes(ctx, state.slashes);
	drawBullets(ctx, state.bullets.filter((bullet) => bullet.from === "player"));
	drawPets(ctx, state.pets, state.time);
	drawParticles(ctx, state.particles);
	drawPlayer(ctx, state);
	ctx.restore();

	ctx.strokeStyle = "rgba(255,255,255,0.2)";
	ctx.lineWidth = 1;
	ctx.strokeRect(layout.offsetX, layout.offsetY, WORLD_WIDTH * layout.scale, WORLD_HEIGHT * layout.scale);
};
