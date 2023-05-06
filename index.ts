// Import stylesheets
import './style.css';

/* -------------------------------------------------------------------------- */
/*                                MINI FRAMEWORK.                             */
/* -------------------------------------------------------------------------- */

// boiler plate setup the canvas for the game
var canvas = <HTMLCanvasElement>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.setAttribute('tabindex', '1');
canvas.style.outline = 'none';
canvas.focus();

// utility functions to use everywhere
class Util {
  static getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

// Input Controller to use everywhere
class InputController {
  public x: number;
  public y: number;

  constructor() {}

  update(gameObject: GameObject) {}
}

class GameObject {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public command: string;

  private inputController: InputController;

  constructor(inputController?) {
    this.inputController = inputController;
  }

  update() {
    this.inputController?.update(this);
  }

  render() {}
}

class Physics {
  private gameObjectCollisionRegister: Array<any> = [];
  private wallCollisionRegister: Array<any> = [];
  private objectA: GameObject;
  private objectB: GameObject;

  constructor() {}

  onCollide(
    objectA: GameObject,
    objectB: GameObject,
    callback: Function,
    scope: any
  ) {
    if (objectA && objectB) {
      this.gameObjectCollisionRegister.push({
        objectA: objectA,
        objectB: objectB,
        callback: callback,
        scope: scope,
      });
    }
  }

  onCollideWalls(objectA: GameObject, callback: Function, scope: any) {
    if (objectA) {
      this.wallCollisionRegister.push({
        objectA: objectA,
        callback: callback,
        scope: scope,
      });
    }
  }

  update() {
    for (let collisionEntry of this.gameObjectCollisionRegister) {
      if (
        collisionEntry.objectA.x > 0 &&
        collisionEntry.objectA.x < canvas.width &&
        collisionEntry.objectA.y > 0 &&
        collisionEntry.objectA.y < canvas.height &&
        collisionEntry.objectB.x > 0 &&
        collisionEntry.objectB.x < canvas.width &&
        collisionEntry.objectB.y > 0 &&
        collisionEntry.objectB.y < canvas.height &&
        collisionEntry.objectA.x >= collisionEntry.objectB.x &&
        collisionEntry.objectA.x <=
          collisionEntry.objectB.x + collisionEntry.objectB.width &&
        collisionEntry.objectA.y >= collisionEntry.objectB.y &&
        collisionEntry.objectA.y <=
          collisionEntry.objectB.y + collisionEntry.objectB.height
      ) {
        collisionEntry.callback.bind(collisionEntry.scope).apply();
      }
    }
    for (let wallCollisionEntry of this.wallCollisionRegister) {
      if (
        wallCollisionEntry.objectA.y < wallCollisionEntry.objectA.height ||
        wallCollisionEntry.objectA.y > canvas.height ||
        wallCollisionEntry.objectA.x < wallCollisionEntry.objectA.width ||
        wallCollisionEntry.objectA.x > canvas.width
      ) {
        wallCollisionEntry.callback.bind(wallCollisionEntry.scope).apply();
      }
    }
  }
}

class Scene {
  public children: Array<any>;
  public physics: Physics;

  constructor() {
    this.children = [];
    this.physics = new Physics();
  }

  add(gameObject: GameObject) {
    this.children.push(gameObject);
  }

  create() {}

  update() {
    for (let gameObject of this.children) {
      gameObject.update();
    }
    this.physics.update();
  }

  render() {
    // update the game background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let gameObject of this.children) {
      gameObject.render();
    }
  }
}

class Game {
  private scene: Scene;
  private id: number;

  constructor(scene: Scene) {
    this.scene = scene;
    this.scene.create();
    //Setup Components
    this.id = requestAnimationFrame(this.gameLoop);
  }

  gameLoop(timestamp) {
    // WARNING: This pattern is not using Times Step and as such
    // Entities must be kept low, when needing multiple entities, scenes,
    // or other components it's recommended to move to a Game Framework

    // game lifecycle events
    game.scene.update();
    game.scene.render();

    // call next frame
    cancelAnimationFrame(game.id);
    game.id = requestAnimationFrame(game.gameLoop);
  }
}

/* -------------------------------------------------------------------------- */
/*                               GAME SPECIFIC CODE                           */
/* -------------------------------------------------------------------------- */

/* ------------------------------ GAME MECHANICS ---------------------------- */
const COLOR_BACKGROUND: string = '#000';
const COLOR_LEFT_LASER = '#124AE0';
const COLOR_RIGHT_LASER = '#E01212';
const COLOR_WALL = '#FFF';
const COLOR_SCORE = '#FFF';
const LASER_WIDTH = 3;
const LASER_LENGTH = 3;
const LASER_SPEED = 1; //smaller is faster
const LASER_ALLOWED_DISTANCE = 150;
const TANK_SPEED = 5;

/* --------------------------------- ENTITIES ------------------------------- */
class Tank extends GameObject {
  public tankSize: number = 32;
  public laser: Laser;
  private tank: string;
  private rotateDegrees: number;
  private blueTank =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAGdJREFUWEdjZEADQl4P/qOLUYP/bpsCIzZzMARHHTAaAgMeAoRSPLEOxJXq0c3HmjXwOWLUAaMhMBoCQyYECJUnMHmalQOjDhjwEBitC0ZDYDQEhm4IEFvZEFvQwNSN9oxGQ2DQhgAAHz15DYWEygkAAAAASUVORK5CYII=';

  private redTank =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAGdJREFUWEdjZEADD4SE/qOLUYOv8O4dIzZzMARHHTAaAgMeAoRSPLEOxJXq0c3HmjXwOWLUAaMhMBoCQyYECJUnMHmalQOjDhjwEBitC0ZDYDQEhm4IEFvZEFvQwNSN9oxGQ2DQhgAAl3Z4LekCecUAAAAASUVORK5CYII=';

  constructor(_position) {
    if (_position == 'LEFT') {
      super(new LeftTankController());
      this.laser = new Laser(_position);
      this.tank = this.blueTank;
      this.y = canvas.height - canvas.height / 2;
      this.x = 0;
      this.rotateDegrees = 0;
    } else {
      super(new RightTankController());
      this.laser = new Laser(_position);
      this.tank = this.redTank;
      this.y = canvas.height - canvas.height / 2;
      this.x = canvas.width - this.tankSize;
      this.rotateDegrees = 180;
    }
    this.width = this.tankSize;
    this.height = this.tankSize;
  }

  update() {
    super.update();

    if (this.command == 'DOWN') {
      var angleRad = this.rotateDegrees * (Math.PI / 180); //angle in radians
      this.x = this.x - TANK_SPEED * Math.cos(angleRad);
      this.y = this.y - TANK_SPEED * Math.sin(angleRad);
    } else if (this.command == 'UP') {
      var angleRad = this.rotateDegrees * (Math.PI / 180); //angle in radians
      this.x = this.x + TANK_SPEED * Math.cos(angleRad);
      this.y = this.y + TANK_SPEED * Math.sin(angleRad);
    } else if (this.command == 'LEFT') {
      this.rotateDegrees -= 30;
      if (this.rotateDegrees == 360) {
        this.rotateDegrees = 0;
      }
    } else if (this.command == 'RIGHT') {
      this.rotateDegrees += 30;
      if (this.rotateDegrees == 360) {
        this.rotateDegrees = 0;
      }
    } else if (this.command == 'FIRE') {
      this.fire();
    }

    this.laser.update();
  }

  render() {
    super.render();
    this.laser.render();

    let myImage = new Image();
    myImage.src = this.tank;
    if (this.rotateDegrees != 0) {
      ctx.save();
      ctx.translate(this.x + this.tankSize / 2, this.y + this.tankSize / 2);
      ctx.rotate(this.rotateDegrees * (Math.PI / 180));
      ctx.drawImage(
        myImage,
        -this.tankSize / 2,
        -this.tankSize / 2,
        this.tankSize,
        this.tankSize
      );
      ctx.rotate(-this.rotateDegrees * (Math.PI / 180));
      ctx.restore();
    } else {
      ctx.drawImage(myImage, this.x, this.y, this.tankSize, this.tankSize);
    }
  }

  fire() {
    this.laser.fire(
      this.x + this.tankSize / 2,
      this.y + this.tankSize / 2,
      this.rotateDegrees
    );
  }
}

class Laser extends GameObject {
  public x: number = 0;
  public y: number = -LASER_LENGTH; //not visible
  private dx: number;
  private dy: number;
  private distance: number = 0;
  private timerId: number;
  private color: string;

  constructor(_position) {
    super();
    if (_position == 'LEFT') {
      this.color = COLOR_LEFT_LASER;
    } else {
      this.color = COLOR_RIGHT_LASER;
    }
    this.x = 0;
    this.y = 0;
    this.width = LASER_WIDTH;
    this.height = LASER_LENGTH;
  }

  update() {
    super.update();

    if (this.timerId && this.x < 0) {
      clearInterval(this.timerId);
    }
  }

  render() {
    super.render();

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, LASER_WIDTH, LASER_LENGTH);
  }

  fire(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.distance = 0;
    let rads = angle * (Math.PI / 180);
    this.dx = LASER_SPEED * Math.cos(rads);
    this.dy = LASER_SPEED * Math.sin(rads);
    let initial_x = this.x;
    let initial_y = this.y;
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (this.distance < LASER_ALLOWED_DISTANCE) {
        this.x = this.x + this.dx;
        this.y = this.y + this.dy;
        let diff_x = this.x - initial_x;
        let diff_y = this.y - initial_y;
        this.distance = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
      } else {
        this.reset();
      }
    }, LASER_SPEED);
  }

  reset() {
    this.x = -LASER_WIDTH;
    this.y = -LASER_LENGTH;
    this.distance = 0;
  }
}

class Walls extends GameObject {
  constructor() {
    super();
  }

  update() {
    super.update();
  }

  render() {
    super.render();

    ctx.fillStyle = COLOR_WALL;
    ctx.fillRect(100, 150, 10, 100);
    ctx.fillRect(300, 150, 10, 100);
  }
}

class Score extends GameObject {
  private leftScore: number = 0;
  private rightScore: number = 0;

  constructor() {
    super();
  }

  update() {
    super.update();
  }

  render() {
    super.render();

    let leftPosition = canvas.width / 8;
    let rightPosition = canvas.width - canvas.width / 4;
    ctx.fillStyle = COLOR_SCORE;
    ctx.font = '48px Verdana';
    ctx.fillText(String(this.leftScore), leftPosition, 50);
    ctx.fillText(String(this.rightScore), rightPosition, 50);
  }

  incrementLeft() {
    this.leftScore += 1;
  }

  incrementRight() {
    this.rightScore += 1;
  }
}

/* ------------------------------- InputController  -------------------------- */

class RightTankController extends InputController {
  private command: string;

  constructor() {
    super();

    document.addEventListener(
      'keydown',
      (evt) => {
        if (evt.key == 'ArrowLeft') {
          this.command = 'LEFT';
        } else if (evt.key == 'ArrowRight') {
          this.command = 'RIGHT';
        } else if (evt.key == 'ArrowUp') {
          this.command = 'UP';
        } else if (evt.key == 'ArrowDown') {
          this.command = 'DOWN';
        } else if (evt.key == 'Enter') {
          this.command = 'FIRE';
        }
      },
      false
    );
  }

  update(gameObject: GameObject) {
    gameObject.command = this.command;
    this.command = null;
  }
}

class LeftTankController extends InputController {
  private command: string;

  constructor() {
    super();

    document.addEventListener(
      'keydown',
      (evt) => {
        if (evt.key == 'a') {
          this.command = 'LEFT';
        } else if (evt.key == 'd') {
          this.command = 'RIGHT';
        } else if (evt.key == 'w') {
          this.command = 'UP';
        } else if (evt.key == 's') {
          this.command = 'DOWN';
        } else if (evt.key == ' ') {
          this.command = 'FIRE';
        }
      },
      false
    );
  }

  update(gameObject: GameObject) {
    gameObject.command = this.command;
    this.command = null;
  }
}

/* ----------------------------------- SCENE --------------------------------- */
class MainLevel extends Scene {
  private playerOneTank: Tank;
  private playerTwoTank: Tank;
  private score: Score;
  private walls: Walls;

  constructor() {
    super();
  }

  create() {
    this.playerOneTank = new Tank('LEFT');
    this.add(this.playerOneTank);

    this.playerTwoTank = new Tank('RIGHT');
    this.add(this.playerTwoTank);

    this.score = new Score();
    this.add(this.score);

    this.walls = new Walls();
    this.add(this.walls);

    this.physics.onCollide(
      this.playerOneTank.laser,
      this.playerTwoTank,
      this.onTankTwoHit,
      this
    );

    this.physics.onCollide(
      this.playerTwoTank.laser,
      this.playerOneTank,
      this.onTankOneHit,
      this
    );
  }

  update() {
    super.update();
  }

  render() {
    super.render();
  }

  onTankOneHit() {
    this.playerOneTank.laser.reset();
    this.score.incrementRight();
  }

  onTankTwoHit() {
    this.playerTwoTank.laser.reset();
    this.score.incrementLeft();
  }
}

/* -------------------------------------------------------------------------- */
/*                                RUN GAME.                                   */
/* -------------------------------------------------------------------------- */
let mainLevel = new MainLevel();
let game = new Game(mainLevel);
