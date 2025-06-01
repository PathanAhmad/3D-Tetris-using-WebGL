import { GRID_W , GRID_D , GRID_H } from './constants.js'

import * as glMatrix from './gl-matrix/index.js'

// Here I set up the camera so I can look at the game from different angles
// I keep track of where the camera is, how far it is zoomed, and what kind of view I use
const defaultZoom = Math.max( GRID_W , GRID_H ) / 2 + 1

// This is my camera
export const cam = {

  yaw: 30 * Math.PI / 180 + Math.PI , // This is how much I turn left/right

  pitch: -20 * Math.PI / 180 , // This is how much I look up/down

  roll: 0 , // This is how much I tilt my head

  zoom: defaultZoom , // This is how far away I am

  mode: 'ortho' , // I can use flat (ortho) or 3D (perspective) view

  proj: null , // I keep my projection matrix here

  view: null , // I keep my view matrix here

  // When I update, I figure out where the camera should be and how it should look at the game
  update: function ( ) {

    // I make sure my matrices are ready before I use them
    if ( !this.proj ) this.proj = glMatrix.mat4.create()

    if ( !this.view ) this.view = glMatrix.mat4.create()

    // I pick which kind of view to use: flat or 3D
    if ( this.mode === 'ortho' ) {

      // Here I set up a flat view so everything looks the same size
      glMatrix.mat4.ortho( this.proj ,
        -this.zoom , this.zoom ,
        -this.zoom , this.zoom ,
        100 , -100 )

    } else {

      // Here I set up a 3D view so things look smaller when far away
      glMatrix.mat4.perspective( this.proj ,
        Math.PI / 4 , 1 , 0.1 , 100 )
    }

    // I figure out where my eye is in space, based on yaw, pitch, and zoom
    let yawNow = this.yaw
    let pitchNow = this.pitch
    if ( this.mode === 'persp' ) {
      yawNow = yawNow + Math.PI
      pitchNow = pitchNow + Math.PI / 6
    }
    const r = this.zoom

    const ex = r * Math.cos( pitchNow ) * Math.sin( yawNow )
    const ey = r * Math.sin( pitchNow )
    const ez = r * Math.cos( pitchNow ) * Math.cos( yawNow )

    const eye = [ ex , ey , ez ]

    const center = [ 0 , 0 , 0 ] // I always look at the middle of the game

    let up = [ 0 , 1 , 0 ] // This is which way is "up" for me

    // If I have any roll, I tilt my up vector around the direction I'm looking
    if ( this.roll !== 0 ) {
      let viewDir = [ -ex , -ey , -ez ]
      glMatrix.vec3.normalize( viewDir , viewDir )
      let rotMat = glMatrix.mat4.create()
      glMatrix.mat4.fromRotation( rotMat , this.roll , viewDir )
      let up4 = [ 0 , 1 , 0 , 0 ]
      glMatrix.vec4.transformMat4( up4 , up4 , rotMat )
      up = [ up4[ 0 ] , up4[ 1 ] , up4[ 2 ] ]
    }

    // Here I actually set the camera to look from my eye to the center, with my up direction
    glMatrix.mat4.lookAt( this.view , eye , center , up )

  }

} 