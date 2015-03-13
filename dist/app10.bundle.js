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
/******/ 	__webpack_require__.p = "http://localhost:8090/assets";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(4);
	var THREE = __webpack_require__(1);
	//let OrbitControls = require('three-orbit-controls')(THREE);
	var Stats = __webpack_require__(6);
	
	var TEXT = "ABCDE";
	var container;
	
	var scene, camera, light, renderer;
	var geometry, cube, mesh, material;
	var mouse;
	
	var data, texture, points;
	
	var fboParticles, rtTexturePos, rtTexturePos2, simulationShader;
	var controls = undefined;
	init();
	animate();
	
	function init() {
	
	  container = document.createElement("div");
	  document.body.appendChild(container);
	
	  renderer = new THREE.WebGLRenderer({ antialias: false, devicePixelRatio: 1 });
	  renderer.setSize(window.innerWidth, window.innerHeight);
	  container.appendChild(renderer.domElement);
	
	  scene = new THREE.Scene();
	
	  camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 1000);
	  camera.position.set(150, 0, 380);
	  //camera
	  scene.add(camera);
	
	  //controls = new THREE.OrbitControls2( camera );
	  //controls.radius = 400;
	  //controls.speed = 3;
	
	  //
	
	  //var width = 2048, height = 2048;
	  var width = 1024,
	      height = 1024;
	  //var width = 512, height = 512;
	  // var width = 128, height = 128;
	
	  if (!renderer.context.getExtension("OES_texture_float")) {
	
	    alert("OES_texture_float is not :(");
	  }
	
	  // Start Creation of DataTexture
	  // Could it be simplified with THREE.FBOUtils.createTextureFromData(textureWidth, textureWidth, data); ?
	
	  data = new Float32Array(width * height * 3);
	
	  var textGeo = new THREE.TextGeometry(TEXT, {
	
	    size: 1,
	    height: 0.5,
	    curveSegments: 0,
	
	    font: "helvetiker",
	    weight: "bold",
	    style: "normal",
	
	    bevelThickness: 2,
	    bevelSize: 5,
	    bevelEnabled: false
	
	  });
	
	  textGeo.applyMatrix(new THREE.Matrix4().makeTranslation(-0.9, 0, 0.2));
	
	  points = THREE.GeometryUtils.randomPointsInGeometry(textGeo, data.length / 3);
	
	  for (var i = 0, j = 0, l = data.length; i < l; i += 3, j += 1) {
	
	    data[i] = points[j].x;
	    data[i + 1] = points[j].y;
	    data[i + 2] = points[j].z;
	  }
	
	  console.log(data.length / 3);
	
	  texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat, THREE.FloatType);
	  texture.minFilter = THREE.NearestFilter;
	  texture.magFilter = THREE.NearestFilter;
	  texture.needsUpdate = true;
	
	  // zz85 - fbo init
	
	  rtTexturePos = new THREE.WebGLRenderTarget(width, height, {
	    wrapS: THREE.RepeatWrapping,
	    wrapT: THREE.RepeatWrapping,
	    minFilter: THREE.NearestFilter,
	    magFilter: THREE.NearestFilter,
	    format: THREE.RGBFormat,
	    type: THREE.FloatType,
	    stencilBuffer: false
	  });
	
	  rtTexturePos2 = rtTexturePos.clone();
	
	  simulationShader = new THREE.ShaderMaterial({
	
	    uniforms: {
	      tPositions: { type: "t", value: texture },
	      origin: { type: "t", value: texture },
	      timer: { type: "f", value: 0 }
	    },
	
	    vertexShader: document.getElementById("texture_vertex_simulation_shader").textContent,
	    fragmentShader: document.getElementById("texture_fragment_simulation_shader").textContent
	
	  });
	
	  fboParticles = new THREE.FBOUtils(width, renderer, simulationShader);
	  fboParticles.renderToTexture(rtTexturePos, rtTexturePos2);
	
	  fboParticles["in"] = rtTexturePos;
	  fboParticles.out = rtTexturePos2;
	
	  geometry = new THREE.Geometry();
	
	  for (var i = 0, l = width * height; i < l; i++) {
	
	    var vertex = new THREE.Vector3();
	    vertex.x = i % width / width;
	    vertex.y = Math.floor(i / width) / height;
	    geometry.vertices.push(vertex);
	  }
	
	  material = new THREE.ShaderMaterial({
	
	    uniforms: {
	
	      map: { type: "t", value: rtTexturePos },
	      width: { type: "f", value: width },
	      height: { type: "f", value: height },
	
	      pointSize: { type: "f", value: 1 }
	
	    },
	    vertexShader: document.getElementById("vs-particles").textContent,
	    fragmentShader: document.getElementById("fs-particles").textContent,
	    depthTest: false,
	    transparent: true
	
	  });
	
	  mesh = new THREE.ParticleSystem(geometry, material);
	  scene.add(mesh);
	
	  //mouse = new THREE.Vector3( 0, 0, 1 );
	
	  //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	}
	
	function onDocumentMouseMove(event) {
	
	  mouse.x = event.clientX - window.innerWidth / 2;
	  mouse.y = event.clientY - window.innerHeight / 2;
	}
	
	function animate() {
	
	  requestAnimationFrame(animate);
	  render();
	}
	
	var timer = 0;
	
	function render() {
	
	  timer += 0.01;
	  simulationShader.uniforms.timer.value = timer;
	  //console.log(fboParticles.in);
	  // swap
	  var tmp = fboParticles["in"];
	  fboParticles["in"] = fboParticles.out;
	  fboParticles.out = tmp;
	
	  simulationShader.uniforms.tPositions.value = fboParticles["in"];
	  fboParticles.simulate(fboParticles.out);
	  material.uniforms.map.value = fboParticles.out;
	
	  //controls.update();
	
	  renderer.render(scene, camera);
	}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = THREE;

/***/ },
/* 2 */,
/* 3 */,
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(5);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(7)(content, {});
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		module.hot.accept("!!/Users/ktsukuda/work/threejs-sandbox/node_modules/css-loader/index.js!/Users/ktsukuda/work/threejs-sandbox/node_modules/autoprefixer-loader/index.js?browsers=last 1 version!/Users/ktsukuda/work/threejs-sandbox/node_modules/stylus-loader/index.js!/Users/ktsukuda/work/threejs-sandbox/examples/app.styl", function() {
			var newContent = require("!!/Users/ktsukuda/work/threejs-sandbox/node_modules/css-loader/index.js!/Users/ktsukuda/work/threejs-sandbox/node_modules/autoprefixer-loader/index.js?browsers=last 1 version!/Users/ktsukuda/work/threejs-sandbox/node_modules/stylus-loader/index.js!/Users/ktsukuda/work/threejs-sandbox/examples/app.styl");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(10)();
	exports.push([module.id, "body {\n  margin: 0;\n}\ncanvas {\n  width: 100%;\n  height: 100%;\n}\n", ""]);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	// stats.js - http://github.com/mrdoob/stats.js
	var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
	i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
	k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
	"block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:12,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" FPS ("+p+"-"+q+")",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
	a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};"object"===typeof module&&(module.exports=Stats);


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isIE9 = memoize(function() {
			return /msie 9\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;
	
	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}
	
		options = options || {};
		// Force single-tag solution on IE9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isIE9();
	
		var styles = listToStyles(list);
		addStylesToDom(styles, options);
	
		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}
	
	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}
	
	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}
	
	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}
	
	function addStyle(obj, options) {
		var styleElement, update, remove;
	
		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function () {
				styleElement.parentNode.removeChild(styleElement);
			};
		}
	
		update(obj);
	
		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}
	
	function replaceText(source, id, replacement) {
		var boundaries = ["/** >>" + id + " **/", "/** " + id + "<< **/"];
		var start = source.lastIndexOf(boundaries[0]);
		var wrappedReplacement = replacement
			? (boundaries[0] + replacement + boundaries[1])
			: "";
		if (source.lastIndexOf(boundaries[0]) >= 0) {
			var end = source.lastIndexOf(boundaries[1]) + boundaries[1].length;
			return source.slice(0, start) + wrappedReplacement + source.slice(end);
		} else {
			return source + wrappedReplacement;
		}
	}
	
	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(styleElement.styleSheet.cssText, index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}
	
	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;
	
		if(sourceMap && typeof btoa === "function") {
			try {
				css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(sourceMap)) + " */";
				css = "@import url(\"data:text/css;base64," + btoa(css) + "\")";
			} catch(e) {}
		}
	
		if(media) {
			styleElement.setAttribute("media", media)
		}
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}


/***/ },
/* 8 */,
/* 9 */,
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() {
		var list = [];
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
		return list;
	}

/***/ }
/******/ ]);
//# sourceMappingURL=app10.bundle.js.map