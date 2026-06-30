import * as React from "react";

type ShaderVideoProps = React.HTMLAttributes<HTMLCanvasElement> & {
  src?: string;
};

const DEFAULT_VIDEO_SRC =
  "https://res.cloudinary.com/dvqxhfwiw/video/upload/Camera_j9jkvr.mp4";

export const ShaderVideo = React.forwardRef<HTMLCanvasElement, ShaderVideoProps>(
  function ShaderVideo({ src = DEFAULT_VIDEO_SRC, className, style, ...rest }, ref) {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    React.useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const gl = canvas.getContext("webgl2");
      if (!gl) {
        return;
      }

      const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main() {
  gl_Position = vec4(position);
}`;

      const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_video;

float character(int n, vec2 p) {
  p = floor(p * vec2(-4., 4.) + 2.5);
  if (clamp(p.x, 0., 4.) == p.x) {
    if (clamp(p.y, 0., 4.) == p.y) {
      int a = int(round(p.x) + 5. * round(p.y));
      if (((n >> a) & 1) == 1) return 1.;
    }
  }
  return 0.;
}

void main() {
  vec2 F = gl_FragCoord.xy;
  float size = 5.;
  float srez = size * 2.;
  vec3 col = texture(u_video, floor(F.xy / srez) * srez / u_resolution).rgb;
  float gray = .3 * col.r + .6 * col.g + .1 * col.b;

  int n = 0;
  if (gray > 0.0233) n = 4096;
  if (gray > 0.0465) n = 131200;
  if (gray > 0.0698) n = 4329476;
  if (gray > 0.0930) n = 459200;
  if (gray > 0.1163) n = 4591748;
  if (gray > 0.1395) n = 12652620;
  if (gray > 0.1628) n = 14749828;
  if (gray > 0.1860) n = 18393220;
  if (gray > 0.2093) n = 15239300;
  if (gray > 0.2326) n = 17318431;
  if (gray > 0.2558) n = 32641156;
  if (gray > 0.2791) n = 18393412;
  if (gray > 0.3023) n = 18157905;
  if (gray > 0.3256) n = 17463428;
  if (gray > 0.3488) n = 14954572;
  if (gray > 0.3721) n = 13177118;
  if (gray > 0.3953) n = 18405034;
  if (gray > 0.4186) n = 16269839;
  if (gray > 0.4419) n = 15018318;
  if (gray > 0.4651) n = 18400814;
  if (gray > 0.4884) n = 33081316;
  if (gray > 0.5116) n = 15255086;
  if (gray > 0.5349) n = 32045584;
  if (gray > 0.5581) n = 6566222;
  if (gray > 0.5814) n = 15022158;
  if (gray > 0.6047) n = 18444881;
  if (gray > 0.6279) n = 16272942;
  if (gray > 0.6512) n = 18415153;
  if (gray > 0.6744) n = 32641183;
  if (gray > 0.6977) n = 32540207;
  if (gray > 0.7209) n = 18732593;
  if (gray > 0.7442) n = 18667121;
  if (gray > 0.7674) n = 16267326;
  if (gray > 0.7907) n = 32575775;
  if (gray > 0.8140) n = 15022414;
  if (gray > 0.8372) n = 15255537;
  if (gray > 0.8605) n = 32032318;
  if (gray > 0.8837) n = 32045617;
  if (gray > 0.9070) n = 33061392;
  if (gray > 0.9302) n = 33061407;
  if (gray > 0.9535) n = 32045630;
  if (gray > 0.9767) n = 11512810;

  vec2 p = mod(F.xy / size, 2.) - vec2(1);
  col = col * character(n, p);
  fragColor = vec4(col, 1);
}
`;

      const compileShader = (type: number, shaderSource: string) => {
        const shader = gl.createShader(type);
        if (!shader) {
          throw new Error("Unable to create shader");
        }
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const error = gl.getShaderInfoLog(shader);
          gl.deleteShader(shader);
          throw new Error(`Shader compile failed: ${error}`);
        }
        return shader;
      };

      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      const program = gl.createProgram();
      if (!program) {
        return;
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program link failed: ${error}`);
      }

      const positionBuffer = gl.createBuffer();
      const vao = gl.createVertexArray();
      if (!positionBuffer || !vao) {
        return;
      }

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]),
        gl.STATIC_DRAW
      );

      const positionLoc = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const video = document.createElement("video");
      video.src = src;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});

      const uTimeLoc = gl.getUniformLocation(program, "u_time");
      const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
      const uVideoLoc = gl.getUniformLocation(program, "u_video");

      let rafId = 0;
      const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const bufferScale = Math.max(1, dpr * 2);
        const width = Math.floor(canvas.clientWidth * bufferScale);
        const height = Math.floor(canvas.clientHeight * bufferScale);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      };

      const render = (time: number) => {
        resizeCanvas();
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        }

        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniform1f(uTimeLoc, time * 0.001);
        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
        gl.uniform1i(uVideoLoc, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        rafId = window.requestAnimationFrame(render);
      };

      const handleResize = () => resizeCanvas();
      window.addEventListener("resize", handleResize);
      rafId = window.requestAnimationFrame(render);

      return () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener("resize", handleResize);
        video.pause();
      };
    }, [src]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ display: "block", width: "100%", height: "100%", ...style }}
        {...rest}
      />
    );
  }
);
