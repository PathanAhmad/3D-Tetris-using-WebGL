#version 300 es
precision highp float;

in vec3 vPos;
in vec3 vNormal;
in vec3 vColor;
in vec2 vUV;

uniform vec3 u_L;
uniform float u_Ma;
uniform float u_Md;
uniform float u_Ms;
uniform float u_alpha;
uniform sampler2D u_tex;
uniform int u_useTex;

out vec4 outColor;

void main() {
    vec3 n = normalize( vNormal );
    vec3 l = normalize( u_L );
    vec3 v = normalize( -vPos );
    vec3 h = normalize( l + v );
    float diff = max( dot( n , l ) , 0.0 );
    float spec = pow( max( dot( n , h ) , 0.0 ) , 16.0 );
    vec3 color = vColor * ( u_Ma + u_Md * diff ) + vec3( u_Ms * spec );
    color = clamp( color , 0.0 , 1.0 );
    color = pow( color , vec3( 1.0 / 2.2 ) );
    // Here I grab the color from the texture image if I am supposed to use it
    vec4 texColor = texture( u_tex , vUV );
    if ( u_useTex == 1 ) {
        outColor = vec4( texColor.rgb , u_alpha );
    } else {
        outColor = vec4( color , u_alpha );
    }
} 