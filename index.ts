import * as nipplejs from 'nipplejs';

// Import stylesheets
import './style.css';

/* -------------------------------------------------------------------------- */
/*                                MINI FRAMEWORK.                             */
/* -------------------------------------------------------------------------- */

// boiler plate setup the canvas for the game
var canvas = <HTMLCanvasElement>document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.setAttribute('tabindex', '1');
canvas.style.outline = '4px solid #F39F54';
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

class Group {
  public x: number;
  public y: number;
  public children: Array<GameObject>;

  constructor() {
    this.children = [];
  }

  update() {
    for (let gameObject of this.children) {
      if (gameObject) gameObject.update();
    }
  }

  render() {
    for (let gameObject of this.children) {
      if (gameObject) gameObject.render();
    }
  }
}

class Physics {
  private gameObjectCollisionRegister: Array<any> = [];
  private wallCollisionRegister: Array<any> = [];
  private objectA: GameObject;
  private objectB: GameObject;

  constructor() {}

  onCollide(
    objectA: GameObject,
    objectB: Group,
    callback: Function,
    scope: any
  ): void;
  onCollide(
    objectA: GameObject,
    objectB: GameObject,
    callback: Function,
    scope: any
  ): void;
  onCollide(
    objectA: GameObject,
    objectB: GameObject | Group,
    callback: Function,
    scope: any
  ): void {
    if (objectA && objectB) {
      if ('children' in objectB) {
        for (let gameObject of objectB.children) {
          this.gameObjectCollisionRegister.push({
            objectA: objectA,
            objectB: gameObject,
            callback: callback,
            scope: scope,
          });
        }
      } else {
        this.gameObjectCollisionRegister.push({
          objectA: objectA,
          objectB: objectB,
          callback: callback,
          scope: scope,
        });
      }
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
        collisionEntry.objectA.x <
          collisionEntry.objectB.x + collisionEntry.objectB.width &&
        collisionEntry.objectA.x + collisionEntry.objectA.width >
          collisionEntry.objectB.x &&
        collisionEntry.objectA.y <
          collisionEntry.objectB.y + collisionEntry.objectB.height &&
        collisionEntry.objectA.y + collisionEntry.objectA.height >
          collisionEntry.objectB.y
      ) {
        collisionEntry.callback.apply(collisionEntry.scope, [
          collisionEntry.objectA,
          collisionEntry.objectB,
        ]);
      }
    }
    for (let wallCollisionEntry of this.wallCollisionRegister) {
      if (
        wallCollisionEntry.objectA.y < 0 ||
        wallCollisionEntry.objectA.y + wallCollisionEntry.objectA.height >
          canvas.height ||
        wallCollisionEntry.objectA.x < 0 ||
        wallCollisionEntry.objectA.x + wallCollisionEntry.objectA.width >=
          canvas.width
      ) {
        wallCollisionEntry.callback.bind(wallCollisionEntry.scope).apply();
      }
    }
  }
}

class Scene {
  public children: Array<GameObject>;
  public groups: Array<Group>;
  public physics: Physics;

  constructor() {
    this.children = [];
    this.groups = [];
    this.physics = new Physics();
  }

  add(object: Group): void;
  add(object: GameObject): void;
  add(object: GameObject | Group): void {
    if ('children' in object) {
      for (let gameObject of object.children) {
        this.children.push(gameObject);
      }
      this.groups.push(object);
    } else {
      this.children.push(object);
    }
  }

  create() {}

  update() {
    for (let gameObject of this.children) {
      if (gameObject) gameObject.update();
    }
    for (let group of this.groups) {
      if (group) group.update();
    }
    this.physics.update();
  }

  render() {
    // update the game background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let gameObject of this.children) {
      if (gameObject) gameObject.render();
    }
    for (let group of this.groups) {
      if (group) group.render();
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
const COLOR_BACKGROUND: string = '#B2BF50';
const COLOR_LEFT_LASER = '#124AE0';
const COLOR_RIGHT_LASER = '#E01212';
const COLOR_WALL = '#F39F54';
const COLOR_LEFT_SCORE = '#124AE0';
const COLOR_RIGHT_SCORE = '#E01212';
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
  private stop: number = 1;
  private rotateDegrees: number;
  public prevX: number;
  public prevY: number;
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
      this.x = 10;
      this.rotateDegrees = 0;
    } else {
      super(new RightTankController());
      this.laser = new Laser(_position);
      this.tank = this.redTank;
      this.y = canvas.height - canvas.height / 2;
      this.x = canvas.width - this.tankSize - 10;
      this.rotateDegrees = 180;
    }
    this.width = this.tankSize;
    this.height = this.tankSize;
  }

  update() {
    super.update();

    if (this.command == 'DOWN') {
      var angleRad = this.rotateDegrees * (Math.PI / 180); //angle in radians
      this.prevX = this.x;
      this.prevY = this.y;
      this.x = this.x - TANK_SPEED * Math.cos(angleRad) * this.stop;
      this.y = this.y - TANK_SPEED * Math.sin(angleRad) * this.stop;
    } else if (this.command == 'UP') {
      var angleRad = this.rotateDegrees * (Math.PI / 180); //angle in radians
      this.prevX = this.x;
      this.prevY = this.y;
      this.x = this.x + TANK_SPEED * Math.cos(angleRad) * this.stop;
      this.y = this.y + TANK_SPEED * Math.sin(angleRad) * this.stop;
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
    this.stop = 1;
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

  stopMoving() {
    this.stop = 0;
  }
}

class Laser extends GameObject {
  public x: number = -LASER_LENGTH;
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

class Wall extends GameObject {
  constructor(x: number, y: number, width: number, height: number) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update() {
    super.update();
  }

  render() {
    super.render();

    ctx.fillStyle = COLOR_WALL;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Walls extends Group {
  constructor() {
    super();
    this.children.push(new Wall(100, 150, 10, 100));
    this.children.push(new Wall(80, 150, 20, 10));
    this.children.push(new Wall(80, 240, 20, 10));
    this.children.push(new Wall(300, 150, 10, 100));
    this.children.push(new Wall(300, 150, 30, 10));
    this.children.push(new Wall(300, 250, 30, 10));

    this.children.push(new Wall(190, 190, 30, 30));

    this.children.push(new Wall(150, 100, 100, 10));
    this.children.push(new Wall(150, 300, 100, 10));
  }

  update() {
    super.update();
  }

  render() {
    super.render();
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

    ctx.font = '48px Verdana';
    ctx.fillStyle = COLOR_LEFT_SCORE;
    ctx.fillText(String(this.leftScore), leftPosition, 50);
    ctx.fillStyle = COLOR_RIGHT_SCORE;
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
  private turretIntervalId: number;
  private movementIntervalId: number;

  constructor() {
    super();

    let TIME_INTERVAL = 300;

    var turretOptions: any = {
      position: { top: '90%', left: '25%' },
      mode: 'static',
      color: 'blue',
      lockX: true,
      zone: document.getElementById('zone1'),
    };
    var turretManager = nipplejs.create(turretOptions);

    var movementOptions: any = {
      position: { top: '90%', left: '75%' },
      mode: 'static',
      color: 'blue',
      lockY: true,
      zone: document.getElementById('zone2'),
    };
    var movementManager = nipplejs.create(movementOptions);

    movementManager.on('dir:down', () => {
      clearInterval(this.movementIntervalId);
      this.movementIntervalId = setInterval(() => {
        this.command = 'DOWN';
      }, TIME_INTERVAL);
    });
    movementManager.on('dir:up', () => {
      clearInterval(this.movementIntervalId);
      this.movementIntervalId = setInterval(() => {
        this.command = 'UP';
      }, TIME_INTERVAL);
    });
    movementManager.on('end', () => {
      clearInterval(this.movementIntervalId);
    });
    turretManager.on('dir:left', () => {
      clearInterval(this.turretIntervalId);
      this.turretIntervalId = setInterval(() => {
        this.command = 'LEFT';
      }, TIME_INTERVAL);
    });
    turretManager.on('dir:right', () => {
      clearInterval(this.turretIntervalId);
      this.turretIntervalId = setInterval(() => {
        this.command = 'RIGHT';
      }, TIME_INTERVAL);
    });
    turretManager.on('end', () => {
      clearInterval(this.turretIntervalId);
    });

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

    this.physics.onCollide(
      this.playerOneTank.laser,
      this.walls,
      this.onPlayerOneLaserHitWall,
      this
    );

    this.physics.onCollide(
      this.playerTwoTank.laser,
      this.walls,
      this.onPlayerTwoLaserHitWall,
      this
    );

    this.physics.onCollide(
      this.playerOneTank,
      this.walls,
      this.onPlayerOneHitWall,
      this
    );

    this.physics.onCollide(
      this.playerTwoTank,
      this.walls,
      this.onPlayerTwoHitWall,
      this
    );

    this.physics.onCollide(
      this.playerOneTank,
      this.playerTwoTank,
      this.onPlayerHitWall,
      this
    );

    this.physics.onCollideWalls(
      this.playerOneTank,
      this.onPlayerOneHitWall,
      this
    );

    this.physics.onCollideWalls(
      this.playerTwoTank,
      this.onPlayerTwoHitWall,
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

  onPlayerOneLaserHitWall() {
    this.playerOneTank.laser.reset();
  }

  onPlayerTwoLaserHitWall() {
    this.playerTwoTank.laser.reset();
  }

  onPlayerOneHitWall() {
    this.playerOneTank.stopMoving();
    this.playerOneTank.x = this.playerOneTank.prevX;
    this.playerOneTank.y = this.playerOneTank.prevY;
  }

  onPlayerTwoHitWall() {
    this.playerTwoTank.stopMoving();
    this.playerTwoTank.x = this.playerTwoTank.prevX;
    this.playerTwoTank.y = this.playerTwoTank.prevY;
  }

  onPlayerHitWall() {
    this.playerOneTank.stopMoving();
    this.playerOneTank.x = this.playerOneTank.prevX;
    this.playerOneTank.y = this.playerOneTank.prevY;
    this.playerTwoTank.stopMoving();
    this.playerTwoTank.x = this.playerTwoTank.prevX;
    this.playerTwoTank.y = this.playerTwoTank.prevY;
  }
}

/* -------------------------------------------------------------------------- */
/*                                RUN GAME.                                   */
/* -------------------------------------------------------------------------- */
let mainLevel = new MainLevel();
let game = new Game(mainLevel);

/**
BUGS

- the bullet fired once gives person 8 points, not 1
 */
