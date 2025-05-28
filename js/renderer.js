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

export function drawGrid( gl , cam ) {
  gl.useProgram( testProgram )
  gl.bindVertexArray( gridVAO )
  gl.uniformMatrix4fv( gl.getUniformLocation( testProgram , 'u_proj' ) , false , cam.proj )
  gl.uniformMatrix4fv( gl.getUniformLocation( testProgram , 'u_view' ) , false , cam.view )
  gl.drawElements( gl.LINES , gridIndexCount , gl.UNSIGNED_INT , 0 )
  gl.bindVertexArray( null )
} 