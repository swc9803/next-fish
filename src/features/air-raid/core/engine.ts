import { MELEE_MAX_CHARGE, PLAYER_BOUNDS_PADDING_X, PLAYER_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { addParticleBurst, updateCollectionEffects, updateParticles } from "./effects";
import { updateEnemies, updateSpawn } from "./enemies";
import { getPetShieldRadius, getPlayerHitbox, getPlayerMaxY, getPlayerMinY, getStageRoutePosition } from "./geometry";
import { clamp, distanceSquared } from "./math";
import { failFlawlessMission, recordMissionCoinsCollected, recordMissionEnemyDefeated, updateStageMission } from "./missions";
import { collectPowerUp, getPickupRadius, updateExperienceOrbs, updatePowerUps } from "./pickups";
import { addExperience, awardEnemyScore, calculateCoinReward, dropCoins, dropExperience } from "./rewards";
import { getBossSkillDamageMultiplier, openStageSelection, selectStageRoute } from "./stages";
import { getNextId } from "./state";
import { firePlayer } from "./weapons";
import type { BossSkillId, GameState, Plane } from "./types";

const BOSS_COIN_DROP_COUNT = 46;
const BOSS_SKILL_COOLDOWNS: Record<BossSkillId, number> = {
	"coral-surge": 18,
	"abyss-lance": 16,
	"ember-current": 22,
	"frost-shell": 20,
	"kelp-snare": 17,
	"ruin-prism": 24,
};

const applyDamageToEnemy = (state: GameState, enemy: Plane, amount: number) => {
	const damage = amount * getBossSkillDamageMultiplier(state, enemy);
	const beforeHp = enemy.hp;
	enemy.hp -= damage;
	if (enemy.kind === "boss") state.bossDamageDealt += Math.max(0, Math.min(beforeHp, damage));
};

const damageEnemies = (state: GameState, amount: number, x: number, y: number, radius: number, color: string) => {
	for (const enemy of state.enemies) {
		if (enemy.kind !== "supply" && distanceSquared(enemy.x, enemy.y, x, y) <= radius * radius) {
			applyDamageToEnemy(state, enemy, amount * state.damageMultiplier);
			addParticleBurst(state, enemy.x, enemy.y, color, enemy.kind === "boss" ? 18 : 9);
		}
	}
};

const addBossSkillProjectile = (state: GameState, skillId: BossSkillId, xOffset: number, vx: number) => {
	const color = skillId === "ruin-prism" ? "#c79cff" : skillId === "abyss-lance" ? "#9cc7ff" : "#ffb45f";
	state.bullets.push({
		id: getNextId(state),
		x: state.player.x + xOffset,
		y: state.player.y - 42,
		vx,
		vy: skillId === "ember-current" ? -255 : -315,
		radius: skillId === "ruin-prism" ? 16 : 14,
		visualRadius: skillId === "ruin-prism" ? 11 : 9,
		blastRadius: skillId === "ruin-prism" ? 98 : 76,
		damage: skillId === "ruin-prism" ? 44 : 36,
		pierce: skillId === "ruin-prism" ? 4 : 3,
		from: "player",
		color,
	});
};

const resolveDefeatedEnemies = (state: GameState, canDropPowerUp: boolean) => {
	const removedEnemies = new Set<number>();
	for (const enemy of state.enemies) {
		if (enemy.hp <= 0) defeatEnemy(state, enemy, removedEnemies, canDropPowerUp);
	}
	state.enemies = state.enemies.filter((enemy) => !removedEnemies.has(enemy.id));
};

export const activateBossSkill = (state: GameState, skillId: BossSkillId) => {
	if (state.mode !== "playing" || !state.bossSkills.includes(skillId) || state.bossSkillCooldowns[skillId] > 0) return false;

	state.bossSkillCooldowns[skillId] = BOSS_SKILL_COOLDOWNS[skillId];
	state.shake = Math.max(state.shake, skillId === "ruin-prism" ? 0.5 : 0.34);

	switch (skillId) {
		case "coral-surge":
			state.bullets = state.bullets.filter((bullet) => bullet.from === "player");
			damageEnemies(state, 22, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT, "#ff8fae");
			addParticleBurst(state, state.player.x, state.player.y - 24, "#ff8fae", 56);
			break;
		case "abyss-lance":
			addBossSkillProjectile(state, skillId, 0, 0);
			addParticleBurst(state, state.player.x, state.player.y - 42, "#9cc7ff", 26);
			break;
		case "ember-current":
			addBossSkillProjectile(state, skillId, 0, 0);
			damageEnemies(state, 18, state.player.x, state.player.y - 160, 150, "#ffb45f");
			addParticleBurst(state, state.player.x, state.player.y - 90, "#ffb45f", 42);
			break;
		case "frost-shell":
			state.bullets = state.bullets.filter((bullet) => bullet.from === "player");
			state.player.invincible = Math.max(state.player.invincible, 3.2);
			if (state.shieldUnlocked) state.shieldCharges = Math.min(state.shieldMaxCharges, state.shieldCharges + 1);
			damageEnemies(state, 16, state.player.x, state.player.y, 190, "#8bf4ff");
			addParticleBurst(state, state.player.x, state.player.y, "#8bf4ff", 52);
			break;
		case "kelp-snare":
			for (const enemy of state.enemies) {
				enemy.vx *= 0.24;
				enemy.vy *= 0.42;
				enemy.fireCooldown += 1.8;
			}
			damageEnemies(state, 24, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_HEIGHT, "#9eff8f");
			addParticleBurst(state, state.player.x, state.player.y - 36, "#9eff8f", 48);
			break;
		case "ruin-prism":
			addBossSkillProjectile(state, skillId, -28, -34);
			addBossSkillProjectile(state, skillId, 0, 0);
			addBossSkillProjectile(state, skillId, 28, 34);
			addParticleBurst(state, state.player.x, state.player.y - 42, "#c79cff", 44);
			break;
	}

	resolveDefeatedEnemies(state, false);
	return true;
};

const updatePlayer = (state: GameState, dt: number, canFire = true) => {
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

	player.x = clamp(player.x, player.radius + PLAYER_BOUNDS_PADDING_X, WORLD_WIDTH - player.radius - PLAYER_BOUNDS_PADDING_X);
	player.y = clamp(player.y, getPlayerMinY(player.radius), getPlayerMaxY(player.radius));
	player.targetX = clamp(player.targetX, player.radius + PLAYER_BOUNDS_PADDING_X, WORLD_WIDTH - player.radius - PLAYER_BOUNDS_PADDING_X);
	player.targetY = clamp(player.targetY, getPlayerMinY(player.radius), getPlayerMaxY(player.radius));
	player.invincible = Math.max(0, player.invincible - dt);
	player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
	if (player.isCharging) {
		player.meleeCharge = Math.min(MELEE_MAX_CHARGE, player.meleeCharge + dt);
	}

	if (!canFire) {
		player.fireCooldown = Math.max(0, player.fireCooldown - dt);
		return;
	}

	player.fireCooldown -= dt;
	const weaponRate = state.weapon === "laser" ? 0.075 : state.weapon === "lance" ? 0.34 : state.weapon === "scatter" ? 0.27 : state.weapon === "fork" ? 0.25 : 0.24;
	const reloadMultiplier = state.weapon === "fork" || state.weapon === "scatter" || state.weapon === "lance" ? 1 / state.reloadSpeedMultiplier : 1;
	const fireRate = clamp((weaponRate - player.power * 0.018) * state.fireCooldownMultiplier * reloadMultiplier, 0.045, 0.5);
	if (player.fireCooldown <= 0) {
		firePlayer(state);
		player.fireCooldown = fireRate;
	}
};

const updatePets = (state: GameState, dt: number) => {
	const count = state.pets.length;
	if (count === 0) return;

	for (let i = 0; i < count; i++) {
		const pet = state.pets[i];
		const angle = state.time * (1.55 + pet.level * 0.08) + pet.phase;
		const orbitRadius = 35 + Math.min(4, pet.level) * 4 + Math.sin(state.time * 3 + pet.phase) * 2;
		const targetX = clamp(state.player.x + Math.cos(angle) * orbitRadius, 24, WORLD_WIDTH - 24);
		const targetY = clamp(state.player.y + Math.sin(angle) * orbitRadius * 0.72, 28, WORLD_HEIGHT - 28);
		const follow = Math.min(1, dt * 12);

		pet.x += (targetX - pet.x) * follow;
		pet.y += (targetY - pet.y) * follow;
		pet.fireCooldown = Math.max(0, pet.fireCooldown - dt);

		const target = state.enemies
			.filter((enemy) => enemy.kind !== "supply")
			.sort((a, b) => distanceSquared(pet.x, pet.y, a.x, a.y) - distanceSquared(pet.x, pet.y, b.x, b.y))[0];
		if (target && pet.fireCooldown <= 0) {
			const dx = target.x - pet.x;
			const dy = target.y - pet.y;
			const distance = Math.max(1, Math.hypot(dx, dy));
			const speed = 520 + pet.level * 34;
			state.bullets.push({
				id: getNextId(state),
				x: pet.x,
				y: pet.y,
				vx: (dx / distance) * speed,
				vy: (dy / distance) * speed,
				radius: 3.4 + pet.level * 0.32,
				visualRadius: 3.4 + pet.level * 0.28,
				damage: (0.36 + pet.level * 0.14) * state.damageMultiplier * state.petDamageMultiplier,
				pierce: pet.level >= 4 ? 1 : 0,
				from: "player",
				color: pet.level >= 4 ? "#ffffff" : "#9eff8f",
			});
			pet.fireCooldown = Math.max(0.18, (0.68 - Math.min(5, pet.level) * 0.055) * state.petFireCooldownMultiplier);
		}
	}
};

const updateBullets = (state: GameState, dt: number) => {
	for (const bullet of state.bullets) {
		bullet.x += bullet.vx * dt;
		bullet.y += bullet.vy * dt;
	}

	state.bullets = state.bullets.filter((bullet) => bullet.y > -40 && bullet.y < WORLD_HEIGHT + 48 && bullet.x > -40 && bullet.x < WORLD_WIDTH + 40);
};

const updateBossSkillCooldowns = (state: GameState, dt: number) => {
	for (const skillId of state.bossSkills) {
		state.bossSkillCooldowns[skillId] = Math.max(0, state.bossSkillCooldowns[skillId] - dt);
	}
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

	state.damageTaken += 1;
	failFlawlessMission(state);
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

const updateWarningZones = (state: GameState, dt: number) => {
	const resolvedWarnings = new Set<number>();

	for (const warning of state.warningZones) {
		warning.life -= dt;
		if (warning.life > 0) continue;

		resolvedWarnings.add(warning.id);
		state.shake = Math.max(state.shake, warning.kind === "ring" ? 0.28 : 0.2);
		addParticleBurst(state, warning.x, warning.y, warning.color, warning.kind === "ring" ? 36 : 24);

		if (warning.kind === "laser") {
			const hitbox = getPlayerHitbox(state);
			if (Math.abs(hitbox.x - warning.x) <= warning.width * 0.5 + hitbox.radius && hitbox.y > warning.y - 24) damagePlayer(state);
			for (const enemy of state.enemies) {
				if (enemy.kind !== "boss" && enemy.kind !== "supply" && Math.abs(enemy.x - warning.x) <= warning.width * 0.6 + enemy.radius) {
					applyDamageToEnemy(state, enemy, 4);
				}
			}
		} else if (warning.kind === "ring") {
			const hitbox = getPlayerHitbox(state);
			const distance = Math.hypot(hitbox.x - warning.x, hitbox.y - warning.y);
			if (Math.abs(distance - warning.radius) <= warning.width + hitbox.radius) damagePlayer(state);
			for (let i = 0; i < 12; i++) {
				const angle = (Math.PI * 2 * i) / 12;
				state.bullets.push({
					id: getNextId(state),
					x: warning.x + Math.cos(angle) * warning.radius * 0.18,
					y: warning.y + Math.sin(angle) * warning.radius * 0.18,
					vx: Math.cos(angle) * 210,
					vy: Math.sin(angle) * 210,
					radius: 4.5,
					damage: 1,
					pierce: 0,
					from: "enemy",
					color: warning.color,
				});
			}
		}
	}

	state.warningZones = state.warningZones.filter((warning) => !resolvedWarnings.has(warning.id));
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

const getEnemyBurstColor = (enemy: Plane) => {
	if (enemy.kind === "boss") return "#ff8ad7";
	if (enemy.kind === "goldfish") return "#fff27a";
	return "#ffb15f";
};

const awardGoldfishBonus = (state: GameState, enemy: Plane) => {
	const coinReward = enemy.coinReward ?? Math.round(65 + state.wave * 24);
	dropCoins(state, enemy, coinReward, 12);
};

const collectSupplyCraft = (state: GameState, enemy: Plane, removedEnemies: Set<number>) => {
	removedEnemies.add(enemy.id);
	state.suppliesCollected += 1;
	state.player.power = Math.min(5, state.player.power + 1);
	state.player.lives = Math.min(state.player.maxLives, state.player.lives + 1);
	if (state.shieldUnlocked) state.shieldCharges = Math.min(state.shieldMaxCharges, state.shieldCharges + 1);
	const coinReward = Math.round((enemy.coinReward ?? 38 + state.wave * 8) * state.rewardMultiplier * state.routeRewardMultiplier);
	state.earnedCoins += coinReward;
	recordMissionCoinsCollected(state, coinReward);
	addExperience(state, enemy.experienceReward ?? 20 + state.wave * 4);
	addParticleBurst(state, enemy.x, enemy.y, "#9eff8f", 34);
};

const breakSupplyCraft = (state: GameState, enemy: Plane, removedEnemies: Set<number>) => {
	removedEnemies.add(enemy.id);
	dropCoins(state, enemy, Math.round((enemy.coinReward ?? 28) * 0.35), 5);
	addParticleBurst(state, enemy.x, enemy.y, "#ffb45f", 22);
};

const defeatEnemy = (state: GameState, enemy: Plane, removedEnemies: Set<number>, canDropPowerUp: boolean) => {
	removedEnemies.add(enemy.id);
	awardEnemyScore(state, enemy);
	recordMissionEnemyDefeated(state, enemy.kind === "boss");
	state.shake = Math.max(state.shake, enemy.kind === "boss" ? 0.42 : enemy.kind === "goldfish" ? 0.32 : 0.13);
	addParticleBurst(state, enemy.x, enemy.y, getEnemyBurstColor(enemy), enemy.kind === "boss" ? 58 : enemy.kind === "goldfish" ? 42 : 18);

	if (enemy.kind === "goldfish") {
		awardGoldfishBonus(state, enemy);
	}

	dropExperience(state, enemy);

	if (enemy.kind === "boss") {
		const coinReward = Math.round(260 + state.wave * 42 + state.defeatedBosses * 85);
		dropCoins(state, enemy, coinReward, BOSS_COIN_DROP_COUNT, true);
		addParticleBurst(state, enemy.x, enemy.y, "#fff27a", 76);
		addParticleBurst(state, enemy.x, enemy.y, "#ffffff", 42);
		state.bossActive = false;
		openStageSelection(state);
	} else if (enemy.kind !== "goldfish" && canDropPowerUp && Math.random() < 0.13) {
		state.powerUps.push({
			id: getNextId(state),
			x: enemy.x,
			y: enemy.y,
			vy: 88,
			radius: 12,
			kind: Math.random() < 0.22 ? "repair" : "power",
		});
	}
};

const resolveCollisions = (state: GameState) => {
	const playerBullets = state.bullets.filter((bullet) => bullet.from === "player");
	const enemyBullets = state.bullets.filter((bullet) => bullet.from === "enemy");
	const removedBullets = new Set<number>();
	const removedEnemies = new Set<number>();
	const playerHitbox = getPlayerHitbox(state);

	for (const bullet of playerBullets) {
		for (const enemy of state.enemies) {
			if (removedEnemies.has(enemy.id)) continue;
				const hitDistance = bullet.radius + enemy.radius;
				if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <= hitDistance * hitDistance) {
					if (enemy.kind === "supply") {
						enemy.hp -= bullet.damage;
						removedBullets.add(bullet.id);
						addParticleBurst(state, bullet.x, bullet.y, "#9eff8f", 4);
						if (enemy.hp <= 0) breakSupplyCraft(state, enemy, removedEnemies);
						break;
					}
					if (bullet.blastRadius) {
						damageEnemies(state, bullet.damage, bullet.x, bullet.y, bullet.blastRadius, bullet.color);
						removedBullets.add(bullet.id);
						addParticleBurst(state, bullet.x, bullet.y, bullet.color, 32);
						for (const blastEnemy of state.enemies) {
							if (!removedEnemies.has(blastEnemy.id) && blastEnemy.hp <= 0) defeatEnemy(state, blastEnemy, removedEnemies, false);
						}
					} else {
						applyDamageToEnemy(state, enemy, bullet.damage);
						addParticleBurst(state, bullet.x, bullet.y, "#8bf4ff", 3);
					}

					if (!bullet.blastRadius && bullet.pierce > 0) {
						bullet.pierce -= 1;
					} else if (!bullet.blastRadius) {
						removedBullets.add(bullet.id);
					}

					if (!removedEnemies.has(enemy.id) && enemy.hp <= 0) {
						defeatEnemy(state, enemy, removedEnemies, true);
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
				if (enemy.kind === "supply") {
					breakSupplyCraft(state, enemy, removedEnemies);
					slash.hitEnemyIds.push(enemy.id);
					continue;
				}
				applyDamageToEnemy(state, enemy, slash.damage);
				slash.hitEnemyIds.push(enemy.id);
				addParticleBurst(state, enemy.x, enemy.y, slash.charge > 0.75 ? "#fff27a" : "#8bf4ff", 8);

				if (enemy.hp <= 0) {
					defeatEnemy(state, enemy, removedEnemies, false);
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
		for (const pet of state.pets) {
			const shieldRadius = getPetShieldRadius(pet.level);
			const hitDistance = bullet.radius + shieldRadius;
			if (distanceSquared(bullet.x, bullet.y, pet.x, pet.y) <= hitDistance * hitDistance) {
				removedBullets.add(bullet.id);
				pet.fireCooldown = 0.18;
				state.shake = Math.max(state.shake, 0.06);
				addParticleBurst(state, pet.x, pet.y, pet.level >= 4 ? "#ffffff" : "#8bf4ff", 12 + pet.level * 3);
				break;
			}
		}
		if (removedBullets.has(bullet.id)) continue;

		const hitDistance = bullet.radius + playerHitbox.radius;
		if (distanceSquared(bullet.x, bullet.y, playerHitbox.x, playerHitbox.y) <= hitDistance * hitDistance) {
			removedBullets.add(bullet.id);
			damagePlayer(state);
		}
	}

	for (const enemy of state.enemies) {
		const hitDistance = enemy.radius + playerHitbox.radius;
		if (enemy.y > -20 && distanceSquared(enemy.x, enemy.y, playerHitbox.x, playerHitbox.y) <= hitDistance * hitDistance) {
			if (enemy.kind === "supply") {
				collectSupplyCraft(state, enemy, removedEnemies);
				continue;
			}
			removedEnemies.add(enemy.id);
			if (enemy.kind !== "boss") addParticleBurst(state, enemy.x, enemy.y, getEnemyBurstColor(enemy), 12);
			damagePlayer(state);
		}
	}

	for (const powerUp of state.powerUps) {
		const pickupRadius = getPickupRadius(state, powerUp.radius, 28);
		if (distanceSquared(powerUp.x, powerUp.y, state.player.x, state.player.y) <= pickupRadius * pickupRadius) {
			collectPowerUp(state, powerUp);
			removedBullets.add(powerUp.id);
		}
	}

	state.bullets = state.bullets.filter((bullet) => !removedBullets.has(bullet.id));
	state.enemies = state.enemies.filter(
		(enemy) =>
			!removedEnemies.has(enemy.id) &&
			(enemy.kind !== "goldfish" || !enemy.escapeTime || enemy.age < enemy.escapeTime) &&
			(enemy.kind !== "supply" || (enemy.x > -enemy.radius - 64 && enemy.x < WORLD_WIDTH + enemy.radius + 64)) &&
			enemy.y < WORLD_HEIGHT + enemy.radius + 40,
	);
	state.powerUps = state.powerUps.filter((powerUp) => !removedBullets.has(powerUp.id));
	if (state.mode === "stage-select") {
		state.enemies = [];
		state.bullets = [];
		state.slashes = [];
		state.powerUps = [];
		state.warningZones = [];
	}
};

const updateStageSelection = (state: GameState, dt: number) => {
	state.time += dt;
	state.shake = Math.max(0, state.shake - dt);
	updatePlayer(state, dt, false);
	updateExperienceOrbs(state, dt);
	updateCollectionEffects(state, dt);
	updateParticles(state, dt);

	for (let index = 0; index < state.stageChoices.length; index++) {
		const route = getStageRoutePosition(index);
		const hitRadius = state.player.radius + route.radius * 0.58;
		if (distanceSquared(state.player.x, state.player.y, route.x, route.y) <= hitRadius * hitRadius) {
			selectStageRoute(state, state.stageChoices[index].id);
			break;
		}
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
	if (state.mode !== "playing") {
		if (state.mode === "stage-select") {
			updateStageSelection(state, dt);
			return;
		}
		if (state.mode === "augment" || state.mode === "gameover") {
			updateCollectionEffects(state, dt);
			updateParticles(state, dt);
		}
		return;
	}
	addExperience(state, 0);
	if (state.mode !== "playing") {
		updateCollectionEffects(state, dt);
		updateParticles(state, dt);
		return;
	}

	state.time += dt;
	state.shake = Math.max(0, state.shake - dt);
	state.comboTimer = Math.max(0, state.comboTimer - dt);
	if (state.comboTimer <= 0) state.combo = 0;
	updatePlayer(state, dt);
	updateBossSkillCooldowns(state, dt);
	updateStageMission(state, dt);
	if (state.mode !== "playing") {
		updateCollectionEffects(state, dt);
		updateParticles(state, dt);
		return;
	}
	updateSpawn(state, dt);
	updateEnemies(state, dt);
	updatePets(state, dt);
	updateShield(state, dt);
	updateBullets(state, dt);
	updateWarningZones(state, dt);
	updatePowerUps(state, dt);
	updateSlashes(state, dt);
	resolveCollisions(state);
	updateExperienceOrbs(state, dt);
	updateCollectionEffects(state, dt);
	updateParticles(state, dt);
};
