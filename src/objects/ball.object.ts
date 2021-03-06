import { COLOR_PALETTE, GRID_UNIT, GROUND } from "~/game.config";
import CalculatorService, { Bound } from "~/services/calculator.service";

export default class BallImageObject extends Phaser.GameObjects.Image {
  public vY = 0;
  public vX = 0;
  public vR = 0;
  private gravity = 0;
  private accY = 0;
  private accX = 0;
  private bounce = -0.8;
  public isDisabled = false;
  private calculator = new CalculatorService();
  private initPos = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x, y, texture) {
    super(scene, x, y, texture);
    this.initPos.x = x;
    this.initPos.y = y;
    this.setDisplaySize(GRID_UNIT, GRID_UNIT);
    this.setTintFill(COLOR_PALETTE.lightOrange);
    scene.children.add(this);
  }

  setGravity(value: number) {
    this.gravity = value;
  }

  update(delta: number) {
    const { width, height } = this.getBounds();
    const { x: centerX, y: centerY } = this.getCenter();
    // touch the left
    //if (centerX - width / 2 < GROUND.X) {
    //  this.x = GROUND.X + width / 2;
    //  this.vX *= this.bounce;
    //}

    // touch the right
    // if (centerX + width / 2 > GROUND.X + GROUND.WIDTH) {
    //   this.x = GROUND.X + GROUND.WIDTH - width / 2;
    //   this.vX *= this.bounce;
    // }

    // touch the top
    // if (centerY - height / 2 < GROUND.Y) {
    //   // this.vY = -this.velocityY;
    //   this.y = GROUND.Y + height / 2;
    //   this.vY *= this.bounce;
    // }

    // touch the bottom
    if (centerY + height / 2 > GROUND.Y + GROUND.HEIGHT) {
      // this.vY = -this.velocityY;
      this.y = GROUND.Y + GROUND.HEIGHT - height / 2;
      this.vY *= this.bounce;
    }

    this.vY += this.accY;
    this.vX += this.accX;
    this.x += delta * this.vX;
    this.y += delta * this.vY;
    this.rotation += this.vR;
  }

  bounceIt(bounds: Bound) {
    const { x, y, width, height } = this.getBounds();
    const posA: Bound = {
      x: x + width / 2 || 0,
      y: y + height / 2 || 0,
      width: 0,
      height: 0,
    };
    const speed = -this.calculator.distanceAABB(posA, bounds) / 90;
    this.vX = Math.cos(this.calculator.distanceAngle(posA, bounds)) * speed;
    this.vY = Math.sin(this.calculator.distanceAngle(posA, bounds)) * speed;
    this.vR = this.vX;
  }

  shot(target: Bound) {
    if (this.isDisabled) {
      return;
    }
    this.isDisabled = true;
    const { x, y } = this.getBounds();
    const posA: Bound = {
      x: this.getCenter().x,
      y: this.getCenter().y,
      width: 0,
      height: 0,
    };
    const speed = this.calculator.distanceAABB(target, posA) / 90;
    const angle = this.calculator.distanceAngle(target, posA);
    this.vX = Math.cos(angle) * speed;
    this.vY = Math.sin(angle) * speed;
    this.vR = 0.1;
    this.accY = this.gravity;
  }

  reposition() {
    this.isDisabled = false;
    this.vX = 0;
    this.vY = 0;
    this.accX = 0;
    this.accY = 0;
    this.rotation = 0;
    this.vR = 0;
    this.setPosition(this.initPos.x, this.initPos.y);
  }
}
