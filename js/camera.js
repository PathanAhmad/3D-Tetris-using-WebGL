import { GRID_W , GRID_D } from './constants.js'

import * as glMatrix from './gl-matrix/index.js'

export const cam = {

  yaw: 30 * Math.PI / 180 ,

  pitch: -30 * Math.PI / 180 ,

  roll: 0 ,

  zoom: GRID_W * 1.5 ,

  mode: 'ortho' ,

  proj: null ,

  view: null ,

  update: function ( ) {

    if ( !this.proj ) this.proj = glMatrix.mat4.create()

    if ( !this.view ) this.view = glMatrix.mat4.create()

    if ( this.mode === 'ortho' ) {

      glMatrix.mat4.ortho( this.proj ,
        -this.zoom , this.zoom ,
        -this.zoom , this.zoom ,
        -100 , 100 )

    } else {

      glMatrix.mat4.perspective( this.proj ,
        Math.PI / 4 , 1 , 0.1 , 100 )

    }

    const r = this.zoom

    const ex = r * Math.cos( this.pitch ) * Math.sin( this.yaw )
    const ey = r * Math.sin( this.pitch )
    const ez = r * Math.cos( this.pitch ) * Math.cos( this.yaw )

    const eye = [ ex , ey , ez ]

    const center = [ 0 , 0 , 0 ]

    const up = [ 0 , 1 , 0 ]

    glMatrix.mat4.lookAt( this.view , eye , center , up )

  }

} 