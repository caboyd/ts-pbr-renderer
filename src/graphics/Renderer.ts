import { IndexBuffer } from "./IndexBuffer";
import { VertexBuffer } from "./VertexBuffer";
import { Shader } from "./Shader";
import {mat3, mat4} from "gl-matrix";
import {Texture2D} from "./Texture2D";
import {PBRShader} from "./PBRShader";
import {UniformBuffer} from "./UniformBuffer";
import {Material} from "../materials/Material";
import {RendererStats} from "./RendererStats";

let temp:mat4 = mat4.create();

let modelview_matrix: mat4 = mat4.create();
let normalview_matrix: mat3 = mat3.create();
let mvp_matrix: mat4 = mat4.create();

export class Renderer {
    gl: WebGL2RenderingContext;
    current_vertex_buffer: VertexBuffer | undefined;
    current_index_buffer: IndexBuffer | undefined;
    current_material: Material | undefined;
    current_shader: Shader | undefined;
    
    private static _EMPTY_TEXTURE:WebGLTexture;
    private static _BasicShader:PBRShader;
    private static _PBRShader:PBRShader;
    private static _NormalOnlyShader:Shader;
    private static _GridShader:Shader;
    
    private uboGlobalBlock:UniformBuffer;
    private uboModelBlock:UniformBuffer;
    private stats:RendererStats;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.stats = new RendererStats();

        Renderer._EMPTY_TEXTURE = new Texture2D(gl).texture_id;
        
        Renderer._BasicShader = new Shader(gl,
            require("src/shaders/standard.vert").default, require("src/shaders/basic.frag").default);
        Renderer._PBRShader = new PBRShader(gl);

        Renderer._GridShader = new Shader(gl,
            require("src/shaders/grid.vert").default, require("src/shaders/grid.frag").default);
        Renderer._NormalOnlyShader = new Shader(gl,
            require("src/shaders/standard.vert").default, require("src/shaders/normals.frag").default);
        
        this.uboGlobalBlock = new UniformBuffer(Renderer._PBRShader,"ubo_per_frame");
        this.uboGlobalBlock.bindShader(Renderer._BasicShader,0);
        this.uboGlobalBlock.bindShader(Renderer._PBRShader,0);
        this.uboGlobalBlock.bindShader(Renderer._GridShader,0);
        this.uboGlobalBlock.bindShader(Renderer._NormalOnlyShader,0);
        
        this.uboModelBlock = new UniformBuffer(Renderer._PBRShader,"ubo_per_model");
        this.uboModelBlock.bindShader(Renderer._BasicShader,1);
        this.uboModelBlock.bindShader(Renderer._PBRShader,1);
        this.uboModelBlock.bindShader(Renderer._GridShader,1);
        this.uboModelBlock.bindShader(Renderer._NormalOnlyShader,1);
    }
    
    public setPerFrameUniforms(view:mat4, proj:mat4):void{
        this.uboGlobalBlock.set("view", view);
        this.uboGlobalBlock.set("projection", proj);
        this.uboGlobalBlock.set("view_projection", mat4.mul(temp,proj,view));
        this.uboGlobalBlock.update(this.gl);
        
        //console.dir(this.stats);
        this.resetStats();
    }

    public setPerModelUniforms(model_matrix: mat4, view_matrix: mat4, proj_matrix: mat4):void{
        this.uboModelBlock.set("model_view", mat4.mul(modelview_matrix,view_matrix,model_matrix));
        
        //NOTE: Does this bug if normalFromMat4 returns null?
        this.uboModelBlock.set("normal_view", mat3.normalFromMat4(normalview_matrix,modelview_matrix)!);
        
        this.uboModelBlock.set("mvp", mat4.mul(mvp_matrix,proj_matrix,modelview_matrix));
        this.uboModelBlock.update(this.gl);
    }
    
    public draw(
        draw_mode: number,
        count: number,
        offset: number,
        index_buffer: IndexBuffer | undefined,
        vertex_buffer: VertexBuffer,
        mat: Material
    ): void {
        if (mat.shader != this.current_shader) {
            this.current_shader = mat.shader;
            this.current_shader.use();
            this.stats.shader_bind_count++;
        }
        
        if (mat != this.current_material) {
            this.current_material = mat;
            this.current_material.activate(this.gl);
            this.stats.material_bind_count++;
        }

        if (vertex_buffer != this.current_vertex_buffer) {
            this.current_vertex_buffer = vertex_buffer;
            this.current_vertex_buffer.bindBuffers(this.gl);
            this.stats.vertex_buffer_bind_count++;
        }

        if (index_buffer && index_buffer != this.current_index_buffer) {
            this.current_index_buffer = index_buffer;
            this.current_index_buffer.bind(this.gl);
            this.stats.index_buffer_bind_count++;
        }

        if (index_buffer) {
            if (index_buffer.indices.BYTES_PER_ELEMENT === 2)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_SHORT, offset);
            else if (index_buffer.indices.BYTES_PER_ELEMENT === 4)
                this.gl.drawElements(draw_mode, count, this.gl.UNSIGNED_INT, offset);
            else throw "Unknown index buffer type";
            this.stats.index_draw_count += count;
        } else {
            this.gl.drawArrays(draw_mode, offset, count);
            this.stats.vertex_draw_count += count;
        }
        
        this.stats.draw_calls++;
    }

    public resetStats(): void{
        //console.dir(this.stats);
        this.stats.reset();
        this.current_material = undefined;
    }
    
    static get EMPTY_TEXTURE() :WebGLTexture{
        return this._EMPTY_TEXTURE;
    }
    
    static get PBRShader(): PBRShader{
        return this._PBRShader;
    }
    
    static get GridShader():Shader{
        return this._GridShader;
    }
    
    static get NormalOnlyShader():Shader{
        return this._NormalOnlyShader;
    }

    static get BasicShader():Shader{
        return this._BasicShader;
    }
}
