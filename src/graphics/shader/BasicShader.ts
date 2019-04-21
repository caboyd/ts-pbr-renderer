import {Shader} from "./Shader";
import {Renderer} from "../Renderer";

export class BasicShader extends Shader {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, require("src/shaders/standard.vert").default, require("src/shaders/basic.frag").default);
        this.use();
        this.setUniform("u_material.albedo_sampler", 0);
        this.setUniform("u_material.albedo_cube_sampler", 1);
    }

    public use(): void {
        let gl = this.gl;
        gl.useProgram(this.ID);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, Renderer.EMPTY_TEXTURE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, Renderer.EMPTY_CUBE_TEXTURE);
    }
}