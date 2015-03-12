'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;

let data, texture, points;
let fboParticles, rtTexturePos, rtTexturePos2, simulationShader;
let geometry, material, mesh;
let randomPointInTriangle = function () {

  var vector = new THREE.Vector3();

  return function ( vectorA, vectorB, vectorC ) {

    var point = new THREE.Vector3();

    var a = THREE.Math.random16();
    var b = THREE.Math.random16();

    if ( ( a + b ) > 1 ) {

      a = 1 - a;
      b = 1 - b;

    }

    var c = 1 - a - b;

    point.copy( vectorA );
    point.multiplyScalar( a );

    vector.copy( vectorB );
    vector.multiplyScalar( b );

    point.add( vector );

    vector.copy( vectorC );
    vector.multiplyScalar( c );

    point.add( vector );

    return point;

  };

}();

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.z = 1750;
  scene.add(camera);
  //controls = new OrbitControls( camera, container );

  renderer = new THREE.WebGLRenderer( { antialias: false } );
  //renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  if ( ! renderer.context.getExtension( 'OES_texture_float' ) ) {
    alert( 'OES_texture_float is not :(' );
  }

  // -----------------------------------------------------------------
  //let width = 2048, height = 1024;
  // let width = 64, height = 64;
  let width = 512, height = 512;

  data = new Float32Array( width * height * 3 );

  let textGeo = new THREE.TextGeometry( "DAT", {

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

  textGeo.applyMatrix( new THREE.Matrix4().makeTranslation( -0.9, 0, 0.2 ) );

  points = randomPointsInGeometry( textGeo, data.length / 3 );

  for ( var i = 0, j = 0, l = data.length; i < l; i += 3, j += 1 ) {

    data[ i ] = points[ j ].x;
    data[ i + 1 ] = points[ j ].y;
    data[ i + 2 ] = points[ j ].z;

  }

  console.log( data.length / 3 );

  texture = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  rtTexturePos = new THREE.WebGLRenderTarget(width, height, {
    wrapS:THREE.RepeatWrapping,
    wrapT:THREE.RepeatWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBFormat,
    type:THREE.FloatType,
    stencilBuffer: false
  });

  rtTexturePos2 = rtTexturePos.clone();

  simulationShader = new THREE.ShaderMaterial({

    uniforms: {
      tPositions: { type: "t", value: texture },
      origin: { type: "t", value: texture },
      timer: { type: "f", value: 0 }
    },

    vertexShader: shader['texture_vertex_simulation_shader'],
    fragmentShader:  shader['texture_fragment_simulation_shader']

  });

  fboParticles = new THREE.FBOUtils( width, renderer, simulationShader );
  fboParticles.renderToTexture(rtTexturePos, rtTexturePos2);

  fboParticles.in = rtTexturePos;
  fboParticles.out = rtTexturePos2;


  geometry = new THREE.Geometry();

  for ( var i = 0, l = width * height; i < l; i ++ ) {

    var vertex = new THREE.Vector3();
    vertex.x = ( i % width ) / width ;
    vertex.y = Math.floor( i / width ) / height;
    geometry.vertices.push( vertex );

  }
  console.log(geometry);
  material = new THREE.ShaderMaterial( {

    uniforms: {

      "map": { type: "t", value: rtTexturePos },
      "width": { type: "f", value: width },
      "height": { type: "f", value: height },

      "pointSize": { type: "f", value: 3 }

    },
    vertexShader: shader['vs-particles'],
    fragmentShader: shader['fs-particles'],
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    transparent: true

  } );

  mesh = new THREE.ParticleSystem( geometry, material );
  scene.add( mesh );

  // -----------------------------------------------------------------



  // set stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};

let animate = function(){

  // insert your creativity :D

  requestAnimationFrame(animate);
  stats.update();
  render();

};
let timer = 0;
let render = function(){
  timer += 0.01;
  simulationShader.uniforms.timer.value = timer;


  // swap
  var tmp = fboParticles.in;
  fboParticles.in = fboParticles.out;
  fboParticles.out = tmp;

  simulationShader.uniforms.tPositions.value = fboParticles.in;
  fboParticles.simulate(fboParticles.out);
  material.uniforms.map.value = fboParticles.out;
  //controls.update();

  renderer.render( scene, camera );

};


let shader = {
  texture_vertex_simulation_shader: `
    varying vec2 vUv;

		void main() {

      vUv = vec2(uv.x, 1.0 - uv.y);
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
  `,

  texture_fragment_simulation_shader:`
    // simulation
    varying vec2 vUv;

    uniform sampler2D tPositions;
    uniform sampler2D origin;

    uniform float timer;


    float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec3 pos = texture2D( tPositions, vUv ).xyz;

      if ( rand(vUv + timer ) > 0.97 ) {
        pos = texture2D( origin, vUv ).xyz;
      } else {
        float x = pos.x + timer;
        float y = pos.y;
        float z = pos.z;

        pos.x += sin( y * 3.0 ) * cos( z * 11.0 ) * 0.005;
        pos.y += sin( x * 5.0 ) * cos( z * 13.0 ) * 0.005;
        pos.z += sin( x * 7.0 ) * cos( y * 17.0 ) * 0.005;

      }
      // Write new position out
      gl_FragColor = vec4(pos, 1.0);
    }
  `,
  'vs-particles':`
      uniform sampler2D map;

			uniform float width;
			uniform float height;

			uniform float pointSize;

			varying vec2 vUv;
			varying vec4 vPosition;

			void main() {

				vUv = position.xy + vec2( 0.5 / width, 0.5 / height );

				vec3 color = texture2D( map, vUv ).rgb * 200.0 - 100.0;

				gl_PointSize = pointSize;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( color, 1.0 );
        //gl_Position = projectionMatrix * modelViewMatrix * vec4( position * 200.0, 1.0 );

			}

  `,
  'fs-particles':`
    uniform sampler2D map;

    varying vec2 vUv;
    varying vec4 vPosition;

    void main() {

      float depth = smoothstep( 750.0, -500.0, gl_FragCoord.z / gl_FragCoord.w );
      gl_FragColor = vec4( texture2D( map, vUv ).xyz * 1.5, depth );

    }
  `,

  "vs-copy":`
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {

      vUv = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,

  "fs-copy":`
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {

      gl_FragColor = texture2D( map, vUv );

    }
  `

};

let randomPointsInGeometry = function ( geometry, n ) {

  var face, i,
    faces = geometry.faces,
    vertices = geometry.vertices,
    il = faces.length,
    totalArea = 0,
    cumulativeAreas = [],
    vA, vB, vC;

  // precompute face areas

  for ( i = 0; i < il; i ++ ) {

    face = faces[ i ];

    vA = vertices[ face.a ];
    vB = vertices[ face.b ];
    vC = vertices[ face.c ];

    face._area = triangleArea( vA, vB, vC );

    totalArea += face._area;

    cumulativeAreas[ i ] = totalArea;

  }

  // binary search cumulative areas array

  function binarySearchIndices( value ) {

    function binarySearch( start, end ) {

      // return closest larger index
      // if exact number is not found

      if ( end < start )
        return start;

      var mid = start + Math.floor( ( end - start ) / 2 );

      if ( cumulativeAreas[ mid ] > value ) {

        return binarySearch( start, mid - 1 );

      } else if ( cumulativeAreas[ mid ] < value ) {

        return binarySearch( mid + 1, end );

      } else {

        return mid;

      }

    }

    var result = binarySearch( 0, cumulativeAreas.length - 1 )
    return result;

  }

  // pick random face weighted by face area

  var r, index,
    result = [];

  var stats = {};

  for ( i = 0; i < n; i ++ ) {

    r = THREE.Math.random16() * totalArea;

    index = binarySearchIndices( r );

    result[ i ] = randomPointInFace( faces[ index ], geometry );

    if ( ! stats[ index ] ) {

      stats[ index ] = 1;

    } else {

      stats[ index ] += 1;

    }

  }

  return result;

};
let triangleArea= function () {

  var vector1 = new THREE.Vector3();
  var vector2 = new THREE.Vector3();

  return function ( vectorA, vectorB, vectorC ) {

    vector1.subVectors( vectorB, vectorA );
    vector2.subVectors( vectorC, vectorA );
    vector1.cross( vector2 );

    return 0.5 * vector1.length();

  };

}();

let randomPointInFace = function ( face, geometry ) {

  var vA, vB, vC;

  vA = geometry.vertices[ face.a ];
  vB = geometry.vertices[ face.b ];
  vC = geometry.vertices[ face.c ];

  return randomPointInTriangle( vA, vB, vC );

};
init();
animate();