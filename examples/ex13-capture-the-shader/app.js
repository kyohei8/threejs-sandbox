/**
 * wgld.orgのGLSLをやってみる
 * http://wgld.org/d/glsl/g001.html
 */
'use strict';
//require('../app.styl');
import {Lib} from './modules/lib';
import {ShaderTypes} from './modules/shader-types';

const canvasW = 512, canvasH = 512;
let c, el, gl;
let uniLocation = [];
let mouseX, mouseY, startTime;
let run; //レンダリングをし続けるかどうか
let time;
let fps = 1000 / 30; // 30fps
let tempTime = 0.0;


let position = [
  -1.0,  1.0, 0.0,
  1.0,  1.0, 0.0,
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0
];

let index = [
  0, 2, 1,
  1, 2, 3
];

let createRadio = function(){
  let container = document.getElementById('container');

  let onChangeRadio = function(e){
    let key = e.target.value;
    let fs = ShaderTypes[key];
    createPrg(vs, fs, gl);

  };

  Object.keys(ShaderTypes).forEach(function(shaderType, i){
    let input = document.createElement('input');
    let label = document.createElement('label');
    input.type = 'radio';
    input.name = 'g1';
    if(i === 0){
      input.checked = 'checked';
    }
    input.id = label.htmlFor = shaderType;
    input.value = label.textContent = shaderType;

    input.addEventListener('change', onChangeRadio, false);

    container.appendChild(input);
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
  });


};
createRadio();


/**
 *
 * @param vs 頂点シェーダ
 * @param fs フラグメントシェーダ
 * @param gl webglオブジェクト
 * @returns {*}
 */
let createPrg = function(vs, fs, gl){
  let prg = Lib.createProgram(
    Lib.createShader(vs, 'vertex', gl),
    Lib.createShader(fs, 'fragment', gl),
    gl);
  run = (prg != null);
  if(!run){
    el.checked = false;
  }
  uniLocation[0] = gl.getUniformLocation(prg, 'time');
  uniLocation[1] = gl.getUniformLocation(prg, 'mouse');
  uniLocation[2] = gl.getUniformLocation(prg, 'resolution');

  let vPosition = Lib.createVbo(position, gl);
  let vIndex = Lib.createIbo(index, gl);
  let vAttLocation = gl.getAttribLocation(prg, 'position');

  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
  gl.enableVertexAttribArray(vAttLocation);
  gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
};

/**
 * 初期化
 */
let init = function(){
  // get canvas
  c = document.getElementById('canvas1');
  c.width = canvasW;
  c.height = canvasH;
  // get check
  el = document.getElementById('check1');
  // domイベント
  c.addEventListener('mousemove', mouseMove, true);
  el.addEventListener('change', checkChange, true);

  // webGl context
  gl = c.getContext('webgl') || c.getContext('experimental-webgl');

  let firstKey = Object.keys(ShaderTypes)[0];
  createPrg(vs, ShaderTypes[firstKey], gl);

  //その他初期化
  gl.clearColor(0,0,0,1.0);
  mouseX = 0.5;
  mouseY = 0.5;

  //現在のタイムスタンプを設定
  startTime = new Date().getTime();
  render();

};

let render = function(){
  if(!run){
    return;
  }
  time = (new Date().getTime() - startTime) * 0.001;
  //カラーバッファーをクリア
  gl.clear(gl.COLOR_BUFFER_BIT);

  //uniform
  gl.uniform1f(uniLocation[0], time + tempTime);
  gl.uniform2fv(uniLocation[1], [mouseX, mouseY]);
  gl.uniform2fv(uniLocation[2], [canvasW, canvasH]);

  //描画
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();

  //再帰
  setTimeout(render, fps);

};

/**
 * mouse move イベント
 */
let mouseMove = function(e){
  mouseX = e.offsetX / canvasW;
  mouseY = e.offsetY / canvasH;
};

/**
 * チェックボックス
 */
let checkChange = function(e){
  run = e.currentTarget.checked;
  if(run){
    startTime = new Date().getTime();
    render();
  }else{
    tempTime += time;
  }
};

// 頂点シェーダ
// 入力されたposition情報をvec4に変換する
let vs = `
attribute vec3 position;
void main(void){
    gl_Position = vec4(position, 1.0);
}
`;

init();