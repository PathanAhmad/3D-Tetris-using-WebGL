// Here I draw everything for the game. I set up the grid, blocks, lines, and all the visuals.
// I keep track of shaders, textures, and how to show each block or effect.
// This file is a bit long because I have to handle all the different ways to draw stuff in 3D.
// If you are lost, just know: I set up shapes, I set up how to draw them, and then I draw them every frame.
// I spent days on trial and error to get it working the way its working rn.
// I used a lot of help from these:
// https://webgl2fundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html
// https://webgl2fundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html
// https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers/drawBuffersWEBGL
// and other parts of this website and a couple of youtube videos
// Good amount of the buffer and shader setup is copied or adapted from those sources.
import { GRID_W , GRID_D , GRID_H , BLOCK } from './constants.js'
import { loadShader } from './utils.js'
import * as mat4 from './gl-matrix/mat4.js'
import * as vec4 from './gl-matrix/vec4.js'
import { board , boardColor , current , SHAPES , idx , flyingBlocks , boardTex } from './gameState.js'
import { isBlockExploding } from './explosion.js'
import { useCylinder } from './input.js'

// I keep some variables for the grid lines
let b1
let i1
let v1
let n1

// Here I make the grid lines for the 3D box
function makeLines() {
  // I just make a list of all the points for the grid
  let arr = []
  let xO = GRID_W * BLOCK / 2
  let yO = GRID_H * BLOCK / 2
  let zO = GRID_D * BLOCK / 2
  for ( let y = 0 ; y <= GRID_H ; y = y + 1 ) {
    for ( let x = 0 ; x <= GRID_W ; x = x + 1 ) {
      for ( let z = 0 ; z <= GRID_D ; z = z + 1 ) {
        arr.push( x * BLOCK - xO , y * BLOCK - yO , z * BLOCK - zO )
      }
    }
  }
  return arr
}

// Here I make the indices for the grid lines
function makeIdxLines() {
  // I just figure out which points to connect for the grid
  let idx = ( x , y , z ) => ( y * ( GRID_W + 1 ) * ( GRID_D + 1 ) ) + ( x * ( GRID_D + 1 ) ) + z
  let arr = []
  for ( let x = 0 ; x <= GRID_W ; x = x + 1 ) {
    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
      arr.push( idx( x , 0 , z ) , idx( x , 0 , z + 1 ) )
    }
  }
  for ( let z = 0 ; z <= GRID_D ; z = z + 1 ) {
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
      arr.push( idx( x , 0 , z ) , idx( x + 1 , 0 , z ) )
    }
  }
  for ( let x = 0 ; x <= GRID_W ; x = x + 1 ) {
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      arr.push( idx( x , y , GRID_D ) , idx( x , y + 1 , GRID_D ) )
    }
  }
  for ( let y = 0 ; y <= GRID_H ; y = y + 1 ) {
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
      arr.push( idx( x , y , GRID_D ) , idx( x + 1 , y , GRID_D ) )
    }
  }
  for ( let z = 0 ; z <= GRID_D ; z = z + 1 ) {
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      arr.push( idx( GRID_W , y , z ) , idx( GRID_W , y + 1 , z ) )
    }
  }
  for ( let y = 0 ; y <= GRID_H ; y = y + 1 ) {
    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
      arr.push( idx( GRID_W , y , z ) , idx( GRID_W , y , z + 1 ) )
    }
  }
  return arr
}

let prog1

// Here I set up the grid lines for drawing
export function makeLinesSetup( g1 ) {
  // I make the buffers and stuff for the grid lines
  let verts = makeLines()
  let inds = makeIdxLines()
  n1 = inds.length
  v1 = g1.createVertexArray()
  g1.bindVertexArray( v1 )
  b1 = g1.createBuffer()
  g1.bindBuffer( g1.ARRAY_BUFFER , b1 )
  g1.bufferData( g1.ARRAY_BUFFER , new Float32Array( verts ) , g1.STATIC_DRAW )
  i1 = g1.createBuffer()
  g1.bindBuffer( g1.ELEMENT_ARRAY_BUFFER , i1 )
  g1.bufferData( g1.ELEMENT_ARRAY_BUFFER , new Uint32Array( inds ) , g1.STATIC_DRAW )
  g1.enableVertexAttribArray( 0 )
  g1.vertexAttribPointer( 0 , 3 , g1.FLOAT , false , 0 , 0 )
  g1.bindVertexArray( null )
}

// Here I draw the grid lines if needed
export function showLines( g1 , cam1 , show , a1 ) {
  // I only draw if show is true
  if ( !show ) {
    return
  }
  // I set up the shader and draw the lines
  g1.useProgram( prog1 )
  g1.bindVertexArray( v1 )
  g1.bindBuffer( g1.ELEMENT_ARRAY_BUFFER , i1 )
  g1.uniformMatrix4fv( g1.getUniformLocation( prog1 , 'u_proj' ) , false , cam1.proj )
  g1.uniformMatrix4fv( g1.getUniformLocation( prog1 , 'u_view' ) , false , cam1.view )
  let m1 = [ -1 , 0 , 0 , 0 , 0 , 1 , 0 , 0 , 0 , 0 , -1 , 0 , 0 , 0 , 0 , 1 ]
  g1.uniformMatrix4fv( g1.getUniformLocation( prog1 , 'u_model' ) , false , m1 )
  g1.uniform3fv( g1.getUniformLocation( prog1 , 'u_color' ) , [ 1 , 1 , 1 ] )
  g1.uniform1f( g1.getUniformLocation( prog1 , 'u_alpha' ) , a1 )
  g1.lineWidth( 1 )
  g1.drawElements( g1.LINES , n1 , g1.UNSIGNED_INT , 0 )
  g1.bindVertexArray( null )
}

let v2
let b2
let i2
let n2
let prog2
let prog3
let progNow
let shadeMode = 'gouraud'
let a = 0.2
let d = 0.7
let s = 0.3
let light = [ 1 , 1 , 1 ]
let textureImg = null
let textureObj = null
let textureLoaded = false

export async function loadBlockTexture( g1 ) {
    return new Promise( function( resolve ) {
        let img = new window.Image()
        img.src = 'assets/textures/texture1.png'
        img.onload = function() {
            let tex = g1.createTexture()
            g1.bindTexture( g1.TEXTURE_2D , tex )
            g1.texImage2D( g1.TEXTURE_2D , 0 , g1.RGBA , g1.RGBA , g1.UNSIGNED_BYTE , img )
            g1.texParameteri( g1.TEXTURE_2D , g1.TEXTURE_MIN_FILTER , g1.LINEAR )
            g1.texParameteri( g1.TEXTURE_2D , g1.TEXTURE_MAG_FILTER , g1.LINEAR )
            g1.texParameteri( g1.TEXTURE_2D , g1.TEXTURE_WRAP_S , g1.CLAMP_TO_EDGE )
            g1.texParameteri( g1.TEXTURE_2D , g1.TEXTURE_WRAP_T , g1.CLAMP_TO_EDGE )
            textureImg = img
            textureObj = tex
            textureLoaded = true
            resolve()
        }
    } )
}

function makeBoxes() {
  let s1 = BLOCK / 2
  let arr = []
  let uvs = [
    0 , 0 ,
    1 , 0 ,
    1 , 1 ,
    0 , 1
  ]
  let faces = [
    [ -s1, -s1, -s1,  0,  0, -1 ],
    [  s1, -s1, -s1,  0,  0, -1 ],
    [  s1,  s1, -s1,  0,  0, -1 ],
    [ -s1,  s1, -s1,  0,  0, -1 ],
    [ -s1, -s1,  s1,  0,  0,  1 ],
    [  s1, -s1,  s1,  0,  0,  1 ],
    [  s1,  s1,  s1,  0,  0,  1 ],
    [ -s1,  s1,  s1,  0,  0,  1 ],
    [ -s1, -s1, -s1, -1,  0,  0 ],
    [ -s1,  s1, -s1, -1,  0,  0 ],
    [ -s1,  s1,  s1, -1,  0,  0 ],
    [ -s1, -s1,  s1, -1,  0,  0 ],
    [  s1, -s1, -s1,  1,  0,  0 ],
    [  s1,  s1, -s1,  1,  0,  0 ],
    [  s1,  s1,  s1,  1,  0,  0 ],
    [  s1, -s1,  s1,  1,  0,  0 ],
    [ -s1,  s1, -s1,  0,  1,  0 ],
    [  s1,  s1, -s1,  0,  1,  0 ],
    [  s1,  s1,  s1,  0,  1,  0 ],
    [ -s1,  s1,  s1,  0,  1,  0 ],
    [ -s1, -s1, -s1,  0, -1,  0 ],
    [  s1, -s1, -s1,  0, -1,  0 ],
    [  s1, -s1,  s1,  0, -1,  0 ],
    [ -s1, -s1,  s1,  0, -1,  0 ]
  ]
  for ( let i = 0 ; i < faces.length ; i = i + 1 ) {
    arr.push( faces[ i ][ 0 ] , faces[ i ][ 1 ] , faces[ i ][ 2 ] )
    arr.push( faces[ i ][ 3 ] , faces[ i ][ 4 ] , faces[ i ][ 5 ] )
    let uv = uvs.slice( ( i % 4 ) * 2 , ( i % 4 ) * 2 + 2 )
    arr.push( uv[ 0 ] , uv[ 1 ] )
  }
  return arr
}

function makeIdxBoxes() {
  let arr = []
  for ( let f = 0 ; f < 6 ; f = f + 1 ) {
    let base = f * 4
    arr.push( base , base + 1 , base + 2 , base , base + 2 , base + 3 )
  }
  return arr
}

export async function makeBoxesSetup( g1 ) {
  let verts = makeBoxes()
  let inds = makeIdxBoxes()
  n2 = inds.length
  v2 = g1.createVertexArray()
  g1.bindVertexArray( v2 )
  b2 = g1.createBuffer()
  g1.bindBuffer( g1.ARRAY_BUFFER , b2 )
  g1.bufferData( g1.ARRAY_BUFFER , new Float32Array( verts ) , g1.STATIC_DRAW )
  i2 = g1.createBuffer()
  g1.bindBuffer( g1.ELEMENT_ARRAY_BUFFER , i2 )
  g1.bufferData( g1.ELEMENT_ARRAY_BUFFER , new Uint16Array( inds ) , g1.STATIC_DRAW )
  g1.enableVertexAttribArray( 0 )
  g1.vertexAttribPointer( 0 , 3 , g1.FLOAT , false , 32 , 0 )
  g1.enableVertexAttribArray( 1 )
  g1.vertexAttribPointer( 1 , 3 , g1.FLOAT , false , 32 , 12 )
  g1.enableVertexAttribArray( 2 )
  g1.vertexAttribPointer( 2 , 2 , g1.FLOAT , false , 32 , 24 )
  g1.bindVertexArray( null )
  let vtx1 = await loadShader( 'shaders/basic.vert' )
  let frg1 = await loadShader( 'shaders/basic.frag' )
  let vtx2 = await loadShader( 'shaders/gouraud.vert' )
  let frg2 = await loadShader( 'shaders/gouraud.frag' )
  let vtx3 = await loadShader( 'shaders/phong.vert' )
  let frg3 = await loadShader( 'shaders/phong.frag' )
  function comp( t , s ) {
    let sh = g1.createShader( t )
    g1.shaderSource( sh , s )
    g1.compileShader( sh )
    return sh
  }
  function makeProg( v , f ) {
    let vv = comp( g1.VERTEX_SHADER , v )
    let ff = comp( g1.FRAGMENT_SHADER , f )
    let p = g1.createProgram()
    g1.attachShader( p , vv )
    g1.attachShader( p , ff )
    g1.linkProgram( p )
    return p
  }
  prog1 = makeProg( vtx1 , frg1 )
  prog2 = makeProg( vtx2 , frg2 )
  prog3 = makeProg( vtx3 , frg3 )
  if ( shadeMode === 'gouraud' ) {
    progNow = prog2
  } else {
    progNow = prog3
  }
  await loadBlockTexture( g1 )
}

// Here I make a cylinder shape for when I want to draw blocks as cylinders instead of cubes
function drawCylinder( g1 , cam1 , x , y , z , c1 , a1 ) {
  // I just use triangles to make a round shape, not perfect but looks like a cylinder
  let sides = 16
  let radius = 0.5 * BLOCK
  let height = BLOCK
  let verts = []
  let centerY = 0
  for ( let i = 0 ; i < sides ; i = i + 1 ) {
    let theta1 = ( i / sides ) * 2 * Math.PI
    let theta2 = ( ( i + 1 ) / sides ) * 2 * Math.PI
    let x1 = Math.cos( theta1 ) * radius
    let z1 = Math.sin( theta1 ) * radius
    let x2 = Math.cos( theta2 ) * radius
    let z2 = Math.sin( theta2 ) * radius
    // side quad (two triangles)
    verts.push( x1 , -height / 2 , z1 )
    verts.push( x2 , -height / 2 , z2 )
    verts.push( x2 , height / 2 , z2 )
    verts.push( x1 , -height / 2 , z1 )
    verts.push( x2 , height / 2 , z2 )
    verts.push( x1 , height / 2 , z1 )
    // bottom
    verts.push( 0 , -height / 2 , 0 )
    verts.push( x2 , -height / 2 , z2 )
    verts.push( x1 , -height / 2 , z1 )
    // top
    verts.push( 0 , height / 2 , 0 )
    verts.push( x1 , height / 2 , z1 )
    verts.push( x2 , height / 2 , z2 )
  }
  let m1 = mat4.create()
  mat4.translate( m1 , m1 , [ -x + GRID_W / 2 - 0.5 , y - GRID_H / 2 + 0.5 , -z + GRID_D / 2 - 0.5 ] )
  g1.useProgram( progNow )
  g1.uniformMatrix4fv( g1.getUniformLocation( progNow , 'u_proj' ) , false , cam1.proj )
  g1.uniformMatrix4fv( g1.getUniformLocation( progNow , 'u_view' ) , false , cam1.view )
  g1.uniformMatrix4fv( g1.getUniformLocation( progNow , 'u_model' ) , false , m1 )
  g1.uniform3fv( g1.getUniformLocation( progNow , 'u_color' ) , c1 )
  g1.uniform1f( g1.getUniformLocation( progNow , 'u_alpha' ) , a1 )
  if ( progNow === prog2 || progNow === prog3 ) {
    g1.uniform3fv( g1.getUniformLocation( progNow , 'u_L' ) , light )
    g1.uniform1f( g1.getUniformLocation( progNow , 'u_Ma' ) , a )
    g1.uniform1f( g1.getUniformLocation( progNow , 'u_Md' ) , d )
    g1.uniform1f( g1.getUniformLocation( progNow , 'u_Ms' ) , s )
  }
  let buf = g1.createBuffer()
  g1.bindBuffer( g1.ARRAY_BUFFER , buf )
  g1.bufferData( g1.ARRAY_BUFFER , new Float32Array( verts ) , g1.STREAM_DRAW )
  g1.enableVertexAttribArray( 0 )
  g1.vertexAttribPointer( 0 , 3 , g1.FLOAT , false , 0 , 0 )
  g1.disableVertexAttribArray( 1 )
  g1.drawArrays( g1.TRIANGLES , 0 , verts.length / 3 )
  g1.deleteBuffer( buf )
}

// Here I draw a single block, either as a cube or a cylinder, with color and maybe texture
export function showBox( g1 , cam1 , x , y , z , c1 , a1 , texId ) {
  if ( useCylinder ) {
    drawCylinder( g1 , cam1 , x , y , z , c1 , a1 )
  } else {
    // I set up the shader and draw the cube, with color and maybe texture
    g1.useProgram( progNow )
    g1.bindVertexArray( v2 )
    g1.bindBuffer( g1.ELEMENT_ARRAY_BUFFER , i2 )
    let m1 = mat4.create()
    mat4.translate( m1 , m1 , [ -x + GRID_W / 2 - 0.5 , y - GRID_H / 2 + 0.5 , -z + GRID_D / 2 - 0.5 ] )
    g1.uniformMatrix4fv( g1.getUniformLocation( progNow , 'u_proj' ) , false , cam1.proj )
    g1.uniformMatrix4fv( g1.getUniformLocation( progNow , 'u_view' ) , false , cam1.view )
    g1.uniformMatrix4fv( g1.getUniformLocation( progNow , 'u_model' ) , false , m1 )
    g1.uniform3fv( g1.getUniformLocation( progNow , 'u_color' ) , c1 )
    g1.uniform1f( g1.getUniformLocation( progNow , 'u_alpha' ) , a1 )
    if ( progNow === prog2 || progNow === prog3 ) {
      g1.uniform3fv( g1.getUniformLocation( progNow , 'u_L' ) , light )
      g1.uniform1f( g1.getUniformLocation( progNow , 'u_Ma' ) , a )
      g1.uniform1f( g1.getUniformLocation( progNow , 'u_Md' ) , d )
      g1.uniform1f( g1.getUniformLocation( progNow , 'u_Ms' ) , s )
    }
    if ( texId !== undefined && texId !== -1 && textureLoaded ) {
      g1.activeTexture( g1.TEXTURE0 )
      g1.bindTexture( g1.TEXTURE_2D , textureObj )
      g1.uniform1i( g1.getUniformLocation( progNow , 'u_useTex' ) , 1 )
      g1.uniform1i( g1.getUniformLocation( progNow , 'u_tex' ) , 0 )
    } else {
      g1.uniform1i( g1.getUniformLocation( progNow , 'u_useTex' ) , 0 )
    }
    g1.drawElements( g1.TRIANGLES , n2 , g1.UNSIGNED_SHORT , 0 )
    g1.bindVertexArray( null )
  }
  // console.log( 'showBox', x, y, z )
}

// Here I draw all the blocks that are on the board
export function showAll( g1 , cam1 ) {
  // I just go through every spot and draw a block if there is one
  for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
      for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
        if ( board[ idx( x , y , z ) ] ) {
          let ci = idx( x , y , z ) * 3
          let c1 = [ boardColor[ ci ] , boardColor[ ci + 1 ] , boardColor[ ci + 2 ] ]
          let texId = boardTex[ idx( x , y , z ) ]
          showBox( g1 , cam1 , x , y , z , c1 , 1.0 , texId )
        }
      }
    }
  }
  // console.log( 'showAll ran' )
}

// Here I draw the current falling piece
export function showNow( g1 , cam1 ) {
  // I draw each block of the current piece at its position
  if ( !current ) {
    return
  }
  let shape = current.shape || SHAPES[ current.id ]
  let px = current.pos[ 0 ]
  let py = ( typeof current.floatY === 'number' ? current.floatY : current.pos[ 1 ] ) // I use the float y-position for smooth falling
  let pz = current.pos[ 2 ]
  let c1 = current.color
  let texId = current.tex
  for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
    let x = px + shape[ i ][ 0 ]
    let y = py + shape[ i ][ 1 ]
    let z = pz + shape[ i ][ 2 ]
    showBox( g1 , cam1 , x , y , z , c1 , 1.0 , texId )
  }
  // console.log( 'showNow ran' )
}

// Here I draw the shadow where the current piece would land
export function showShadow( g1 , cam1 ) {
  // I figure out how far the piece can drop, then draw it there in dark color
  if ( !current ) {
    return
  }
  let shape = current.shape || SHAPES[ current.id ]
  let px = current.pos[ 0 ]
  let py = current.pos[ 1 ]
  let pz = current.pos[ 2 ]
  let shadowBlocks = []
  for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
    let x = px + shape[ i ][ 0 ]
    let y = py + shape[ i ][ 1 ]
    let z = pz + shape[ i ][ 2 ]
    shadowBlocks.push( { x : x , y : y , z : z } )
  }
  let minDrop = GRID_H
  for ( let i = 0 ; i < shadowBlocks.length ; i = i + 1 ) {
    let { x , y , z } = shadowBlocks[ i ]
    let drop = 0
    for ( let yy = y - 1 ; yy >= 0 ; yy = yy - 1 ) {
      let idxVal = idx( x , yy , z )
      let occupied = board[ idxVal ]
      let isSelf = false
      for ( let j = 0 ; j < shadowBlocks.length ; j = j + 1 ) {
        if ( shadowBlocks[ j ].x === x && shadowBlocks[ j ].y === yy && shadowBlocks[ j ].z === z ) {
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
  let c1 = [ 0.1 , 0.1 , 0.1 ]
  for ( let i = 0 ; i < shadowBlocks.length ; i = i + 1 ) {
    let x = shadowBlocks[ i ].x
    let y = shadowBlocks[ i ].y - minDrop
    let z = shadowBlocks[ i ].z
    showBox( g1 , cam1 , x , y , z , c1 , 0.5 )
  }
  // console.log( 'showShadow ran' )
}

// Here I turn a 3D position into a 2D screen position (for UI stuff)
function projectToScreen( pos , cam , canvas ) {
  let v = [ pos[ 0 ] , pos[ 1 ] , pos[ 2 ] , 1 ]
  let mvp = mat4.create()
  mat4.multiply( mvp , cam.proj , cam.view )
  vec4.transformMat4( v , v , mvp )
  if ( v[ 3 ] !== 0 ) {
    v[ 0 ] = v[ 0 ] / v[ 3 ]
    v[ 1 ] = v[ 1 ] / v[ 3 ]
    v[ 2 ] = v[ 2 ] / v[ 3 ]
  }
  let x = ( v[ 0 ] * 0.5 + 0.5 ) * canvas.width
  let y = ( 1.0 - ( v[ 1 ] * 0.5 + 0.5 ) ) * canvas.height
  return [ x , y , v[ 2 ] ]
}

// Here I draw a thick edge between two points (for highlighting)
function drawEdge( g1 , cam1 , x1 , y1 , z1 , x2 , y2 , z2 , color ) {
  let a = [ -x1 + GRID_W / 2 - 0.5 , y1 - GRID_H / 2 + 0.5 , -z1 + GRID_D / 2 - 0.5 ]
  let b = [ -x2 + GRID_W / 2 - 0.5 , y2 - GRID_H / 2 + 0.5 , -z2 + GRID_D / 2 - 0.5 ]
  let verts = new Float32Array( [ a[ 0 ] , a[ 1 ] , a[ 2 ] , b[ 0 ] , b[ 1 ] , b[ 2 ] ] )
  let buf = g1.createBuffer()
  g1.bindBuffer( g1.ARRAY_BUFFER , buf )
  g1.bufferData( g1.ARRAY_BUFFER , verts , g1.STREAM_DRAW )
  g1.useProgram( prog1 )
  g1.uniformMatrix4fv( g1.getUniformLocation( prog1 , 'u_proj' ) , false , cam1.proj )
  g1.uniformMatrix4fv( g1.getUniformLocation( prog1 , 'u_view' ) , false , cam1.view )
  let m1 = [ 1 , 0 , 0 , 0 , 0 , 1 , 0 , 0 , 0 , 0 , 1 , 0 , 0 , 0 , 0 , 1 ]
  g1.uniformMatrix4fv( g1.getUniformLocation( prog1 , 'u_model' ) , false , m1 )
  g1.uniform3fv( g1.getUniformLocation( prog1 , 'u_color' ) , color )
  g1.uniform1f( g1.getUniformLocation( prog1 , 'u_alpha' ) , 1.0 )
  g1.enableVertexAttribArray( 0 )
  g1.vertexAttribPointer( 0 , 3 , g1.FLOAT , false , 0 , 0 )
  g1.lineWidth( 3 )
  g1.drawArrays( g1.LINES , 0 , 2 )
  g1.deleteBuffer( buf )
}

// Here I draw everything for one frame: grid, blocks, shadow, effects
function drawStuff( g1 , cam1 , show ) {
  // Here I set up depth and blending so things look right
  g1.disable( g1.BLEND )
  g1.enable( g1.DEPTH_TEST )
  g1.depthMask( true )
  g1.depthFunc( g1.LEQUAL )
  showLines( g1 , cam1 , show , 1.0 )

  let transparentBlocks = new Set( )

  // Here I figure out which blocks should be transparent because they block the view of the shadow
  if ( current ) {
    let shape = current.shape || SHAPES[ current.id ]
    let px = current.pos[ 0 ]
    let py = current.pos[ 1 ]
    let pz = current.pos[ 2 ]
    let shadowBlocks = []
    for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
      let x = px + shape[ i ][ 0 ]
      let y = py + shape[ i ][ 1 ]
      let z = pz + shape[ i ][ 2 ]
      shadowBlocks.push( { x : x , y : y , z : z } )
    }
    let minDrop = GRID_H
    for ( let i = 0 ; i < shadowBlocks.length ; i = i + 1 ) {
      let { x , y , z } = shadowBlocks[ i ]
      let drop = 0
      for ( let yy = y - 1 ; yy >= 0 ; yy = yy - 1 ) {
        let idxVal = idx( x , yy , z )
        let occupied = board[ idxVal ]
        let isSelf = false
        for ( let j = 0 ; j < shadowBlocks.length ; j = j + 1 ) {
          if ( shadowBlocks[ j ].x === x && shadowBlocks[ j ].y === yy && shadowBlocks[ j ].z === z ) {
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
    let shadowY = new Set()
    for ( let i = 0 ; i < shadowBlocks.length ; i = i + 1 ) {
      let x = shadowBlocks[ i ].x
      let y = shadowBlocks[ i ].y - minDrop
      let z = shadowBlocks[ i ].z
      shadowY.add( y )
    }
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
        for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
          if ( board[ idx( x , y , z ) ] ) {
            if ( shadowY.has( y ) ) {
              transparentBlocks.add( x + ',' + y + ',' + z )
            }
          }
        }
      }
    }
    let canvas = g1.canvas
    let shadowScreen = []
    for ( let i = 0 ; i < shadowBlocks.length ; i = i + 1 ) {
      let x = shadowBlocks[ i ].x
      let y = shadowBlocks[ i ].y - minDrop
      let z = shadowBlocks[ i ].z
      let screenPos = projectToScreen( [ x - GRID_W / 2 + 0.5 , y - GRID_H / 2 + 0.5 , z - GRID_D / 2 + 0.5 ] , cam1 , canvas )
      shadowScreen.push( { x: x , y: y , z: z , screen: screenPos } )
    }
    // Here I draw all the solid blocks first
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
        for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
          if ( board[ idx( x , y , z ) ] ) {
            let ci = idx( x , y , z ) * 3
            let c1 = [ boardColor[ ci ] , boardColor[ ci + 1 ] , boardColor[ ci + 2 ] ]
            let key = x + ',' + y + ',' + z
            let texId = boardTex[ idx( x , y , z ) ]
            if ( isBlockExploding( x , y , z ) ) {
              showBox( g1 , cam1 , x , y , z , [ 1 , 1 , 0 ] , 1.0 , texId )
            } else if ( !transparentBlocks.has( key ) ) {
              showBox( g1 , cam1 , x , y , z , c1 , 1.0 , texId )
            }
          }
        }
      }
    }
    // Here I draw all the transparent blocks on top
    g1.enable( g1.BLEND )
    g1.blendFunc( g1.SRC_ALPHA , g1.ONE_MINUS_SRC_ALPHA )
    g1.depthMask( false )
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
        for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
          if ( board[ idx( x , y , z ) ] ) {
            let ci = idx( x , y , z ) * 3
            let c1 = [ boardColor[ ci ] , boardColor[ ci + 1 ] , boardColor[ ci + 2 ] ]
            let key = x + ',' + y + ',' + z
            let texId = boardTex[ idx( x , y , z ) ]
            if ( isBlockExploding( x , y , z ) ) {
              showBox( g1 , cam1 , x , y , z , [ 1 , 1 , 0 ] , 1.0 , texId )
            } else if ( transparentBlocks.has( key ) ) {
              showBox( g1 , cam1 , x , y , z , c1 , 0.3 , texId )
            }
          }
        }
      }
    }
    // Here I draw the shadow blocks last, so they are always visible
    for ( let i = 0 ; i < shadowScreen.length ; i = i + 1 ) {
      let s = shadowScreen[ i ]
      let c1 = [ 0.1 , 0.1 , 0.1 ]
      showBox( g1 , cam1 , s.x , s.y , s.z , c1 , 0.5 )
      // Here I highlight the outer edges of the shadow block that touch other blocks or the grid
      let dirs = [ [ 1,0,0 ], [ -1,0,0 ], [ 0,1,0 ], [ 0,-1,0 ], [ 0,0,1 ], [ 0,0,-1 ] ]
      for ( let d = 0 ; d < dirs.length ; d = d + 1 ) {
        let nx = s.x + dirs[ d ][ 0 ]
        let ny = s.y + dirs[ d ][ 1 ]
        let nz = s.z + dirs[ d ][ 2 ]
        let outOfBounds = nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H || nz < 0 || nz >= GRID_D
        let isBlock = !outOfBounds && board[ idx( nx , ny , nz ) ]
        if ( outOfBounds || isBlock ) {
          // Here I draw the edge for this face
          // For each face, I draw 4 edges
          let edges = []
          if ( dirs[ d ][ 0 ] !== 0 ) {
            // x face
            edges = [
              [ s.x + 0.5 * dirs[ d ][ 0 ] , s.y - 0.5 , s.z - 0.5 , s.x + 0.5 * dirs[ d ][ 0 ] , s.y + 0.5 , s.z - 0.5 ] ,
              [ s.x + 0.5 * dirs[ d ][ 0 ] , s.y + 0.5 , s.z - 0.5 , s.x + 0.5 * dirs[ d ][ 0 ] , s.y + 0.5 , s.z + 0.5 ] ,
              [ s.x + 0.5 * dirs[ d ][ 0 ] , s.y + 0.5 , s.z + 0.5 , s.x + 0.5 * dirs[ d ][ 0 ] , s.y - 0.5 , s.z + 0.5 ] ,
              [ s.x + 0.5 * dirs[ d ][ 0 ] , s.y - 0.5 , s.z + 0.5 , s.x + 0.5 * dirs[ d ][ 0 ] , s.y - 0.5 , s.z - 0.5 ]
            ]
          } else if ( dirs[ d ][ 1 ] !== 0 ) {
            // y face
            edges = [
              [ s.x - 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z - 0.5 , s.x + 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z - 0.5 ] ,
              [ s.x + 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z - 0.5 , s.x + 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z + 0.5 ] ,
              [ s.x + 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z + 0.5 , s.x - 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z + 0.5 ] ,
              [ s.x - 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z + 0.5 , s.x - 0.5 , s.y + 0.5 * dirs[ d ][ 1 ] , s.z - 0.5 ]
            ]
          } else if ( dirs[ d ][ 2 ] !== 0 ) {
            // z face
            edges = [
              [ s.x - 0.5 , s.y - 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] , s.x + 0.5 , s.y - 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] ] ,
              [ s.x + 0.5 , s.y - 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] , s.x + 0.5 , s.y + 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] ] ,
              [ s.x + 0.5 , s.y + 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] , s.x - 0.5 , s.y + 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] ] ,
              [ s.x - 0.5 , s.y + 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] , s.x - 0.5 , s.y - 0.5 , s.z + 0.5 * dirs[ d ][ 2 ] ]
            ]
          }
          for ( let e = 0 ; e < edges.length ; e = e + 1 ) {
            drawEdge( g1 , cam1 , edges[ e ][ 0 ] , edges[ e ][ 1 ] , edges[ e ][ 2 ] , edges[ e ][ 3 ] , edges[ e ][ 4 ] , edges[ e ][ 5 ] , [ 0.2 , 1.0 , 1.0 ] )
          }
        }
      }
    }
    g1.depthMask( true )
    g1.disable( g1.BLEND )
  }

  // Here I draw all the flying blocks that are exploding
  for ( let i = 0 ; i < flyingBlocks.length ; i = i + 1 ) {
    let b = flyingBlocks[ i ]
    let c1 = [ 1.0 , 0.5 , 0.2 ]
    showBox( g1 , cam1 , b.x , b.y , b.z , c1 , 1.0 )
  }

  // Here I draw the current falling piece on top of everything
  showNow( g1 , cam1 )
}

// Here I clear the screen and draw everything for this frame
export function mainDraw( g1 , cam1 , show ) {
  g1.clear( g1.COLOR_BUFFER_BIT | g1.DEPTH_BUFFER_BIT )
  drawStuff( g1 , cam1 , show )
}

// Here I switch between shading modes (Gouraud or Phong)
export async function pickShade( m ) {
  shadeMode = m
  if ( m === 'gouraud' ) {
    progNow = prog2
  } else {
    progNow = prog3
  }
}

export const showGrid = { value: true }

window.addEventListener( 'DOMContentLoaded' , function ( ) {
  let amb = document.getElementById( 'ambient-slider' )
  let diff = document.getElementById( 'diffuse-slider' )
  let spec = document.getElementById( 'specular-slider' )
  if ( amb ) {
    amb.addEventListener( 'input' , function ( ) {
      a = Number( amb.value )
    } )
  }
  if ( diff ) {
    diff.addEventListener( 'input' , function ( ) {
      d = Number( diff.value )
    } )
  }
  if ( spec ) {
    spec.addEventListener( 'input' , function ( ) {
      s = Number( spec.value )
    } )
  }
} ) 