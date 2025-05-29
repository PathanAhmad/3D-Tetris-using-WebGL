import { showGrid } from './renderer.js'
import { cam } from './camera.js'
import { GRID_W, GRID_H } from './constants.js'
import { tryStepDown , current , moveCurrent , rotateCurrent , spawn , board } from './gameState.js'
import { setShadingMode , shadingMode } from './renderer.js'

export const keys = new Set( )

let mouseDown = false
let lastX = 0
let lastY = 0

window.addEventListener( 'keydown' , function ( e ) {

    keys.add( e.key )

    if ( e.key === 'ArrowLeft' ) {

        keys.add( 'a' )

    }

    if ( e.key === 'ArrowRight' ) {

        keys.add( 'd' )

    }

    if ( e.key === 'ArrowUp' ) {

        keys.add( 'w' )

    }

    if ( e.key === 'ArrowDown' ) {

        keys.add( 's' )

    }

    if ( e.key === 'g' || e.key === 'j' || e.key === 'l' || e.key === 'i' || e.key === 'k' || e.key === 'u' || e.key === 'o' || e.key === 'v' || e.key === '+' || e.key === '-' ) {
        e.preventDefault()
    }

    if ( e.key === 'g' ) {
        showGrid.value = !showGrid.value
        console.log( 'showGrid.value:' , showGrid.value )
    }

    if ( e.key === 'j' ) {
        cam.yaw = cam.yaw - ( Math.PI / 18 )
        console.log( 'cam.yaw:' , cam.yaw )
    }
    if ( e.key === 'l' ) {
        cam.yaw = cam.yaw + ( Math.PI / 18 )
        console.log( 'cam.yaw:' , cam.yaw )
    }
    if ( e.key === 'i' ) {
        cam.pitch = cam.pitch - ( Math.PI / 18 )
        console.log( 'cam.pitch:' , cam.pitch )
    }
    if ( e.key === 'k' ) {
        cam.pitch = cam.pitch + ( Math.PI / 18 )
        console.log( 'cam.pitch:' , cam.pitch )
    }
    if ( e.key === 'u' ) {
        cam.roll = cam.roll - ( Math.PI / 18 )
        console.log( 'cam.roll:' , cam.roll )
    }
    if ( e.key === 'o' ) {
        cam.roll = cam.roll + ( Math.PI / 18 )
        console.log( 'cam.roll:' , cam.roll )
    }
    if ( e.key === 'v' ) {
        let margin = 1
        let gridSize = Math.max( GRID_W , GRID_H )
        if ( cam.mode === 'ortho' ) {
            cam.mode = 'persp'
            cam.zoom = ( gridSize / 2 + margin ) / Math.tan( Math.PI / 8 )
        } else {
            cam.mode = 'ortho'
            cam.zoom = gridSize / 2 + margin
        }
        console.log( 'cam.mode:' , cam.mode )
        console.log( 'cam.zoom:' , cam.zoom )
    }
    if ( e.key === '+' ) {
        cam.zoom = cam.zoom - 1
        if ( cam.zoom < 1 ) {
            cam.zoom = 1
        }
        console.log( 'cam.zoom:' , cam.zoom )
    }
    if ( e.key === '-' ) {
        cam.zoom = cam.zoom + 1
        console.log( 'cam.zoom:' , cam.zoom )
    }
    if ( e.key === ' ' ) {
        let dropped = true
        while ( dropped ) {
            let before = current && current.pos ? current.pos[ 1 ] : null
            tryStepDown()
            let after = current && current.pos ? current.pos[ 1 ] : null
            if ( before === null || after === null || before === after ) {
                dropped = false
            }
        }
    }
    if ( e.key === 'a' ) {
        moveCurrent( -1 , 0 , 0 )
    }
    if ( e.key === 'd' ) {
        moveCurrent( 1 , 0 , 0 )
    }
    if ( e.key === 'w' ) {
        moveCurrent( 0 , 0 , -1 )
    }
    if ( e.key === 's' ) {
        moveCurrent( 0 , 0 , 1 )
    }
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
    if ( e.key === 'r' ) {
        for ( let i = 0 ; i < board.length ; i = i + 1 ) {
            board[ i ] = 0
        }
        spawn()
    }

    if ( [ 'a', 'd', 'w', 's', 'x', 'X', 'y', 'Y', 'z', 'Z', ' ', 'd', 'f' ].includes( e.key ) ) {
        e.preventDefault()
    }

    if ( e.key === 'f' ) {
        if ( shadingMode === 'gouraud' ) {
            setShadingMode( 'phong' )
        } else {
            setShadingMode( 'gouraud' )
        }
    }

    // console.log( keys )

} )

window.addEventListener( 'keyup' , function ( e ) {

    keys.delete( e.key )

    if ( e.key === 'ArrowLeft' ) {

        keys.delete( 'a' )

    }

    if ( e.key === 'ArrowRight' ) {

        keys.delete( 'd' )

    }

    if ( e.key === 'ArrowUp' ) {

        keys.delete( 'w' )

    }

    if ( e.key === 'ArrowDown' ) {

        keys.delete( 's' )

    }

} )

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
        // camera control will use dx, dy

    }

} )

window.addEventListener( 'wheel' , function ( e ) {

    // camera zoom will use e.deltaY

} ) 