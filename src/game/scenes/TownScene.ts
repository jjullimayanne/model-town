import Phaser from 'phaser';
import { EventBus } from '../../bridge/EventBus';
import { BUILDINGS, BUILDING_BY_ID, type BuildingId } from '../../content/buildings';
import { createRng } from '../../ml/rng';
import { MAP_SIZE, TILE_H, TILE_W, gridToScreen, screenToGrid } from '../iso';
import { buildTownMap, HIGHWAY_X, isWalkable, type TownMap } from '../map';
import { findPath } from '../pathfinding';
import { currentDict } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { buildingTextureOrigin, generateAllTextures, houseOrigins, loadCharacterSheets, NEON, prepareCharacters, TOWER_H, type CharacterSheet } from '../textures';
import { Walker } from '../objects/Walker';

const PLAYER_SPEED_PX = 150;
/** Screen y just above a building's roof (tallest toppers need more room). */
const labelY = (id: BuildingId, centerY: number) => centerY - TOWER_H[id] - (id === 'monitoring' ? 82 : id === 'cityhall' ? 72 : 58);
const BUBBLES = ['bub_heart', 'bub_note', 'bub_cup', 'bub_flower', 'bub_bridge'];
const VILLAGERS: { sheet: CharacterSheet; glow: number }[] = [
  { sheet: 'femalePerson', glow: NEON.cyan }, { sheet: 'malePerson', glow: NEON.pink }, { sheet: 'maleAdventurer', glow: NEON.violet },
  { sheet: 'femalePerson', glow: NEON.yellow }, { sheet: 'malePerson', glow: NEON.green }, { sheet: 'maleAdventurer', glow: NEON.pink },
];

export class TownScene extends Phaser.Scene {
  private map!: TownMap;
  private player!: Walker;
  private villagers: { w: Walker; wait: number; bubble?: Phaser.GameObjects.Image }[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private locked = false;
  private near: BuildingId | null = null;
  private pendingEnter: BuildingId | null = null;
  private cars: { img: Phaser.GameObjects.Image; gy: number; lane: number; dir: 1 | -1; speed: number }[] = [];
  private hovers: { img: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  private sky?: Phaser.GameObjects.Image;
  private stars: Phaser.GameObjects.Image[] = [];
  private dayFx?: Phaser.FX.ColorMatrix;
  private buildingImgs = new Map<BuildingId, Phaser.GameObjects.Image>();
  private labels = new Map<BuildingId, Phaser.GameObjects.Text>();
  private marker?: Phaser.GameObjects.Image;
  private ring?: Phaser.GameObjects.Image;
  private cracks: Phaser.GameObjects.GameObject[] = [];
  private trainingFx?: Phaser.GameObjects.Particles.ParticleEmitter;
  private unsubs: (() => void)[] = [];

  constructor() {
    super('Town');
  }

  preload() {
    loadCharacterSheets(this);
  }

  create() {
    this.map = buildTownMap();
    generateAllTextures(this, this.map.houses);
    prepareCharacters(this);

    this.drawSky();
    this.applyTheme(useGame.getState().theme);
    this.drawGround();
    this.drawBuildings();
    this.drawDecos();
    this.drawBridgeProblems();
    this.spawnAmbient();

    this.player = new Walker(this, 'femaleAdventurer', this.map.spawn.x + 0.5, this.map.spawn.y + 0.5, NEON.cyan);
    this.spawnTraffic();
    VILLAGERS.forEach((_, i) => this.spawnVillager(i));

    const N = MAP_SIZE;
    const cam = this.cameras.main;
    cam.setBounds(-N * 32 - 200, -300, N * 64 + 400, N * 32 + 600);
    cam.startFollow(this.player.sprite, true, 0.09, 0.09);
    cam.setZoom(this.scale.width < 900 ? 0.85 : 1.15);

    this.setupInput();
    this.setupBus();
    EventBus.emit('scene:ready');
  }

  // ───────────────────────── world building
  private drawGround() {
    const N = MAP_SIZE;
    const rng = createRng(5);
    for (let x = 0; x < N; x++)
      for (let y = 0; y < N; y++) {
        const g = this.map.ground[x][y];
        const p = gridToScreen(x, y);
        const lane = x === HIGHWAY_X[0] ? 'tile_hw_left' : x === HIGHWAY_X[2] ? 'tile_hw_right' : 'tile_hw_mid';
        const key = g === 'grass' ? `tile_grass_${Math.floor(rng() * 3)}` : g === 'highway' || g === 'bridge' ? lane : `tile_${g}`;
        this.add.image(p.x - TILE_W / 2, p.y, key).setOrigin(0, 0).setDepth(-10000);
        // footbridges float above the traffic
        if (g === 'bridge') this.add.image(p.x - TILE_W / 2, p.y, 'tile_bridge').setOrigin(0, 0).setDepth(-9000);
        if (y === N - 1) this.add.image(p.x - TILE_W / 2, p.y + TILE_H / 2, 'edge_left').setOrigin(0, 0).setDepth(-10001);
        if (x === N - 1) this.add.image(p.x, p.y + TILE_H / 2, 'edge_right').setOrigin(0, 0).setDepth(-10001);
      }
  }

  private drawBuildings() {
    for (const b of BUILDINGS) {
      const o = buildingTextureOrigin[b.id];
      const top = gridToScreen(b.tile.x, b.tile.y);
      const img = this.add.image(top.x - o.ox, top.y - o.oy, `bld_${b.id}`).setOrigin(0, 0);
      img.setDepth(gridToScreen(b.tile.x + b.tile.w / 2, b.tile.y + b.tile.h / 2).y);
      img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 10 });
      img.on('pointerover', () => img.setTint(0xfff4d6));
      img.on('pointerout', () => img.clearTint());
      img.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        if (!this.locked) this.walkToBuilding(b.id);
      });
      this.buildingImgs.set(b.id, img);

      const labelPos = gridToScreen(b.tile.x + b.tile.w / 2, b.tile.y + b.tile.h / 2);
      const label = this.add
        .text(labelPos.x, labelY(b.id, labelPos.y), currentDict().buildings[b.id].name, {
          fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '15px', color: `#${b.roof.toString(16).padStart(6, '0')}`,
          backgroundColor: '#1e2133e6', padding: { x: 9, y: 4 },
        })
        .setOrigin(0.5, 1)
        .setDepth(20000)
        .setResolution(2);
      this.labels.set(b.id, label);
    }
    for (const [i, h] of this.map.houses.entries()) {
      const key = `house_${i}`;
      const o = houseOrigins[key];
      const top = gridToScreen(h.x, h.y);
      this.add.image(top.x - o.ox, top.y - o.oy, key).setOrigin(0, 0).setDepth(gridToScreen(h.x + 1, h.y + 1).y);
    }
  }

  private drawDecos() {
    for (const d of this.map.decos) {
      const c = gridToScreen(d.x + 0.5, d.y + 0.5);
      const key =
        d.kind === 'tree' || d.kind === 'pine' || d.kind === 'bush' ? `${d.kind}_${d.variant}` :
        d.kind === 'flowers' ? `flowers_${d.variant}` : d.kind;
      if (d.kind === 'flowers') {
        this.add.image(c.x, c.y, key).setDepth(-9000);
        continue;
      }
      const img = this.add.image(c.x, c.y + 4, key).setOrigin(0.5, 1).setDepth(c.y);
      if (d.kind === 'tree' || d.kind === 'pine') {
        this.tweens.add({ targets: img, angle: { from: -1.2, to: 1.2 }, duration: 1800 + d.variant * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }
  }

  private drawBridgeProblems() {
    const middle = this.map.bridges[1];
    for (const t of middle) {
      const p = gridToScreen(t.x, t.y);
      const crack = this.add.image(p.x - TILE_W / 2, p.y, 'crack').setOrigin(0, 0).setDepth(-8990);
      crack.setInteractive({ useHandCursor: true, pixelPerfect: false });
      crack.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        EventBus.emit('bridge:click');
      });
      this.cracks.push(crack);
    }
    const mid = middle[Math.floor(middle.length / 2)] ?? { x: 12, y: 14 };
    const p = gridToScreen(mid.x + 0.5, mid.y - 0.3);
    const sign = this.add.image(p.x, p.y - 8, 'warn_sign').setOrigin(0.5, 1).setDepth(p.y + 10);
    sign.setInteractive({ useHandCursor: true });
    sign.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      EventBus.emit('bridge:click');
    });
    this.tweens.add({ targets: sign, y: sign.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.cracks.push(sign);
  }

  private setBridgesRepaired(repaired: boolean, animate?: boolean) {
    if (!repaired) return;
    for (const c of this.cracks) {
      if (animate && c instanceof Phaser.GameObjects.Image) {
        this.add.particles(c.x + TILE_W / 2, c.y + TILE_H / 2, 'spark', {
          speed: { min: 40, max: 120 }, lifespan: 900, quantity: 10, scale: { start: 0.8, end: 0 },
          tint: [0xffd23f, 0xffffff, 0x7cc46a], emitting: false,
        }).setDepth(30000).explode(12);
      }
      c.destroy();
    }
    this.cracks = [];
  }

  private drawSky() {
    const { width, height } = this.scale;
    this.sky = this.add.image(width / 2, height / 2, 'sky_dark').setScrollFactor(0).setDepth(-20000).setDisplaySize(width * 2.4, height * 2.4);
    this.scale.on('resize', (size: Phaser.Structs.Size) => {
      this.sky?.setPosition(size.width / 2, size.height / 2).setDisplaySize(size.width * 2.4, size.height * 2.4);
    });
    const rng = createRng(3);
    for (let i = 0; i < 70; i++) {
      const star = this.add
        .image(rng() * width * 1.6 - width * 0.3, rng() * height * 0.7 - height * 0.2, 'dot')
        .setScrollFactor(0.05)
        .setScale(0.12 + rng() * 0.2)
        .setAlpha(0.4 + rng() * 0.5)
        .setDepth(-19999);
      this.tweens.add({ targets: star, alpha: 0.15, duration: 900 + rng() * 2000, yoyo: true, repeat: -1, delay: rng() * 2000 });
      this.stars.push(star);
    }
  }

  private applyTheme(theme: 'light' | 'dark') {
    this.cameras.main.setBackgroundColor(theme === 'dark' ? '#262a40' : '#dfe3ee');
    this.sky?.setTexture(theme === 'dark' ? 'sky_dark' : 'sky_light');
    this.stars.forEach((st) => st.setVisible(theme === 'dark'));
    // Daytime look: brighten + soften the neon night (WebGL only).
    const cam = this.cameras.main;
    if (!cam.postFX) return;
    if (theme === 'light') {
      this.dayFx ??= cam.postFX.addColorMatrix();
      this.dayFx.brightness(1.45);
      this.dayFx.saturate(-0.18, true);
    } else if (this.dayFx) {
      cam.postFX.remove(this.dayFx as unknown as Phaser.FX.Controller);
      this.dayFx = undefined;
    }
  }

  private spawnAmbient() {
    const N = MAP_SIZE;
    // neon fireflies drifting over the town
    this.add.particles(0, 0, 'dot', {
      x: { min: -N * 32, max: N * 32 }, y: { min: -100, max: N * 32 },
      lifespan: 5000, speedX: { min: -8, max: 8 }, speedY: { min: -14, max: -4 },
      alpha: { start: 0.55, end: 0 }, scale: { min: 0.1, max: 0.22 }, frequency: 260,
      tint: [NEON.cyan, NEON.pink, NEON.yellow, NEON.violet], blendMode: 'ADD',
    }).setDepth(24000);
    // steam from the Cleaning Lab tanks
    const cl = BUILDING_BY_ID.cleaning;
    const cp = gridToScreen(cl.tile.x + cl.tile.w / 2, cl.tile.y + cl.tile.h / 2);
    this.add.particles(cp.x, cp.y - 110, 'dot', {
      speedY: { min: -30, max: -15 }, speedX: { min: -6, max: 10 }, lifespan: 2200, frequency: 400,
      scale: { start: 0.3, end: 0.8 }, alpha: { start: 0.5, end: 0 }, tint: NEON.green, blendMode: 'ADD',
    }).setDepth(21000);
  }

  /** Two-way traffic on the expressway, plus hover cars in the sky. */
  private spawnTraffic() {
    const rng = createRng(21);
    for (let i = 0; i < 10; i++) {
      const dir: 1 | -1 = i % 2 ? 1 : -1;
      const lane = dir === 1 ? HIGHWAY_X[0] + 0.5 : HIGHWAY_X[2] + 0.5;
      const color = Math.floor(rng() * 6);
      const img = this.add.image(0, 0, `car_${color}_${dir === 1 ? 'f' : 'b'}`).setDepth(-9500);
      this.cars.push({ img, gy: rng() * MAP_SIZE, lane, dir, speed: 2.2 + rng() * 2 });
    }
    for (let i = 0; i < 4; i++) {
      const img = this.add.image(-800 + rng() * 1600, -120 + rng() * 300, `hover_${i % 3}`).setDepth(26000).setAlpha(0.95);
      const vx = (rng() < 0.5 ? -1 : 1) * (40 + rng() * 40);
      img.setFlipX(vx < 0);
      this.hovers.push({ img, vx, vy: vx * 0.08 });
    }
  }

  private updateTraffic(dt: number) {
    const s = dt / 1000;
    for (const c of this.cars) {
      c.gy += c.dir * c.speed * s;
      if (c.gy > MAP_SIZE + 1) c.gy = -1;
      if (c.gy < -1) c.gy = MAP_SIZE + 1;
      const p = gridToScreen(c.lane, c.gy);
      c.img.setPosition(p.x, p.y);
    }
    const N = MAP_SIZE * 32 + 300;
    for (const h of this.hovers) {
      h.img.x += h.vx * s;
      h.img.y += h.vy * s;
      if (h.img.x > N) { h.img.x = -N; }
      if (h.img.x < -N) { h.img.x = N; }
    }
  }

  // ───────────────────────── villagers
  private spawnVillager(i: number) {
    const rng = createRng(100 + i);
    let x = 0, y = 0;
    do {
      x = Math.floor(rng() * MAP_SIZE);
      y = Math.floor(rng() * MAP_SIZE);
    } while (this.map.ground[x][y] !== 'path');
    const w = new Walker(this, VILLAGERS[i].sheet, x + 0.5, y + 0.5, VILLAGERS[i].glow);
    this.villagers.push({ w, wait: 500 + i * 400 });
  }

  private updateVillagers(dt: number) {
    for (const v of this.villagers) {
      if (v.bubble) v.bubble.setPosition(v.w.sprite.x, v.w.sprite.y - 50).setDepth(v.w.sprite.depth + 1);
      if (v.w.followPath(dt, 1.3)) continue;
      v.w.animate(dt, false);
      v.wait -= dt;
      if (v.wait > 0) continue;
      v.wait = 1500 + Math.random() * 4000;
      const tx = Phaser.Math.Clamp(Math.floor(v.w.gx + (Math.random() - 0.5) * 12), 0, MAP_SIZE - 1);
      const ty = Phaser.Math.Clamp(Math.floor(v.w.gy + (Math.random() - 0.5) * 12), 0, MAP_SIZE - 1);
      if (this.map.ground[tx][ty] === 'path' || this.map.ground[tx][ty] === 'plaza') {
        v.w.path = findPath(this.map, { x: Math.floor(v.w.gx), y: Math.floor(v.w.gy) }, { x: tx, y: ty })?.slice(1) ?? [];
      }
      if (!v.bubble && Math.random() < 0.35) this.sayVillager(v);
    }
  }

  private sayVillager(v: { w: Walker; bubble?: Phaser.GameObjects.Image }) {
    const key = BUBBLES[Math.floor(Math.random() * BUBBLES.length)];
    v.bubble = this.add.image(v.w.sprite.x, v.w.sprite.y - 50, key).setOrigin(0.5, 1);
    this.tweens.add({ targets: v.bubble, scale: { from: 0.4, to: 1 }, duration: 220, ease: 'Back.out' });
    this.time.delayedCall(2200, () => {
      v.bubble?.destroy();
      v.bubble = undefined;
    });
  }

  // ───────────────────────── input & movement
  private setupInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER', false) as Record<string, Phaser.Input.Keyboard.Key>;
    const tryEnter = () => {
      if (!this.locked && this.near) EventBus.emit('building:enter', { id: this.near });
    };
    this.keys.E.on('down', tryEnter);
    this.keys.SPACE.on('down', tryEnter);
    this.keys.ENTER.on('down', tryEnter);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.locked) return;
      const g = screenToGrid(p.worldX, p.worldY);
      const tx = Math.floor(g.x), ty = Math.floor(g.y);
      if (!isWalkable(this.map, tx, ty)) return;
      this.pendingEnter = null;
      this.walkTo(tx, ty);
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.6, 1.8));
    });
  }

  private walkTo(tx: number, ty: number) {
    const path = findPath(this.map, { x: Math.floor(this.player.gx), y: Math.floor(this.player.gy) }, { x: tx, y: ty });
    this.player.path = path ? path.slice(1) : [];
  }

  private walkToBuilding(id: BuildingId) {
    const d = BUILDING_BY_ID[id].door;
    this.pendingEnter = id;
    this.walkTo(d.x, d.y);
    if (!this.player.path.length && this.near === id) {
      this.pendingEnter = null;
      EventBus.emit('building:enter', { id });
    }
  }

  private updatePlayer(dt: number) {
    const k = this.keys;
    let sx = 0, sy = 0;
    if (!this.locked) {
      if (k.LEFT.isDown || k.A.isDown) sx -= 1;
      if (k.RIGHT.isDown || k.D.isDown) sx += 1;
      if (k.UP.isDown || k.W.isDown) sy -= 1;
      if (k.DOWN.isDown || k.S.isDown) sy += 1;
    }
    const p = this.player;
    if (sx || sy) {
      p.path = [];
      this.pendingEnter = null;
      const len = Math.hypot(sx, sy);
      const px = (sx / len) * PLAYER_SPEED_PX * (dt / 1000);
      const py = (sy / len) * PLAYER_SPEED_PX * (dt / 1000);
      const dg = screenToGrid(px, py);
      const r = 0.22;
      const ok = (x: number, y: number) =>
        isWalkable(this.map, x - r, y - r) && isWalkable(this.map, x + r, y - r) &&
        isWalkable(this.map, x - r, y + r) && isWalkable(this.map, x + r, y + r);
      if (ok(p.gx + dg.x, p.gy + dg.y)) { p.gx += dg.x; p.gy += dg.y; }
      else if (ok(p.gx + dg.x, p.gy)) p.gx += dg.x;
      else if (ok(p.gx, p.gy + dg.y)) p.gy += dg.y;
      p.sync();
      p.animate(dt, true, sx);
    } else if (!p.followPath(dt, 4.2)) {
      p.sync();
      p.animate(dt, false);
      if (this.pendingEnter && this.near === this.pendingEnter) {
        EventBus.emit('building:enter', { id: this.pendingEnter });
        this.pendingEnter = null;
      }
    }
  }

  private updateNear() {
    let best: BuildingId | null = null;
    let bestD = 1.4;
    for (const b of BUILDINGS) {
      const d = Math.hypot(this.player.gx - (b.door.x + 0.5), this.player.gy - (b.door.y + 0.5));
      if (d < bestD) { bestD = d; best = b.id; }
    }
    if (best !== this.near) {
      this.near = best;
      EventBus.emit('building:near', { id: best });
    }
  }

  // ───────────────────────── React bridge
  private setupBus() {
    this.unsubs.push(
      EventBus.on('input:lock', ({ locked }) => {
        this.locked = locked;
        if (locked) this.player.path = [];
      }),
      EventBus.on('player:walkTo', ({ id }) => this.walkToBuilding(id)),
      EventBus.on('objective:set', ({ id }) => this.setObjective(id)),
      EventBus.on('town:bridgesRepaired', ({ repaired, animate }) => this.setBridgesRepaired(repaired, animate)),
      EventBus.on('fx:celebrate', () => this.celebrate()),
      EventBus.on('fx:training', ({ on }) => this.setTraining(on)),
      EventBus.on('fx:deploy', () => this.deployFx()),
      EventBus.on('theme:set', ({ theme }) => this.applyTheme(theme)),
      EventBus.on('lang:set', () => this.labels.forEach((l, id) => l.setText(currentDict().buildings[id].name))),
    );
    this.events.once('shutdown', () => this.unsubs.forEach((u) => u()));
    this.events.once('destroy', () => this.unsubs.forEach((u) => u()));
  }

  private setObjective(id: BuildingId | null) {
    this.marker?.destroy();
    this.ring?.destroy();
    this.marker = undefined;
    this.ring = undefined;
    if (!id) return;
    const b = BUILDING_BY_ID[id];
    const c = gridToScreen(b.tile.x + b.tile.w / 2, b.tile.y + b.tile.h / 2);
    this.marker = this.add.image(c.x, labelY(id, c.y) - 48, 'marker').setDepth(30000);
    this.tweens.add({ targets: this.marker, y: this.marker.y - 12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const d = gridToScreen(b.door.x, b.door.y);
    this.ring = this.add.image(d.x - TILE_W / 2, d.y, 'ring').setOrigin(0, 0).setDepth(-9000);
    this.tweens.add({ targets: this.ring, alpha: { from: 1, to: 0.3 }, duration: 700, yoyo: true, repeat: -1 });
  }

  private celebrate() {
    this.player.cheer();
    const { x, y } = this.player.sprite;
    this.add.particles(x, y - 30, 'confetti', {
      speed: { min: 120, max: 320 }, angle: { min: 200, max: 340 }, gravityY: 400, lifespan: 1600,
      rotate: { start: 0, end: 720 }, tint: [0xff8a5b, 0xffd23f, 0x7cc46a, 0x5b8def, 0xf7a1c4, 0x9b6bdf],
      emitting: false,
    }).setDepth(30000).explode(80);
  }

  private setTraining(on: boolean) {
    if (on && !this.trainingFx) {
      const b = BUILDING_BY_ID.mllab;
      const img = this.buildingImgs.get('mllab')!;
      const c = gridToScreen(b.tile.x + b.tile.w / 2, b.tile.y + b.tile.h / 2);
      this.trainingFx = this.add.particles(c.x, img.y + 40, 'spark', {
        speed: { min: 30, max: 90 }, angle: { min: 230, max: 310 }, lifespan: 1200, frequency: 60,
        scale: { start: 0.9, end: 0 }, tint: [0xb79cf2, 0xffd23f, 0xffffff],
      }).setDepth(30000);
    } else if (!on && this.trainingFx) {
      this.trainingFx.stop();
      const fx = this.trainingFx;
      this.time.delayedCall(1300, () => fx.destroy());
      this.trainingFx = undefined;
    }
  }

  private deployFx() {
    const b = BUILDING_BY_ID.deploy;
    const img = this.buildingImgs.get('deploy')!;
    const c = gridToScreen(b.tile.x + b.tile.w / 2, b.tile.y + b.tile.h / 2);
    const rocket = this.add.image(c.x, img.y + 30, 'rocket').setOrigin(0.5).setDepth(30000).setAngle(20);
    this.tweens.add({ targets: rocket, y: rocket.y - 400, alpha: 0, duration: 1600, ease: 'Quad.in', onComplete: () => rocket.destroy() });
    this.add.particles(c.x, img.y + 40, 'dot', {
      speed: { min: 40, max: 140 }, lifespan: 1000, scale: { start: 0.8, end: 0 }, tint: [0xffffff, 0xf7a1c4, 0xffd23f], emitting: false,
    }).setDepth(29999).explode(30);
  }

  update(_t: number, dt: number) {
    this.updatePlayer(dt);
    this.updateNear();
    this.updateVillagers(dt);
    this.updateTraffic(dt);
  }
}
