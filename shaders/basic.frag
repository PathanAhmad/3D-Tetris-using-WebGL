#version 300 es
precision highp float;
in vec3 vColor;
in vec2 vUV;
uniform float u_alpha;
uniform sampler2D u_tex;
uniform int u_useTex;
out vec4 outColor;
void main() {
    // Here I grab the color from the texture image if I am supposed to use it
    vec4 texColor = texture( u_tex , vUV );
    if ( u_useTex == 1 ) {
        outColor = vec4( texColor.rgb , u_alpha );
    } else {
        outColor = vec4( vColor , u_alpha );
    }
} 