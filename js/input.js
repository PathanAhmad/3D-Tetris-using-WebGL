import { showGrid } from './renderer.js'
import { cam } from './camera.js'
import { GRID_W, GRID_H } from './constants.js'
import { tryStepDown , current , moveCurrent , rotateCurrent , spawn , board , boardColor , idx , lock } from './gameState.js'
import { pickShade } from './renderer.js'

// Here I keep track of which keys are pressed
export const keys = new Set( )

let mouseDown = false
let lastX = 0
let lastY = 0
let modeNow = 'basic'
let paused = false
let useCylinder = false
export { paused }
export { useCylinder }
export function setPaused( v ) {
    paused = v
}
export function getPaused() {
    return paused
}

// I handle all the keyboard controls here
window.addEventListener( 'keydown' , function ( e ) {
    keys.add( e.key )
    // Here I move and rotate the piece, and do all the controls
    if ( e.key === 'ArrowLeft' || e.key === 'a' ) {
        moveCurrent( -1 , 0 , 0 )
    }
    if ( e.key === 'ArrowRight' || e.key === 'd' ) {
        moveCurrent( 1 , 0 , 0 )
    }
    if ( e.key === 'ArrowUp' || e.key === 'w' ) {
        moveCurrent( 0 , 0 , 1 )
    }
    if ( e.key === 'ArrowDown' || e.key === 's' ) {
        moveCurrent( 0 , 0 , -1 )
    }
    // Here I handle all the camera and game toggles
    if ( e.key === 'g' || e.key === 'j' || e.key === 'l' || e.key === 'i' || e.key === 'k' || e.key === 'u' || e.key === 'o' || e.key === 'v' || e.key === '+' || e.key === '-' || e.key === 'p' ) {
        e.preventDefault()
    }
    if ( e.key === 'g' ) {
        showGrid.value = !showGrid.value
    }
    if ( e.key === 'j' ) {
        cam.yaw = cam.yaw - ( Math.PI / 18 )
    }
    if ( e.key === 'l' ) {
        cam.yaw = cam.yaw + ( Math.PI / 18 )
    }
    if ( e.key === 'i' ) {
        cam.pitch = cam.pitch - ( Math.PI / 18 )
    }
    if ( e.key === 'k' ) {
        cam.pitch = cam.pitch + ( Math.PI / 18 )
    }
    if ( e.key === 'u' ) {
        cam.roll = cam.roll - ( Math.PI / 18 )
    }
    if ( e.key === 'o' ) {
        cam.roll = cam.roll + ( Math.PI / 18 )
    }
    if ( e.key === 'v' ) {
        // I switch between ortho and perspective here
        let margin = 1
        let gridSize = Math.max( GRID_W , GRID_H )
        if ( cam.mode === 'ortho' ) {
            cam.mode = 'persp'
            cam.zoom = ( gridSize / 2 + margin ) / Math.tan( Math.PI / 8 )
        } else {
            cam.mode = 'ortho'
            cam.zoom = gridSize / 2 + margin
        }
    }
    if ( e.key === '+' ) {
        cam.zoom = cam.zoom - 1
        if ( cam.zoom < 1 ) {
            cam.zoom = 1
        }
    }
    if ( e.key === '-' ) {
        cam.zoom = cam.zoom + 1
    }
    if ( e.key === ' ' ) {
        if ( current ) {
            // Here I do a hard drop here, kinda messy, but its working. I couldn't get the animation right, so its more like instant-teleportation
            let shape = current.shape || current.shape
            let px = current.pos[ 0 ]
            let py = current.pos[ 1 ]
            let pz = current.pos[ 2 ]
            let minDrop = GRID_H
            for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
                let x = px + shape[ i ][ 0 ]
                let y = py + shape[ i ][ 1 ]
                let z = pz + shape[ i ][ 2 ]
                let drop = 0
                for ( let yy = y - 1 ; yy >= 0 ; yy = yy - 1 ) {
                    let idxVal = board && board.length ? idx( x , yy , z ) : 0
                    let occupied = board[ idxVal ]
                    let isSelf = false
                    for ( let j = 0 ; j < shape.length ; j = j + 1 ) {
                        if ( px + shape[ j ][ 0 ] === x && py + shape[ j ][ 1 ] === yy && pz + shape[ j ][ 2 ] === z ) {
                            isSelf = true
                        }
                    }
                    if ( occupied && !isSelf ) {
                        break
                    }
                    drop = drop + 1
                }
                if ( drop < minDrop ) {
                    minDrop = drop
                }
            }
            current.pos[ 1 ] = current.pos[ 1 ] - minDrop
            console.log( 'Hard drop to Y:', current.pos[ 1 ] )
            lock()
        }
    }
    // Here I handle all the rotations
    if ( e.key === 'x' ) {
        rotateCurrent( 'x' )
    }
    if ( e.key === 'X' ) {
        rotateCurrent( 'x' )
        rotateCurrent( 'x' )
        rotateCurrent( 'x' )
    }
    if ( e.key === 'y' ) {
        rotateCurrent( 'y' )
    }
    if ( e.key === 'Y' ) {
        rotateCurrent( 'y' )
        rotateCurrent( 'y' )
        rotateCurrent( 'y' )
    }
    if ( e.key === 'z' ) {
        rotateCurrent( 'z' )
    }
    if ( e.key === 'Z' ) {
        rotateCurrent( 'z' )
        rotateCurrent( 'z' )
        rotateCurrent( 'z' )
    }
    if ( [ 'a', 'd', 'w', 's', 'x', 'X', 'y', 'Y', 'z', 'Z', ' ', 'd', 'f' ].includes( e.key ) ) {
        e.preventDefault()
    }
    if ( e.key === 'f' ) {
        // This is my toggle between shaders (Phong and Gouraud)
        if ( modeNow === 'gouraud' ) {
            pickShade( 'phong' )
            modeNow = 'phong'
        } else {
            pickShade( 'gouraud' )
            modeNow = 'gouraud'
        }
    }
    if ( e.key === 'p' ) {
        paused = !paused
    }
    if ( e.key === 'b' ) {
        // I flip between cubes and cylinders here
        useCylinder = !useCylinder
    }
    // This is so my camera doesn't flip out. I'm not sure if this is working as I need it to
    let maxPitch = Math.PI / 2 - 0.01
    if ( cam.pitch > maxPitch ) cam.pitch = maxPitch
    if ( cam.pitch < -maxPitch ) cam.pitch = -maxPitch
} )

// I just track which keys are up
window.addEventListener( 'keyup' , function ( e ) {
    keys.delete( e.key )
} )

// I handle mouse for dragging camera
window.addEventListener( 'mousedown' , function ( e ) {
    mouseDown = true
    lastX = e.clientX
    lastY = e.clientY
} )

window.addEventListener( 'mouseup' , function ( e ) {
    mouseDown = false
} )

window.addEventListener( 'mousemove' , function ( e ) {
    if ( mouseDown ) {
        let dx = e.clientX - lastX
        let dy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY

        // This is to rotate camera yaw by dragging left/right
        let step = Math.PI / 180
        if ( dx > 0 ) {
            cam.yaw = cam.yaw + step * Math.abs( dx )
        }
        if ( dx < 0 ) {
            cam.yaw = cam.yaw - step * Math.abs( dx )
        }
    }
} )

window.addEventListener( 'wheel' , function ( e ) {
} ) 