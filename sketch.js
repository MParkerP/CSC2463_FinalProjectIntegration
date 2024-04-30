//variables
let backgroundImg;
let UFOStill;
let gameState = "menu";
let titleFont;
let playerUFO;
let floor, ceiling;

let isFLying = false;

let missileYPositions = [32, 80, 128, 192, 256, 320, 384, 430, 480];
let missiles = [];

let isMissileSpawning = false;
let missileLaunchDelay = 0;
let leftBound = -50;
let rightBound = 552;
let missileSpeed = 8;
let activeMissile;

let currentLives = 3;
let currentSurvivalTime = 0;

let menuMusic;
let gameMusic;
let rocketLaunchSound;
let UFO_FlySound;
let lossSound;
let explosionSound;

let menuMusicStarted = false;
let buffer; 
let lossSoundPlayed = false;

//class for missile 'enemy'
class Missile
{
  constructor(sheetPath, spawnX, spawnY)
  {
    this.xPos = spawnX; //off screen
    this.yPos = spawnY; //off screen
    this.sprite = new Sprite(this.xPos, this.yPos, 32, 32);
    this.sprite.spriteSheet = sheetPath;
    this.sprite.anis.frameDelay = 6;
    this.animations = {
      flying: {row: 0, frames: 4},
      explosion: {row: 0, col: 4, frames: 5}
    };
    this.sprite.addAnis(this.animations);
    this.sprite.changeAni('flying');
    this.sprite.rotationLock = true;
    this.sprite.collider = 'kinematic';
  }

  respawn()
  {
    this.sprite.velocity.x = 0;
    this.sprite.x = rightBound;
    this.sprite.changeAni('flying');
    if (gameState == "playing") { launchRandomMissile(); }
  }
}

class UFO
{
  constructor(sheetPath)
  {
    this.xPos = 1000; //off screen
    this.yPos = 1000; //off screen
    this.sprite = new Sprite(this.xPos, this.yPos, 32, 32);
    this.sprite.spriteSheet = sheetPath;
    this.sprite.anis.frameDelay = 3;
    this.animations = {
      idle: {row: 0, frames: 1},
      flying: {row: 0, col: 1, frames: 7}
    };
    this.sprite.addAnis(this.animations);
    this.sprite.changeAni('idle');
    this.sprite.rotationLock = true;
  }
}

function preload()
{
  backgroundImg = loadImage('assets/Background_Sprite.png');
  UFOStill = loadImage('assets/UFO_Sprite.png');
  titleFont = loadFont('assets/Jersey10-Regular.ttf');

  // buffer = new Tone.Buffer("assets/menu_music.mp3");
  // menuMusic = new Tone.Player("assets/menu_music.mp3").toDestination();

  gameMusic = new Tone.Player("assets/gameplay_music.mp3").toDestination();


  lossSound = new Tone.Player("assets/loss_sound.wav").toDestination();
  lossSound.volume.value = 15;

  explosionSound = new Tone.Player("assets/explosion_sound.wav").toDestination();

  UFO_FlySound = new Tone.Player("assets/UFO_Flying_Sound.mp3").toDestination();

  
  rocketLaunchSound = new Tone.Player("assets/rocket_launch_sound.mp3").toDestination();

}

function setup() 
{
  createCanvas(512, 512);
  playerUFO = new UFO('assets/UFO_Spritesheet.png');

  //make floor and ceiling to contain the player
  floor = new Sprite();
  floor.y = height + 30;
  floor.height = 0;
  floor.width = width;
  floor.collider = 'static';

  ceiling = new Sprite();
  ceiling.y = -10;
  ceiling.height = 0;
  ceiling.width = width;
  ceiling.collider = 'static';

  for (let i = 0; i < 9; i++)
  {
    spawnMissile(rightBound,missileYPositions[i]);
  }

   //menuMusic.loop = true;
   gameMusic.loop = true;
   UFO_FlySound.loop = true;
}

function keyPressed()
{
  //input handling for each gamestate
  if (gameState == "menu")
  {
    if (key == 's')
    {
      setupPlayerStart();
      gameState = "starting";
    }
  }

  if (gameState == "starting")
  {
    if (keyCode == 32)
    {
      startPlaying();
      gameState = "playing";
    }
  }

  if (gameState == "ending")
  {
    if (key == 'r')
    {
      gameState = "starting";
      world.gravity.y = 0;
      playerUFO.sprite.x = width/4;
      playerUFO.sprite.y = height/2;
      playerUFO.sprite.collider = 'dynamic';
      currentLives = 3;
      currentSurvivalTime = 0;
      gameMusic.start();
      lossSoundPlayed = false;
    }
  }
}

function launchRandomMissile()
{
  rocketLaunchSound.start();
  activeMissile = random(missiles);
  activeMissile.sprite.velocity.x = -missileSpeed;
}

function spawnMissile(x, y)
{
  let newMissile = new Missile('assets/Missile_Spritesheet.png',x,y);
  newMissile.sprite.scale.x *= 1;
  missiles.unshift(newMissile);
}

function setupPlayerStart()
{
  //setup player properly for game
  playerUFO.sprite.scale *= 3;
  playerUFO.sprite.x = width/4;
  playerUFO.sprite.y = height/2;
  
  //change music
  // menuMusic.stop();
  gameMusic.start();
}

function flyUp()
{
  playerUFO.sprite.changeAni('flying');
  playerUFO.sprite.velocity.y = -5;
}

function stopFlying()
{
  playerUFO.sprite.changeAni('idle');
}

function startPlaying()
{
  //setup gravity, start missles, start all score tracking
  world.gravity.y = 10;
  launchRandomMissile();
}

function resolveAfterHalfSecond() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
    }, 500);
  });
}

async function missileHit(missileIndex)
{
  missiles[missileIndex].sprite.velocity.x = 0;
  missiles[missileIndex].sprite.changeAni('explosion');
  missiles[missileIndex].sprite.scale *= 2;
  explosionSound.start();
  const result = await resolveAfterHalfSecond();
  missiles[missileIndex].respawn();
  missiles[missileIndex].sprite.scale *= 0.5;
  currentLives--;
}


function draw() 
{
  clear();

  //gamestate handling
  
  //MENU//
  if (gameState == "menu")
  {
    //background images
    background(77, 34, 87);
    imageMode(CENTER);
    image(UFOStill, width/2, height/2 - 100, 300,300);

    //title
    textAlign(CENTER,CENTER);
    textSize(100);
    textFont(titleFont);
    text("UFO ESCAPE", width/2, height/2);

    //instructions
    textSize(50);
    text("Press 'S' to START", width/2, height/2 + 75);

  }

  //STARTING//
  if (gameState == "starting")
  {
    //draw background image
    imageMode(CORNER);
    image(backgroundImg,0,0,512,512);
    
    textAlign(CENTER,CENTER);
    textSize(40);
    text("Press 'SPACE' to begin...", width/2, height/4 + 350);
  }

  //PLAYING//
  if (gameState == "playing")
  {
    //draw background image
    imageMode(CORNER);
    image(backgroundImg,0,0,512,512);

    if (kb.presses('space')) { UFO_FlySound.start(); }
    if (kb.released('space')) { UFO_FlySound.stop(); }

    if (kb.pressing('space'))
    {
      flyUp();
    }
    else
    {
      stopFlying();
    }

    //check if new missile needs to be spawned
    missiles.forEach(element => {
      if (element.sprite.x <= leftBound)
      {
        element.sprite.velocity.x = 0;
        element.sprite.x = rightBound;
        launchRandomMissile();  
      }
    });
  
    currentSurvivalTime += deltaTime/1000;
    missileSpeed += 0.001;

    if (playerUFO.sprite.overlaps(missiles[0].sprite)) { missileHit(0); }
    if (playerUFO.sprite.overlaps(missiles[1].sprite)) { missileHit(1); }
    if (playerUFO.sprite.overlaps(missiles[2].sprite)) { missileHit(2); }
    if (playerUFO.sprite.overlaps(missiles[3].sprite)) { missileHit(3); }
    if (playerUFO.sprite.overlaps(missiles[4].sprite)) { missileHit(4); }
    if (playerUFO.sprite.overlaps(missiles[5].sprite)) { missileHit(5); }
    if (playerUFO.sprite.overlaps(missiles[6].sprite)) { missileHit(6); }
    if (playerUFO.sprite.overlaps(missiles[7].sprite)) { missileHit(7); }
    if (playerUFO.sprite.overlaps(missiles[8].sprite)) { missileHit(8); }

    if (currentLives <= 0)
    {
      if (!lossSoundPlayed)
      {
        lossSound.start();
        lossSoundPlayed = true;
      }
      UFO_FlySound.stop();
      gameState = "ending";
      missiles.forEach(element => {
        element.respawn();
      });
      playerUFO.sprite.collider = 'none';
      playerUFO.sprite.velocity.y = 0;
      playerUFO.sprite.x = 1000; //off screen
      gameMusic.stop();
    }
  }

  if (gameState == "ending")
  {
    background(77, 34, 87);

    textAlign(CENTER,CENTER);
    textSize(100);
    textFont(titleFont);
    text("YOU LOST", width/2, height/4);

    //instructions
    textSize(50);
    text("Survival Time: " + ceil(currentSurvivalTime).toString() + "s", width/2, height/4 + 75);
    textSize(25);
    text("Press 'R' to try again!", width/2, height/4 + 150);
  }


  //for testing purposes
  textAlign(LEFT,CENTER);
  textSize(30);
  text(gameState,10,10);
  text("Lives: " + currentLives.toString(), 10, 40);
  text("Time: " + ceil(currentSurvivalTime).toString(), 10,70);
}