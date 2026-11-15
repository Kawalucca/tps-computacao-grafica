import * as twgl from "../lib/twgl-full.module.js";

// Skydome: esfera grande que acompanha a câmera, com céu atmosférico procedural.
export function criarCeu(gl, vertexShader, fragmentShader) {
  const programa = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
  const geometria = twgl.primitives.createSphereBufferInfo(gl, 1, 36, 20);
  const m4 = twgl.m4;

  return {
    desenhar(camera, tempo) {
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      gl.useProgram(programa.program);
      twgl.setBuffersAndAttributes(gl, programa, geometria);
      const modelo = m4.multiply(m4.translation(camera.olho), m4.scaling([75, 75, 75]));
      twgl.setUniforms(programa, {
        u_model: modelo,
        u_view: camera.view,
        u_projection: camera.projection,
        u_time: tempo,
      });
      twgl.drawBufferInfo(gl, geometria);
      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
    },
  };
}
