/* global THREE */
/**
 * Liquid fluid background (ported from LiquidEther React component).
 * Requires Three.js (global THREE).
 */
window.createLiquidEther = function createLiquidEther(mountEl, options = {}) {
  const {
    mouseForce = 20,
    cursorSize = 100,
    isViscous = false,
    viscous = 30,
    iterationsViscous = 32,
    iterationsPoisson = 32,
    dt = 0.014,
    BFECC = true,
    resolution = 0.5,
    isBounce = false,
    colors = ["#5227FF", "#FF9FFC", "#B497CF"],
    autoDemo = true,
    autoSpeed = 0.5,
    autoIntensity = 2.2,
    takeoverDuration = 0.25,
    autoResumeDelay = 1000,
    autoRampDuration = 0.6,
    getColors = null
  } = options;

  let paletteTex = null;
  let webgl = null;
  let rafId = null;
  let resizeRafId = null;
  let intersectionObserver = null;
  let resizeObserver = null;
  let isVisible = true;

  function makePaletteTexture(stops) {
    let arr;
    if (Array.isArray(stops) && stops.length > 0) {
      arr = stops.length === 1 ? [stops[0], stops[0]] : stops;
    } else {
      arr = ["#ffffff", "#ffffff"];
    }
    const w = arr.length;
    const data = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      const c = new THREE.Color(arr[i]);
      data[i * 4 + 0] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }

  paletteTex = makePaletteTexture(colors);
  const bgVec4 = new THREE.Vector4(0, 0, 0, 0);

  function refreshPalette() {
    const stops = typeof getColors === "function" ? getColors() : colors;
    const next = makePaletteTexture(stops);
    if (paletteTex) paletteTex.dispose();
    paletteTex = next;
    if (webgl?.output?.output?.material?.uniforms?.palette) {
      webgl.output.output.material.uniforms.palette.value = paletteTex;
    }
  }

  class CommonClass {
    constructor() {
      this.width = 0;
      this.height = 0;
      this.aspect = 1;
      this.pixelRatio = 1;
      this.time = 0;
      this.delta = 0;
      this.container = null;
      this.renderer = null;
      this.clock = null;
    }
    init(container) {
      this.container = container;
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.resize();
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true
      });
      if (this.renderer.debug) this.renderer.debug.checkShaderErrors = true;
      this.renderer.autoClear = false;
      this.renderer.setClearColor(new THREE.Color(0x000000), 0);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.width, this.height);
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
      this.renderer.domElement.style.display = "block";
      this.clock = new THREE.Clock();
      this.clock.start();
    }
    resize() {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(1, Math.floor(rect.width));
      this.height = Math.max(1, Math.floor(rect.height));
      this.aspect = this.width / this.height;
      if (this.renderer) this.renderer.setSize(this.width, this.height, false);
    }
    update() {
      this.delta = this.clock.getDelta();
      this.time += this.delta;
    }
  }
  const Common = new CommonClass();

  class MouseClass {
    constructor() {
      this.mouseMoved = false;
      this.coords = new THREE.Vector2();
      this.coords_old = new THREE.Vector2();
      this.diff = new THREE.Vector2();
      this.timer = null;
      this.container = null;
      this.docTarget = null;
      this.listenerTarget = null;
      this.isHoverInside = false;
      this.hasUserControl = false;
      this.isAutoActive = false;
      this.autoIntensity = 2.0;
      this.takeoverActive = false;
      this.takeoverStartTime = 0;
      this.takeoverDuration = 0.25;
      this.takeoverFrom = new THREE.Vector2();
      this.takeoverTo = new THREE.Vector2();
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.onInteract = null;
      this._onMouseMove = this.onDocumentMouseMove.bind(this);
      this._onTouchStart = this.onDocumentTouchStart.bind(this);
      this._onTouchMove = this.onDocumentTouchMove.bind(this);
      this._onTouchEnd = this.onTouchEnd.bind(this);
      this._onDocumentLeave = this.onDocumentLeave.bind(this);
    }
    init(container) {
      this.container = container;
      this.docTarget = container.ownerDocument || null;
      const defaultView = (this.docTarget && this.docTarget.defaultView) || window;
      this.listenerTarget = defaultView;
      this.listenerTarget.addEventListener("mousemove", this._onMouseMove);
      this.listenerTarget.addEventListener("touchstart", this._onTouchStart, { passive: true });
      this.listenerTarget.addEventListener("touchmove", this._onTouchMove, { passive: true });
      this.listenerTarget.addEventListener("touchend", this._onTouchEnd);
      if (this.docTarget) this.docTarget.addEventListener("mouseleave", this._onDocumentLeave);
    }
    dispose() {
      if (this.listenerTarget) {
        this.listenerTarget.removeEventListener("mousemove", this._onMouseMove);
        this.listenerTarget.removeEventListener("touchstart", this._onTouchStart);
        this.listenerTarget.removeEventListener("touchmove", this._onTouchMove);
        this.listenerTarget.removeEventListener("touchend", this._onTouchEnd);
      }
      if (this.docTarget) this.docTarget.removeEventListener("mouseleave", this._onDocumentLeave);
      this.listenerTarget = null;
      this.docTarget = null;
      this.container = null;
    }
    isPointInside(clientX, clientY) {
      if (!this.container) return false;
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }
    updateHoverState(clientX, clientY) {
      this.isHoverInside = this.isPointInside(clientX, clientY);
      return this.isHoverInside;
    }
    setCoords(x, y) {
      if (!this.container) return;
      if (this.timer) window.clearTimeout(this.timer);
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = (x - rect.left) / rect.width;
      const ny = (y - rect.top) / rect.height;
      this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
      this.mouseMoved = true;
      this.timer = window.setTimeout(() => {
        this.mouseMoved = false;
      }, 100);
    }
    setNormalized(nx, ny) {
      this.coords.set(nx, ny);
      this.mouseMoved = true;
    }
    onDocumentMouseMove(event) {
      if (!this.updateHoverState(event.clientX, event.clientY)) return;
      if (this.onInteract) this.onInteract();
      if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = (event.clientY - rect.top) / rect.height;
        this.takeoverFrom.copy(this.coords);
        this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
        this.takeoverStartTime = performance.now();
        this.takeoverActive = true;
        this.hasUserControl = true;
        this.isAutoActive = false;
        return;
      }
      this.setCoords(event.clientX, event.clientY);
      this.hasUserControl = true;
    }
    isScrollGesture(clientX, clientY) {
      const dx = Math.abs(clientX - this.touchStartX);
      const dy = Math.abs(clientY - this.touchStartY);
      return dy > 12 && dy > dx * 1.25;
    }
    onDocumentTouchStart(event) {
      if (event.touches.length !== 1) return;
      const t = event.touches[0];
      this.touchStartX = t.clientX;
      this.touchStartY = t.clientY;
      if (!this.updateHoverState(t.clientX, t.clientY)) return;
      if (this.onInteract) this.onInteract();
      this.setCoords(t.clientX, t.clientY);
      this.hasUserControl = true;
    }
    onDocumentTouchMove(event) {
      if (event.touches.length !== 1) return;
      const t = event.touches[0];
      if (this.isScrollGesture(t.clientX, t.clientY)) return;
      if (!this.updateHoverState(t.clientX, t.clientY)) return;
      if (this.onInteract) this.onInteract();
      this.setCoords(t.clientX, t.clientY);
    }
    onTouchEnd() {
      this.isHoverInside = false;
    }
    onDocumentLeave() {
      this.isHoverInside = false;
    }
    update() {
      if (this.takeoverActive) {
        const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
        if (t >= 1) {
          this.takeoverActive = false;
          this.coords.copy(this.takeoverTo);
          this.coords_old.copy(this.coords);
          this.diff.set(0, 0);
        } else {
          const k = t * t * (3 - 2 * t);
          this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
        }
      }
      this.diff.subVectors(this.coords, this.coords_old);
      this.coords_old.copy(this.coords);
      if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
      if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
    }
  }
  const Mouse = new MouseClass();

  class AutoDriver {
    constructor(mouse, manager, opts) {
      this.mouse = mouse;
      this.manager = manager;
      this.enabled = opts.enabled;
      this.speed = opts.speed;
      this.resumeDelay = opts.resumeDelay || 3000;
      this.rampDurationMs = (opts.rampDuration || 0) * 1000;
      this.active = false;
      this.current = new THREE.Vector2(0, 0);
      this.target = new THREE.Vector2();
      this.lastTime = performance.now();
      this.activationTime = 0;
      this.margin = 0.2;
      this._tmpDir = new THREE.Vector2();
      this.pickNewTarget();
    }
    pickNewTarget() {
      const r = Math.random;
      this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
    }
    forceStop() {
      this.active = false;
      this.mouse.isAutoActive = false;
    }
    update() {
      if (!this.enabled) return;
      const now = performance.now();
      const idle = now - this.manager.lastUserInteraction;
      if (idle < this.resumeDelay) {
        if (this.active) this.forceStop();
        return;
      }
      if (this.mouse.isHoverInside) {
        if (this.active) this.forceStop();
        return;
      }
      if (!this.active) {
        this.active = true;
        this.current.copy(this.mouse.coords);
        this.lastTime = now;
        this.activationTime = now;
      }
      if (!this.active) return;
      this.mouse.isAutoActive = true;
      let dtSec = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dtSec > 0.2) dtSec = 0.016;
      const dir = this._tmpDir.subVectors(this.target, this.current);
      const dist = dir.length();
      if (dist < 0.01) {
        this.pickNewTarget();
        return;
      }
      dir.normalize();
      let ramp = 1;
      if (this.rampDurationMs > 0) {
        const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
        ramp = t * t * (3 - 2 * t);
      }
      const step = this.speed * dtSec * ramp;
      const move = Math.min(step, dist);
      this.current.addScaledVector(dir, move);
      this.mouse.setNormalized(this.current.x, this.current.y);
    }
  }

  const face_vert = `
  attribute vec3 position;
  uniform vec2 px;
  uniform vec2 boundarySpace;
  varying vec2 uv;
  precision highp float;
  void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5)+(pos.xy)*0.5;
  gl_Position = vec4(pos, 1.0);
}`;
  const line_vert = `
  attribute vec3 position;
  uniform vec2 px;
  precision highp float;
  varying vec2 uv;
  void main(){
  vec3 pos = position;
  uv = 0.5 + pos.xy * 0.5;
  vec2 n = sign(pos.xy);
  pos.xy = abs(pos.xy) - px * 1.0;
  pos.xy *= n;
  gl_Position = vec4(pos, 1.0);
}`;
  const mouse_vert = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform vec2 center;
    uniform vec2 scale;
    uniform vec2 px;
    varying vec2 vUv;
    void main(){
    vec2 pos = position.xy * scale * 2.0 * px + center;
    vUv = uv;
    gl_Position = vec4(pos, 0.0, 1.0);
}`;
  const advection_frag = `
    precision highp float;
    uniform sampler2D velocity;
    uniform float dt;
    uniform bool isBFECC;
    uniform vec2 fboSize;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
    if(isBFECC == false){
        vec2 vel = texture2D(velocity, uv).xy;
        vec2 uv2 = uv - vel * dt * ratio;
        vec2 newVel = texture2D(velocity, uv2).xy;
        gl_FragColor = vec4(newVel, 0.0, 0.0);
    } else {
        vec2 spot_new = uv;
        vec2 vel_old = texture2D(velocity, uv).xy;
        vec2 spot_old = spot_new - vel_old * dt * ratio;
        vec2 vel_new1 = texture2D(velocity, spot_old).xy;
        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
        vec2 error = spot_new2 - spot_new;
        vec2 spot_new3 = spot_new - error / 2.0;
        vec2 vel_2 = texture2D(velocity, spot_new3).xy;
        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
        vec2 newVel2 = texture2D(velocity, spot_old2).xy;
        gl_FragColor = vec4(newVel2, 0.0, 0.0);
    }
}`;
    const color_frag = `
    precision highp float;
    uniform sampler2D velocity;
    uniform sampler2D palette;
    uniform vec4 bgColor;
    varying vec2 uv;
    void main(){
    vec2 vel = texture2D(velocity, uv).xy;
    float lenv = clamp(length(vel), 0.0, 1.0);
    vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
    gl_FragColor = vec4(mix(bgColor.rgb, c, lenv), mix(bgColor.a, 1.0, lenv));
}`;
  const divergence_frag = `
    precision highp float;
    uniform sampler2D velocity;
    uniform float dt;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
    float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
    float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
    float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
    float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
    float divergence = (x1 - x0 + y1 - y0) / 2.0;
    gl_FragColor = vec4(divergence / dt);
}`;
  const externalForce_frag = `
    precision highp float;
    uniform vec2 force;
    uniform vec2 center;
    uniform vec2 scale;
    uniform vec2 px;
    varying vec2 vUv;
    void main(){
    vec2 circle = (vUv - 0.5) * 2.0;
    float d = 1.0 - min(length(circle), 1.0);
    d *= d;
    gl_FragColor = vec4(force * d, 0.0, 1.0);
}`;
  const poisson_frag = `
    precision highp float;
    uniform sampler2D pressure;
    uniform sampler2D divergence;
    uniform vec2 px;
    varying vec2 uv;
    void main(){
    float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
    float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
    float div = texture2D(divergence, uv).r;
    float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
    gl_FragColor = vec4(newP);
}`;
  const pressure_frag = `
    precision highp float;
    uniform sampler2D pressure;
    uniform sampler2D velocity;
    uniform vec2 px;
    uniform float dt;
    varying vec2 uv;
    void main(){
    float step = 1.0;
    float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;
    float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;
    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;
    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;
    vec2 v = texture2D(velocity, uv).xy;
    vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
    v = v - gradP * dt;
    gl_FragColor = vec4(v, 0.0, 1.0);
}`;
  const viscous_frag = `
    precision highp float;
    uniform sampler2D velocity;
    uniform sampler2D velocity_new;
    uniform float v;
    uniform vec2 px;
    uniform float dt;
    varying vec2 uv;
    void main(){
    vec2 old = texture2D(velocity, uv).xy;
    vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
    vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
    vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
    vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
    vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
    newv /= 4.0 * (1.0 + v * dt);
    gl_FragColor = vec4(newv, 0.0, 0.0);
}`;

  class ShaderPass {
    constructor(props) {
      this.props = props || {};
      this.uniforms = this.props.material?.uniforms;
      this.scene = null;
      this.camera = null;
      this.material = null;
      this.geometry = null;
      this.plane = null;
    }
    init() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      if (this.uniforms) {
        this.material = new THREE.RawShaderMaterial(this.props.material);
        this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
      }
    }
    update() {
      Common.renderer.setRenderTarget(this.props.output || null);
      Common.renderer.render(this.scene, this.camera);
      Common.renderer.setRenderTarget(null);
    }
  }

  class Advection extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: advection_frag,
          uniforms: {
            boundarySpace: { value: simProps.cellScale },
            px: { value: simProps.cellScale },
            fboSize: { value: simProps.fboSize },
            velocity: { value: simProps.src.texture },
            dt: { value: simProps.dt },
            isBFECC: { value: true }
          }
        },
        output: simProps.dst
      });
      this.uniforms = this.props.material.uniforms;
      this.init();
    }
    init() {
      super.init();
      this.createBoundary();
    }
    createBoundary() {
      const boundaryG = new THREE.BufferGeometry();
      const vertices_boundary = new Float32Array([
        -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0
      ]);
      boundaryG.setAttribute("position", new THREE.BufferAttribute(vertices_boundary, 3));
      const boundaryM = new THREE.RawShaderMaterial({
        vertexShader: line_vert,
        fragmentShader: advection_frag,
        uniforms: this.uniforms
      });
      this.line = new THREE.LineSegments(boundaryG, boundaryM);
      this.scene.add(this.line);
    }
    update({ dt: stepDt, isBounce, BFECC: useBFECC }) {
      this.uniforms.dt.value = stepDt;
      this.line.visible = isBounce;
      this.uniforms.isBFECC.value = useBFECC;
      super.update();
    }
  }

  class ExternalForce extends ShaderPass {
    constructor(simProps) {
      super({ output: simProps.dst });
      this.init(simProps);
    }
    init(simProps) {
      super.init();
      const mouseG = new THREE.PlaneGeometry(1, 1);
      const mouseM = new THREE.RawShaderMaterial({
        vertexShader: mouse_vert,
        fragmentShader: externalForce_frag,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          px: { value: simProps.cellScale },
          force: { value: new THREE.Vector2(0.0, 0.0) },
          center: { value: new THREE.Vector2(0.0, 0.0) },
          scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
        }
      });
      this.mouse = new THREE.Mesh(mouseG, mouseM);
      this.scene.add(this.mouse);
    }
    update(props) {
      const forceX = (Mouse.diff.x / 2) * props.mouse_force;
      const forceY = (Mouse.diff.y / 2) * props.mouse_force;
      const cursorSizeX = props.cursor_size * props.cellScale.x;
      const cursorSizeY = props.cursor_size * props.cellScale.y;
      const centerX = Math.min(
        Math.max(Mouse.coords.x, -1 + cursorSizeX + props.cellScale.x * 2),
        1 - cursorSizeX - props.cellScale.x * 2
      );
      const centerY = Math.min(
        Math.max(Mouse.coords.y, -1 + cursorSizeY + props.cellScale.y * 2),
        1 - cursorSizeY - props.cellScale.y * 2
      );
      const uniforms = this.mouse.material.uniforms;
      uniforms.force.value.set(forceX, forceY);
      uniforms.center.value.set(centerX, centerY);
      uniforms.scale.value.set(props.cursor_size, props.cursor_size);
      super.update();
    }
  }

  class Viscous extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: viscous_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            velocity: { value: simProps.src.texture },
            velocity_new: { value: simProps.dst_.texture },
            v: { value: simProps.viscous },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst,
        output0: simProps.dst_,
        output1: simProps.dst
      });
      this.init();
    }
    update({ viscous: v, iterations, dt: stepDt }) {
      let fbo_in;
      let fbo_out;
      this.uniforms.v.value = v;
      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          fbo_in = this.props.output0;
          fbo_out = this.props.output1;
        } else {
          fbo_in = this.props.output1;
          fbo_out = this.props.output0;
        }
        this.uniforms.velocity_new.value = fbo_in.texture;
        this.props.output = fbo_out;
        this.uniforms.dt.value = stepDt;
        super.update();
      }
      return fbo_out;
    }
  }

  class Divergence extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: divergence_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            velocity: { value: simProps.src.texture },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      });
      this.init();
    }
    update({ vel }) {
      this.uniforms.velocity.value = vel.texture;
      super.update();
    }
  }

  class Poisson extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: poisson_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            pressure: { value: simProps.dst_.texture },
            divergence: { value: simProps.src.texture },
            px: { value: simProps.cellScale }
          }
        },
        output: simProps.dst,
        output0: simProps.dst_,
        output1: simProps.dst
      });
      this.init();
    }
    update({ iterations }) {
      let p_in;
      let p_out;
      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          p_in = this.props.output0;
          p_out = this.props.output1;
        } else {
          p_in = this.props.output1;
          p_out = this.props.output0;
        }
        this.uniforms.pressure.value = p_in.texture;
        this.props.output = p_out;
        super.update();
      }
      return p_out;
    }
  }

  class Pressure extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert,
          fragmentShader: pressure_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            pressure: { value: simProps.src_p.texture },
            velocity: { value: simProps.src_v.texture },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      });
      this.init();
    }
    update({ vel, pressure }) {
      this.uniforms.velocity.value = vel.texture;
      this.uniforms.pressure.value = pressure.texture;
      super.update();
    }
  }

  function getRenderTargetType(renderer) {
    const gl = renderer.getContext();
    const extFloat = gl.getExtension("EXT_color_buffer_float");
    const extHalf = gl.getExtension("EXT_color_buffer_half_float");
    const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
    if (isWebGL2 || extFloat) return THREE.FloatType;
    if (extHalf) return THREE.HalfFloatType;
    return THREE.UnsignedByteType;
  }

  class Simulation {
    constructor(simOptions, renderer) {
      this.renderer = renderer;
      this.options = {
        iterations_poisson: iterationsPoisson,
        iterations_viscous: iterationsViscous,
        mouse_force: mouseForce,
        resolution,
        cursor_size: cursorSize,
        viscous,
        isBounce,
        dt,
        isViscous,
        BFECC,
        ...simOptions
      };
      this.fbos = {
        vel_0: null,
        vel_1: null,
        vel_viscous0: null,
        vel_viscous1: null,
        div: null,
        pressure_0: null,
        pressure_1: null
      };
      this.fboSize = new THREE.Vector2();
      this.cellScale = new THREE.Vector2();
      this.boundarySpace = new THREE.Vector2();
      this.init();
    }
    init() {
      this.calcSize();
      this.createAllFBO();
      this.createShaderPass();
    }
    createAllFBO() {
      const type = getRenderTargetType(this.renderer);
      const opts = {
        type,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping
      };
      for (const key in this.fbos) {
        this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts);
      }
    }
    createShaderPass() {
      this.advection = new Advection({
        cellScale: this.cellScale,
        fboSize: this.fboSize,
        dt: this.options.dt,
        src: this.fbos.vel_0,
        dst: this.fbos.vel_1
      });
      this.externalForce = new ExternalForce({
        cellScale: this.cellScale,
        cursor_size: this.options.cursor_size,
        dst: this.fbos.vel_1
      });
      this.viscous = new Viscous({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        viscous: this.options.viscous,
        src: this.fbos.vel_1,
        dst: this.fbos.vel_viscous1,
        dst_: this.fbos.vel_viscous0,
        dt: this.options.dt
      });
      this.divergence = new Divergence({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src: this.fbos.vel_viscous0,
        dst: this.fbos.div,
        dt: this.options.dt
      });
      this.poisson = new Poisson({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src: this.fbos.div,
        dst: this.fbos.pressure_1,
        dst_: this.fbos.pressure_0
      });
      this.pressure = new Pressure({
        cellScale: this.cellScale,
        boundarySpace: this.boundarySpace,
        src_p: this.fbos.pressure_0,
        src_v: this.fbos.vel_viscous0,
        dst: this.fbos.vel_0,
        dt: this.options.dt
      });
    }
    calcSize() {
      const width = Math.max(1, Math.round(this.options.resolution * Common.width));
      const height = Math.max(1, Math.round(this.options.resolution * Common.height));
      const px_x = 1.0 / width;
      const px_y = 1.0 / height;
      this.cellScale.set(px_x, px_y);
      this.fboSize.set(width, height);
    }
    resize() {
      this.calcSize();
      for (const key in this.fbos) {
        this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
      }
    }
    update() {
      if (this.options.isBounce) {
        this.boundarySpace.set(0, 0);
      } else {
        this.boundarySpace.copy(this.cellScale);
      }
      this.advection.update({
        dt: this.options.dt,
        isBounce: this.options.isBounce,
        BFECC: this.options.BFECC
      });
      this.externalForce.update({
        cursor_size: this.options.cursor_size,
        mouse_force: this.options.mouse_force,
        cellScale: this.cellScale
      });
      let vel = this.fbos.vel_1;
      if (this.options.isViscous) {
        vel = this.viscous.update({
          viscous: this.options.viscous,
          iterations: this.options.iterations_viscous,
          dt: this.options.dt
        });
      }
      this.divergence.update({ vel });
      const pressure = this.poisson.update({
        iterations: this.options.iterations_poisson
      });
      this.pressure.update({ vel, pressure });
    }
  }

  class Output {
    constructor(renderer) {
      this.renderer = renderer;
      this.init();
    }
    init() {
      this.simulation = new Simulation({}, this.renderer);
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.output = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
          vertexShader: face_vert,
          fragmentShader: color_frag,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: { value: this.simulation.fbos.vel_0.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTex },
            bgColor: { value: bgVec4 }
          }
        })
      );
      this.scene.add(this.output);
    }
    resize() {
      this.simulation.resize();
    }
    render() {
      Common.renderer.setRenderTarget(null);
      Common.renderer.render(this.scene, this.camera);
    }
    update() {
      this.simulation.update();
      this.render();
    }
  }

  class WebGLManager {
    constructor(props) {
      this.props = props;
      Common.init(props.$wrapper);
      Mouse.init(props.$wrapper);
      Mouse.autoIntensity = props.autoIntensity;
      Mouse.takeoverDuration = props.takeoverDuration;
      this.lastUserInteraction = performance.now();
      Mouse.onInteract = () => {
        this.lastUserInteraction = performance.now();
        if (this.autoDriver) this.autoDriver.forceStop();
      };
      this.autoDriver = new AutoDriver(Mouse, this, {
        enabled: props.autoDemo,
        speed: props.autoSpeed,
        resumeDelay: props.autoResumeDelay,
        rampDuration: props.autoRampDuration
      });
      this.init();
      this._loop = this.loop.bind(this);
      this._resize = this.resize.bind(this);
      window.addEventListener("resize", this._resize);
      this._onVisibility = () => {
        if (document.hidden) {
          this.pause();
        } else if (isVisible) {
          this.start();
        }
      };
      document.addEventListener("visibilitychange", this._onVisibility);
      this.running = false;
    }
    init() {
      this.props.$wrapper.prepend(Common.renderer.domElement);
      this.output = new Output(Common.renderer);
      this.failed = false;
      try {
        Common.resize();
        if (Common.width < 2 || Common.height < 2) this.failed = true;
        else this.render();
      } catch (_err) {
        this.failed = true;
      }
    }
    resize() {
      Common.resize();
      this.output.resize();
    }
    render() {
      if (this.autoDriver) this.autoDriver.update();
      Mouse.update();
      Common.update();
      this.output.update();
    }
    loop() {
      if (!this.running) return;
      this.render();
      rafId = requestAnimationFrame(this._loop);
    }
    start() {
      if (this.running) return;
      this.running = true;
      this._loop();
    }
    pause() {
      this.running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
    dispose() {
      try {
        window.removeEventListener("resize", this._resize);
        document.removeEventListener("visibilitychange", this._onVisibility);
        Mouse.dispose();
        if (Common.renderer) {
          const canvas = Common.renderer.domElement;
          if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
          Common.renderer.dispose();
          Common.renderer.forceContextLoss();
        }
      } catch (_e) {
        /* ignore */
      }
    }
  }

  if (!mountEl || typeof THREE === "undefined") {
    return { dispose() {}, start() {}, pause() {}, resize() {}, setColors() {}, updateOptions() {} };
  }

  mountEl.style.overflow = mountEl.style.overflow || "hidden";

  try {
    webgl = new WebGLManager({
      $wrapper: mountEl,
      autoDemo,
      autoSpeed,
      autoIntensity,
      takeoverDuration,
      autoResumeDelay,
      autoRampDuration
    });
    if (webgl.failed) {
      webgl.dispose();
      return { dispose() {}, start() {}, pause() {}, resize() {}, setColors() {}, updateOptions() {}, failed: true };
    }
    webgl.start();
  } catch (_err) {
    return { dispose() {}, start() {}, pause() {}, resize() {}, setColors() {}, updateOptions() {}, failed: true };
  }

  isVisible = true;

  resizeObserver = new ResizeObserver(() => {
    if (!webgl) return;
    if (resizeRafId) cancelAnimationFrame(resizeRafId);
    resizeRafId = requestAnimationFrame(() => {
      if (webgl) webgl.resize();
    });
  });
  resizeObserver.observe(mountEl);

  function applySimOptions(opts) {
    if (!webgl?.output?.simulation) return;
    const sim = webgl.output.simulation;
    const prevRes = sim.options.resolution;
    Object.assign(sim.options, opts);
    if (opts.resolution !== undefined && opts.resolution !== prevRes) sim.resize();
  }

  applySimOptions({
    mouse_force: mouseForce,
    cursor_size: cursorSize,
    isViscous,
    viscous,
    iterations_viscous: iterationsViscous,
    iterations_poisson: iterationsPoisson,
    dt,
    BFECC,
    resolution,
    isBounce
  });

  const onColorschemeChanged = () => refreshPalette();
  window.addEventListener("colorscheme:changed", onColorschemeChanged);

  function dispose() {
    window.removeEventListener("colorscheme:changed", onColorschemeChanged);
    if (rafId) cancelAnimationFrame(rafId);
    if (resizeRafId) cancelAnimationFrame(resizeRafId);
    try {
      resizeObserver?.disconnect();
    } catch (_e) {
      /* ignore */
    }
    try {
      intersectionObserver?.disconnect();
    } catch (_e) {
      /* ignore */
    }
    webgl?.dispose();
    webgl = null;
    if (paletteTex) paletteTex.dispose();
    paletteTex = null;
  }

  return {
    dispose,
    start: () => webgl?.start(),
    pause: () => webgl?.pause(),
    resize: () => webgl?.resize(),
    setColors(newColors) {
      if (paletteTex) paletteTex.dispose();
      paletteTex = makePaletteTexture(newColors);
      if (webgl?.output?.output?.material?.uniforms?.palette) {
        webgl.output.output.material.uniforms.palette.value = paletteTex;
      }
    },
    refreshPalette,
    updateOptions(opts) {
      if (!webgl) return;
      const simOpts = {};
      if (opts.mouseForce !== undefined) simOpts.mouse_force = opts.mouseForce;
      if (opts.cursorSize !== undefined) simOpts.cursor_size = opts.cursorSize;
      if (opts.isViscous !== undefined) simOpts.isViscous = opts.isViscous;
      if (opts.viscous !== undefined) simOpts.viscous = opts.viscous;
      if (opts.iterationsViscous !== undefined) simOpts.iterations_viscous = opts.iterationsViscous;
      if (opts.iterationsPoisson !== undefined) simOpts.iterations_poisson = opts.iterationsPoisson;
      if (opts.dt !== undefined) simOpts.dt = opts.dt;
      if (opts.BFECC !== undefined) simOpts.BFECC = opts.BFECC;
      if (opts.resolution !== undefined) simOpts.resolution = opts.resolution;
      if (opts.isBounce !== undefined) simOpts.isBounce = opts.isBounce;
      applySimOptions(simOpts);
      if (webgl.autoDriver) {
        if (opts.autoDemo !== undefined) webgl.autoDriver.enabled = opts.autoDemo;
        if (opts.autoSpeed !== undefined) webgl.autoDriver.speed = opts.autoSpeed;
        if (opts.autoResumeDelay !== undefined) webgl.autoDriver.resumeDelay = opts.autoResumeDelay;
        if (opts.autoRampDuration !== undefined) webgl.autoDriver.rampDurationMs = opts.autoRampDuration * 1000;
      }
      if (opts.autoIntensity !== undefined) Mouse.autoIntensity = opts.autoIntensity;
      if (opts.takeoverDuration !== undefined) Mouse.takeoverDuration = opts.takeoverDuration;
    }
  };
};
