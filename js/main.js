import './constants.js'
import { resizeCanvas } from './utils.js'
import { initGridBuffers , drawGrid , showGrid , initCubeBuffers , drawScene } from './renderer.js'
import { cam } from './camera.js'
import './input.js'
import { spawn , tryStepDown } from './gameState.js'
import { GRAVITY_MS } from './constants.js'

const canvas = document.getElementById( 'glcanvas' )
// console.log( 'canvas:' , canvas )

const gl = canvas.getContext( 'webgl2' , { antialias: true , depth: true } )
// console.log( 'gl:' , gl )

if ( !canvas ) console.error( 'Canvas not found' )
if ( !gl ) console.error( 'WebGL2 context not found' )

gl.clearColor( 0 , 0 , 0 , 1 )
gl.enable( gl.DEPTH_TEST )
gl.enable( gl.CULL_FACE )

resizeCanvas( canvas )

initGridBuffers( gl )
initCubeBuffers( gl )
spawn()

cam.update()
drawScene( gl , cam , showGrid.value )

window.onresize = ( ) => resizeCanvas( canvas )

let fallClock = 0
let last = 0
let paused = false

function frame( now ) {

    // console.log( 'frame' , now )

    let dt = now - last
    last = now

    if ( !paused ) {

        fallClock = fallClock + dt

        if ( fallClock > GRAVITY_MS ) {
            tryStepDown()
            fallClock = 0
        }

    }

    cam.update()
    drawScene( gl , cam , showGrid.value )

    requestAnimationFrame( frame )

}

requestAnimationFrame( frame ) 