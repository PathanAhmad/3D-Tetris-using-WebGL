export function resizeCanvas( c ) {

  const dpr = window.devicePixelRatio

  c.width = window.innerWidth * dpr

  c.height = window.innerHeight * dpr

  const gl = c.getContext( 'webgl2' )

  gl.viewport( 0 , 0 , c.width , c.height )

}

export async function loadShader( url , defines = '' ) {

  const res = await fetch( url )

  let src = await res.text()

  src = '#version 300 es\n' + ( defines ? defines + '\n' : '' ) + src

  return src

} 