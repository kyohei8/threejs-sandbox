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
	
	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };
	
	__webpack_require__(8);
	
	var mainCanvas = undefined,
	    mainContext = undefined;
	var fireworkCanvas = undefined,
	    fireworkContext = undefined;
	var particles = [];
	var viewportWidth = window.innerWidth;
	var viewportHeight = window.innerHeight;
	
	var Particle = __webpack_require__(2).Particle;
	
	var Library = __webpack_require__(3).Library;
	
	var Fireworks = (function () {
	  /**
	   * 初期化関数
	   */
	
	  function Fireworks() {
	    var _this = this;
	
	    _classCallCheck(this, Fireworks);
	
	    // 花火用のcanvasを生成
	    mainCanvas = document.createElement("canvas");
	    mainContext = mainCanvas.getContext("2d");
	    // 火花の画像を保持するcanvasを生成
	    fireworkCanvas = document.createElement("canvas");
	    fireworkContext = fireworkCanvas.getContext("2d");
	
	    // 花火の色を設定
	    this.createFireworkPalette(12, Library.bigGlow);
	
	    // メインキャンバスのサイズ等を設定
	    this.setMainCanvasDimensions();
	
	    // canvasを追加
	    var container = document.getElementById("container");
	    container.appendChild(mainCanvas);
	
	    document.addEventListener("mouseup", function () {
	      return _this.createFirework();
	    }, true);
	    document.addEventListener("touchend", function () {
	      return _this.createFirework();
	    }, true);
	    window.addEventListener("resize", function () {
	      return _this.onWindowResize();
	    }, false);
	
	    this.update();
	  }
	
	  _createClass(Fireworks, {
	    createFirework: {
	      value: function createFirework() {
	        Fireworks.createParticle();
	      }
	    },
	    onWindowResize: {
	      value: function onWindowResize() {
	        viewportWidth = window.innerWidth;
	        viewportHeight = window.innerHeight;
	        this.setMainCanvasDimensions();
	      }
	    },
	    setMainCanvasDimensions: {
	      value: function setMainCanvasDimensions() {
	        mainCanvas.width = viewportWidth;
	        mainCanvas.height = viewportHeight;
	      }
	    },
	    update: {
	      value: function update() {
	        this.clearContext();
	        var self = this;
	        requestAnimationFrame(function () {
	          self.update();
	        });
	        this.drawFireworks();
	      }
	    },
	    clearContext: {
	
	      /**
	       * 半透明の黒でcanvasでクリアする
	       * 花火の軌跡を残すためにalphaは半透明とする
	       */
	
	      value: function clearContext() {
	        mainContext.fillStyle = "rgba(0,0,0,0.2)";
	        mainContext.fillRect(0, 0, viewportWidth, viewportHeight);
	      }
	    },
	    drawFireworks: {
	
	      /**
	       * 花火を描画する
	       */
	
	      value: function drawFireworks() {
	        var particlesIndex = particles.length;
	        while (particlesIndex--) {
	          var particle = particles[particlesIndex];
	
	          //trueなら爆発する
	          if (particle.update()) {
	            //花火を削除して、パーティクルから爆発するようにする
	            particles.splice(particlesIndex, 1);
	
	            //もし物理演算を使わない場合
	            // 爆発後の処理となる
	            if (!particle.usePhysics) {
	
	              //if(Math.random() < 0.8){
	              FireworkExplosions.star(particle);
	              //}else{
	              //  FireworkExplosions.circle(particle);
	              //}
	            }
	          }
	          particle.render(mainContext, fireworkCanvas);
	        }
	      }
	    },
	    createFireworkPalette: {
	
	      /**
	       * 花火の色のブロックを生成
	       *
	       * @param gridSize 1つ分のgridの大きさ
	       * @param img パーティクル画像
	       */
	
	      value: function createFireworkPalette(gridSize, img) {
	        var size = gridSize * 10;
	        fireworkCanvas.width = size;
	        fireworkCanvas.height = size;
	        fireworkContext.globalCompositeOperation = "source-over";
	
	        for (var c = 0; c < 100; c++) {
	          var marker = c * gridSize;
	          var gridX = marker % size;
	          var gridY = Math.floor(marker / size) * gridSize;
	
	          fireworkContext.fillStyle = "hsl(" + Math.round(c * 3.6) + ", 100%, 60%)";
	          fireworkContext.fillRect(gridX, gridY, gridSize, gridSize);
	
	          fireworkContext.drawImage(img, gridX, gridY);
	        }
	      }
	    }
	  }, {
	    createParticle: {
	
	      /**
	       * 花火を生成
	       * @param pos
	       * @param target
	       * @param vel
	       * @param color
	       * @param usePhysics
	       */
	
	      value: function createParticle() {
	        var pos = arguments[0] === undefined ? {} : arguments[0];
	        var target = arguments[1] === undefined ? {} : arguments[1];
	        var vel = arguments[2] === undefined ? {} : arguments[2];
	        var color = arguments[3] === undefined ? "" : arguments[3];
	        var usePhysics = arguments[4] === undefined ? false : arguments[4];
	
	        particles.push(new Particle( // position
	        {
	          x: pos.x || Math.random() * viewportWidth,
	          y: pos.y || viewportHeight + 10
	        }, // target
	        {
	          y: target.y || 150 + Math.random() * 100
	        }, // velocity
	        {
	          x: vel.x || Math.random() * 3 - 1.5,
	          y: vel.y || 0
	        }, color || Math.floor(Math.random() * 100) * 12, usePhysics));
	      }
	    }
	  });
	
	  return Fireworks;
	})();
	
	var FireworkExplosions = {
	  /**
	   * Explodes in a roughly circular fashion
	   */
	  circle: function circle(firework) {
	
	    var count = 200;
	    var angle = Math.PI * 2 / count;
	    while (count--) {
	
	      var randomVelocity = 4 + Math.random() * 4;
	      var particleAngle = count * angle;
	
	      Fireworks.createParticle(firework.pos, undefined, {
	        x: Math.cos(particleAngle) * randomVelocity,
	        y: Math.sin(particleAngle) * randomVelocity
	      }, firework.color, true);
	    }
	  },
	
	  /**
	   * Explodes in a star shape
	   */
	  star: function star(firework) {
	
	    // set up how many points the firework
	    // should have as well as the velocity
	    // of the exploded particles etc
	    // 6 - 20
	    var points = 6 + Math.round(Math.random() * 15);
	    // 3 - 10
	    var jump = 3 + Math.round(Math.random() * 7);
	    var subdivisions = 10;
	    var radius = 80;
	    // 3 - 6
	    var randomVelocity = -(Math.random() * 3 - 6);
	    var start = 0;
	    var end = 0;
	    var circle = Math.PI * 2;
	    var adjustment = Math.random() * circle;
	
	    do {
	
	      // work out the start, end
	      // and change values
	      start = end;
	      end = (end + jump) % points;
	      var sAngle = start / points * circle - adjustment;
	      var eAngle = (start + jump) / points * circle - adjustment;
	
	      var startPos = {
	        x: firework.pos.x + Math.cos(sAngle) * radius,
	        y: firework.pos.y + Math.sin(sAngle) * radius
	      };
	
	      var endPos = {
	        x: firework.pos.x + Math.cos(eAngle) * radius,
	        y: firework.pos.y + Math.sin(eAngle) * radius
	      };
	
	      var diffPos = {
	        x: endPos.x - startPos.x,
	        y: endPos.y - startPos.y,
	        a: eAngle - sAngle
	      };
	
	      // now linearly interpolate across
	      // the subdivisions to get to a final
	      // set of particles
	      for (var s = 0; s < subdivisions; s++) {
	
	        var sub = s / subdivisions;
	        var subAngle = sAngle + sub * diffPos.a;
	
	        Fireworks.createParticle({
	          x: startPos.x + sub * diffPos.x,
	          y: startPos.y + sub * diffPos.y
	        }, undefined, {
	          x: Math.cos(subAngle) * randomVelocity,
	          y: Math.sin(subAngle) * randomVelocity
	        }, firework.color, true);
	      }
	
	      // loop until we're back at the start
	    } while (end !== 0);
	  }
	};
	window.onload = function () {
	  new Fireworks();
	};
	//http://creativejs.com/tutorials/creating-fireworks/
	// をES6で書きなおした

/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	"use strict";
	
	var Library = __webpack_require__(3).Library;
	
	/**
	 * 打ち上がった花火の中心となるシングルポイントを表す
	 * @param pos        位置
	 * @param target     ?
	 * @param vel        velocity
	 * @param marker     マーカ？
	 * @param usePhysics 物理演算を使うかどうか
	 * @constructor
	 */
	
	var Particle = (function () {
	  function Particle(pos, target, vel, marker, usePhysics) {
	    _classCallCheck(this, Particle);
	
	    //アニメーションの設定
	    this.GRAVITY = 0.06;
	    this.alpha = 1;
	    this.easing = Math.random() * 0.02;
	    this.fade = Math.random() * 0.1;
	    this.gridX = marker % 120;
	    this.gridY = Math.floor(marker / 120) * 12;
	    this.color = marker;
	
	    this.pos = {
	      x: pos.x || 0,
	      y: pos.y || 0
	    };
	
	    this.vel = {
	      x: vel.x || 0,
	      y: vel.y || 0
	    };
	
	    this.lastPos = {
	      x: this.pos.x,
	      y: this.pos.y
	    };
	
	    this.target = {
	      y: target.y || 0
	    };
	
	    this.usePhysics = usePhysics || false;
	  }
	
	  _createClass(Particle, {
	    update: {
	      value: function update() {
	        this.lastPos.x = this.pos.x;
	        this.lastPos.y = this.pos.y;
	
	        if (this.usePhysics) {
	          //爆発時
	          this.vel.y += this.GRAVITY;
	          this.pos.y += this.vel.y;
	
	          this.alpha -= this.fade;
	        } else {
	          //打ち上げ時
	          var distance = this.target.y - this.pos.y;
	
	          this.pos.y += distance * (0.03 + this.easing);
	          this.alpha = Math.min(distance * distance * 0.00005, 1);
	        }
	
	        this.pos.x += this.vel.x;
	        return this.alpha < 0.005;
	      }
	    },
	    render: {
	      value: function render(context, fireworkCanvas) {
	        var x = Math.round(this.pos.x),
	            y = Math.round(this.pos.y),
	            xVel = (x - this.lastPos.x) * -5,
	            yVel = (y - this.lastPos.y) * -5;
	
	        context.save();
	        context.globalCompositeOperation = "lighter";
	        context.globalAlpha = Math.random() * this.alpha;
	
	        context.fillStyle = "rgba(255, 255, 255, 0.3)";
	        context.beginPath();
	        context.moveTo(this.pos.x, this.pos.y);
	        context.lineTo(this.pos.x + 1.5, this.pos.y);
	        context.lineTo(this.pos.x + xVel, this.pos.y + yVel);
	        context.lineTo(this.pos.x - 1.5, this.pos.y);
	        context.closePath();
	        context.fill();
	
	        // imageを描画
	        context.drawImage(fireworkCanvas, this.gridX, this.gridY, 12, 12, x - 6, y - 6, 12, 12);
	        context.drawImage(Library.smallGlow, x - 3, y - 3);
	
	        context.restore();
	      }
	    }
	  });
	
	  return Particle;
	})();
	
	exports.Particle = Particle;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var Library = {
	  bigGlow: document.getElementById("big-glow"),
	  smallGlow: document.getElementById("small-glow")
	};
	exports.Library = Library;

/***/ },
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(9);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(11)(content, {});
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		module.hot.accept("!!/Users/kyohei/work/threejs-sandbox/node_modules/css-loader/index.js!/Users/kyohei/work/threejs-sandbox/node_modules/autoprefixer-loader/index.js?browsers=last 1 version!/Users/kyohei/work/threejs-sandbox/node_modules/stylus-loader/index.js!/Users/kyohei/work/threejs-sandbox/examples/app.styl", function() {
			var newContent = require("!!/Users/kyohei/work/threejs-sandbox/node_modules/css-loader/index.js!/Users/kyohei/work/threejs-sandbox/node_modules/autoprefixer-loader/index.js?browsers=last 1 version!/Users/kyohei/work/threejs-sandbox/node_modules/stylus-loader/index.js!/Users/kyohei/work/threejs-sandbox/examples/app.styl");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(14)();
	exports.push([module.id, "body {\n  margin: 0;\n}\ncanvas {\n  width: 100%;\n  height: 100%;\n}\n", ""]);

/***/ },
/* 10 */,
/* 11 */
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
/* 12 */,
/* 13 */,
/* 14 */
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
//# sourceMappingURL=app12.bundle.js.map