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
	
	__webpack_require__(10);
	var THREE = __webpack_require__(1);
	var OrbitControls = __webpack_require__(8)(THREE);
	var Stats = __webpack_require__(12);
	
	var container = undefined,
	    stats = undefined;
	var camera = undefined,
	    controls = undefined,
	    scene = undefined,
	    renderer = undefined;
	
	var data = undefined,
	    texture = undefined,
	    points = undefined;
	var fboParticles = undefined,
	    rtTexturePos = undefined,
	    rtTexturePos2 = undefined,
	    simulationShader = undefined;
	var geometry = undefined,
	    material = undefined,
	    mesh = undefined;
	var randomPointInTriangle = (function () {
	
	  var vector = new THREE.Vector3();
	
	  return function (vectorA, vectorB, vectorC) {
	
	    var point = new THREE.Vector3();
	
	    var a = THREE.Math.random16();
	    var b = THREE.Math.random16();
	
	    if (a + b > 1) {
	
	      a = 1 - a;
	      b = 1 - b;
	    }
	
	    var c = 1 - a - b;
	
	    point.copy(vectorA);
	    point.multiplyScalar(a);
	
	    vector.copy(vectorB);
	    vector.multiplyScalar(b);
	
	    point.add(vector);
	
	    vector.copy(vectorC);
	    vector.multiplyScalar(c);
	
	    point.add(vector);
	
	    return point;
	  };
	})();
	
	var init = function init() {
	  container = document.getElementById("container");
	
	  scene = new THREE.Scene();
	
	  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
	  camera.position.z = 1750;
	  scene.add(camera);
	  //controls = new OrbitControls( camera, container );
	
	  renderer = new THREE.WebGLRenderer({ antialias: false });
	  //renderer.setPixelRatio( window.devicePixelRatio );
	  renderer.setSize(window.innerWidth, window.innerHeight);
	  container.appendChild(renderer.domElement);
	  if (!renderer.context.getExtension("OES_texture_float")) {
	    alert("OES_texture_float is not :(");
	  }
	
	  // -----------------------------------------------------------------
	  //let width = 2048, height = 1024;
	  // let width = 64, height = 64;
	  var width = 512,
	      height = 512;
	
	  data = new Float32Array(width * height * 3);
	
	  var textGeo = new THREE.TextGeometry("DAT", {
	
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
	
	  points = randomPointsInGeometry(textGeo, data.length / 3);
	
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
	
	    vertexShader: shader.texture_vertex_simulation_shader,
	    fragmentShader: shader.texture_fragment_simulation_shader
	
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
	  console.log(geometry);
	  material = new THREE.ShaderMaterial({
	
	    uniforms: {
	
	      map: { type: "t", value: rtTexturePos },
	      width: { type: "f", value: width },
	      height: { type: "f", value: height },
	
	      pointSize: { type: "f", value: 3 }
	
	    },
	    vertexShader: shader["vs-particles"],
	    fragmentShader: shader["fs-particles"],
	    blending: THREE.AdditiveBlending,
	    depthWrite: false,
	    depthTest: false,
	    transparent: true
	
	  });
	
	  mesh = new THREE.ParticleSystem(geometry, material);
	  scene.add(mesh);
	
	  // -----------------------------------------------------------------
	
	  // set stats
	  stats = new Stats();
	  stats.domElement.style.position = "absolute";
	  stats.domElement.style.top = "0px";
	  document.body.appendChild(stats.domElement);
	
	  window.addEventListener("resize", onWindowResize, false);
	};
	
	var onWindowResize = function onWindowResize() {
	
	  camera.aspect = window.innerWidth / window.innerHeight;
	  camera.updateProjectionMatrix();
	
	  renderer.setSize(window.innerWidth, window.innerHeight);
	};
	
	var animate = (function (_animate) {
	  var _animateWrapper = function animate() {
	    return _animate.apply(this, arguments);
	  };
	
	  _animateWrapper.toString = function () {
	    return _animate.toString();
	  };
	
	  return _animateWrapper;
	})(function () {
	
	  // insert your creativity :D
	
	  requestAnimationFrame(animate);
	  stats.update();
	  render();
	});
	var timer = 0;
	var render = function render() {
	  timer += 0.01;
	  simulationShader.uniforms.timer.value = timer;
	
	  // swap
	  var tmp = fboParticles["in"];
	  fboParticles["in"] = fboParticles.out;
	  fboParticles.out = tmp;
	
	  simulationShader.uniforms.tPositions.value = fboParticles["in"];
	  fboParticles.simulate(fboParticles.out);
	  material.uniforms.map.value = fboParticles.out;
	  //controls.update();
	
	  renderer.render(scene, camera);
	};
	
	var shader = {
	  texture_vertex_simulation_shader: "\n    varying vec2 vUv;\n\n\t\tvoid main() {\n\n      vUv = vec2(uv.x, 1.0 - uv.y);\n      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t}\n  ",
	
	  texture_fragment_simulation_shader: "\n    // simulation\n    varying vec2 vUv;\n\n    uniform sampler2D tPositions;\n    uniform sampler2D origin;\n\n    uniform float timer;\n\n\n    float rand(vec2 co){\n      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    }\n\n    void main() {\n      vec3 pos = texture2D( tPositions, vUv ).xyz;\n\n      if ( rand(vUv + timer ) > 0.97 ) {\n        pos = texture2D( origin, vUv ).xyz;\n      } else {\n        float x = pos.x + timer;\n        float y = pos.y;\n        float z = pos.z;\n\n        pos.x += sin( y * 3.0 ) * cos( z * 11.0 ) * 0.005;\n        pos.y += sin( x * 5.0 ) * cos( z * 13.0 ) * 0.005;\n        pos.z += sin( x * 7.0 ) * cos( y * 17.0 ) * 0.005;\n\n      }\n      // Write new position out\n      gl_FragColor = vec4(pos, 1.0);\n    }\n  ",
	  "vs-particles": "\n      uniform sampler2D map;\n\n\t\t\tuniform float width;\n\t\t\tuniform float height;\n\n\t\t\tuniform float pointSize;\n\n\t\t\tvarying vec2 vUv;\n\t\t\tvarying vec4 vPosition;\n\n\t\t\tvoid main() {\n\n\t\t\t\tvUv = position.xy + vec2( 0.5 / width, 0.5 / height );\n\n\t\t\t\tvec3 color = texture2D( map, vUv ).rgb * 200.0 - 100.0;\n\n\t\t\t\tgl_PointSize = pointSize;\n\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( color, 1.0 );\n        //gl_Position = projectionMatrix * modelViewMatrix * vec4( position * 200.0, 1.0 );\n\n\t\t\t}\n\n  ",
	  "fs-particles": "\n    uniform sampler2D map;\n\n    varying vec2 vUv;\n    varying vec4 vPosition;\n\n    void main() {\n\n      float depth = smoothstep( 750.0, -500.0, gl_FragCoord.z / gl_FragCoord.w );\n      gl_FragColor = vec4( texture2D( map, vUv ).xyz * 1.5, depth );\n\n    }\n  ",
	
	  "vs-copy": "\n    uniform sampler2D map;\n    varying vec2 vUv;\n\n    void main() {\n\n      vUv = position.xy;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n    }\n  ",
	
	  "fs-copy": "\n    uniform sampler2D map;\n    varying vec2 vUv;\n\n    void main() {\n\n      gl_FragColor = texture2D( map, vUv );\n\n    }\n  "
	
	};
	
	var randomPointsInGeometry = function randomPointsInGeometry(geometry, n) {
	
	  var face,
	      i,
	      faces = geometry.faces,
	      vertices = geometry.vertices,
	      il = faces.length,
	      totalArea = 0,
	      cumulativeAreas = [],
	      vA,
	      vB,
	      vC;
	
	  // precompute face areas
	
	  for (i = 0; i < il; i++) {
	
	    face = faces[i];
	
	    vA = vertices[face.a];
	    vB = vertices[face.b];
	    vC = vertices[face.c];
	
	    face._area = triangleArea(vA, vB, vC);
	
	    totalArea += face._area;
	
	    cumulativeAreas[i] = totalArea;
	  }
	
	  // binary search cumulative areas array
	
	  function binarySearchIndices(value) {
	
	    function binarySearch(_x, _x2) {
	      var _again = true;
	
	      _function: while (_again) {
	        _again = false;
	        var start = _x,
	            end = _x2;
	        mid = undefined;
	
	        // return closest larger index
	        // if exact number is not found
	
	        if (end < start) {
	          return start;
	        }var mid = start + Math.floor((end - start) / 2);
	
	        if (cumulativeAreas[mid] > value) {
	          _x = start;
	          _x2 = mid - 1;
	          _again = true;
	          continue _function;
	        } else if (cumulativeAreas[mid] < value) {
	          _x = mid + 1;
	          _x2 = end;
	          _again = true;
	          continue _function;
	        } else {
	
	          return mid;
	        }
	      }
	    }
	
	    var result = binarySearch(0, cumulativeAreas.length - 1);
	    return result;
	  }
	
	  // pick random face weighted by face area
	
	  var r,
	      index,
	      result = [];
	
	  var stats = {};
	
	  for (i = 0; i < n; i++) {
	
	    r = THREE.Math.random16() * totalArea;
	
	    index = binarySearchIndices(r);
	
	    result[i] = randomPointInFace(faces[index], geometry);
	
	    if (!stats[index]) {
	
	      stats[index] = 1;
	    } else {
	
	      stats[index] += 1;
	    }
	  }
	
	  return result;
	};
	var triangleArea = (function () {
	
	  var vector1 = new THREE.Vector3();
	  var vector2 = new THREE.Vector3();
	
	  return function (vectorA, vectorB, vectorC) {
	
	    vector1.subVectors(vectorB, vectorA);
	    vector2.subVectors(vectorC, vectorA);
	    vector1.cross(vector2);
	
	    return 0.5 * vector1.length();
	  };
	})();
	
	var randomPointInFace = function randomPointInFace(face, geometry) {
	
	  var vA, vB, vC;
	
	  vA = geometry.vertices[face.a];
	  vB = geometry.vertices[face.b];
	  vC = geometry.vertices[face.c];
	
	  return randomPointInTriangle(vA, vB, vC);
	};
	init();
	animate();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = THREE;

/***/ },
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(THREE) {
	    var MOUSE = THREE.MOUSE
	    if (!MOUSE)
	        MOUSE = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };
	    
	    /**
	     * @author qiao / https://github.com/qiao
	     * @author mrdoob / http://mrdoob.com
	     * @author alteredq / http://alteredqualia.com/
	     * @author WestLangley / http://github.com/WestLangley
	     * @author erich666 / http://erichaines.com
	     */
	    /*global THREE, console */
	
	    // This set of controls performs orbiting, dollying (zooming), and panning. It maintains
	    // the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
	    // supported.
	    //
	    //    Orbit - left mouse / touch: one finger move
	    //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
	    //    Pan - right mouse, or arrow keys / touch: three finter swipe
	    //
	    // This is a drop-in replacement for (most) TrackballControls used in examples.
	    // That is, include this js file and wherever you see:
	    //      controls = new THREE.TrackballControls( camera );
	    //      controls.target.z = 150;
	    // Simple substitute "OrbitControls" and the control should work as-is.
	
	    function OrbitControls ( object, domElement ) {
	
	        this.object = object;
	        this.domElement = ( domElement !== undefined ) ? domElement : document;
	
	        // API
	
	        // Set to false to disable this control
	        this.enabled = true;
	
	        // "target" sets the location of focus, where the control orbits around
	        // and where it pans with respect to.
	        this.target = new THREE.Vector3();
	
	        // center is old, deprecated; use "target" instead
	        this.center = this.target;
	
	        // This option actually enables dollying in and out; left as "zoom" for
	        // backwards compatibility
	        this.noZoom = false;
	        this.zoomSpeed = 1.0;
	
	        // Limits to how far you can dolly in and out
	        this.minDistance = 0;
	        this.maxDistance = Infinity;
	
	        // Set to true to disable this control
	        this.noRotate = false;
	        this.rotateSpeed = 1.0;
	
	        // Set to true to disable this control
	        this.noPan = false;
	        this.keyPanSpeed = 7.0; // pixels moved per arrow key push
	
	        // Set to true to automatically rotate around the target
	        this.autoRotate = false;
	        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
	
	        // How far you can orbit vertically, upper and lower limits.
	        // Range is 0 to Math.PI radians.
	        this.minPolarAngle = 0; // radians
	        this.maxPolarAngle = Math.PI; // radians
	
	        // How far you can orbit horizontally, upper and lower limits.
	        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	        this.minAzimuthAngle = - Infinity; // radians
	        this.maxAzimuthAngle = Infinity; // radians
	
	        // Set to true to disable use of the keys
	        this.noKeys = false;
	
	        // The four arrow keys
	        this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
	
	        // Mouse buttons
	        this.mouseButtons = { ORBIT: MOUSE.LEFT, ZOOM: MOUSE.MIDDLE, PAN: MOUSE.RIGHT };
	
	        ////////////
	        // internals
	
	        var scope = this;
	
	        var EPS = 0.000001;
	
	        var rotateStart = new THREE.Vector2();
	        var rotateEnd = new THREE.Vector2();
	        var rotateDelta = new THREE.Vector2();
	
	        var panStart = new THREE.Vector2();
	        var panEnd = new THREE.Vector2();
	        var panDelta = new THREE.Vector2();
	        var panOffset = new THREE.Vector3();
	
	        var offset = new THREE.Vector3();
	
	        var dollyStart = new THREE.Vector2();
	        var dollyEnd = new THREE.Vector2();
	        var dollyDelta = new THREE.Vector2();
	
	        var theta;
	        var phi;
	        var phiDelta = 0;
	        var thetaDelta = 0;
	        var scale = 1;
	        var pan = new THREE.Vector3();
	
	        var lastPosition = new THREE.Vector3();
	        var lastQuaternion = new THREE.Quaternion();
	
	        var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
	
	        var state = STATE.NONE;
	
	        // for reset
	
	        this.target0 = this.target.clone();
	        this.position0 = this.object.position.clone();
	
	        // so camera.up is the orbit axis
	
	        var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
	        var quatInverse = quat.clone().inverse();
	
	        // events
	
	        var changeEvent = { type: 'change' };
	        var startEvent = { type: 'start'};
	        var endEvent = { type: 'end'};
	
	        this.rotateLeft = function ( angle ) {
	
	            if ( angle === undefined ) {
	
	                angle = getAutoRotationAngle();
	
	            }
	
	            thetaDelta -= angle;
	
	        };
	
	        this.rotateUp = function ( angle ) {
	
	            if ( angle === undefined ) {
	
	                angle = getAutoRotationAngle();
	
	            }
	
	            phiDelta -= angle;
	
	        };
	
	        // pass in distance in world space to move left
	        this.panLeft = function ( distance ) {
	
	            var te = this.object.matrix.elements;
	
	            // get X column of matrix
	            panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
	            panOffset.multiplyScalar( - distance );
	
	            pan.add( panOffset );
	
	        };
	
	        // pass in distance in world space to move up
	        this.panUp = function ( distance ) {
	
	            var te = this.object.matrix.elements;
	
	            // get Y column of matrix
	            panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
	            panOffset.multiplyScalar( distance );
	
	            pan.add( panOffset );
	
	        };
	
	        // pass in x,y of change desired in pixel space,
	        // right and down are positive
	        this.pan = function ( deltaX, deltaY ) {
	
	            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
	
	            if ( scope.object.fov !== undefined ) {
	
	                // perspective
	                var position = scope.object.position;
	                var offset = position.clone().sub( scope.target );
	                var targetDistance = offset.length();
	
	                // half of the fov is center to top of screen
	                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );
	
	                // we actually don't use screenWidth, since perspective camera is fixed to screen height
	                scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
	                scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );
	
	            } else if ( scope.object.top !== undefined ) {
	
	                // orthographic
	                scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
	                scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );
	
	            } else {
	
	                // camera neither orthographic or perspective
	                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
	
	            }
	
	        };
	
	        this.dollyIn = function ( dollyScale ) {
	
	            if ( dollyScale === undefined ) {
	
	                dollyScale = getZoomScale();
	
	            }
	
	            scale /= dollyScale;
	
	        };
	
	        this.dollyOut = function ( dollyScale ) {
	
	            if ( dollyScale === undefined ) {
	
	                dollyScale = getZoomScale();
	
	            }
	
	            scale *= dollyScale;
	
	        };
	
	        this.update = function () {
	
	            var position = this.object.position;
	
	            offset.copy( position ).sub( this.target );
	
	            // rotate offset to "y-axis-is-up" space
	            offset.applyQuaternion( quat );
	
	            // angle from z-axis around y-axis
	
	            theta = Math.atan2( offset.x, offset.z );
	
	            // angle from y-axis
	
	            phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );
	
	            if ( this.autoRotate && state === STATE.NONE ) {
	
	                this.rotateLeft( getAutoRotationAngle() );
	
	            }
	
	            theta += thetaDelta;
	            phi += phiDelta;
	
	            // restrict theta to be between desired limits
	            theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, theta ) );
	
	            // restrict phi to be between desired limits
	            phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );
	
	            // restrict phi to be betwee EPS and PI-EPS
	            phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );
	
	            var radius = offset.length() * scale;
	
	            // restrict radius to be between desired limits
	            radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
	
	            // move target to panned location
	            this.target.add( pan );
	
	            offset.x = radius * Math.sin( phi ) * Math.sin( theta );
	            offset.y = radius * Math.cos( phi );
	            offset.z = radius * Math.sin( phi ) * Math.cos( theta );
	
	            // rotate offset back to "camera-up-vector-is-up" space
	            offset.applyQuaternion( quatInverse );
	
	            position.copy( this.target ).add( offset );
	
	            this.object.lookAt( this.target );
	
	            thetaDelta = 0;
	            phiDelta = 0;
	            scale = 1;
	            pan.set( 0, 0, 0 );
	
	            // update condition is:
	            // min(camera displacement, camera rotation in radians)^2 > EPS
	            // using small-angle approximation cos(x/2) = 1 - x^2 / 8
	
	            if ( lastPosition.distanceToSquared( this.object.position ) > EPS
	                || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS ) {
	
	                this.dispatchEvent( changeEvent );
	
	                lastPosition.copy( this.object.position );
	                lastQuaternion.copy (this.object.quaternion );
	
	            }
	
	        };
	
	
	        this.reset = function () {
	
	            state = STATE.NONE;
	
	            this.target.copy( this.target0 );
	            this.object.position.copy( this.position0 );
	
	            this.update();
	
	        };
	
	        this.getPolarAngle = function () {
	
	            return phi;
	
	        };
	
	        this.getAzimuthalAngle = function () {
	
	            return theta
	
	        };
	
	        function getAutoRotationAngle() {
	
	            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
	
	        }
	
	        function getZoomScale() {
	
	            return Math.pow( 0.95, scope.zoomSpeed );
	
	        }
	
	        function onMouseDown( event ) {
	
	            if ( scope.enabled === false ) return;
	            event.preventDefault();
	
	            if ( event.button === scope.mouseButtons.ORBIT ) {
	                if ( scope.noRotate === true ) return;
	
	                state = STATE.ROTATE;
	
	                rotateStart.set( event.clientX, event.clientY );
	
	            } else if ( event.button === scope.mouseButtons.ZOOM ) {
	                if ( scope.noZoom === true ) return;
	
	                state = STATE.DOLLY;
	
	                dollyStart.set( event.clientX, event.clientY );
	
	            } else if ( event.button === scope.mouseButtons.PAN ) {
	                if ( scope.noPan === true ) return;
	
	                state = STATE.PAN;
	
	                panStart.set( event.clientX, event.clientY );
	
	            }
	
	            if ( state !== STATE.NONE ) {
	                document.addEventListener( 'mousemove', onMouseMove, false );
	                document.addEventListener( 'mouseup', onMouseUp, false );
	                scope.dispatchEvent( startEvent );
	            }
	
	        }
	
	        function onMouseMove( event ) {
	
	            if ( scope.enabled === false ) return;
	
	            event.preventDefault();
	
	            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
	
	            if ( state === STATE.ROTATE ) {
	
	                if ( scope.noRotate === true ) return;
	
	                rotateEnd.set( event.clientX, event.clientY );
	                rotateDelta.subVectors( rotateEnd, rotateStart );
	
	                // rotating across whole screen goes 360 degrees around
	                scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
	
	                // rotating up and down along whole screen attempts to go 360, but limited to 180
	                scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );
	
	                rotateStart.copy( rotateEnd );
	
	            } else if ( state === STATE.DOLLY ) {
	
	                if ( scope.noZoom === true ) return;
	
	                dollyEnd.set( event.clientX, event.clientY );
	                dollyDelta.subVectors( dollyEnd, dollyStart );
	
	                if ( dollyDelta.y > 0 ) {
	
	                    scope.dollyIn();
	
	                } else {
	
	                    scope.dollyOut();
	
	                }
	
	                dollyStart.copy( dollyEnd );
	
	            } else if ( state === STATE.PAN ) {
	
	                if ( scope.noPan === true ) return;
	
	                panEnd.set( event.clientX, event.clientY );
	                panDelta.subVectors( panEnd, panStart );
	
	                scope.pan( panDelta.x, panDelta.y );
	
	                panStart.copy( panEnd );
	
	            }
	
	            if ( state !== STATE.NONE ) scope.update();
	
	        }
	
	        function onMouseUp( /* event */ ) {
	
	            if ( scope.enabled === false ) return;
	
	            document.removeEventListener( 'mousemove', onMouseMove, false );
	            document.removeEventListener( 'mouseup', onMouseUp, false );
	            scope.dispatchEvent( endEvent );
	            state = STATE.NONE;
	
	        }
	
	        function onMouseWheel( event ) {
	
	            if ( scope.enabled === false || scope.noZoom === true || state !== STATE.NONE ) return;
	
	            event.preventDefault();
	            event.stopPropagation();
	
	            var delta = 0;
	
	            if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9
	
	                delta = event.wheelDelta;
	
	            } else if ( event.detail !== undefined ) { // Firefox
	
	                delta = - event.detail;
	
	            }
	
	            if ( delta > 0 ) {
	
	                scope.dollyOut();
	
	            } else {
	
	                scope.dollyIn();
	
	            }
	
	            scope.update();
	            scope.dispatchEvent( startEvent );
	            scope.dispatchEvent( endEvent );
	
	        }
	
	        function onKeyDown( event ) {
	
	            if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;
	
	            switch ( event.keyCode ) {
	
	                case scope.keys.UP:
	                    scope.pan( 0, scope.keyPanSpeed );
	                    scope.update();
	                    break;
	
	                case scope.keys.BOTTOM:
	                    scope.pan( 0, - scope.keyPanSpeed );
	                    scope.update();
	                    break;
	
	                case scope.keys.LEFT:
	                    scope.pan( scope.keyPanSpeed, 0 );
	                    scope.update();
	                    break;
	
	                case scope.keys.RIGHT:
	                    scope.pan( - scope.keyPanSpeed, 0 );
	                    scope.update();
	                    break;
	
	            }
	
	        }
	
	        function touchstart( event ) {
	
	            if ( scope.enabled === false ) return;
	
	            switch ( event.touches.length ) {
	
	                case 1: // one-fingered touch: rotate
	
	                    if ( scope.noRotate === true ) return;
	
	                    state = STATE.TOUCH_ROTATE;
	
	                    rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	                    break;
	
	                case 2: // two-fingered touch: dolly
	
	                    if ( scope.noZoom === true ) return;
	
	                    state = STATE.TOUCH_DOLLY;
	
	                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
	                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
	                    var distance = Math.sqrt( dx * dx + dy * dy );
	                    dollyStart.set( 0, distance );
	                    break;
	
	                case 3: // three-fingered touch: pan
	
	                    if ( scope.noPan === true ) return;
	
	                    state = STATE.TOUCH_PAN;
	
	                    panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	                    break;
	
	                default:
	
	                    state = STATE.NONE;
	
	            }
	
	            if ( state !== STATE.NONE ) scope.dispatchEvent( startEvent );
	
	        }
	
	        function touchmove( event ) {
	
	            if ( scope.enabled === false ) return;
	
	            event.preventDefault();
	            event.stopPropagation();
	
	            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
	
	            switch ( event.touches.length ) {
	
	                case 1: // one-fingered touch: rotate
	
	                    if ( scope.noRotate === true ) return;
	                    if ( state !== STATE.TOUCH_ROTATE ) return;
	
	                    rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	                    rotateDelta.subVectors( rotateEnd, rotateStart );
	
	                    // rotating across whole screen goes 360 degrees around
	                    scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
	                    // rotating up and down along whole screen attempts to go 360, but limited to 180
	                    scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );
	
	                    rotateStart.copy( rotateEnd );
	
	                    scope.update();
	                    break;
	
	                case 2: // two-fingered touch: dolly
	
	                    if ( scope.noZoom === true ) return;
	                    if ( state !== STATE.TOUCH_DOLLY ) return;
	
	                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
	                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
	                    var distance = Math.sqrt( dx * dx + dy * dy );
	
	                    dollyEnd.set( 0, distance );
	                    dollyDelta.subVectors( dollyEnd, dollyStart );
	
	                    if ( dollyDelta.y > 0 ) {
	
	                        scope.dollyOut();
	
	                    } else {
	
	                        scope.dollyIn();
	
	                    }
	
	                    dollyStart.copy( dollyEnd );
	
	                    scope.update();
	                    break;
	
	                case 3: // three-fingered touch: pan
	
	                    if ( scope.noPan === true ) return;
	                    if ( state !== STATE.TOUCH_PAN ) return;
	
	                    panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	                    panDelta.subVectors( panEnd, panStart );
	
	                    scope.pan( panDelta.x, panDelta.y );
	
	                    panStart.copy( panEnd );
	
	                    scope.update();
	                    break;
	
	                default:
	
	                    state = STATE.NONE;
	
	            }
	
	        }
	
	        function touchend( /* event */ ) {
	
	            if ( scope.enabled === false ) return;
	
	            scope.dispatchEvent( endEvent );
	            state = STATE.NONE;
	
	        }
	
	        this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	        this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	        this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	        this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
	
	        this.domElement.addEventListener( 'touchstart', touchstart, false );
	        this.domElement.addEventListener( 'touchend', touchend, false );
	        this.domElement.addEventListener( 'touchmove', touchmove, false );
	
	        window.addEventListener( 'keydown', onKeyDown, false );
	
	        // force an update at start
	        this.update();
	    };
	
	    OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
	    OrbitControls.prototype.constructor = OrbitControls;
	    return OrbitControls;
	}

/***/ },
/* 9 */,
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(11);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(13)(content, {});
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(16)();
	exports.push([module.id, "body {\n  margin: 0;\n}\ncanvas {\n  width: 100%;\n  height: 100%;\n}\n", ""]);

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// stats.js - http://github.com/mrdoob/stats.js
	var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
	i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
	k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
	"block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:12,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" FPS ("+p+"-"+q+")",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
	a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};"object"===typeof module&&(module.exports=Stats);


/***/ },
/* 13 */
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
/* 14 */,
/* 15 */,
/* 16 */
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
//# sourceMappingURL=app9.bundle.js.map