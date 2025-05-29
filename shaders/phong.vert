#version 300 es
precision highp float;

layout(location=0) in vec3 pos;
layout(location=1) in vec3 normal;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform vec3 u_color;

out vec3 vPos;
out vec3 vNormal;
out vec3 vColor;

void main() {
    vPos = ( u_model * vec4( pos , 1.0 ) ).xyz;
    vNormal = normalize( mat3( u_model ) * normal );
    vColor = u_color;
    gl_Position = u_proj * u_view * u_model * vec4( pos , 1.0 );
} 