// Here I keep all the game state: the board, the current piece, and all the logic for moving, rotating, and locking pieces.
// I also handle clearing rows/columns, explosions, and spawning new pieces. This file is long because I do everything for the game here.
import { GRID_W , GRID_D , GRID_H } from './constants.js'
import * as vec3 from './gl-matrix/vec3.js'
import { markBlockExploding , explodingBlocks , isBlockExploding } from './explosion.js'
import { setPaused } from './input.js'

// Here I list all the shapes I can spawn. I just use arrays for the block positions.
export const SHAPES = {

    I: [ [ 0 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 0 , 2 , 0 ] , [ 0 , 3 , 0 ] ] ,

    O: [ [ 0 , 0 , 0 ] , [ 1 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 1 , 1 , 0 ] ] ,

    L: [ [ 0 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 0 , 2 , 0 ] , [ 1 , 0 , 0 ] ] ,

    N: [ [ 0 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 1 , 1 , 0 ] , [ 1 , 2 , 0 ] ] ,

    T: [ [ 0 , 0 , 0 ] , [ -1 , 0 , 0 ] , [ 1 , 0 , 0 ] , [ 0 , 1 , 0 ] ] ,

    towerR: [ [ 0 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 0 , 2 , 0 ] , [ 1 , 1 , 0 ] ] ,

    towerL: [ [ 0 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 0 , 2 , 0 ] , [ -1 , 1 , 0 ] ] ,

    tripod: [ [ 0 , 0 , 0 ] , [ 1 , 0 , 0 ] , [ 0 , 1 , 0 ] , [ 0 , 0 , 1 ] ]

} 

// Here I pick a random key from an object (for random shape)
function randKey( obj ) {
    // I just get all the keys and pick one at random
    let keys = Object.keys( obj )
    let idx = Math.floor( Math.random( ) * keys.length )
    return keys[ idx ]
}

// Here I pick a random color for a piece, so every piece looks different
function randColor( ) {
    let r = Math.random( )
    let g = Math.random( )
    let b = Math.random( )
    return [ r , g , b ]
}

let spawnCnt = 0

// Here I keep the current falling piece. If it's null, the game is over.
export let current = null

// Here I update the float y-position for smooth falling
export function updateFloatY( dy ) {

    // I move the piece down smoothly by dy (can be negative)
    if ( current ) {

        if ( typeof current.floatY !== 'number' ) {

            current.floatY = current.pos[ 1 ]

        }

        current.floatY = current.floatY + dy

    }

}

// Here I spawn a new piece at the top, centered, and with a random color and maybe a texture
export function spawn( ) {
    let id = randKey( SHAPES )
    let shape = SHAPES[ id ]
    // I find the highest block in the shape so I can spawn it at the top
    let maxY = shape[ 0 ][ 1 ]
    for ( let i = 1 ; i < shape.length ; i = i + 1 ) {
        if ( shape[ i ][ 1 ] > maxY ) {
            maxY = shape[ i ][ 1 ]
        }
    }
    let posY = GRID_H - 1 - maxY
    current = {
        id: id ,
        pos: [ GRID_W >> 1 , posY , GRID_D >> 1 ] ,
        rot: [ 0 , 0 , 0 ] ,
        color: randColor( ) ,
        tex: ( ( ++spawnCnt ) % 5 ? -1 : Math.floor( Math.random( ) * 10 ) ) ,
        shape: shape.map( v => v.slice() ) ,
        floatY: posY
    }
    // console.log( 'spawned', current )
}

// Here I keep the board and color/texture info for every block. I use flat arrays for speed.
export const board = new Uint8Array( GRID_W * GRID_D * GRID_H )
export const boardColor = new Float32Array( GRID_W * GRID_D * GRID_H * 3 )
export const boardTex = new Int8Array( GRID_W * GRID_D * GRID_H )

// Here I check if a position is inside the board, so I don't go out of bounds
export function inside( x , y , z ) {
    if ( 0 <= x && x < GRID_W && 0 <= y && y < GRID_H && 0 <= z && z < GRID_D ) {
        return true
    } else {
        return false
    }
}

// Here I turn 3D coordinates into a 1D index for my arrays, so I can store everything flat
export function idx( x , y , z ) {
    return x + GRID_W * ( z + GRID_D * y )
}

// Here I check if a set of blocks is free (not blocked and inside the board)
export function free( blocks ) {
    for ( let i = 0 ; i < blocks.length ; i = i + 1 ) {
        let x = blocks[ i ][ 0 ]
        let y = blocks[ i ][ 1 ]
        let z = blocks[ i ][ 2 ]
        if ( !inside( x , y , z ) ) {
            // If any block is out of bounds, it's not free
            return false
        }
        if ( board[ idx( x , y , z ) ] ) {
            // If any block is already filled, it's not free
            return false
        }
    }
    return true
}

// Here I lock the current piece into the board, and handle row/column clears and new piece spawn
export function lock( ) {
    // console.log( 'locked', current )
    let shape = current.shape || SHAPES[ current.id ]
    let px = current.pos[ 0 ]
    let py = current.pos[ 1 ]
    let pz = current.pos[ 2 ]
    let color = current.color
    let tex = current.tex
    // I put each block of the piece into the board arrays
    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
        let x = px + shape[ i ][ 0 ]
        let y = py + shape[ i ][ 1 ]
        let z = pz + shape[ i ][ 2 ]
        if ( inside( x , y , z ) ) {
            board[ idx( x , y , z ) ] = 1
            let ci = idx( x , y , z ) * 3
            boardColor[ ci ] = color[ 0 ]
            boardColor[ ci + 1 ] = color[ 1 ]
            boardColor[ ci + 2 ] = color[ 2 ]
            boardTex[ idx( x , y , z ) ] = tex
        }
    }
    // I check for full rows/columns and clear them, making blocks above fall
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
        let full = true
        for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
            for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                if ( board[ idx( x , y , z ) ] === 0 ) {
                    full = false
                }
            }
        }
        if ( full ) {
            // If a row is full, I move everything above it down
            for ( let yy = y ; yy < GRID_H - 1 ; yy = yy + 1 ) {
                for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                        board[ idx( x , yy , z ) ] = board[ idx( x , yy + 1 , z ) ]
                        let ci = idx( x , yy , z ) * 3
                        let ciAbove = idx( x , yy + 1 , z ) * 3
                        boardColor[ ci ] = boardColor[ ciAbove ]
                        boardColor[ ci + 1 ] = boardColor[ ciAbove + 1 ]
                        boardColor[ ci + 2 ] = boardColor[ ciAbove + 2 ]
                        boardTex[ idx( x , yy , z ) ] = boardTex[ idx( x , yy + 1 , z ) ]
                    }
                }
            }
            // I clear the top row after moving everything down
            for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                    board[ idx( x , GRID_H - 1 , z ) ] = 0
                    let ci = idx( x , GRID_H - 1 , z ) * 3
                    boardColor[ ci ] = 0
                    boardColor[ ci + 1 ] = 0
                    boardColor[ ci + 2 ] = 0
                    boardTex[ idx( x , GRID_H - 1 , z ) ] = -1
                }
            }
            y = y - 1 // I check the same row again since everything moved down
        }
    }
    // I try to spawn a new piece. If it can't fit, the game is over (current = null)
    let id = randKey( SHAPES )
    let shapeNew = SHAPES[ id ]
    let maxY = shapeNew[ 0 ][ 1 ]
    for ( let i = 1 ; i < shapeNew.length ; i = i + 1 ) {
        if ( shapeNew[ i ][ 1 ] > maxY ) {
            maxY = shapeNew[ i ][ 1 ]
        }
    }
    let posY = GRID_H - 1 - maxY
    let preview = {
        id: id ,
        pos: [ GRID_W >> 1 , posY , GRID_D >> 1 ] ,
        rot: [ 0 , 0 , 0 ] ,
        color: randColor( ) ,
        tex: ( ( ++spawnCnt ) % 5 ? -1 : Math.floor( Math.random( ) * 10 ) ) ,
        shape: shapeNew.map( v => v.slice() )
    }
    let previewShape = preview.shape
    let blocks = []
    for ( let i = 0 ; i < previewShape.length ; i = i + 1 ) {
        let x = preview.pos[ 0 ] + previewShape[ i ][ 0 ]
        let y = preview.pos[ 1 ] + previewShape[ i ][ 1 ]
        let z = preview.pos[ 2 ] + previewShape[ i ][ 2 ]
        blocks.push( [ x , y , z ] )
    }
    if ( free( blocks ) ) {
        current = preview
    } else {
        current = null
    }
    clearBottomRowOrColumn()
}

// Here I try to move the current piece down by one, or lock it if it can't move
export function tryStepDown() {
    // console.log( 'stepped down', current && current.pos )
    if ( !current ) {
        return
    }
    let shape = current.shape || SHAPES[ current.id ]
    let px = current.pos[ 0 ]
    let py = current.pos[ 1 ]
    let pz = current.pos[ 2 ]
    let moved = []
    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
        let x = px + shape[ i ][ 0 ]
        let y = py + shape[ i ][ 1 ] - 1
        let z = pz + shape[ i ][ 2 ]
        moved.push( [ x , y , z ] )
    }
    if ( free( moved ) ) {
        current.pos[ 1 ] = current.pos[ 1 ] - 1
    } else {
        lock()
    }
}

// Here I move the current piece by (dx, dy, dz) if possible
export function moveCurrent( dx , dy , dz ) {
    // console.log( 'moved', current && current.pos )
    if ( !current ) {
        return
    }
    let shape = current.shape || SHAPES[ current.id ]
    let px = current.pos[ 0 ] + dx
    let py = current.pos[ 1 ] + dy
    let pz = current.pos[ 2 ] + dz
    let moved = []
    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
        let x = px + shape[ i ][ 0 ]
        let y = py + shape[ i ][ 1 ]
        let z = pz + shape[ i ][ 2 ]
        moved.push( [ x , y , z ] )
    }
    if ( free( moved ) ) {
        current.pos[ 0 ] = px
        current.pos[ 1 ] = py
        current.pos[ 2 ] = pz
    }
}

// Here I rotate the current piece around an axis if possible
export function rotateCurrent( axis ) {
    // console.log( 'rotated', current && current.rot )
    if ( !current ) {
        return
    }
    let shape = current.shape || SHAPES[ current.id ]
    let pivot = shape[ 0 ]
    let center = [ pivot[ 0 ] , pivot[ 1 ] , pivot[ 2 ] ]
    let rotShape = []
    let angle = Math.PI / 2
    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
        let v = [ shape[ i ][ 0 ] , shape[ i ][ 1 ] , shape[ i ][ 2 ] ]
        let out = [ 0 , 0 , 0 ]
        if ( axis === 'x' ) {
            vec3.rotateX( out , v , center , angle )
        } else if ( axis === 'y' ) {
            vec3.rotateY( out , v , center , angle )
        } else if ( axis === 'z' ) {
            vec3.rotateZ( out , v , center , angle )
        }
        out = out.map( Math.round )
        rotShape.push( out )
    }
    let px = current.pos[ 0 ]
    let py = current.pos[ 1 ]
    let pz = current.pos[ 2 ]
    let moved = []
    for ( let i = 0 ; i < rotShape.length ; i = i + 1 ) {
        let x = px + rotShape[ i ][ 0 ]
        let y = py + rotShape[ i ][ 1 ]
        let z = pz + rotShape[ i ][ 2 ]
        moved.push( [ x , y , z ] )
    }
    if ( free( moved ) ) {
        current.shape = rotShape
    }
}

// Here I clear any full row or column at the bottom, and make blocks above fall
export function clearBottomRowOrColumn() {
    // console.log( 'cleared row/col' )
    let found = true
    while ( found ) {
        found = false
        let rowLogged = false
        let colLogged = false
        // I check every x-row at the bottom (y=0) to see if it's full
        for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
            let full = true
            for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                if ( board[ idx( x , 0 , z ) ] === 0 ) {
                    full = false
                }
            }
            if ( full ) {
                found = true
                // If a row is full, I mark all its blocks for explosion and clear them
                for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                    if ( board[ idx( x , 0 , z ) ] ) {
                        markBlockExploding( x , 0 , z , 20 )
                        board[ idx( x , 0 , z ) ] = 0
                        let ci = idx( x , 0 , z ) * 3
                        boardColor[ ci ] = 0
                        boardColor[ ci + 1 ] = 0
                        boardColor[ ci + 2 ] = 0
                        boardTex[ idx( x , 0 , z ) ] = -1
                    }
                }
                if ( !rowLogged ) {
                    console.log( 'Full bottom x-row detected at x = ' , x )
                    rowLogged = true
                }
            }
        }
        // I check every z-column at the bottom (y=0) to see if it's full
        for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
            let full = true
            for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                if ( board[ idx( x , 0 , z ) ] === 0 ) {
                    full = false
                }
            }
            if ( full ) {
                found = true
                // If a column is full, I mark all its blocks for explosion and clear them
                for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                    if ( board[ idx( x , 0 , z ) ] ) {
                        markBlockExploding( x , 0 , z , 20 )
                        board[ idx( x , 0 , z ) ] = 0
                        let ci = idx( x , 0 , z ) * 3
                        boardColor[ ci ] = 0
                        boardColor[ ci + 1 ] = 0
                        boardColor[ ci + 2 ] = 0
                        boardTex[ idx( x , 0 , z ) ] = -1
                    }
                }
                if ( !colLogged ) {
                    console.log( 'Full bottom z-column detected at z = ' , z )
                    colLogged = true
                }
            }
        }
        // After clearing, I let blocks above fall down if there is space
        let changed = true
        while ( changed ) {
            changed = false
            for ( let y = 1 ; y < GRID_H ; y = y + 1 ) {
                for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                        if ( board[ idx( x , y , z ) ] && !board[ idx( x , y - 1 , z ) ] ) {
                            board[ idx( x , y - 1 , z ) ] = board[ idx( x , y , z ) ]
                            let ciFrom = idx( x , y , z ) * 3
                            let ciTo = idx( x , y - 1 , z ) * 3
                            boardColor[ ciTo ] = boardColor[ ciFrom ]
                            boardColor[ ciTo + 1 ] = boardColor[ ciFrom + 1 ]
                            boardColor[ ciTo + 2 ] = boardColor[ ciFrom + 2 ]
                            boardTex[ idx( x , y - 1 , z ) ] = boardTex[ idx( x , y , z ) ]
                            board[ idx( x , y , z ) ] = 0
                            boardColor[ ciFrom ] = 0
                            boardColor[ ciFrom + 1 ] = 0
                            boardColor[ ciFrom + 2 ] = 0
                            boardTex[ idx( x , y , z ) ] = -1
                            changed = true
                        }
                    }
                }
            }
        }
    }
}

// Here I remove a block from the board (used for explosions)
export function removeBlockFromShape( x , y , z ) {
    // console.log( 'removed block', x, y, z )
    for ( let objY = y + 1 ; objY < GRID_H ; objY = objY + 1 ) {
        let found = false
        for ( let objX = 0 ; objX < GRID_W ; objX = objX + 1 ) {
            for ( let objZ = 0 ; objZ < GRID_D ; objZ = objZ + 1 ) {
                if ( board[ idx( objX , objY , objZ ) ] ) {
                    found = true
                }
            }
        }
        if ( found ) {
            break
        }
    }
    board[ idx( x , y , z ) ] = 0
    let ci = idx( x , y , z ) * 3
    boardColor[ ci ] = 0
    boardColor[ ci + 1 ] = 0
    boardColor[ ci + 2 ] = 0
    boardTex[ idx( x , y , z ) ] = -1
}

// Here I check if a block can fall down (used for explosions and gravity)
export function canBlockFall( x , y , z ) {
    if ( y === 0 ) {
        return false
    }
    if ( board[ idx( x , y - 1 , z ) ] ) {
        return false
    }
    return true
}

// Here I finish all explosions and clear flying/exploding blocks
export function finishExplosions() {
    // console.log( 'finished explosions' )
    let toClear = []
    for ( let i = 0 ; i < flyingBlocks.length ; i = i + 1 ) {
        let b = flyingBlocks[ i ]
        toClear.push( [ b.x , b.y , b.z ] )
    }
    for ( let i = 0 ; i < explodingBlocks.length ; i = i + 1 ) {
        let b = explodingBlocks[ i ]
        toClear.push( [ b.x , b.y , b.z ] )
    }
    console.log( 'Clearing cubes:', JSON.stringify( toClear ) )
    for ( let i = 0 ; i < toClear.length ; i = i + 1 ) {
        let x = Math.round( toClear[ i ][ 0 ] )
        let y = Math.round( toClear[ i ][ 1 ] )
        let z = Math.round( toClear[ i ][ 2 ] )
        if ( inside( x , y , z ) ) {
            removeBlockFromShape( x , y , z )
        }
    }
    flyingBlocks.length = 0
    explodingBlocks.length = 0
    // After clearing, I let blocks above fall down if there is space
    let changed = true
    while ( changed ) {
        changed = false
        for ( let y = 1 ; y < GRID_H ; y = y + 1 ) {
            for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                    if ( board[ idx( x , y , z ) ] && !board[ idx( x , y - 1 , z ) ] ) {
                        board[ idx( x , y - 1 , z ) ] = board[ idx( x , y , z ) ]
                        let ciFrom = idx( x , y , z ) * 3
                        let ciTo = idx( x , y - 1 , z ) * 3
                        boardColor[ ciTo ] = boardColor[ ciFrom ]
                        boardColor[ ciTo + 1 ] = boardColor[ ciFrom + 1 ]
                        boardColor[ ciTo + 2 ] = boardColor[ ciFrom + 2 ]
                        boardTex[ idx( x , y - 1 , z ) ] = boardTex[ idx( x , y , z ) ]
                        board[ idx( x , y , z ) ] = 0
                        boardColor[ ciFrom ] = 0
                        boardColor[ ciFrom + 1 ] = 0
                        boardColor[ ciFrom + 2 ] = 0
                        boardTex[ idx( x , y , z ) ] = -1
                        changed = true
                    }
                }
            }
        }
    }
}

// Here I keep track of flying blocks for explosion animation
export let flyingBlocks = []

// Here I start flying blocks when an explosion happens
export function startFlyingBlocks() {
    // I give each exploding block a random velocity so it flies out
    for ( let i = 0 ; i < explodingBlocks.length ; i = i + 1 ) {
        let b = explodingBlocks[ i ]
        let vx = ( Math.random() - 0.5 ) * 0.2
        let vy = ( Math.random() + 0.5 ) * 0.3
        let vz = ( Math.random() - 0.5 ) * 0.2
        flyingBlocks.push( { x: b.x , y: b.y , z: b.z , vx: vx , vy: vy , vz: vz } )
    }
    explodingBlocks.length = 0
}

// Here I clear all flying blocks (used to reset after explosions)
export function endFlyingBlocks() {
    flyingBlocks.length = 0
}

// Here I check for new explosions and start them if needed (used in the main loop)
export function processExplosionsLoop() {
    if ( flyingBlocks.length > 0 || explodingBlocks.length > 0 ) {
        return
    }
    let found = false
    // I check every x-row at the bottom to see if it's full and needs to explode
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
        let full = true
        for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
            if ( board[ idx( x , 0 , z ) ] === 0 ) {
                full = false
            }
        }
        if ( full ) {
            for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
                markBlockExploding( x , 0 , z , 20 )
            }
            found = true
        }
    }
    // I check every z-column at the bottom to see if it's full and needs to explode
    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
        let full = true
        for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
            if ( board[ idx( x , 0 , z ) ] === 0 ) {
                full = false
            }
        }
        if ( full ) {
            for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
                markBlockExploding( x , 0 , z , 20 )
            }
            found = true
        }
    }
    if ( found ) {
        startFlyingBlocks()
    }
} 