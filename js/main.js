import './constants.js'
import { resizeCanvas } from './utils.js'
import { showGrid , makeBoxesSetup , mainDraw , makeLinesSetup } from './renderer.js'
import { cam } from './camera.js'
import './input.js'
import { spawn , tryStepDown , flyingBlocks , startFlyingBlocks , processExplosionsLoop , updateFloatY , current , board , idx } from './gameState.js'
import { GRAVITY_MS } from './constants.js'
import { setPaused, getPaused } from './input.js'
import { updateExplosions , explodingBlocks } from './explosion.js'
import { finishExplosions } from './gameState.js'

// I get the canvas and WebGL ready
const canvas = document.getElementById( 'glcanvas' )

const gl = canvas.getContext( 'webgl2' , { antialias: true , depth: true , alpha: false } )

if ( !canvas ) console.error( 'Canvas not found' )
if ( !gl ) console.error( 'WebGL2 context not found' )

if ( gl ) {
  gl.clearColor( 0 , 0 , 0 , 1 )
  gl.enable( gl.DEPTH_TEST )
  gl.disable( gl.BLEND )
}

const gameoverModal = document.getElementById( 'gameover-modal' )
const restartBtn = document.getElementById( 'restart-btn' )

// I show or hide the game over screen
function showGameOver() {
    if ( gameoverModal ) {
        gameoverModal.style.display = 'flex'
    }
}

function hideGameOver() {
    if ( gameoverModal ) {
        gameoverModal.style.display = 'none'
    }
}

if ( restartBtn ) {
    restartBtn.addEventListener( 'click' , function() {
        hideGameOver()
        window.location.reload()
    } )
}

// I start the game and set up everything
(async function() {
  // console.log( 'ok, setup works' )
  resizeCanvas( canvas )
  makeLinesSetup( gl )
  await makeBoxesSetup( gl )
  spawn()
  // console.log( 'draw first works' )
  cam.update()
  mainDraw( gl , cam , showGrid.value )
  window.onresize = ( ) => resizeCanvas( canvas )

  let fallClock = 0
  let last = 0
  let lastFlyingCount = 0
  let gravityPerMs = 1.0 / GRAVITY_MS

  // This is my main game loop
  function frame( now ) {
    // console.log( 'frame running' )
    let dt = now - last
    last = now
    // I move the piece down smoothly if not paused
    if ( !getPaused() ) {
      if ( current ) {
        // console.log( 'falling works?' , current.floatY )
        if ( typeof current.floatY !== 'number' ) {
          current.floatY = current.pos[ 1 ]
        }
        let dy = -gravityPerMs * dt
        updateFloatY( dy )
        // I check if the piece should lock (if it would overlap the board at the next int position)
        let shape = current.shape || current.shape
        let px = current.pos[ 0 ]
        let py = current.floatY
        let pz = current.pos[ 2 ]
        let landed = false
        for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
          let x = px + shape[ i ][ 0 ]
          let y = py + shape[ i ][ 1 ]
          let z = pz + shape[ i ][ 2 ]
          let yBelow = Math.floor( y - 0.01 )
          if ( yBelow < 0 ) {
            landed = true
          } else {
            let idxVal = idx( x , yBelow , z )
            if ( board[ idxVal ] ) {
              landed = true
            }
          }
        }
        if ( landed ) {
          // console.log( 'landed, locking' )
          current.pos[ 1 ] = Math.round( current.floatY )
          updateFloatY( 0 )
          tryStepDown()
        }
      }
    }
    // I update explosions and flying blocks, but this is too buggy and I spent way wayy too much time trying to fix this and I have other exams, so I'm sorry for this one
    updateExplosions()
    if ( explodingBlocks.length > 0 && flyingBlocks.length === 0 ) {
      startFlyingBlocks()
    }
    if ( flyingBlocks.length > 0 ) {
      for ( let i = 0 ; i < flyingBlocks.length ; i = i + 1 ) {
        flyingBlocks[ i ].x = flyingBlocks[ i ].x + flyingBlocks[ i ].vx
        flyingBlocks[ i ].y = flyingBlocks[ i ].y + flyingBlocks[ i ].vy
        flyingBlocks[ i ].z = flyingBlocks[ i ].z + flyingBlocks[ i ].vz
      }
    }
    // I finish explosions and reset if needed
    if ( explodingBlocks.length === 0 && flyingBlocks.length === 0 && lastFlyingCount > 0 ) {
      setPaused( false )
      finishExplosions()
      processExplosionsLoop()
    }
    lastFlyingCount = flyingBlocks.length
    // I update camera and draw everything
    cam.update()
    mainDraw( gl , cam , showGrid.value )
    processExplosionsLoop()
    // I check for game over
    if ( typeof current !== 'undefined' && current === null ) {
        showGameOver()
        return
    }
    // I keep the game running
    requestAnimationFrame( frame )
  }

  // I start the main loop
  requestAnimationFrame( frame )
})() 