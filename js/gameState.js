import { GRID_W , GRID_D , GRID_H } from './constants.js'
import * as vec3 from './gl-matrix/vec3.js'

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

function randKey( obj ) {

    let keys = Object.keys( obj )

    let idx = Math.floor( Math.random( ) * keys.length )

    return keys[ idx ]

}

function randColor( ) {

    let r = Math.random( )
    let g = Math.random( )
    let b = Math.random( )
    return [ r , g , b ]

}

let spawnCnt = 0

export let current = null

export function spawn( ) {
    let id = randKey( SHAPES )
    let shape = SHAPES[ id ]
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
        shape: shape.map( v => v.slice() )
    }
}

export const board = new Uint8Array( GRID_W * GRID_D * GRID_H )

export function inside( x , y , z ) {

    if ( 0 <= x && x < GRID_W && 0 <= y && y < GRID_H && 0 <= z && z < GRID_D ) {

        return true

    } else {

        return false

    }

}

export function idx( x , y , z ) {

    return x + GRID_W * ( z + GRID_D * y )

}

export function free( blocks ) {

    for ( let i = 0 ; i < blocks.length ; i = i + 1 ) {

        let x = blocks[ i ][ 0 ]
        let y = blocks[ i ][ 1 ]
        let z = blocks[ i ][ 2 ]

        if ( !inside( x , y , z ) ) {

            return false

        }

        if ( board[ idx( x , y , z ) ] ) {

            return false

        }

    }

    return true

}

export function lock( ) {

    let shape = current.shape || SHAPES[ current.id ]
    let px = current.pos[ 0 ]
    let py = current.pos[ 1 ]
    let pz = current.pos[ 2 ]

    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {

        let x = px + shape[ i ][ 0 ]
        let y = py + shape[ i ][ 1 ]
        let z = pz + shape[ i ][ 2 ]

        if ( inside( x , y , z ) ) {

            board[ idx( x , y , z ) ] = 1

        }

    }

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

            for ( let yy = y ; yy < GRID_H - 1 ; yy = yy + 1 ) {

                for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {

                    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {

                        board[ idx( x , yy , z ) ] = board[ idx( x , yy + 1 , z ) ]

                    }

                }

            }

            for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {

                for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {

                    board[ idx( x , GRID_H - 1 , z ) ] = 0

                }

            }

            y = y - 1

        }

    }

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

}

export function tryStepDown() {
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

export function moveCurrent( dx , dy , dz ) {
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

export function rotateCurrent( axis ) {
    if ( !current ) {
        return
    }
    let shape = current.shape || SHAPES[ current.id ]
    let center = [ 0 , 0 , 0 ]
    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
        center[ 0 ] = center[ 0 ] + shape[ i ][ 0 ]
        center[ 1 ] = center[ 1 ] + shape[ i ][ 1 ]
        center[ 2 ] = center[ 2 ] + shape[ i ][ 2 ]
    }
    center[ 0 ] = center[ 0 ] / shape.length
    center[ 1 ] = center[ 1 ] / shape.length
    center[ 2 ] = center[ 2 ] / shape.length

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