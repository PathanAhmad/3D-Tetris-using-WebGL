#version 300 es
precision highp float;
layout(location=0) in vec3 pos;
layout(location=2) in vec2 uv;
uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform vec3 u_color;
out vec3 vColor;
out vec2 vUV;
void main() {
    vColor = u_color;
    vUV = uv;
    gl_Position = u_proj * u_view * u_model * vec4( pos , 1.0 );
} 