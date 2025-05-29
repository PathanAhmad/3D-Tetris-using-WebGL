import { GRID_W , GRID_D , GRID_H } from './constants.js'

import * as glMatrix from './gl-matrix/index.js'

const defaultZoom = Math.max( GRID_W , GRID_H ) / 2 + 1

export const cam = {

  yaw: 30 * Math.PI / 180 ,

  pitch: -20 * Math.PI / 180 ,

  roll: 0 ,

  zoom: defaultZoom ,

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

    let up = [ 0 , 1 , 0 ]

    // Apply roll: rotate up vector around view direction
    if ( this.roll !== 0 ) {
      let viewDir = [ -ex , -ey , -ez ]
      glMatrix.vec3.normalize( viewDir , viewDir )
      let rotMat = glMatrix.mat4.create()
      glMatrix.mat4.fromRotation( rotMat , this.roll , viewDir )
      let up4 = [ 0 , 1 , 0 , 0 ]
      glMatrix.vec4.transformMat4( up4 , up4 , rotMat )
      up = [ up4[ 0 ] , up4[ 1 ] , up4[ 2 ] ]
    }

    glMatrix.mat4.lookAt( this.view , eye , center , up )

  }

} 