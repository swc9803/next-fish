import { MELEE_MAX_CHARGE, PLAYER_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { openAugmentSelection } from "./augments";
import { clamp, distanceSquared, randomRange } from "./math";
import { getNextId } from "./state";
import type { EnemyKind, GameState, Plane } from "./types";

const addParticleBurst = (state: GameState, x: number, y: number, color: string, count: number) => {
	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = randomRange(50, 240);
		state.particles.push({
			id: getNextId(state),
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: randomRange(0.28, 0.72),
			maxLife: 0.72,
			size: randomRange(2, 6),
			color,
		});
	}
};

const awardEnemyScore = (state: GameState, enemy: Plane) => {
	const baseScore = enemy.kind === "boss" ? 2200 : enemy.kind === "bomber" ? 260 : enemy.kind === "ace" ? 230 : enemy.kind === "fighter" ? 180 : 110;
	state.combo = Math.min(99, state.combo + 1);
	state.comboTimer = 2.6;
	state.score += Math.round(baseScore * (1 + Math.min(state.combo - 1, 18) * 0.05));
	state.defeatedEnemies += 1;
	if (enemy.kind === "boss") state.defeatedBosses += 1;
};

const calculateCoinReward = (state: GameState) =>
	Math.max(0, Math.floor(state.defeatedEnemies * 2 + Math.max(0, state.wave - 1) * 25 + state.defeatedBosses * 60 + state.score / 900));

const getEnemyExperience = (state: GameState, enemy: Plane) => {
	const baseExperience = enemy.kind === "boss" ? 125 : enemy.kind === "bomber" ? 18 : enemy.kind === "ace" ? 16 : enemy.kind === "fighter" ? 12 : 8;
	return baseExperience + Math.floor(state.wave * (enemy.kind === "boss" ? 4 : 0.8));
};

const getNextExperience = (level: number, currentNext: number) => Math.round(currentNext * 1.22 + 18 + level * 6);

const addExperience = (state: GameState, amount: number) => {
	state.experience += amount;
	if (state.mode !== "playing" || state.experience < state.nextExperience) return;

	state.experience -= state.nextExperience;
	state.experienceLevel += 1;
	state.nextExperience = getNextExperience(state.experienceLevel, state.nextExperience);
	state.shake = Math.max(state.shake, 0.2);
	addParticleBurst(state, state.player.x, state.player.y, "#b6ff7a", 26);
	openAugmentSelection(state);
};

const dropExperience = (state: GameState, enemy: Plane) => {
	const totalExperience = getEnemyExperience(state, enemy);
	const orbCount = enemy.kind === "boss" ? 12 : enemy.kind === "bomber" ? 4 : enemy.kind === "ace" ? 3 : 2;
	let remaining = totalExperience;

	for (let i = 0; i < orbCount; i++) {
		const value = i === orbCount - 1 ? remaining : Math.max(1, Math.floor(totalExperience / orbCount));
		remaining -= value;
		state.experienceOrbs.push({
			id: getNextId(state),
			x: enemy.x + randomRange(-enemy.radius * 0.35, enemy.radius * 0.35),
			y: enemy.y + randomRange(-enemy.radius * 0.25, enemy.radius * 0.25),
			vx: randomRange(-44, 44),
			vy: randomRange(48, 98),
			value,
			radius: enemy.kind === "boss" ? 5.6 : 4.6,
		});
	}
};

const getShotChaos = (state: GameState) => {
	const focusStabilizer = state.weapon === "laser" ? state.laserFocus * 0.24 : 0;
	return Math.max(0, state.projectileChaos - focusStabilizer);
};

const addPlayerBullet = (
	state: GameState,
	x: number,
	y: number,
	vx: number,
	vy: number,
	damage = 1,
	radius = 4,
	color = "#8bf4ff",
	pierceBonus = 0,
) => {
	const powerBonus = 1 + state.player.power * 0.08;
	const chaos = getShotChaos(state);
	const nextVx = vx + (chaos > 0 ? randomRange(-85, 85) * chaos : 0);
	const nextVy = vy + (chaos > 0 ? randomRange(-20, 28) * chaos : 0);

	state.bullets.push({
		id: getNextId(state),
		x,
		y,
		vx: nextVx,
		vy: nextVy,
		radius,
		damage: damage * state.damageMultiplier * powerBonus,
		pierce: state.bulletPierce + pierceBonus,
		from: "player",
		color,
	});
};

const firePlayer = (state: GameState) => {
	const { player } = state;
	const addPowerWingShots = () => {
		if (player.power >= 2) {
			addPlayerBullet(state, player.x - 12, player.y - 12, -55, -610, 0.92);
			addPlayerBullet(state, player.x + 12, player.y - 12, 55, -610, 0.92);
		}

		if (player.power >= 4) {
			addPlayerBullet(state, player.x - 22, player.y - 2, -115, -560, 0.78);
			addPlayerBullet(state, player.x + 22, player.y - 2, 115, -560, 0.78);
		}
	};

	if (state.weapon === "fork") {
		const forkVx = state.prismSplitter ? 170 : 115;
		addPlayerBullet(state, player.x - 14, player.y - 16, -forkVx, -635, 1.55, 4.6, "#92fff2");
		addPlayerBullet(state, player.x + 14, player.y - 16, forkVx, -635, 1.55, 4.6, "#92fff2");
		if (player.power >= 3) {
			addPlayerBullet(state, player.x - 25, player.y - 5, -forkVx - 58, -585, 1.08, 4, "#92fff2");
			addPlayerBullet(state, player.x + 25, player.y - 5, forkVx + 58, -585, 1.08, 4, "#92fff2");
		}
		return;
	}

	if (state.weapon === "scatter") {
		const sideCount = state.prismSplitter ? 3 : 2;
		for (let i = -sideCount; i <= sideCount; i++) {
			addPlayerBullet(state, player.x + i * 6, player.y - 16, i * 76, -600 + Math.abs(i) * 18, i === 0 ? 0.9 : 0.72, 3.8, "#b3ff74");
		}
		if (player.power >= 4) {
			addPlayerBullet(state, player.x - 28, player.y - 2, -210, -520, 0.66, 3.6, "#b3ff74");
			addPlayerBullet(state, player.x + 28, player.y - 2, 210, -520, 0.66, 3.6, "#b3ff74");
		}
		return;
	}

	if (state.weapon === "laser") {
		const focus = state.laserFocus;
		const laserDamage = focus > 0 ? 0.74 + focus * 0.62 : 0.28;
		const laserRadius = focus > 0 ? 2.8 + focus * 1.35 : 1.85;
		const laserPierce = focus + (state.prismSplitter ? 1 : 0);

		if (state.prismSplitter && focus === 0) {
			addPlayerBullet(state, player.x - 8, player.y - 24, -34, -850, 0.26, 1.75, "#ff9cff", laserPierce);
			addPlayerBullet(state, player.x + 8, player.y - 24, 34, -850, 0.26, 1.75, "#ff9cff", laserPierce);
			return;
		}

		addPlayerBullet(state, player.x, player.y - 28, 0, -930, laserDamage, laserRadius, focus >= 2 ? "#ffffff" : "#ff9cff", laserPierce);

		if (state.prismSplitter) {
			addPlayerBullet(state, player.x - 13, player.y - 18, -24, -880, laserDamage * 0.72, Math.max(1.9, laserRadius * 0.75), "#ffb7ff", laserPierce);
			addPlayerBullet(state, player.x + 13, player.y - 18, 24, -880, laserDamage * 0.72, Math.max(1.9, laserRadius * 0.75), "#ffb7ff", laserPierce);
		}

		if (focus >= 2) {
			addPlayerBullet(state, player.x, player.y - 5, 0, -780, laserDamage * 0.58, laserRadius * 0.65, "#f6fdff", laserPierce);
		}
		return;
	}

	if (state.weapon === "lance") {
		addPlayerBullet(state, player.x, player.y - 28, 0, -720, 2.45, 7, "#ffe989");
		if (player.power >= 3) addPlayerBullet(state, player.x, player.y - 4, 0, -620, 1.25, 5, "#ffe989");
		return;
	}

	addPlayerBullet(state, player.x, player.y - 22, 0, -650, 1.2);
	addPowerWingShots();
};

const firePet = (state: GameState, petX: number, petY: number, level: number) => {
	const target = state.enemies
		.filter((enemy) => enemy.y < petY + 36)
		.sort((a, b) => distanceSquared(petX, petY, a.x, a.y) - distanceSquared(petX, petY, b.x, b.y))[0];
	const angle = target ? Math.atan2(target.y - petY, target.x - petX) : -Math.PI / 2;
	const speed = 620 + level * 34;
	const damage = (0.38 + level * 0.16) * state.petDamageMultiplier;
	const radius = 2.6 + level * 0.22;
	const vx = Math.cos(angle) * speed;
	const vy = Math.sin(angle) * speed;

	addPlayerBullet(state, petX, petY - 6, vx, vy, damage, radius, level >= 4 ? "#ffffff" : "#7cf8a8", level >= 5 ? 1 : 0);
	if (level >= 3) {
		addPlayerBullet(state, petX - 4, petY - 2, vx - 42, vy, damage * 0.56, radius * 0.78, "#a8ffd2");
		addPlayerBullet(state, petX + 4, petY - 2, vx + 42, vy, damage * 0.56, radius * 0.78, "#a8ffd2");
	}
};

const addEnemyBullet = (state: GameState, enemy: Plane, angle: number, speed: number) => {
	state.bullets.push({
		id: getNextId(state),
		x: enemy.x,
		y: enemy.y + enemy.radius * 0.45,
		vx: Math.cos(angle) * speed,
		vy: Math.sin(angle) * speed,
		radius: enemy.kind === "boss" ? 5 : 4,
		damage: 1,
		pierce: 0,
		from: "enemy",
		color: enemy.kind === "boss" ? "#ff8ad7" : "#ffcb74",
	});
};

const spawnEnemy = (state: GameState) => {
	const roll = Math.random();
	const aceChance = Math.min(0.1 + state.wave * 0.012, 0.2);
	const kind: EnemyKind = roll > 0.86 ? "bomber" : roll > 0.86 - aceChance ? "ace" : roll > 0.36 ? "fighter" : "scout";
	const radius = kind === "bomber" ? 22 : kind === "ace" ? 16 : kind === "fighter" ? 17 : 14;
	const hp =
		kind === "bomber"
			? 5 + state.wave
			: kind === "ace"
				? 3 + Math.floor(state.wave / 2)
				: kind === "fighter"
					? 3 + Math.floor(state.wave / 2)
					: 2 + Math.floor(state.wave / 3);
	const x = randomRange(radius + 12, WORLD_WIDTH - radius - 12);
	const side = Math.random() > 0.5 ? 1 : -1;

	state.enemies.push({
		id: getNextId(state),
		x,
		y: -radius - 10,
		vx: side * (kind === "ace" ? randomRange(88, 126) : randomRange(18, 45)),
		vy: kind === "bomber" ? randomRange(42, 62) : kind === "ace" ? randomRange(118, 148) : randomRange(70, 112),
		radius,
		hp,
		maxHp: hp,
		kind,
		fireCooldown: randomRange(0.8, 1.8),
		age: 0,
	});
};

const spawnBoss = (state: GameState) => {
	const hp = 72 + state.wave * 12;
	state.bossActive = true;
	state.enemies.push({
		id: getNextId(state),
		x: WORLD_WIDTH / 2,
		y: -72,
		vx: 82,
		vy: 52,
		radius: 54,
		hp,
		maxHp: hp,
		kind: "boss",
		fireCooldown: 0.8,
		age: 0,
	});
};

const updatePlayer = (state: GameState, dt: number) => {
	const { player, keys } = state;
	let dx = 0;
	let dy = 0;

	if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
	if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
	if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
	if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;

	if (state.pointerActive) {
		const targetDx = player.targetX - player.x;
		const targetDy = player.targetY - player.y;
		const targetDistance = Math.hypot(targetDx, targetDy);
		const maxDistance = PLAYER_SPEED * state.playerSpeedMultiplier * dt;

		if (targetDistance <= maxDistance) {
			player.x = player.targetX;
			player.y = player.targetY;
		} else if (targetDistance > 0) {
			player.x += (targetDx / targetDistance) * maxDistance;
			player.y += (targetDy / targetDistance) * maxDistance;
		}
	} else if (dx !== 0 || dy !== 0) {
		const length = Math.hypot(dx, dy);
		player.x += (dx / length) * PLAYER_SPEED * state.playerSpeedMultiplier * dt;
		player.y += (dy / length) * PLAYER_SPEED * state.playerSpeedMultiplier * dt;
	}

	player.x = clamp(player.x, player.radius + 12, WORLD_WIDTH - player.radius - 12);
	player.y = clamp(player.y, WORLD_HEIGHT * 0.42, WORLD_HEIGHT - player.radius - 16);
	player.targetX = clamp(player.targetX, player.radius + 12, WORLD_WIDTH - player.radius - 12);
	player.targetY = clamp(player.targetY, WORLD_HEIGHT * 0.42, WORLD_HEIGHT - player.radius - 16);
	player.invincible = Math.max(0, player.invincible - dt);
	player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
	if (player.isCharging) {
		player.meleeCharge = Math.min(MELEE_MAX_CHARGE, player.meleeCharge + dt);
	}

	player.fireCooldown -= dt;
	const weaponRate = state.weapon === "laser" ? 0.055 : state.weapon === "lance" ? 0.26 : state.weapon === "scatter" ? 0.2 : 0.17;
	const reloadMultiplier = state.weapon === "fork" || state.weapon === "scatter" || state.weapon === "lance" ? 1 / state.reloadSpeedMultiplier : 1;
	const fireRate = clamp((weaponRate - player.power * 0.018) * state.fireCooldownMultiplier * reloadMultiplier, 0.045, 0.34);
	if (player.fireCooldown <= 0) {
		firePlayer(state);
		player.fireCooldown = fireRate;
	}
};

const updateEnemies = (state: GameState, dt: number) => {
	for (const enemy of state.enemies) {
		enemy.age += dt;

		if (enemy.kind === "boss") {
			if (enemy.y < 86) {
				enemy.y += enemy.vy * dt;
			} else {
				enemy.x += enemy.vx * dt;
				if (enemy.x < 76 || enemy.x > WORLD_WIDTH - 76) enemy.vx *= -1;
			}
		} else {
			const weave = enemy.kind === "ace" ? 82 : enemy.kind === "fighter" ? 44 : 28;
			const waveSpeed = enemy.kind === "ace" ? 5.8 : enemy.kind === "fighter" ? 3.4 : 2.1;
			enemy.x += Math.sin(enemy.age * waveSpeed) * weave * dt + enemy.vx * dt;
			enemy.y += enemy.vy * dt;
			if (enemy.x < enemy.radius || enemy.x > WORLD_WIDTH - enemy.radius) enemy.vx *= -1;
		}

		enemy.fireCooldown -= dt;
		if (enemy.fireCooldown <= 0 && enemy.y > 20) {
			const angleToPlayer = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
			if (enemy.kind === "boss") {
				const sweep = Math.sin(enemy.age * 2.2) * 0.12;
				for (let i = -2; i <= 2; i++) addEnemyBullet(state, enemy, angleToPlayer + sweep + i * 0.18, 245);
				enemy.fireCooldown = 0.78;
			} else if (enemy.kind === "ace") {
				addEnemyBullet(state, enemy, angleToPlayer - 0.13, 270);
				addEnemyBullet(state, enemy, angleToPlayer + 0.13, 270);
				enemy.fireCooldown = 1.0;
			} else {
				addEnemyBullet(state, enemy, angleToPlayer, enemy.kind === "bomber" ? 210 : 250);
				enemy.fireCooldown = enemy.kind === "bomber" ? 1.45 : 1.15;
			}
		}
	}
};

const updatePets = (state: GameState, dt: number) => {
	const count = state.pets.length;
	if (count === 0) return;

	for (let i = 0; i < count; i++) {
		const pet = state.pets[i];
		const centerOffset = (i - (count - 1) / 2) * 44;
		const orbit = Math.sin(state.time * 3.1 + pet.phase) * 8;
		const targetX = clamp(state.player.x + centerOffset + orbit, 24, WORLD_WIDTH - 24);
		const targetY = clamp(state.player.y + 34 + Math.cos(state.time * 2.4 + pet.phase) * 10, WORLD_HEIGHT * 0.46, WORLD_HEIGHT - 28);
		const follow = Math.min(1, dt * 9.5);

		pet.x += (targetX - pet.x) * follow;
		pet.y += (targetY - pet.y) * follow;
		pet.fireCooldown -= dt;

		if (pet.fireCooldown <= 0) {
			firePet(state, pet.x, pet.y, pet.level);
			const cooldown = clamp((0.54 - pet.level * 0.052) * state.petFireCooldownMultiplier, 0.16, 0.58);
			pet.fireCooldown = cooldown + i * 0.035;
		}
	}
};

const updateBullets = (state: GameState, dt: number) => {
	for (const bullet of state.bullets) {
		bullet.x += bullet.vx * dt;
		bullet.y += bullet.vy * dt;
	}

	state.bullets = state.bullets.filter(
		(bullet) => bullet.y > -40 && bullet.y < WORLD_HEIGHT + 48 && bullet.x > -40 && bullet.x < WORLD_WIDTH + 40,
	);
};

const updateParticles = (state: GameState, dt: number) => {
	for (const particle of state.particles) {
		particle.x += particle.vx * dt;
		particle.y += particle.vy * dt;
		particle.vy += 70 * dt;
		particle.life -= dt;
	}

	state.particles = state.particles.filter((particle) => particle.life > 0);
};

const updatePowerUps = (state: GameState, dt: number) => {
	const magnetRadius = 42 * state.magnetMultiplier;
	for (const powerUp of state.powerUps) {
		const dx = state.player.x - powerUp.x;
		const dy = state.player.y - powerUp.y;
		const distance = Math.hypot(dx, dy);
		if (distance < magnetRadius && distance > 0) {
			const pull = (1 - distance / magnetRadius) * 360;
			powerUp.x += (dx / distance) * pull * dt;
			powerUp.y += (dy / distance) * pull * dt;
		}
		powerUp.y += powerUp.vy * dt;
	}

	state.powerUps = state.powerUps.filter((powerUp) => powerUp.y < WORLD_HEIGHT + 32);
};

const updateExperienceOrbs = (state: GameState, dt: number) => {
	const collectedOrbs = new Set<number>();
	const magnetRadius = 34 * state.magnetMultiplier;

	for (const orb of state.experienceOrbs) {
		const dx = state.player.x - orb.x;
		const dy = state.player.y - orb.y;
		const distance = Math.hypot(dx, dy);

		if (distance <= state.player.radius + orb.radius) {
			collectedOrbs.add(orb.id);
			addExperience(state, orb.value);
			addParticleBurst(state, orb.x, orb.y, "#b6ff7a", 4);
			continue;
		}

		if (distance < magnetRadius && distance > 0) {
			const pull = (1 - distance / magnetRadius) * 340;
			orb.vx += (dx / distance) * pull * dt;
			orb.vy += (dy / distance) * pull * dt;
		}

		orb.x += orb.vx * dt;
		orb.y += orb.vy * dt;
		orb.vx *= 0.985;
		orb.vy = Math.min(180, orb.vy + 28 * dt);
	}

	state.experienceOrbs = state.experienceOrbs.filter(
		(orb) => !collectedOrbs.has(orb.id) && orb.y < WORLD_HEIGHT + 32 && orb.x > -32 && orb.x < WORLD_WIDTH + 32,
	);
};

const updateShield = (state: GameState, dt: number) => {
	if (!state.shieldUnlocked || state.shieldCharges >= state.shieldMaxCharges) return;

	state.shieldTimer -= dt;
	if (state.shieldTimer <= 0) {
		state.shieldCharges = Math.min(state.shieldMaxCharges, state.shieldCharges + 1);
		state.shieldTimer = state.shieldInterval;
		addParticleBurst(state, state.player.x, state.player.y, "#8bf4ff", 14);
	}
};

const damagePlayer = (state: GameState) => {
	const { player } = state;
	if (player.invincible > 0) return;

	if (state.shieldCharges > 0) {
		state.shieldCharges -= 1;
		state.shieldTimer = Math.min(state.shieldTimer, state.shieldInterval);
		player.invincible = 0.85;
		state.shake = Math.max(state.shake, 0.18);
		addParticleBurst(state, player.x, player.y, "#8bf4ff", 28);
		return;
	}

	player.lives -= 1;
	player.power = Math.max(1, player.power - 1);
	player.invincible = 2.3;
	state.combo = 0;
	state.comboTimer = 0;
	state.shake = 0.3;
	addParticleBurst(state, player.x, player.y, "#67eaff", 24);

	if (player.lives <= 0) {
		state.mode = "gameover";
		state.highScore = Math.max(state.highScore, state.score);
		state.earnedCoins = calculateCoinReward(state);
	}
};

const addSlash = (state: GameState, chargeRatio: number) => {
	const { player } = state;
	const clampedCharge = clamp(chargeRatio, 0, 1);
	const radius = 58 + clampedCharge * 64;
	const damage = (3.4 + clampedCharge * 11.5) * state.meleeDamageMultiplier * state.damageMultiplier;

	state.slashes.push({
		id: getNextId(state),
		x: player.x,
		y: player.y - 44 - clampedCharge * 14,
		radius,
		damage,
		charge: clampedCharge,
		life: 0.17 + clampedCharge * 0.16,
		maxLife: 0.17 + clampedCharge * 0.16,
		hitEnemyIds: [],
	});
	state.shake = Math.max(state.shake, 0.12 + clampedCharge * 0.22);
	addParticleBurst(state, player.x, player.y - 42, clampedCharge > 0.7 ? "#fff27a" : "#8bf4ff", 10 + Math.floor(clampedCharge * 18));
};

export const beginMeleeCharge = (state: GameState) => {
	if (state.mode !== "playing" || !state.meleeUnlocked || state.player.meleeCooldown > 0) return;

	if (!state.chargeUnlocked) {
		addSlash(state, 0.18);
		state.player.meleeCooldown = 0.72;
		return;
	}

	state.player.isCharging = true;
};

export const releaseMeleeCharge = (state: GameState) => {
	if (!state.meleeUnlocked) return;

	const { player } = state;
	if (player.meleeCooldown > 0 && !player.isCharging) return;

	const chargeRatio = state.chargeUnlocked ? clamp(player.meleeCharge / MELEE_MAX_CHARGE, 0.2, 1) : 0.18;
	addSlash(state, chargeRatio);
	player.isCharging = false;
	player.meleeCharge = 0;
	player.meleeCooldown = 0.72 + chargeRatio * 0.58;
};

const updateSlashes = (state: GameState, dt: number) => {
	for (const slash of state.slashes) {
		slash.life -= dt;
	}

	state.slashes = state.slashes.filter((slash) => slash.life > 0);
};

const resolveCollisions = (state: GameState) => {
	const playerBullets = state.bullets.filter((bullet) => bullet.from === "player");
	const enemyBullets = state.bullets.filter((bullet) => bullet.from === "enemy");
	const removedBullets = new Set<number>();
	const removedEnemies = new Set<number>();

	for (const bullet of playerBullets) {
		for (const enemy of state.enemies) {
			if (removedEnemies.has(enemy.id)) continue;
			const hitDistance = bullet.radius + enemy.radius;
			if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
				enemy.hp -= bullet.damage;
				if (bullet.pierce > 0) {
					bullet.pierce -= 1;
				} else {
					removedBullets.add(bullet.id);
				}
				addParticleBurst(state, bullet.x, bullet.y, "#8bf4ff", 3);

				if (enemy.hp <= 0) {
					removedEnemies.add(enemy.id);
					awardEnemyScore(state, enemy);
					state.shake = enemy.kind === "boss" ? 0.42 : 0.13;
					addParticleBurst(state, enemy.x, enemy.y, enemy.kind === "boss" ? "#ff8ad7" : "#ffb15f", enemy.kind === "boss" ? 58 : 18);
					dropExperience(state, enemy);

					if (enemy.kind === "boss") {
						state.bossActive = false;
						state.bossTimer = 24;
						state.wave += 1;
					} else if (Math.random() < 0.13) {
						state.powerUps.push({
							id: getNextId(state),
							x: enemy.x,
							y: enemy.y,
							vy: 88,
							radius: 12,
							kind: Math.random() < 0.22 ? "repair" : "power",
						});
					}
				}
				break;
			}
		}
	}

	for (const slash of state.slashes) {
		for (const enemy of state.enemies) {
			if (removedEnemies.has(enemy.id) || slash.hitEnemyIds.includes(enemy.id)) continue;

			const hitDistance = slash.radius + enemy.radius * 0.25;
			if (enemy.y < state.player.y + 24 && distanceSquared(slash.x, slash.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
				enemy.hp -= slash.damage;
				slash.hitEnemyIds.push(enemy.id);
				addParticleBurst(state, enemy.x, enemy.y, slash.charge > 0.75 ? "#fff27a" : "#8bf4ff", 8);

				if (enemy.hp <= 0) {
					removedEnemies.add(enemy.id);
					awardEnemyScore(state, enemy);
					addParticleBurst(state, enemy.x, enemy.y, enemy.kind === "boss" ? "#ff8ad7" : "#ffb15f", enemy.kind === "boss" ? 58 : 18);
					dropExperience(state, enemy);

					if (enemy.kind === "boss") {
						state.bossActive = false;
						state.bossTimer = 24;
						state.wave += 1;
					}
				}
			}
		}

		for (const bullet of enemyBullets) {
			if (distanceSquared(slash.x, slash.y, bullet.x, bullet.y) <= slash.radius * slash.radius) {
				removedBullets.add(bullet.id);
			}
		}
	}

	for (const bullet of enemyBullets) {
		const hitDistance = bullet.radius + state.player.radius;
		if (distanceSquared(bullet.x, bullet.y, state.player.x, state.player.y) <= hitDistance * hitDistance) {
			removedBullets.add(bullet.id);
			damagePlayer(state);
		}
	}

	for (const enemy of state.enemies) {
		const hitDistance = enemy.radius + state.player.radius;
		if (enemy.y > -20 && distanceSquared(enemy.x, enemy.y, state.player.x, state.player.y) <= hitDistance * hitDistance) {
			removedEnemies.add(enemy.id);
			if (enemy.kind !== "boss") addParticleBurst(state, enemy.x, enemy.y, "#ffb15f", 12);
			damagePlayer(state);
		}
	}

	for (const powerUp of state.powerUps) {
		const hitDistance = powerUp.radius + state.player.radius;
		if (distanceSquared(powerUp.x, powerUp.y, state.player.x, state.player.y) <= hitDistance * hitDistance) {
			if (powerUp.kind === "repair") {
				state.player.lives = Math.min(state.player.maxLives, state.player.lives + 1);
			} else {
				state.player.power = Math.min(5, state.player.power + 1);
			}
			removedBullets.add(powerUp.id);
			addParticleBurst(state, powerUp.x, powerUp.y, powerUp.kind === "repair" ? "#9eff8f" : "#fff27a", 14);
		}
	}

	state.bullets = state.bullets.filter((bullet) => !removedBullets.has(bullet.id));
	state.enemies = state.enemies.filter((enemy) => !removedEnemies.has(enemy.id) && enemy.y < WORLD_HEIGHT + enemy.radius + 40);
	state.powerUps = state.powerUps.filter((powerUp) => !removedBullets.has(powerUp.id));
};

const updateSpawn = (state: GameState, dt: number) => {
	state.wave = Math.max(state.wave, 1 + Math.floor(state.score / 1800));
	state.spawnTimer -= dt;
	state.bossTimer -= dt;

	if (state.spawnTimer <= 0 && !state.bossActive) {
		spawnEnemy(state);
		const speedUp = Math.min(0.55, state.wave * 0.035);
		state.spawnTimer = randomRange(0.46, 0.92) - speedUp;
	}

	if (state.bossTimer <= 0 && !state.bossActive) {
		spawnBoss(state);
	}
};

const updateStars = (state: GameState, dt: number) => {
	for (const star of state.stars) {
		star.y += star.speed * dt;
		if (star.y > WORLD_HEIGHT + 8) {
			star.y = -8;
			star.x = Math.random() * WORLD_WIDTH;
		}
	}
};

export const updateGame = (state: GameState, dt: number) => {
	updateStars(state, dt);
	if (state.mode !== "playing") return;
	addExperience(state, 0);
	if (state.mode !== "playing") return;

	state.time += dt;
	state.shake = Math.max(0, state.shake - dt);
	state.comboTimer = Math.max(0, state.comboTimer - dt);
	if (state.comboTimer <= 0) state.combo = 0;
	updatePlayer(state, dt);
	updateSpawn(state, dt);
	updateEnemies(state, dt);
	updatePets(state, dt);
	updateShield(state, dt);
	updateBullets(state, dt);
	updatePowerUps(state, dt);
	updateSlashes(state, dt);
	resolveCollisions(state);
	updateExperienceOrbs(state, dt);
	updateParticles(state, dt);
};
