import { GRID_W , GRID_D , GRID_H , BLOCK } from './constants.js'

let gridVBO
let gridIBO
let gridVAO
let gridIndexCount

// Vertices for all grid points
function makeGridVertices() {
  const verts = []
  const xOff = GRID_W * BLOCK / 2
  const yOff = GRID_H * BLOCK / 2
  const zOff = GRID_D * BLOCK / 2
  for ( let y = 0 ; y <= GRID_H ; y = y + 1 ) {
    for ( let x = 0 ; x <= GRID_W ; x = x + 1 ) {
      for ( let z = 0 ; z <= GRID_D ; z = z + 1 ) {
        verts.push( x * BLOCK - xOff , y * BLOCK - yOff , z * BLOCK - zOff )
      }
    }
  }
  return verts
}

// Indices for base, back, right, and internal grid lines
function makeGridIndices() {
  const idx = ( x , y , z ) => ( y * ( GRID_W + 1 ) * ( GRID_D + 1 ) ) + ( x * ( GRID_D + 1 ) ) + z
  const inds = []

  // Base (y = 0): draw all grid lines in x and z
  for ( let x = 0 ; x <= GRID_W ; x = x + 1 ) {
    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
      inds.push( idx( x , 0 , z ) , idx( x , 0 , z + 1 ) )
    }
  }
  for ( let z = 0 ; z <= GRID_D ; z = z + 1 ) {
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
      inds.push( idx( x , 0 , z ) , idx( x + 1 , 0 , z ) )
    }
  }

  // Back (z = GRID_D): verticals
  for ( let x = 0 ; x <= GRID_W ; x = x + 1 ) {
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      inds.push( idx( x , y , GRID_D ) , idx( x , y + 1 , GRID_D ) )
    }
  }
  for ( let y = 0 ; y <= GRID_H ; y = y + 1 ) {
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
      inds.push( idx( x , y , GRID_D ) , idx( x + 1 , y , GRID_D ) )
    }
  }

  // Right (x = GRID_W): verticals
  for ( let z = 0 ; z <= GRID_D ; z = z + 1 ) {
    for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
      inds.push( idx( GRID_W , y , z ) , idx( GRID_W , y + 1 , z ) )
    }
  }
  for ( let y = 0 ; y <= GRID_H ; y = y + 1 ) {
    for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
      inds.push( idx( GRID_W , y , z ) , idx( GRID_W , y , z + 1 ) )
    }
  }

  return inds
}

let testProgram

function createTestProgram( gl ) {
  const vertSrc = `#version 300 es
layout(location=0) in vec3 pos;
uniform mat4 u_proj;
uniform mat4 u_view;
void main() {
  gl_Position = u_proj * u_view * vec4( pos , 1.0 );
}`
  const fragSrc = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4( 1.0 , 1.0 , 1.0 , 1.0 );
}`
  function compile( type , src ) {
    const s = gl.createShader( type )
    gl.shaderSource( s , src )
    gl.compileShader( s )
    return s
  }
  const v = compile( gl.VERTEX_SHADER , vertSrc )
  const f = compile( gl.FRAGMENT_SHADER , fragSrc )
  const p = gl.createProgram()
  gl.attachShader( p , v )
  gl.attachShader( p , f )
  gl.linkProgram( p )
  return p
}

export const showGrid = { value: true }

export function initGridBuffers( gl ) {
  const verts = makeGridVertices()
  const inds = makeGridIndices()
  gridIndexCount = inds.length
  gridVAO = gl.createVertexArray()
  gl.bindVertexArray( gridVAO )
  gridVBO = gl.createBuffer()
  gl.bindBuffer( gl.ARRAY_BUFFER , gridVBO )
  gl.bufferData( gl.ARRAY_BUFFER , new Float32Array( verts ) , gl.STATIC_DRAW )
  gridIBO = gl.createBuffer()
  gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER , gridIBO )
  gl.bufferData( gl.ELEMENT_ARRAY_BUFFER , new Uint32Array( inds ) , gl.STATIC_DRAW )
  gl.enableVertexAttribArray( 0 )
  gl.vertexAttribPointer( 0 , 3 , gl.FLOAT , false , 0 , 0 )
  gl.bindVertexArray( null )
  testProgram = createTestProgram( gl )
}

export function drawGrid( gl , cam , showGridParam ) {
  if ( !showGridParam ) {
    return
  }
  gl.useProgram( testProgram )
  gl.bindVertexArray( gridVAO )
  gl.uniformMatrix4fv( gl.getUniformLocation( testProgram , 'u_proj' ) , false , cam.proj )
  gl.uniformMatrix4fv( gl.getUniformLocation( testProgram , 'u_view' ) , false , cam.view )
  gl.drawElements( gl.LINES , gridIndexCount , gl.UNSIGNED_INT , 0 )
  gl.bindVertexArray( null )
}

let cubeVAO
let cubeVBO
let cubeIBO
let cubeIndexCount
let cubeProgram

function makeCubeVertices() {
  const s = BLOCK / 2
  return [
    -s , -s , -s ,
     s , -s , -s ,
     s ,  s , -s ,
    -s ,  s , -s ,
    -s , -s ,  s ,
     s , -s ,  s ,
     s ,  s ,  s ,
    -s ,  s ,  s
  ]
}

function makeCubeIndices() {
  return [
    0 , 1 , 2 , 2 , 3 , 0 , // back
    4 , 5 , 6 , 6 , 7 , 4 , // front
    0 , 4 , 7 , 7 , 3 , 0 , // left
    1 , 5 , 6 , 6 , 2 , 1 , // right
    3 , 2 , 6 , 6 , 7 , 3 , // top
    0 , 1 , 5 , 5 , 4 , 0  // bottom
  ]
}

function createCubeProgram( gl ) {
  const vertSrc = `#version 300 es\nlayout(location=0) in vec3 pos;\nuniform mat4 u_proj;\nuniform mat4 u_view;\nuniform mat4 u_model;\nuniform vec3 u_color;\nout vec3 vColor;\nvoid main() {\n  vColor = u_color;\n  gl_Position = u_proj * u_view * u_model * vec4( pos , 1.0 );\n}`
  const fragSrc = `#version 300 es\nprecision highp float;\nin vec3 vColor;\nout vec4 outColor;\nvoid main() {\n  outColor = vec4( vColor , 1.0 );\n}`
  function compile( type , src ) {
    const s = gl.createShader( type )
    gl.shaderSource( s , src )
    gl.compileShader( s )
    return s
  }
  const v = compile( gl.VERTEX_SHADER , vertSrc )
  const f = compile( gl.FRAGMENT_SHADER , fragSrc )
  const p = gl.createProgram()
  gl.attachShader( p , v )
  gl.attachShader( p , f )
  gl.linkProgram( p )
  return p
}

export function initCubeBuffers( gl ) {
  const verts = makeCubeVertices()
  const inds = makeCubeIndices()
  cubeIndexCount = inds.length
  cubeVAO = gl.createVertexArray()
  gl.bindVertexArray( cubeVAO )
  cubeVBO = gl.createBuffer()
  gl.bindBuffer( gl.ARRAY_BUFFER , cubeVBO )
  gl.bufferData( gl.ARRAY_BUFFER , new Float32Array( verts ) , gl.STATIC_DRAW )
  cubeIBO = gl.createBuffer()
  gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER , cubeIBO )
  gl.bufferData( gl.ELEMENT_ARRAY_BUFFER , new Uint16Array( inds ) , gl.STATIC_DRAW )
  gl.enableVertexAttribArray( 0 )
  gl.vertexAttribPointer( 0 , 3 , gl.FLOAT , false , 0 , 0 )
  gl.bindVertexArray( null )
  cubeProgram = createCubeProgram( gl )
}

import * as mat4 from './gl-matrix/mat4.js'

import { board , current , SHAPES , idx } from './gameState.js'

export function drawCube( gl , cam , pos , color ) {
  gl.useProgram( cubeProgram )
  gl.bindVertexArray( cubeVAO )
  gl.uniformMatrix4fv( gl.getUniformLocation( cubeProgram , 'u_proj' ) , false , cam.proj )
  gl.uniformMatrix4fv( gl.getUniformLocation( cubeProgram , 'u_view' ) , false , cam.view )
  let model = mat4.create()
  mat4.translate( model , model , pos )
  gl.uniformMatrix4fv( gl.getUniformLocation( cubeProgram , 'u_model' ) , false , model )
  gl.uniform3fv( gl.getUniformLocation( cubeProgram , 'u_color' ) , color )
  gl.drawElements( gl.TRIANGLES , cubeIndexCount , gl.UNSIGNED_SHORT , 0 )
  gl.bindVertexArray( null )
}

export function drawBoard( gl , cam ) {
  for ( let y = 0 ; y < GRID_H ; y = y + 1 ) {
    for ( let x = 0 ; x < GRID_W ; x = x + 1 ) {
      for ( let z = 0 ; z < GRID_D ; z = z + 1 ) {
        if ( board[ idx( x , y , z ) ] ) {
          drawCube( gl , cam , [ x - GRID_W / 2 + 0.5 , y - GRID_H / 2 + 0.5 , z - GRID_D / 2 + 0.5 ] , [ 0.7 , 0.7 , 0.7 ] )
        }
      }
    }
  }
}

export function drawCurrentPiece( gl , cam ) {
  if ( !current ) {
    return
  }
  let shape = current.shape || SHAPES[ current.id ]
  let px = current.pos[ 0 ]
  let py = current.pos[ 1 ]
  let pz = current.pos[ 2 ]
  let color = current.color
  for ( let i = 0 ; i < shape.length ; i = i + 1 ) {
    let x = px + shape[ i ][ 0 ]
    let y = py + shape[ i ][ 1 ]
    let z = pz + shape[ i ][ 2 ]
    drawCube( gl , cam , [ x - GRID_W / 2 + 0.5 , y - GRID_H / 2 + 0.5 , z - GRID_D / 2 + 0.5 ] , color )
  }
}

export function drawScene( gl , cam , showGridParam ) {
  drawGrid( gl , cam , showGridParam )
  drawBoard( gl , cam )
  drawCurrentPiece( gl , cam )
}

export let shadingMode = 'gouraud'
export function setShadingMode( mode ) {
    shadingMode = mode
    console.log( 'Switched shading mode to:' , mode )
} 