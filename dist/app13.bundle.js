/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "http://localhost:8090/dist";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	//require('../app.styl');
	
	var Lib = __webpack_require__(6).Lib;
	
	var ShaderTypes = __webpack_require__(7).ShaderTypes;
	
	var canvasW = 512,
	    canvasH = 512;
	var c = undefined,
	    el = undefined,
	    gl = undefined;
	var uniLocation = [];
	var mouseX = undefined,
	    mouseY = undefined,
	    startTime = undefined;
	var run = undefined; //レンダリングをし続けるかどうか
	var time = undefined;
	var fps = 1000 / 30; // 30fps
	var tempTime = 0;
	
	var position = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
	
	var index = [0, 2, 1, 1, 2, 3];
	
	var createRadio = function createRadio() {
	  var container = document.getElementById("container");
	
	  var onChangeRadio = function onChangeRadio(e) {
	    var key = e.target.value;
	    var fs = ShaderTypes[key];
	    createPrg(vs, fs, gl);
	  };
	
	  Object.keys(ShaderTypes).forEach(function (shaderType, i) {
	    var input = document.createElement("input");
	    var label = document.createElement("label");
	    input.type = "radio";
	    input.name = "g1";
	    if (i === 0) {
	      input.checked = "checked";
	    }
	    input.id = label.htmlFor = shaderType;
	    input.value = label.textContent = shaderType;
	
	    input.addEventListener("change", onChangeRadio, false);
	
	    container.appendChild(input);
	    container.appendChild(label);
	    container.appendChild(document.createElement("br"));
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
	var createPrg = function createPrg(vs, fs, gl) {
	  var prg = Lib.createProgram(Lib.createShader(vs, "vertex", gl), Lib.createShader(fs, "fragment", gl), gl);
	  run = prg != null;
	  if (!run) {
	    el.checked = false;
	  }
	  uniLocation[0] = gl.getUniformLocation(prg, "time");
	  uniLocation[1] = gl.getUniformLocation(prg, "mouse");
	  uniLocation[2] = gl.getUniformLocation(prg, "resolution");
	
	  var vPosition = Lib.createVbo(position, gl);
	  var vIndex = Lib.createIbo(index, gl);
	  var vAttLocation = gl.getAttribLocation(prg, "position");
	
	  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition);
	  gl.enableVertexAttribArray(vAttLocation);
	  gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
	};
	
	/**
	 * 初期化
	 */
	var init = function init() {
	  // get canvas
	  c = document.getElementById("canvas1");
	  c.width = canvasW;
	  c.height = canvasH;
	  // get check
	  el = document.getElementById("check1");
	  // domイベント
	  c.addEventListener("mousemove", mouseMove, true);
	  el.addEventListener("change", checkChange, true);
	
	  // webGl context
	  gl = c.getContext("webgl") || c.getContext("experimental-webgl");
	
	  var firstKey = Object.keys(ShaderTypes)[0];
	  createPrg(vs, ShaderTypes[firstKey], gl);
	
	  //その他初期化
	  gl.clearColor(0, 0, 0, 1);
	  mouseX = 0.5;
	  mouseY = 0.5;
	
	  //現在のタイムスタンプを設定
	  startTime = new Date().getTime();
	  render();
	};
	
	var render = (function (_render) {
	  var _renderWrapper = function render() {
	    return _render.apply(this, arguments);
	  };
	
	  _renderWrapper.toString = function () {
	    return _render.toString();
	  };
	
	  return _renderWrapper;
	})(function () {
	  if (!run) {
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
	});
	
	/**
	 * mouse move イベント
	 */
	var mouseMove = function mouseMove(e) {
	  mouseX = e.offsetX / canvasW;
	  mouseY = e.offsetY / canvasH;
	};
	
	/**
	 * チェックボックス
	 */
	var checkChange = function checkChange(e) {
	  run = e.currentTarget.checked;
	  if (run) {
	    startTime = new Date().getTime();
	    render();
	  } else {
	    tempTime += time;
	  }
	};
	
	// 頂点シェーダ
	// 入力されたposition情報をvec4に変換する
	var vs = "\nattribute vec3 position;\nvoid main(void){\n    gl_Position = vec4(position, 1.0);\n}\n";
	
	init();
	/**
	 * wgld.orgのGLSLをやってみる
	 * http://wgld.org/d/glsl/g001.html
	 */

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Lib = {
	
	  /**
	   * シェーダを生成する関数
	   * @param shaderText
	   * @param type vertex or fragment
	   * @returns {*}
	   */
	  createShader: function createShader(shaderText, type, gl) {
	    // シェーダを格納する変数
	    var shader;
	
	    // scriptタグのtype属性をチェック
	    switch (type) {
	
	      // 頂点シェーダの場合
	      case "vertex":
	        shader = gl.createShader(gl.VERTEX_SHADER);
	        break;
	
	      // フラグメントシェーダの場合
	      case "fragment":
	        shader = gl.createShader(gl.FRAGMENT_SHADER);
	        break;
	      default:
	        return;
	    }
	
	    // 生成されたシェーダにソースを割り当てる
	    gl.shaderSource(shader, shaderText);
	
	    // シェーダをコンパイルする
	    gl.compileShader(shader);
	
	    // シェーダが正しくコンパイルされたかチェック
	    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	      // 成功していたらシェーダを返して終了
	      return shader;
	    } else {
	
	      // 失敗していたらエラーログをアラートしコンソールに出力
	      console.log(gl.getShaderInfoLog(shader));
	    }
	  },
	
	  // プログラムオブジェクトを生成しシェーダをリンクする関数
	  createProgram: function createProgram(vs, fs, gl) {
	    // プログラムオブジェクトの生成
	    var program = gl.createProgram();
	
	    // プログラムオブジェクトにシェーダを割り当てる
	    gl.attachShader(program, vs);
	    gl.attachShader(program, fs);
	
	    // シェーダをリンク
	    gl.linkProgram(program);
	
	    // シェーダのリンクが正しく行なわれたかチェック
	    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
	
	      // 成功していたらプログラムオブジェクトを有効にする
	      gl.useProgram(program);
	
	      // プログラムオブジェクトを返して終了
	      return program;
	    } else {
	
	      // 失敗していたら NULL を返す
	      return null;
	    }
	  },
	
	  // VBOを生成する関数
	  createVbo: function createVbo(data, gl) {
	    // バッファオブジェクトの生成
	    var vbo = gl.createBuffer();
	
	    // バッファをバインドする
	    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	
	    // バッファにデータをセット
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	
	    // バッファのバインドを無効化
	    gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	    // 生成した VBO を返して終了
	    return vbo;
	  },
	
	  // IBOを生成する関数
	  createIbo: function createIbo(data, gl) {
	    // バッファオブジェクトの生成
	    var ibo = gl.createBuffer();
	
	    // バッファをバインドする
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	
	    // バッファにデータをセット
	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
	
	    // バッファのバインドを無効化
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	    // 生成したIBOを返して終了
	    return ibo;
	  }
	
	};
	exports.Lib = Lib;
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var ShaderTypes = {
	  // フラグメントシェーダ
	  // 3つのuniform変数を定義
	  //  time ... javascriptからミリsec単位で時間を送ってもらっている ex. 1.234
	  //  mouse ... javascriptからマウスカーソルの位置を0〜1で受け取る ex. [0.3, 0.1]
	  //  resolution ... javascript スクリーンの幅を受け取る ex. [512, 512]
	  gradationColor: "\n  precision mediump float;\n  uniform float time;\n  uniform vec2 mouse;\n  uniform vec2 resolution;\n  void main(void){\n    // 正規化\n    // gl_FragCoord の中身の範囲は、0 ～ スクリーンの横幅(もしくは縦幅)の最大値\n    // それを2倍して画面幅でわると -1〜1の間の値が返る\n    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);\n\n    // なので p.xy は(vec2で)[-1〜1, -1〜1)]となる\n    // 0~1の値にしたいので\n    // まず+1 をする。そうすると [0〜2, 0〜2]となる\n    // それを半分でわって [0〜1, 0〜1]の値をだす\n    vec2 color = (vec2(1.0) + p.xy) * 0.5;\n\n    // ポジションをrgbaに変換\n    // colorは[0(〜1), 0(〜1)]のvec2なのでそれをそれぞれred, greenに当てはめる\n    // [0, 0, 0, 1] から [1, 1, 0, 1]になる\n    // GLSLでは左下が0,0になる\n    // (0,1)  (1,1)\n    //   +-----+\n    //   |     |\n    //   |     |\n    //   +-----+\n    // (0.0)  (1,0)\n    gl_FragColor = vec4(color, p.x, 1.0);\n  }\n  ",
	  ripple: "\n    precision mediump float;\n    uniform float time;\n    uniform vec2  mouse;\n    uniform vec2  resolution;\n\n    void main(void){\n        // 上述の通りの正規化\n        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);\n\n        // マウスのカーソルの位置を[0~1, 0~1]から[-1~1, -1~1]に変換\n        // ※ GLSLではy軸は上がプラスなので、正負が反転している\n        vec2 mouse = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);\n\n        // length ... 2点間の距離を返す\n        // ベクトルと時間から正弦波を生成している\n        float t = sin(length(mouse - p) * 20.0 + time * 5.0);\n        gl_FragColor = vec4(vec2(t), 0.3, 1.0);\n    }\n  ",
	  "moving ripple": "\n    precision mediump float;\n    uniform float time;\n    uniform vec2 mouse;\n    uniform vec2 resolution;\n\n    void main(void){\n        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);\n        vec2 mouse = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);\n\n        float t = 0.02 / abs(sin(time) - length(mouse - p));\n        gl_FragColor = vec4(vec3(t), 1.0);\n    }\n\n  ",
	
	  "Mandelbrot set": "\n    precision mediump float;\n    uniform float time;\n    uniform vec2 mouse;\n    uniform vec2 resolution;\n\n    //HSVカラーを生成\n    vec3 hsv(float h, float s, float v){\n      vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n      vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));\n      return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0 , 1.0), s);\n    }\n\n    void main(void){\n      // マウス座標を正規化\n      vec2 m = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);\n      // フラグメントを正規化\n      vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);\n\n      // マンデルブロ集合を定義\n      // カウンタ\n      int j = 0;\n      // 原点（少しずらしている）\n      vec2 x = p + vec2(-0.5, 0.0);\n      // マウス座標を使って拡大度?を変更\n      float y = 1.5 - mouse.x * 0.5;\n      // 漸化式 Z の初期値\n      vec2 z = vec2(0.0, 0.0);\n\n      //漸化式の繰り返し処理\n      float fnum = float(100);\n      for(int i=0; i < 100; i++){\n        j++;\n        // 2を超えると確実に発散する\n        if(length(z) > 2.0){\n          break;\n        }\n        //Zn+1 = Zn^2 + C\n        z = vec2(z.x * z.x - z.y * z.y , 2.0 * z.x * z.y) + x * y;\n      }\n\n      //時間の経過とともにhsvを出力\n      float h = mod(time * 20.0, 360.0) / 360.0;\n      vec3 rgb = hsv(h, 1.0, 1.0);\n\n      // 繰り返した回数を元に輝度を決める\n      float t = float(j) / fnum;\n\n      //最終的な色を出力\n      gl_FragColor = vec4(rgb * t, 1.0);\n    }\n  "
	};
	exports.ShaderTypes = ShaderTypes;
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

/***/ }
/******/ ]);
//# sourceMappingURL=app13.bundle.js.map