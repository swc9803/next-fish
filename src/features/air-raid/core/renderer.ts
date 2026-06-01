import { MELEE_MAX_CHARGE, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { clamp, randomRange } from "./math";
import type { Bullet, ExperienceOrb, GameState, Layout, Particle, Pet, Plane, PowerUp, Slash } from "./types";

const drawPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, fill: string, accent: string, isPlayer: boolean) => {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(scale, scale);
	ctx.beginPath();
	ctx.moveTo(0, isPlayer ? -26 : 26);
	ctx.lineTo(isPlayer ? -13 : -16, isPlayer ? 16 : -12);
	ctx.lineTo(isPlayer ? -34 : -38, isPlayer ? 24 : -18);
	ctx.lineTo(isPlayer ? -18 : -19, isPlayer ? 5 : 4);
	ctx.lineTo(isPlayer ? -10 : -12, isPlayer ? 30 : -28);
	ctx.lineTo(0, isPlayer ? 20 : -16);
	ctx.lineTo(isPlayer ? 10 : 12, isPlayer ? 30 : -28);
	ctx.lineTo(isPlayer ? 18 : 19, isPlayer ? 5 : 4);
	ctx.lineTo(isPlayer ? 34 : 38, isPlayer ? 24 : -18);
	ctx.lineTo(isPlayer ? 13 : 16, isPlayer ? 16 : -12);
	ctx.closePath();
	ctx.fillStyle = fill;
	ctx.fill();
	ctx.strokeStyle = "rgba(255,255,255,0.45)";
	ctx.lineWidth = 1.5;
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(0, isPlayer ? -18 : 18);
	ctx.lineTo(-7, isPlayer ? 8 : -8);
	ctx.lineTo(0, isPlayer ? 14 : -13);
	ctx.lineTo(7, isPlayer ? 8 : -8);
	ctx.closePath();
	ctx.fillStyle = accent;
	ctx.fill();
	ctx.restore();
};

const drawBackground = (ctx: CanvasRenderingContext2D, state: GameState) => {
	const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
	gradient.addColorStop(0, "#111a3f");
	gradient.addColorStop(0.5, "#173c54");
	gradient.addColorStop(1, "#0c1829");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

	ctx.fillStyle = "rgba(255,255,255,0.8)";
	for (const star of state.stars) {
		ctx.globalAlpha = star.alpha;
		ctx.fillRect(star.x, star.y, star.size, star.size * 2.6);
	}
	ctx.globalAlpha = 1;

	ctx.fillStyle = "rgba(255, 255, 255, 0.055)";
	for (let i = 0; i < 5; i++) {
		const y = (state.time * (18 + i * 8) + i * 138) % (WORLD_HEIGHT + 180) - 120;
		ctx.beginPath();
		ctx.ellipse(70 + i * 78, y, 58 + i * 8, 16 + i * 2, 0, 0, Math.PI * 2);
		ctx.ellipse(118 + i * 64, y + 8, 48, 13, 0, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.strokeStyle = "rgba(144, 240, 255, 0.09)";
	ctx.lineWidth = 1;
	for (let x = 20; x < WORLD_WIDTH; x += 46) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x - 110, WORLD_HEIGHT);
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
		ctx.save();
		ctx.shadowColor = bullet.color;
		ctx.shadowBlur = 14;
		ctx.strokeStyle = bullet.color;
		ctx.globalAlpha = 0.42;
		ctx.lineWidth = bullet.radius * 1.15;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(bullet.x, bullet.y);
		ctx.lineTo(bullet.x - bullet.vx * 0.035, bullet.y - bullet.vy * 0.035);
		ctx.stroke();
		ctx.globalAlpha = 1;
		ctx.fillStyle = bullet.color;
		ctx.beginPath();
		ctx.ellipse(bullet.x, bullet.y, bullet.radius, bullet.radius * 2.3, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
};

const drawEnemies = (ctx: CanvasRenderingContext2D, enemies: Plane[]) => {
	for (const enemy of enemies) {
		const scale = enemy.kind === "boss" ? 1.45 : enemy.kind === "bomber" ? 0.8 : enemy.kind === "ace" ? 0.66 : 0.62;
		const fill = enemy.kind === "boss" ? "#6d355f" : enemy.kind === "bomber" ? "#76563e" : enemy.kind === "ace" ? "#8b3f54" : "#6f526f";
		const accent = enemy.kind === "boss" ? "#ff8ad7" : enemy.kind === "ace" ? "#ffec7a" : "#ffcb74";
		drawPlane(ctx, enemy.x, enemy.y, scale, fill, accent, false);

		if (enemy.kind === "boss") {
			const width = 110;
			ctx.fillStyle = "rgba(255,255,255,0.16)";
			ctx.fillRect(enemy.x - width / 2, enemy.y - 80, width, 5);
			ctx.fillStyle = "#ff8ad7";
			ctx.fillRect(enemy.x - width / 2, enemy.y - 80, width * (enemy.hp / enemy.maxHp), 5);
		} else if (enemy.hp < enemy.maxHp) {
			const width = enemy.radius * 1.8;
			ctx.fillStyle = "rgba(255,255,255,0.18)";
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width, 3);
			ctx.fillStyle = accent;
			ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width * (enemy.hp / enemy.maxHp), 3);
		}
	}
};

const drawPlayer = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
	const { player } = state;
	const flicker = player.invincible > 0 && Math.floor(time * 18) % 2 === 0;
	if (flicker) ctx.globalAlpha = 0.42;

	if (player.isCharging) {
		const chargeRatio = clamp(player.meleeCharge / MELEE_MAX_CHARGE, 0, 1);
		ctx.save();
		ctx.globalAlpha = 0.18 + chargeRatio * 0.28;
		ctx.strokeStyle = chargeRatio > 0.75 ? "#fff27a" : "#8bf4ff";
		ctx.lineWidth = 3 + chargeRatio * 4;
		ctx.beginPath();
		ctx.arc(player.x, player.y - 8, 28 + chargeRatio * 26, 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	}

	drawPlane(ctx, player.x, player.y, 0.72, "#d8fbff", "#30b8ff", true);

	const flame = 10 + Math.sin(time * 30) * 4;
	const gradient = ctx.createRadialGradient(player.x, player.y + 25, 1, player.x, player.y + 25, flame);
	gradient.addColorStop(0, "#ffffff");
	gradient.addColorStop(0.45, "#8bf4ff");
	gradient.addColorStop(1, "rgba(139,244,255,0)");
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.ellipse(player.x, player.y + 27, flame * 0.42, flame, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "rgba(139,244,255,0.3)";
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.arc(player.x, player.y, player.radius + 9, -Math.PI * 0.12, Math.PI * 1.12);
	ctx.stroke();

	if (state.shieldCharges > 0) {
		ctx.save();
		ctx.globalAlpha = 0.45 + Math.sin(time * 8) * 0.12;
		ctx.strokeStyle = "#8bf4ff";
		ctx.shadowColor = "#8bf4ff";
		ctx.shadowBlur = 18;
		ctx.lineWidth = 2.5 + state.shieldCharges * 0.7;
		ctx.beginPath();
		ctx.arc(player.x, player.y, player.radius + 16 + state.shieldCharges * 2, 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	}
	ctx.globalAlpha = 1;
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

const drawPets = (ctx: CanvasRenderingContext2D, pets: Pet[], time: number) => {
	for (const pet of pets) {
		const pulse = 1 + Math.sin(time * 8 + pet.phase) * 0.08;

		ctx.save();
		ctx.translate(pet.x, pet.y);
		ctx.scale(pulse, pulse);
		ctx.shadowColor = pet.level >= 4 ? "#ffffff" : "#7cf8a8";
		ctx.shadowBlur = 14 + pet.level * 3;
		ctx.fillStyle = pet.level >= 4 ? "#dfffee" : "#7cf8a8";
		ctx.strokeStyle = "rgba(255,255,255,0.72)";
		ctx.lineWidth = 1.4;

		ctx.beginPath();
		ctx.moveTo(0, -12 - pet.level);
		ctx.lineTo(-11, 8);
		ctx.lineTo(0, 5);
		ctx.lineTo(11, 8);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = pet.level >= 4 ? "#79f6ff" : "#15352d";
		ctx.beginPath();
		ctx.arc(0, -1, 3.4 + pet.level * 0.28, 0, Math.PI * 2);
		ctx.fill();

		for (let i = 0; i < pet.level; i++) {
			ctx.fillStyle = "rgba(255,255,255,0.9)";
			ctx.fillRect(-pet.level * 2.1 + i * 4.2, 13, 2.2, 2.2);
		}
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
	drawBullets(ctx, state.bullets.filter((bullet) => bullet.from === "enemy"));
	drawEnemies(ctx, state.enemies);
	drawSlashes(ctx, state.slashes);
	drawBullets(ctx, state.bullets.filter((bullet) => bullet.from === "player"));
	drawPets(ctx, state.pets, state.time);
	drawParticles(ctx, state.particles);
	drawPlayer(ctx, state, state.time);
	ctx.restore();

	ctx.strokeStyle = "rgba(255,255,255,0.2)";
	ctx.lineWidth = 1;
	ctx.strokeRect(layout.offsetX, layout.offsetY, WORLD_WIDTH * layout.scale, WORLD_HEIGHT * layout.scale);
};
