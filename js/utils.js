// Here I keep some helper functions for the game. I use these to resize the canvas and load shaders.

// Here I resize the canvas to fit the window and set up WebGL viewport
export function resizeCanvas( c ) {
  const dpr = window.devicePixelRatio
  c.style.width = '100vw'
  c.style.height = '100vh'
  c.width = Math.round( c.clientWidth * dpr )
  c.height = Math.round( c.clientHeight * dpr )
  const gl = c.getContext( 'webgl2' )
  gl.viewport( 0 , 0 , c.width , c.height )
}

// Here I load a shader file from a URL, and add #version and any defines if needed
export async function loadShader( url , defines = '' ) {
  const res = await fetch( url )
  let src = await res.text()
  // I make sure the shader has #version at the top, and add defines if needed
  if ( !src.trim().startsWith( '#version' ) ) {
    src = '#version 300 es\n' + ( defines ? defines + '\n' : '' ) + src
  } else if ( defines ) {
    let lines = src.split( '\n' )
    lines.splice( 1 , 0 , defines )
    src = lines.join( '\n' )
  }
  return src
} 