import Phaser from 'phaser';
import { gridToScreen } from '../iso';
import type { CharacterSheet } from '../textures';

const SCALE = 0.4;

/** Anything that walks on the iso grid: a Kenney character sprite, its shadow and a waypoint queue. */
export class Walker {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  gx: number;
  gy: number;
  path: { x: number; y: number }[] = [];
  moving = false;

  constructor(protected scene: Phaser.Scene, protected sheet: CharacterSheet, gx: number, gy: number, glow?: number) {
    this.gx = gx;
    this.gy = gy;
    this.shadow = scene.add.image(0, 0, 'shadow').setScale(1.1, 1);
    this.sprite = scene.add.sprite(0, 0, `toon_${sheet}`, 'idle').setOrigin(0.5, 0.94).setScale(SCALE);
    // neon rim light (WebGL only; canvas renderer simply skips it)
    if (glow !== undefined) this.sprite.preFX?.addGlow(glow, 1.4, 0, false, 0.1, 10);
    this.sync();
  }

  sync() {
    const p = gridToScreen(this.gx, this.gy);
    this.sprite.setPosition(p.x, p.y);
    this.shadow.setPosition(p.x, p.y);
    this.sprite.setDepth(p.y + 2);
    this.shadow.setDepth(p.y + 1);
  }

  animate(_dt: number, moving: boolean, screenDx = 0) {
    if (moving && !this.moving) this.sprite.play(`${this.sheet}_walk`);
    if (!moving && this.moving) {
      this.sprite.stop();
      this.sprite.setFrame('idle');
    }
    this.moving = moving;
    if (moving && Math.abs(screenDx) > 0.01) this.sprite.setFlipX(screenDx < 0);
  }

  /** Brief celebration pose (used when the player completes something). */
  cheer() {
    this.sprite.stop();
    this.moving = false;
    this.sprite.setFrame('cheer0');
    this.scene.time.delayedCall(250, () => this.sprite.setFrame('cheer1'));
    this.scene.time.delayedCall(900, () => !this.moving && this.sprite.setFrame('idle'));
  }

  /** Follows `path` at `speed` tiles/s. Returns true while still walking. */
  followPath(dt: number, speed: number): boolean {
    const target = this.path[0];
    if (!target) return false;
    const tx = target.x + 0.5;
    const ty = target.y + 0.5;
    const dx = tx - this.gx;
    const dy = ty - this.gy;
    const dist = Math.hypot(dx, dy);
    const step = (speed * dt) / 1000;
    const before = gridToScreen(this.gx, this.gy).x;
    if (dist <= step) {
      this.gx = tx;
      this.gy = ty;
      this.path.shift();
    } else {
      this.gx += (dx / dist) * step;
      this.gy += (dy / dist) * step;
    }
    this.sync();
    this.animate(dt, true, gridToScreen(this.gx, this.gy).x - before);
    return true;
  }
}
