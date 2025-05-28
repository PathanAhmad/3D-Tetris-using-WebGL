import './constants.js'
import { resizeCanvas } from './utils.js'
import { initGridBuffers , drawGrid } from './renderer.js'
import { cam } from './camera.js'

const canvas = document.getElementById( 'glcanvas' )
console.log( 'canvas:' , canvas )

const gl = canvas.getContext( 'webgl2' , { antialias: true , depth: true } )
console.log( 'gl:' , gl )

if ( !canvas ) console.error( 'Canvas not found' )
if ( !gl ) console.error( 'WebGL2 context not found' )

gl.clearColor( 0 , 0 , 0 , 1 )
gl.enable( gl.DEPTH_TEST )
gl.enable( gl.CULL_FACE )

resizeCanvas( canvas )

initGridBuffers( gl )

cam.update()

gl.clear( gl.COLOR_BUFFER_BIT )
drawGrid( gl , cam )

window.onresize = ( ) => resizeCanvas( canvas ) 