require('../app.styl');
let glm = require('gl-matrix');
console.log(glm);
Object.assign(window, glm);


const DIFFUSE = vec3.fromValues(1.00, 0.66, 0.00);
const AMBIENT = vec3.fromValues(0.1, 0.1, 0.1);
const SPECULAR = vec3.fromValues(0.50, 0.50, 0.50);
const SHININESS = 50;

const LIGHT_POSITION = vec3.fromValues(0.25, 0.25, 1);

const TRANSLATION = vec3.fromValues(0, 0, -3);

const FIELD_OF_VIEW_DEG = 45;
const Z_NEAR = 0.01;
const Z_FAR = 50;

const SLICES = 192;
const STACKS = 48;

const TREFOIL_A = 0.6;
const TREFOIL_B = 0.3;
const TREFOIL_C = 0.5;
const TREFOIL_D = 0.15;

const CEL_SHADING_LEVEL = 4;

const OUTLINE_WIDTH = 0.02;
const OUTLINE_COLOR = vec4.fromValues(0.0, 0.0, 0.0, 1);

let Epsilon = 0.01;

let VertexCount = SLICES * STACKS;
let IndexCount = VertexCount * 6;

let Tau = 2 * Math.PI;

let OutlineVertShaderSrc = `
precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_projectionMat;
uniform mat4 u_modelviewMat;
uniform float u_offset;

void main() {
  vec4 p = vec4(a_position+a_normal*u_offset, 1.0);
  gl_Position = u_projectionMat * u_modelviewMat * p;
}
`;

let OutlineFragShaderSrc = `
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`;

let CelVertShaderSrc = `
precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_projectionMat;
uniform mat4 u_modelviewMat;
uniform mat3 u_normalMat;
uniform vec3 u_diffuse;

varying vec3 v_eyeNormal;
varying vec3 v_diffuse;

void main() {
  v_eyeNormal = u_normalMat * a_normal;
  v_diffuse = u_diffuse;
  gl_Position = u_projectionMat * u_modelviewMat * vec4(a_position, 1.0);
}
`;

let CelFragShaderSrc = `
precision mediump float;
varying vec3 v_eyeNormal;
varying vec3 v_diffuse;

uniform vec3 u_light;
uniform vec3 u_ambient;
uniform vec3 u_specular;
uniform float u_shine;
uniform float u_celShading;

float celShade(float d) {
  float E = 0.05;
  d *= u_celShading;
  float r = 1.0 / (u_celShading-0.5);
  float fd = floor(d);
  float dr = d * r;
  if (d > fd-E && d < fd+E) {
    float last = (fd - sign(d - fd))*r;
    return mix(last, fd*r, 
      smoothstep((fd-E)*r, (fd+E)*r, dr));
  } else {
    return fd*r;
  }
}

void main() {
  vec3 en = normalize(v_eyeNormal);
  vec3 ln = normalize(u_light);
  vec3 hn = normalize(ln + vec3(0, 0, 1));
  float E = 0.05;

  float df = max(0.0, dot(en, ln));
  float sf = max(0.0, dot(en, hn));

  float cdf = celShade(df);  

  sf = pow(sf, u_shine);

  if (sf > 0.5 - E && sf < 0.5 + E) {
    sf = smoothstep(0.5 - E, 0.5 + E, sf);
  } else {
    sf = step(0.5, sf);
  }

  float csf = sf;

  vec3 color = u_ambient + cdf * v_diffuse + csf * u_specular;


  gl_FragColor = vec4(color, 1.0);
}
`;

let glEnumToString = function(gl, glenum) {
  var name, val;
  for (name in gl) {
    if (!gl.hasOwnProperty(name)) continue;
    val = gl[name];
    if (val === glenum) {
      return name;
    }
  }
  return "0x" + (glenum.toString(16));
};

/**
 * webglのエラーをチェックしコンソールに出力
 * @param gl
 */
let glCheckAndLogError = function(gl) {
  let err = gl.getError();
  if (err !== gl.NO_ERROR) {
    return console.error(glEnumToString(gl, err));
  }
};

//エラーをcanvasに描画する
let fatalError = function(canvas, message) {
  let ctx;
  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px san-serif';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  throw new Error(message);
};
// WebGLのコンテキストを取得
let getWebGLContext = function(canvas, glattrs=null) {
  let ctx;
  let ref = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
  for (let i = 0, len = ref.length; i < len; i++) {
    let alias = ref[i];
    try {
      if (ctx = canvas.getContext(alias, glattrs)) {
        return ctx;
      }
    } catch (_error) {}
  }
  return fatalError(canvas, 'WebGL initialization failed (check browser support?)');
};

// トレフォイル（三つ葉模様）を描画
let trefoil = function(s, t) {
  let u = (1 - s) * 2 * Tau;
  let v = t * Tau;
  let sinu = Math.sin(1.0 * u);
  let cosu = Math.cos(1.0 * u);
  let sinv = Math.sin(1.0 * v);
  let cosv = Math.cos(1.0 * v);
  let su15 = Math.sin(1.5 * u);
  let cu15 = Math.cos(1.5 * u);
  let r = TREFOIL_A + TREFOIL_B * cu15;
  let dv = [-1.5 * TREFOIL_B * su15 * cosu - r * sinu,
            -1.5 * TREFOIL_B * su15 * sinu + r * cosu,
            +1.5 * TREFOIL_C * cu15];
  let q = vec3.normalize(vec3.create(), dv);
  let qv = vec3.normalize(vec3.create(), [q[1], -q[0], 0]);
  //let ww = vec3.cross(vec3.create(), q, qv);
  return [r * cosu + TREFOIL_D * (qv[0] * cosv + (-dv[2] * qv[1]) * sinv),
          r * sinu + TREFOIL_D * (qv[1] * cosv + (+dv[2] * qv[0]) * sinv),
          TREFOIL_C * su15 + TREFOIL_D * (dv[0] * qv[1] - dv[1] * qv[0]) * sinv];
};

class VertexBuffer{

  constructor(gl){
    var i, j, sMax, sStep, tMax, tStep, s, t;
    let ds = 1.0 / SLICES;
    let dt = 1.0 / STACKS;
    let buf = [];
    for(s = i = 0, sMax = 1 - ds / 2, sStep = ds; sStep > 0 ? i < sMax : i > sMax; s = i += sStep){
      for(t = j = 0, tMax = 1 - dt / 2, tStep = dt; tStep > 0 ? j < tMax : j > tMax; t = j += tStep){
        let p = trefoil(s, t);
        let u = vec3.sub([], trefoil(s + Epsilon, t), p);
        let v = vec3.sub([], trefoil(s, t + Epsilon), p);
        //let n = vec3.cross([], u, v);
        u = vec3.cross(u, u, v);
        vec3.normalize(u, u);
        buf.push(p[0]);
        buf.push(p[1]);
        buf.push(p[2]);
        buf.push(u[0]);
        buf.push(u[1]);
        buf.push(u[2]);
      }
    }
    let verts = new Float32Array(buf);
    this.handle = gl.createBuffer();
    console.assert(this.handle !== null, "gl.createBuffer failed" + glEnumToString(gl, gl.getError()));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.handle);
    return gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  }

  bind(gl){
    gl.bindBuffer(gl.ARRAY_BUFFER, this.handle);
  }
}

class IndexBuffer {

  constructor(gl){
    let idxs = new Uint16Array(IndexCount);
    let n = 0;
    let ii = 0;
    let i, j, k, l;

    // 0からSLICESまでループ
    for(i = k = 0; 0 <= SLICES ? k < SLICES : k > SLICES; i = 0 <= SLICES ? ++k : --k){
      // 0からSTACKSまでループ
      for(j = l = 0; 0 <= STACKS ? l < STACKS : l > STACKS; j = 0 <= STACKS ? ++l : --l){
        idxs[ii++] = n + j;
        idxs[ii++] = n + (j + 1) % STACKS;
        idxs[ii++] = (n + j + STACKS) % VertexCount;
        idxs[ii++] = (n + j + STACKS) % VertexCount;
        idxs[ii++] = (n + (j + 1) % STACKS) % VertexCount;
        idxs[ii++] = (n + (j + 1) % STACKS + STACKS) % VertexCount;
      }
      n += STACKS;
    }

    this.handle = gl.createBuffer();
    console.assert(this.handle !== null, "gl.createBuffer failed");
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.handle);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxs, gl.STATIC_DRAW);

  }

  bind(gl){
    return gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.handle);
  }

}

class ShaderProgram {

  compileShader(gl, src, typestr){
    let shader = gl.createShader(gl[typestr]);
    console.assert(shader, `createShader failed. type='${typestr}'`);
    gl.shaderSource(shader, src.trim());
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      let log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error(`${typestr} shader info log:\n#{log}`);
      fatalError("failed to compile ${typestr}");
    }
    return shader;
  }


  constructor(gl, vsrc, fsrc, attribLocs){
    let fs = this.compileShader(gl, fsrc, 'FRAGMENT_SHADER');
    let vs = this.compileShader(gl, vsrc, 'VERTEX_SHADER');

    this.program = gl.createProgram();
    console.assert(!!this.program, "gl.createProgram failed");

    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);

    for(let attrib in attribLocs){
      if(!attribLocs.hasOwnProperty(attrib)) continue;
      let loc = attribLocs[attrib];
      gl.bindAttribLocation(this.program, loc, attrib);
    }

    gl.linkProgram(this.program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if(!gl.getProgramParameter(this.program, gl.LINK_STATUS)){
      let log = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      console.error(`program info log:\n${log}`);
      fatalError(`shader link failed: ${log}`);
    }

    this.uniforms = {};
    let len = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) || 0;
    let i, j;

    for(i = j = 0; 0 <= len ? j < len : j > len; i = 0 <= len ? ++j : --j){
      let info = gl.getActiveUniform(this.program, i);
      if(info != null){
        this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name);
      }
    }

    this.attributes = {};
    let len2 = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES) || 0;
    let l, k;

    for(k = l = 0; 0 <= len2 ? l < len2 : l > len2; k = 0 <= len2 ? ++l : --l){
      let info = gl.getActiveAttrib(this.program, i);
      if(info != null){
        this.attributes[info.name] = gl.getAttribLocation(this.program, info.name);
      }
    }
  }

  use(gl){
    gl.useProgram(this.program);
  }

  setUniform1f(gl, name, x){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform1f(loc, x);
    }
  }

  setUniform2f(gl, name, x, y){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform2f(loc, x, y);
    }
  }

  setUniform3f(gl, name, x, y, z){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform3f(loc, x, y, z);
    }
  }

  setUniform4f(gl, name, x, y, z, w){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform4f(loc, x, y, z, w);
    }
  }

  setUniform1fv(gl, name, arr){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform1fv(loc, arr);
    }
  }

  setUniform2fv(gl, name, arr){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform2fv(loc, arr);
    }
  }

  setUniform3fv(gl, name, arr){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform3fv(loc, arr);
    }
  }

  setUniform4fv(gl, name, arr){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniform4fv(loc, arr);
    }
  }

  setUniformMatrix1fv(gl, name, m){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniformMatrix1fv(loc, gl.FALSE, m);
    }
  }

  setUniformMatrix2fv(gl, name, m){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniformMatrix2fv(loc, gl.FALSE, m);
    }
  }

  setUniformMatrix3fv(gl, name, m){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniformMatrix3fv(loc, gl.FALSE, m);
    }
  }

  setUniformMatrix4fv(gl, name, m){
    let loc;
    if((loc = this.uniforms[name]) != null){
      return gl.uniformMatrix4fv(loc, gl.FALSE, m);
    }
  }
}

let animationFrame = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.oRequestAnimationFrame
  || window.msRequestAnimationFrame
  || (function(callback){
    window.setTimeout(callback, 1000 / 60)
  });

class Demo{
  constructor(canvas){
    this.canvas = canvas;
    this.gl = getWebGLContext(this.canvas);

    this.celShader = new ShaderProgram(this.gl, CelVertShaderSrc, CelFragShaderSrc, {
      a_position: 0,
      a_normal: 1
    });

    this.outlineShader = new ShaderProgram(this.gl, OutlineVertShaderSrc, OutlineFragShaderSrc, {
      a_position: 0,
      a_normal: 1
    });

    this.vbo = new VertexBuffer(this.gl);
    this.ibo = new IndexBuffer(this.gl);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.projection = mat4.create();
    this.modelview = mat4.create();
    this.normalMat = mat3.create();

    this.translation = TRANSLATION;
    this.rotation = mat4.identity(mat4.create());
    this.modelview = mat4.translate(this.modelview, this.modelview, this.translation);
    this.mouse = vec2.create();
    this.mouseDown = false;

    this.canvas.onmousedown = (function(_this) {
      return function(e) {
        return _this.onMouse_(e, e.clientX, e.clientY, true, false);
      };
    })(this);

    document.onmouseup = (function(_this) {
      return function(e) {
        return _this.onMouse_(e, e.clientX, e.clientY, false, false);
      };
    })(this);

    document.onmousemove = (function(_this) {
      return function(e) {
        return _this.onMouse_(e, e.clientX, e.clientY, _this.mouseDown, true);
      };
    })(this);

    this.canvas.ontouchstart = (function(_this) {
      return function(e) {
        return _this.onMouse_(e, e.touches[0].clientX, e.touches[0].clientY, true, false);
      };
    })(this);

    document.ontouchend = (function(_this) {
      return function(e) {
        return _this.onMouse_(e, e.touches[0].clientX, e.touches[0].clientY, false, false);
      };
    })(this);

    document.ontouchmove = (function(_this) {
      return function(e) {
        return _this.onMouse_(e, e.touches[0].clientX, e.touches[0].clientY, _this.mouseDown, true);
      };
    })(this);

    document.onmousewheel = this.onScroll_;

    let self = this;
    console.log(this);
    window.addEventListener('DOMMouseScroll', this.onScroll_.bind(this), false);
    window.addEventListener('resize', this.resize.bind(this));

    this.resize();
  }

  onScroll_(opt){
    // TODO
    console.log(this, 'this がDemo　のインスタンスであること sc');
    this.translation[2] += opt.wheelDelta >= 0 ? 0.05 : -0.05;
  }

  onMouse_(e, x, y, mouseDown, moved){
    this.mouseDown = mouseDown;
    let rect = this.canvas.getBoundingClientRect();
    let mx = x - rect.left;
    let my = y - rect.top;
    e.preventDefault();
    if (this.mouseDown && moved) {
      let deg2rad = Math.PI / 180;
      let nmat = mat4.identity(mat4.create());
      let dx = mx - this.mouse[0];
      let dy = my - this.mouse[1];
      mat4.rotateY(nmat, nmat, dx * deg2rad / 5);
      mat4.rotateX(nmat, nmat, dy * deg2rad / 5);
      mat4.multiply(this.rotation, nmat, this.rotation);
    }
    vec2.set(this.mouse, mx, my);
  }

  zoom(amt){
    translation[2] += amt;
  }

  resize(){
    // TODO
    console.log(this, 'this がDemo　のインスタンスであること');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    let deg2rad = Math.PI/180;
    let fovy = FIELD_OF_VIEW_DEG * deg2rad;
    let aspect = this.canvas.width / this.canvas.height;
    this.projection = mat4.perspective(this.projection, fovy, aspect, Z_NEAR, Z_FAR);

  }

  update(time, dt){
    if (!this.mouseDown) {
      mat4.rotateY(this.rotation, this.rotation, dt/1000)
    }
    mat4.identity(this.modelview);
    mat4.translate(this.modelview, this.modelview, this.translation);
    mat4.multiply(this.modelview, this.modelview, this.rotation);
    mat3.normalFromMat4(this.normalMat, this.modelview);
  }


  bindAttrs(gl, shader){
    this.vbo.bind(gl);
    this.ibo.bind(gl);
    gl.enableVertexAttribArray(shader.attributes.a_position);
    gl.enableVertexAttribArray(shader.attributes.a_normal);
    gl.vertexAttribPointer(shader.attributes.a_position, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(shader.attributes.a_normal, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
  }

  render(time, dt, accum){
    let gl = this.gl;
    gl.clearColor(0.5, 0.5, 0.5, 1);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.outlineShader.use(gl);
    this.bindAttrs(gl, this.outlineShader);

    this.outlineShader.setUniformMatrix4fv(gl, 'u_projectionMat', this.projection);
    this.outlineShader.setUniformMatrix4fv(gl, 'u_modelviewMat', this.modelview);
    //gl.disable gl.DEPTH_TEST
    gl.enable(gl.CULL_FACE);

    //gl.cullFace gl.FRONT
    //gl.depthMask gl.TRUE

    this.outlineShader.setUniform1f(gl, 'u_offset', OUTLINE_WIDTH);
    this.outlineShader.setUniform4fv(gl, 'u_color', OUTLINE_COLOR);

    gl.drawElements(gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0);

    // gl.cullFace gl.BACK
    // gl.depthMask gl.FALSE
    this.outlineShader.setUniform1f(gl, 'u_offset', 0.0);
    this.outlineShader.setUniform4fv(gl, 'u_color', vec4.fromValues(1, 1, 1, 1));
    //gl.drawElements gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0

    //gl.cullFace gl.BACK
    gl.disable(gl.CULL_FACE);
    //gl.disable gl.DEPTH_TEST
    //gl.depthMask gl.TRUE
    glCheckAndLogError(gl);
    this.celShader.use(gl);

    this.celShader.setUniform3fv(gl, 'u_diffuse', DIFFUSE);
    this.celShader.setUniform3fv(gl, 'u_ambient', AMBIENT);
    this.celShader.setUniform3fv(gl, 'u_specular', SPECULAR);
    this.celShader.setUniform1f(gl, 'u_shine', SHININESS);
    this.celShader.setUniform3fv(gl, 'u_light', LIGHT_POSITION);

    this.celShader.setUniform1f(gl, 'u_celShading', CEL_SHADING_LEVEL);

    this.celShader.setUniformMatrix4fv(gl, 'u_projectionMat', this.projection);
    this.celShader.setUniformMatrix4fv(gl, 'u_modelviewMat', this.modelview);
    this.celShader.setUniformMatrix3fv(gl, 'u_normalMat', this.normalMat);

    this.bindAttrs(gl, this.celShader);

    gl.drawElements(gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0);
  }

  tick(){
    let newTime = new Date().getTime();
    let frameTime = newTime - this.currentTime;
    let dt = 1 / 60;
    this.currentTime = newTime;

    this.accum += frameTime;

    while(this.accum >= dt){
      this.update(this.t, dt);
      this.t += dt;
      this.accum -= dt;
    }

    animationFrame(this.tick.bind(this));

    this.render(this.t, dt, this.accum);

  }

  start(){
    this.t = 0;
    this.currentTime = new Date().getTime();
    this.accum = 0;
    this.tick();
  }
}


let demo = new Demo(document.getElementById('screen'));
demo.start();
