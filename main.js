var startRender = 0, audio = 0, holdTimer = 0;
var initialX, initialY, initialTime, touchClicked = 0;
var keyState = {};
function initRender(){
  if (startRender == 0){
    startRender = 1;
    update();
  }
}
Module.ready.then(api => initRender()).catch(e => console.error('💩', e))

const mainGame = document.getElementById("mainGame");
const contextMainGame = mainGame.getContext('2d', { willReadFrequently: true });
const statsGame = document.getElementById("statsGame");
const contextStatsGame = statsGame.getContext('2d', { willReadFrequently: true });
const gameBoard = document.getElementById("gameBoard");
const contextGameBoard = gameBoard.getContext('2d', { willReadFrequently: true });
mainGame.style.display="none";
statsGame.style.display="none";
gameBoard.style.display="none";

var BLOCK_SIZE = 35, BLOCK_SIZE_STATS = BLOCK_SIZE - 15.1;
const wHeight = window.screen.height;
const wWidth = window.screen.width;
if (wHeight < 700){
  BLOCK_SIZE = 20;
  BLOCK_SIZE_STATS = BLOCK_SIZE - 8.6;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const SEPARATOR_IMG = 4;

mainGame.width = BLOCK_SIZE * BOARD_WIDTH;
mainGame.height = BLOCK_SIZE * BOARD_HEIGHT;
statsGame.width = BLOCK_SIZE_STATS * 4;
statsGame.height = BLOCK_SIZE * BOARD_HEIGHT;
gameBoard.width = mainGame.width + statsGame.width + SEPARATOR_IMG;
gameBoard.height = mainGame.height;

contextMainGame.scale(BLOCK_SIZE, BLOCK_SIZE);
contextStatsGame.scale(BLOCK_SIZE_STATS, BLOCK_SIZE_STATS);
contextGameBoard.scale(BLOCK_SIZE, BLOCK_SIZE);

function processKeys(){
    // 119 hardDrop, 97 <-, 100 ->, 115 v, 114 hold, 101 rotate clkw, 113 rotate aclkw
    if (keyState['ArrowLeft'])
      Module.ccall("ManipulateCurrent", null, ['number'], [97],);
    if (keyState['ArrowRight'])
      Module.ccall("ManipulateCurrent", null, ['number'], [100],);
    if (keyState['ArrowUp']){
      Module.ccall("ManipulateCurrent", null, ['number'], [101],); 
      keyState['ArrowUp'] = false;
    }
    if (keyState['ArrowDown'])
      Module.ccall("ManipulateCurrent", null, ['number'], [115],);
    if (keyState['Space']){
      Module.ccall("ManipulateCurrent", null, ['number'], [119],);
      keyState['Space'] = false
    }
    if (keyState['KeyC'] || keyState['Keyc'] || keyState['Shift']){
      Module.ccall("ManipulateCurrent", null, ['number'], [114],);
      keyState['KeyC'] = false;
      keyState['Keyc'] = false;
    }
    if (keyState['KeyZ'] || keyState['Keyz']){
      Module.ccall("ManipulateCurrent", null, ['number'], [113],);
      keyState['KeyZ'] = false;
      keyState['Keyz'] = false;
    }
    if (audio == 0){
        audio = 1;
        soundManager.url = '/';
        soundManager.onready(function() {
            let sm2 = soundManager.createSound({
                id: 'TETRIS_THEME',
                url: './Tetris.mp3'
            });
    
            audio = 1;
            // ...and play it
            if (sm2.instanceCount < 1)
              soundManager.play('TETRIS_THEME', { loops: Infinity });
            audio = 1;
          });
      }  
}

let dropCounter = 0;
let deltaKey = 0
let lastTime = 0;
function update(time = 0){
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  deltaKey += deltaTime; 
  let score = Module.ccall("getScore", 'number', null, null,);
  if (Module.ccall("getGameOn", 'number', null, null,) != 0){
    if (deltaKey > 50){
      processKeys();
      deltaKey = 0;
    }
    if (dropCounter > 1000 - (score/100)*20){
      Module.ccall("ManipulateCurrent", null, ['number'], [115],);
      dropCounter = 0;
    }
//    let scoreField = document.getElementById('fieldScore');
//    scoreField.innerHTML = 'Score: ';
    draw();
    convertCanvasToImg();
// Style your image here
    window.requestAnimationFrame(update);
    } else {
    alert('Your score was '+score);
    location.href = location.href;
  }
}
function drawBorder(context, xPos, yPos, width, height, fillerBorder = '#000', thickness = 0.05) {
  context.fillStyle = fillerBorder;
  context.fillRect(xPos - (thickness), yPos - (thickness), width + (thickness * 2), height + (thickness * 2));
}
function draw(){
  const mainGame = document.getElementById("mainGame");
  const contextMainGame = mainGame.getContext('2d', { willReadFrequently: true });
  contextMainGame.fillStyle = '#000';
  contextMainGame.fillRect(0, 0, mainGame.width, mainGame.height);
  const statsGame = document.getElementById("statsGame");
  const contextStatsGame = statsGame.getContext('2d', { willReadFrequently: true });
  contextStatsGame.fillStyle = '#000';
  contextStatsGame.fillRect(0, 0, statsGame.width, statsGame.height);
  contextStatsGame.canvas.hidden = true;
  contextMainGame.canvas.hidden = true;
  contextGameBoard.canvas.hidden = true;

  let arr = Module.ccall("getBuffer", Uint8Array, null, null,);
  arr = Module.HEAPU8.subarray(arr, arr + (BOARD_WIDTH * BOARD_HEIGHT) -0);
  arr.forEach((value, x) => {
    let filler = 'gray', fillerBorder = '#000';
    switch (value){
      case 71: filler = 'green';
        break;
      case 82: filler = 'red';
        break;
      case 80: filler = 'pink';
        break;
      case 79: filler = 'orange';
        break;
      case 66: filler = 'blue';
        break;
      case 89: filler = 'yellow';
        break;
      case 67: filler = 'cyan';
        break;
      case 103: fillerBorder = 'green';
        break;
      case 114: fillerBorder = 'red';
        break;
      case 112: fillerBorder = 'pink';
        break;
      case 111: fillerBorder = 'orange';
        break;
      case 98: fillerBorder = 'blue';
        break;
      case 121: fillerBorder = 'yellow';
        break;
      case 99: fillerBorder = 'cyan';
        break;
      case 46: filler = 'black';
        break;
    }
    let px = x % BOARD_WIDTH;
    let py = (x-px) / BOARD_WIDTH;
    if (fillerBorder == '#000'){
      drawBorder(contextMainGame, px, py, 1, 1, fillerBorder)
      contextMainGame.fillStyle = filler;
    } else {
      drawBorder(contextMainGame, px, py, 1, 1, fillerBorder)
      contextMainGame.fillStyle = '#EEE';
    } 
    contextMainGame.fillRect(px, py, 1, 1);
  });
  arr = Module.ccall("getNextPzBuffer", Uint8Array, null, null,);
  arr = Module.HEAPU8.subarray(arr, arr + (6 * 4 * 4) -0);
  let lastIndex = 0;
  arr.forEach((value, x) => {
    let filler = 'black', fillerBorder = '#000';
    switch (value){
      case 71: filler = 'green';
        break;
      case 82: filler = 'red';
        break;
      case 80: filler = 'pink';
        break;
      case 79: filler = 'orange';
        break;
      case 66: filler = 'blue';
        break;
      case 89: filler = 'yellow';
        break;
      case 67: filler = 'cyan';
        break;
      case 46: filler = 'black';
        break;
    }
    let px = x % 4;
    let py = (x-px) / 4;
    drawBorder(contextStatsGame, px, py, 1, 1, fillerBorder)
    contextStatsGame.fillStyle = filler;
    contextStatsGame.fillRect(px, py, 1, 1);
    lastIndex = x;
  });
  lastIndex = lastIndex + 1;
  arr = Module.ccall("getHoldPiece", Uint8Array, null, null,);
  arr = Module.HEAPU8.subarray(arr, arr + (4 * 4) -0);
  arr.forEach((value, x) => {
    let filler = '#555', fillerBorder = '#000';
    switch (value){
      case 71: filler = 'green';
        break;
      case 82: filler = 'red';
        break;
      case 80: filler = 'pink';
        break;
      case 79: filler = 'orange';
        break;
      case 66: filler = 'blue';
        break;
      case 89: filler = 'yellow';
        break;
      case 67: filler = 'cyan';
        break;
      case 46: filler = 'black';
        break;
    }
    let px = (lastIndex + x) % 4;
    let py = (lastIndex + x - px) / 4;
    drawBorder(contextStatsGame, px, py, 1, 1, fillerBorder)
    contextStatsGame.fillStyle = filler;
    contextStatsGame.fillRect(px, py, 1, 1);
  });
  contextStatsGame.fillStyle = '#FFF';
  contextStatsGame.fillText(Module.ccall("getScore", 'number', null, null,), 0, 35, 4);
}

function convertCanvasToImg(){
  const mainImgData = contextMainGame.getImageData(0, 0, mainGame.width, mainGame.height);
  const statsImgData = contextStatsGame.getImageData(0, 0, statsGame.width, statsGame.height);
  let mainImgD = mainImgData.data;
  let statsImgD = statsImgData.data;
  const newImg = contextGameBoard.getImageData(0, 0, gameBoard.width, gameBoard.height).data;
  let iNewImg = 0, jNewImg = 0;
  for (let x = 0; x < mainGame.width * mainGame.height * 4; x = x + 4, iNewImg = iNewImg + 4) {
    if (x > 0 && x % (mainGame.width*4) == 0){ //Every WIDTH*4 copy a row of stats
      for (let j = 0; j < SEPARATOR_IMG * 4; j=j+4){
        newImg[iNewImg] = 200;
        newImg[iNewImg+1] = 200;
        newImg[iNewImg+2] = 200;
        newImg[iNewImg+3] = 200;
        iNewImg = iNewImg + 4;
      }
      for (let j = 0; j < statsGame.width * 4; j = j + 4, jNewImg = jNewImg + 4){
        newImg[iNewImg] = statsImgD[jNewImg];
        newImg[iNewImg+1] = statsImgD[jNewImg+1];
        newImg[iNewImg+2] = statsImgD[jNewImg+2];
        newImg[iNewImg+3] = statsImgD[jNewImg+3];
        iNewImg = iNewImg + 4;
      }
    }
    newImg[iNewImg] = mainImgD[x];
    newImg[iNewImg+1] = mainImgD[x+1];
    newImg[iNewImg+2] = mainImgD[x+2];
    newImg[iNewImg+3] = mainImgD[x+3];
  }
  contextGameBoard.putImageData(new ImageData(newImg, gameBoard.width, gameBoard.height,mainImgData.settings), 0, 0);
  dataUrl = gameBoard.toDataURL(),
  imageFoo = document.getElementById('clientGame');
  imageFoo.src = dataUrl;
}

document.addEventListener('keydown', event => {
  event.preventDefault();
  keyState[event.code || event.which] = true;
});
document.addEventListener('keyup', event => {
  event.preventDefault();
  if (event.code != 'Space')
    keyState[event.code || event.which] = false;
});

function touchClick(e){
  if (audio == 0){
    audio = 1;
    soundManager.url = '/';
    soundManager.onready(function() {
        let sm2 = soundManager.createSound({
            id: 'TETRIS_THEME',
            url: './Tetris.mp3'
        });

        audio = 1;
        // ...and play it
        if (sm2.instanceCount < 1)
          soundManager.play('TETRIS_THEME', { loops: Infinity });
	audio = 1;
      });
  }
  initialX = e.touches[0].clientX;
  initialY = e.touches[0].clientY;
  initialTime = new Date();
  if (touchClicked == 1)
    touchClicked = 2;
  else
    touchClicked = 1;
    e.preventDefault();
  }

function touchClickEnd(e){
  if (touchClicked > 1 ){
    Module.ccall("ManipulateCurrent", null, ['number'], [114],);
    touchClicked = 0;
    clearTimeout(holdTimer); holdTimer = 0;
  } else if (touchClicked > -1){
    if (holdTimer == 0) {
      holdTimer = setTimeout( function() { 
      if (touchClicked == 1){
        Module.ccall("ManipulateCurrent", null, ['number'], [101],);
        touchClicked = 0; } clearTimeout(holdTimer); holdTimer = 0; 
        }, 250 );
      }
  }
  e.preventDefault();
}

function touchMove(e){
  var deltaX = e.changedTouches[0].clientX - initialX;
  var deltaY = e.changedTouches[0].clientY - initialY;
  var deltaTime = new Date() - initialTime;
  touchClicked = -1;

  if (deltaX <= -20 && deltaTime <= 500) {
    Module.ccall("ManipulateCurrent", null, ['number'], [97],);
    initialX = e.changedTouches[0].clientX;
  } else if (deltaX >= 20 && deltaTime <= 500) {
    Module.ccall("ManipulateCurrent", null, ['number'], [100],);
    initialX = e.changedTouches[0].clientX;
  }
  if (deltaY <= -250 && deltaTime <= 500){
    Module.ccall("ManipulateCurrent", null, ['number'], [119],);
    initialY = e.changedTouches[0].clientY;
  } else if (deltaY >= 50 && deltaTime <= 500){
    Module.ccall("ManipulateCurrent", null, ['number'], [115],);
    initialY = e.changedTouches[0].clientY;
  }

}
