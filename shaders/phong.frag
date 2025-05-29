#version 300 es
precision highp float;

in vec3 vPos;
in vec3 vNormal;
in vec3 vColor;

uniform vec3 u_L;
uniform float u_Ma;
uniform float u_Md;
uniform float u_Ms;

out vec4 outColor;

void main() {
    vec3 n = normalize( vNormal );
    vec3 l = normalize( u_L );
    vec3 v = normalize( -vPos );
    vec3 h = normalize( l + v );
    float diff = max( dot( n , l ) , 0.0 );
    float spec = pow( max( dot( n , h ) , 0.0 ) , 16.0 );
    vec3 color = vColor * ( u_Ma + u_Md * diff ) + vec3( u_Ms * spec );
    outColor = vec4( color , 1.0 );
} 