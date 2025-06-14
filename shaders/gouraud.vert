#version 300 es
precision highp float;

layout(location=0) in vec3 pos;
layout(location=1) in vec3 normal;
layout(location=2) in vec2 uv;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform vec3 u_color;
uniform vec3 u_L;
uniform float u_Ma;
uniform float u_Md;
uniform float u_Ms;

out vec3 vColor;
out vec2 vUV;

void main() {
    vec3 n = normalize( mat3( u_model ) * normal );
    vec3 l = normalize( u_L );
    vec3 v = normalize( - ( u_model * vec4( pos , 1.0 ) ).xyz );
    vec3 h = normalize( l + v );
    float diff = max( dot( n , l ) , 0.0 );
    float spec = pow( max( dot( n , h ) , 0.0 ) , 16.0 );
    vec3 color = u_color * ( u_Ma + u_Md * diff ) + vec3( u_Ms * spec );
    color = clamp( color , 0.0 , 1.0 );
    color = pow( color , vec3( 1.0 / 2.2 ) );
    vColor = color;
    vUV = uv;
    gl_Position = u_proj * u_view * u_model * vec4( pos , 1.0 );
} 