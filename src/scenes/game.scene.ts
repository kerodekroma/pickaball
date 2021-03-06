import Phaser from "phaser";
import {
  COLOR_PALETTE,
  GRID_UNIT,
  GROUND,
  INITAL_DURATION_ATTEMPT,
  SOUNDS,
} from "~/game.config";
import { BasketRimObject } from "~/objects/basketRim.object";
import BallImageObject from "~/objects/ball.object";
import GroundScene from "./ground.scene";
import { Bound } from "~/services/calculator.service";
import ArrowObject from "~/objects/arrow.object";
export default class GameScene extends Phaser.Scene {
  private ball!: BallImageObject;
  private basketRim?: BasketRimObject;
  private arrow!: ArrowObject;
  private points: number = 0;

  private shotSound?: Phaser.Sound.BaseSound;
  private timeOutSound?: Phaser.Sound.BaseSound;
  private isEnabledTimeOutSound: boolean = true;
  private isMuted = false;
  private timeToRestartShot = INITAL_DURATION_ATTEMPT;
  private timerInShot!: Phaser.Time.TimerEvent;

  constructor() {
    super("Game");
  }

  create() {
    this.points = 0;
    this.cameras.main.setBackgroundColor(COLOR_PALETTE.darkBlue);

    this.shotSound = this.sound.add(SOUNDS[0]);
    this.timeOutSound = this.sound.add(SOUNDS[1]);

    const hudScene = this.scene.get("HUD");
    const gameOverScene = this.scene.get("GameOver");
    const pauseResumeScene = this.scene.get("Pause");
    const groundScene: GroundScene = this.scene.get("Ground") as GroundScene;

    this.scene
      .launch(groundScene)
      .launch(hudScene, { gameScene: this })
      .launch(pauseResumeScene, { gameScene: this })
      .launch(gameOverScene, { gameScene: this });

    //objects setup
    this.basketRim = groundScene.addBasketRim(
      GROUND.X + GRID_UNIT / 3,
      GROUND.HEIGHT / 2
    );
    this.ball = groundScene.addBall(
      GROUND.WIDTH - GRID_UNIT * 6,
      GROUND.HEIGHT - GRID_UNIT * 4,
      "ball"
    );
    this.ball.setGravity(GROUND.GRAVITY);
    this.arrow = groundScene.addArrow(
      this.ball.getCenter().x + GRID_UNIT * 2,
      this.ball.getCenter().y + GRID_UNIT * 2,
      "cursor"
    );
    this.arrow.link(this.ball);
    this.arrow.onDrag(() => {
      this.arrow?.updateProjectionValues(this.ball);
    });
    this.arrow.onLeave((position) => {
      this.arrow.hide();
      this.shot({ x: position.x, y: position.y, width: 0, height: 0 });
    });

    // orientation checker
    this.checkOrientation(this.scale.orientation);
    this.scale.on("orientationchange", this.checkOrientation, this);

    // touch zone
    const zone = this.add
      .zone(GROUND.X, GROUND.Y, GROUND.WIDTH, GROUND.HEIGHT)
      .setOrigin(0, 0)
      .setInteractive({ cursor: "hand" })
      .on("pointerup", (data) => {
        const { downX, downY } = data;
        const pos: Bound = { x: downX, y: downY, width: 0, height: 0 };
        //this.shot(pos)
      });
    // debugging touch area
    this.add.graphics().lineStyle(2, 0x00ff00).strokeRectShape(zone);
  }

  update(time, delta) {
    this.ball.update(delta);
    this.basketRim?.collideWithBall(
      this.ball.getBounds(),
      (obj) => {
        this.ball.bounceIt(obj.getBounds());
        this.timeToRestartShot += 100;
        this.timerInShot = this.generateDelayedCall(this.timeToRestartShot);
      },
      () => {
        this.updateScore();
      }
    );
    this.arrow?.renderLink();
  }

  endGame() {
    if (this.isEnabledTimeOutSound) {
      this.timeOutSound?.play();
      this.isEnabledTimeOutSound = false;
    }
    this.scene.pause("Ground");
    this.events.emit("lose", this.points);
    this.time.delayedCall(2300, () => {
      this.scene.stop("HUD").stop("GameOver").stop("Ground").start("Menu");
    });
  }

  updateScore() {
    this.points += 5;
    this.events.emit("ate", this.points);
  }

  checkOrientation(orientation) {
    if (orientation === Phaser.Scale.PORTRAIT) {
      console.log("is in portrait");
    }
    if (orientation === Phaser.Scale.LANDSCAPE) {
      console.log("is in landscape");
    }
  }

  shot(position: Bound) {
    if (this.ball.isDisabled) {
      return;
    }
    this.ball.shot(position);
    this.timerInShot = this.generateDelayedCall(this.timeToRestartShot);
  }

  private generateDelayedCall(time) {
    if (this.timerInShot) {
      this.timerInShot.remove();
    }
    return this.time.delayedCall(time, () => {
      this.ball?.reposition();
      this.arrow?.reset(this.ball);
      this.basketRim?.resetMark();
      this.timeToRestartShot = INITAL_DURATION_ATTEMPT;
    });
  }
}
