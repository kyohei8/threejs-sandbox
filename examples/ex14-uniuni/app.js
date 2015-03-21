'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

import {vertexShader} from './shader/vertex-shader';
import {fragmentShader} from './shader/fragment-shader';

let container,stats;
let camera, controls, scene, renderer;
let attributes, uniforms;
let sphere;
let noise = [];

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.z = 250;
  controls = new OrbitControls( camera, container );

  var axisHelper = new THREE.AxisHelper(2);
  scene.add(axisHelper);


  // -----------------------------------------------------------------
  /**
   * attributeとは
   * @type {{displacement: {type: string, value: Array}}}
   */
  attributes = {
    displacement: {
      type: 'f',
      value: []
    }
  };

  /**
   * シェーダのuniform変数に値を渡すために定義
   */
  uniforms = {
    // 振動を定義(型はfloat)
    amplitude: {
      type : "f",
      value: 1.0
    },
    // 色(型はTHREE.Color)
    color    : {
      type : "c",
      value: new THREE.Color(0xff2200)
    },
    // テクスチャ (型はTHREE.Texture)
    texture  : {
      type : "t",
      value: THREE.ImageUtils.loadTexture("./water.jpg")
    }
  };
  uniforms.texture.value.warpS = uniforms.texture.value.wrapT = THREE.RepeatWrapping;

  // shaderMaterial を生成
  let shaderMaterial = new THREE.ShaderMaterial({
    uniforms : uniforms,
    attributes: attributes,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

  let radius = 50,
      segments = 128,
      rings = 64;
  let geometry = new THREE.SphereGeometry(radius, segments, rings);
  geometry.dynamic = true;

  sphere = new THREE.Mesh(geometry, shaderMaterial);

  //頂点
  let vertices = sphere.geometry.vertices;
  let values = attributes.displacement.value;

  //球の頂点に対しattributesとnoiseを設定
  for(let v=0; v < vertices.length; v++){
    values[v] = 0;
    noise[v] = Math.random() * 5;
  }

  scene.add(sphere);



  // -----------------------------------------------------------------


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

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

  requestAnimationFrame(animate);
  stats.update();
  render();

};

let render = function(){


  let time = Date.now() * 0.01;
  // 球体を回す
  let rotationSpeed = 0.01;
  sphere.rotation.y = sphere.rotation.z = rotationSpeed * time;

  // テクスチャを変更する
  uniforms.amplitude.value = 2.5  * Math.sin( sphere.rotation.y * 0.125);
  // 色を変更する
  uniforms.color.value.offsetHSL( 0.0005, 0, 0 );

  for ( var i = 0; i < attributes.displacement.value.length; i ++ ) {
    attributes.displacement.value[ i ] = Math.sin( 0.1 * i + time );

    noise[ i ] += 0.5 * ( 0.5 - Math.random() );
    noise[ i ] = THREE.Math.clamp( noise[ i ], -5, 5 );

    attributes.displacement.value[ i ] += noise[ i ];
  }

  attributes.displacement.needsUpdate = true;

  renderer.render( scene, camera );

};

init();
animate();