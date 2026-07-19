/*
 * Floating Lines animated banner background.
 *
 * Vanilla WebGL re-implementation of the React Bits "Floating Lines" background
 * (https://reactbits.dev/backgrounds/floating-lines), themed with the clinic's
 * cyan accent. Mouse interaction and parallax are intentionally disabled so the
 * effect is purely ambient (non-interactive).
 */
(function () {
  'use strict';

  var vertexSource = [
    'attribute vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var fragmentSource = [
    'precision highp float;',
    '',
    'uniform float iTime;',
    'uniform vec3 iResolution;',
    'uniform float animationSpeed;',
    '',
    'uniform vec3 topWavePosition;',
    'uniform vec3 middleWavePosition;',
    'uniform vec3 bottomWavePosition;',
    '',
    'uniform float topLineDistance;',
    'uniform float middleLineDistance;',
    'uniform float bottomLineDistance;',
    '',
    '// Theme gradient (cyan accent -> light cyan -> deep blue).',
    'const vec3 C0 = vec3(55.0, 192.0, 251.0) / 255.0;',
    'const vec3 C1 = vec3(143.0, 224.0, 255.0) / 255.0;',
    'const vec3 C2 = vec3(26.0, 134.0, 201.0) / 255.0;',
    '',
    'const int LINE_COUNT = 6;',
    '',
    'mat2 rotate(float r) {',
    '  return mat2(cos(r), sin(r), -sin(r), cos(r));',
    '}',
    '',
    'vec3 getLineColor(float t) {',
    '  float scaled = clamp(t, 0.0, 0.9999) * 2.0;',
    '  vec3 c;',
    '  if (scaled < 1.0) {',
    '    c = mix(C0, C1, scaled);',
    '  } else {',
    '    c = mix(C1, C2, scaled - 1.0);',
    '  }',
    '  return c * 0.5;',
    '}',
    '',
    'float wave(vec2 uv, float offset) {',
    '  float time = iTime * animationSpeed;',
    '  float x_offset = offset;',
    '  float x_movement = time * 0.1;',
    '  float amp = sin(offset + time * 0.2) * 0.3;',
    '  float y = sin(uv.x + x_offset + x_movement) * amp;',
    '  float m = uv.y - y;',
    '  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;',
    '}',
    '',
    'void main() {',
    '  vec2 baseUv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;',
    '  baseUv.y *= -1.0;',
    '',
    '  vec3 col = vec3(0.0);',
    '',
    '  for (int i = 0; i < LINE_COUNT; ++i) {',
    '    float fi = float(i);',
    '    float t = fi / float(LINE_COUNT - 1);',
    '    vec3 lineCol = getLineColor(t);',
    '    float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);',
    '    vec2 ruv = baseUv * rotate(angle);',
    '    col += lineCol * wave(',
    '      ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),',
    '      1.5 + 0.2 * fi',
    '    ) * 0.2;',
    '  }',
    '',
    '  for (int i = 0; i < LINE_COUNT; ++i) {',
    '    float fi = float(i);',
    '    float t = fi / float(LINE_COUNT - 1);',
    '    vec3 lineCol = getLineColor(t);',
    '    float angle = middleWavePosition.z * log(length(baseUv) + 1.0);',
    '    vec2 ruv = baseUv * rotate(angle);',
    '    col += lineCol * wave(',
    '      ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),',
    '      2.0 + 0.15 * fi',
    '    );',
    '  }',
    '',
    '  for (int i = 0; i < LINE_COUNT; ++i) {',
    '    float fi = float(i);',
    '    float t = fi / float(LINE_COUNT - 1);',
    '    vec3 lineCol = getLineColor(t);',
    '    float angle = topWavePosition.z * log(length(baseUv) + 1.0);',
    '    vec2 ruv = baseUv * rotate(angle);',
    '    ruv.x *= -1.0;',
    '    col += lineCol * wave(',
    '      ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),',
    '      1.0 + 0.2 * fi',
    '    ) * 0.1;',
    '  }',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /**
   * Compiles a single WebGL shader.
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
   * @param {string} source - GLSL source code.
   * @returns {WebGLShader|null} The compiled shader, or null on failure.
   */
  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Floating lines shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /**
   * Links a vertex and fragment shader into a WebGL program.
   * @param {WebGLRenderingContext} gl - The WebGL context.
   * @param {WebGLShader} vertex - Compiled vertex shader.
   * @param {WebGLShader} fragment - Compiled fragment shader.
   * @returns {WebGLProgram|null} The linked program, or null on failure.
   */
  function createProgram(gl, vertex, fragment) {
    var program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Floating lines program error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  /**
   * Initializes the floating-lines WebGL animation inside the given host element.
   * @param {HTMLElement} host - The element the background canvas is attached to.
   * @returns {void}
   */
  function initFloatingLines(host) {
    var canvas = document.createElement('canvas');
    canvas.className = 'floating-lines-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false }) ||
      canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
    if (!gl) {
      // Graceful fallback: a static dark themed background handled by CSS.
      host.classList.add('floating-lines-unsupported');
      return;
    }

    var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      host.classList.add('floating-lines-unsupported');
      return;
    }

    var program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      host.classList.add('floating-lines-unsupported');
      return;
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    var positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    var uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      animationSpeed: gl.getUniformLocation(program, 'animationSpeed'),
      topWavePosition: gl.getUniformLocation(program, 'topWavePosition'),
      middleWavePosition: gl.getUniformLocation(program, 'middleWavePosition'),
      bottomWavePosition: gl.getUniformLocation(program, 'bottomWavePosition'),
      topLineDistance: gl.getUniformLocation(program, 'topLineDistance'),
      middleLineDistance: gl.getUniformLocation(program, 'middleLineDistance'),
      bottomLineDistance: gl.getUniformLocation(program, 'bottomLineDistance')
    };

    // Static configuration mirroring the React Bits defaults.
    gl.uniform1f(uniforms.animationSpeed, 1.0);
    gl.uniform3f(uniforms.topWavePosition, 10.0, 0.5, -0.4);
    gl.uniform3f(uniforms.middleWavePosition, 5.0, 0.0, 0.2);
    gl.uniform3f(uniforms.bottomWavePosition, 2.0, -0.7, -1.0);
    gl.uniform1f(uniforms.topLineDistance, 0.05);
    gl.uniform1f(uniforms.middleLineDistance, 0.05);
    gl.uniform1f(uniforms.bottomLineDistance, 0.05);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    /**
     * Resizes the drawing buffer to match the host element and device pixel ratio.
     * @returns {void}
     */
    function resize() {
      var width = host.clientWidth || 1;
      var height = host.clientHeight || 1;
      var w = Math.floor(width * dpr);
      var h = Math.floor(height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(uniforms.iResolution, canvas.width, canvas.height, 1.0);
    }

    resize();

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(host);
    } else {
      window.addEventListener('resize', resize);
    }

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var start = performance.now();
    var raf = 0;

    /**
     * Renders a single frame at the given elapsed time (seconds).
     * @param {number} timeSeconds - Elapsed time since start, in seconds.
     * @returns {void}
     */
    function draw(timeSeconds) {
      gl.uniform1f(uniforms.iTime, timeSeconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (reduceMotion) {
      // Honor reduced-motion: render a single static frame.
      draw(0);
      return;
    }

    /**
     * Animation loop driven by requestAnimationFrame.
     * @param {number} now - High-resolution timestamp from rAF.
     * @returns {void}
     */
    function loop(now) {
      draw((now - start) / 1000);
      raf = window.requestAnimationFrame(loop);
    }

    // Pause when the tab is hidden to save resources.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
      } else {
        start = performance.now();
        raf = window.requestAnimationFrame(loop);
      }
    });

    raf = window.requestAnimationFrame(loop);
  }

  /**
   * Bootstraps the floating-lines background on the banner once the DOM is ready.
   * @returns {void}
   */
  function boot() {
    var host = document.getElementById('banner');
    if (host) {
      initFloatingLines(host);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
