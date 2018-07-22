#version 300 es
precision highp float;

layout (location = 0) in vec3 a_vertex;
layout (location = 1) in vec2 a_tex_coord;
layout (location = 2) in vec3 a_normal;
layout (location = 3) in vec3 a_tangent;
layout (location = 4) in vec3 a_bitangent;

//layout (std140) uniform Matrices{
//    mat4 view;
//    mat4 projection;
//    mat4 view_projection;
//};

uniform mat4 u_model_matrix;

uniform mat4 u_modelview_matrix;
uniform mat3 u_normalview_matrix;

uniform mat4 u_mvp_matrix;

uniform vec3 u_eye_pos;

out vec3 normal;
out vec2 tex_coord;
out vec3 pos;

void main() {
    vec3 offset = vec3(u_eye_pos.x, 0, u_eye_pos.z);

    gl_Position = u_mvp_matrix * vec4(a_vertex + offset,1.0f);
    
    normal =  u_normalview_matrix * a_normal ;
    
    pos = mat3(u_model_matrix)* (a_vertex + offset  ) ;
    
    tex_coord = a_tex_coord;
}