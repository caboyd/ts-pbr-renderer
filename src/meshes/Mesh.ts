/*
    Base Mesh Class
    A Mesh Contains:
            
 */

import { Geometry } from "src/geometry/Geometry";
import { DrawMode } from "src/graphics/WebglConstants";
import { IndexBuffer } from "src/graphics/IndexBuffer";
import { VertexBuffer } from "src/graphics/VertexBuffer";
import { SubMesh } from "./SubMesh";

export class Mesh {
    public readonly index_buffer: IndexBuffer | undefined;
    public readonly vertex_buffer: VertexBuffer;

    public draw_mode: DrawMode;
    public readonly sub_meshes: SubMesh[];
    public count:number;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        if (geometry.indices) this.index_buffer = new IndexBuffer(gl, geometry);
        this.vertex_buffer = new VertexBuffer(gl, geometry);
        this.sub_meshes = [];
        this.draw_mode = DrawMode.TRIANGLES;
        this.count = 0;
        
        for (let group of geometry.groups) {
            this.count += group.count;
            this.sub_meshes.push(
                new SubMesh(group.material_index, group.offset, group.count, this.vertex_buffer, this.index_buffer)
            );
        }
    }

    public setDrawMode(mode: DrawMode): void {
        this.draw_mode = mode;
    }

    public destroy(gl: WebGL2RenderingContext):void {
        for (let sub_mesh of this.sub_meshes) {
            sub_mesh.destroy();
        }

        if (this.index_buffer) this.index_buffer.destroy(gl);
        this.vertex_buffer.destroy(gl);
    }
}