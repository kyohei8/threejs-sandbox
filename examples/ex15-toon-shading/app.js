'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container, stats;
let camera, controls, scene, renderer, sceneEdge;

let faceMaterial, shaderMaterial;
let mesh, meshEdge;
let globalLight;
let lightCameraVisibility = false;
let vs = `
uniform bool edge;
varying vec3 vNormal;

void main(void) {
  vec3 pos = position;

  if (edge) {
    pos += normal * 0.04;
  }
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
  `;

let fs = `

    precision mediump float;

    uniform vec3 lightDirection;
    uniform sampler2D texture;
    uniform vec4 edgeColor;

    varying vec3 vNormal;

    void main(void) {
        if (edgeColor.a > 0.0) {
            gl_FragColor = edgeColor;
        }
        else {
            float diffuse = clamp(dot(vNormal, lightDirection), 0.0, 1.0);
            vec4 smpColor = texture2D(texture, vec2(diffuse, 0.0));
            gl_FragColor = smpColor;
        }
    }
  `;

let init = function(){
  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 100;
  camera.position.z = 10;
  camera.target = new THREE.Vector3( 0, 150, 0 );

  scene = new THREE.Scene();
  sceneEdge = new THREE.Scene();

  //var axisHelper = new THREE.AxisHelper(2);
  //scene.add(axisHelper);

  // -----------------------------------------------------------------
  // 光源を設定
  globalLight = new THREE.DirectionalLight( 0xefefff, 2 );
  globalLight.position.set(-1, 1, 1).normalize();
  globalLight.castShadow = true;
  globalLight.shadowMapWidth = 2048;
  globalLight.shadowMapHeight = 2048;

  var d = 1000;
  globalLight.shadowCameraLeft = -d;
  globalLight.shadowCameraRight = d;
  globalLight.shadowCameraTop = d;
  globalLight.shadowCameraBottom = -d;
  globalLight.shadowCameraNear = 1;
  globalLight.shadowCameraFar = 1000;
  globalLight.shadowCameraFov = 40;

  globalLight.shadowCameraVisible = false;

  globalLight.shadowBias = 0.0001;
  globalLight.shadowDarkness = 0.5;

  scene.add(globalLight);

  var light2 = new THREE.DirectionalLight( 0xffefef, 2 );
  light2.position.set( -1, -1, -1 ).normalize();

  scene.add( light2 );

  let loader = new THREE.JSONLoader(true);
  loader.load('./model.json', function(geometry, materials){

    shaderMaterial = new THREE.ShaderMaterial({
      fragmentShader: fs,
      vertexShader  : vs,
      attributes    : {},
      uniforms      : {
        edgeColor     : {
          type : 'v4',
          value: new THREE.Vector4(0, 0, 0, 0)
        },
        edge          : {
          type : 'i',
          value: true
        },
        lightDirection: {
          type : 'v3',
          value: globalLight.position
        },
        texture       : {
          type : 't',
          value: THREE.ImageUtils.loadTexture('./texture.png')
        }
      }
    });

    shaderMaterial.morphTargets = true;

    if(materials){
      for(var i = 0, len = materials.length; i < len; i++){
        materials[i].morphTargets = true;
      }

      faceMaterial = new THREE.MeshFaceMaterial(materials);
    }

    mesh = new THREE.SkinnedMesh(geometry, shaderMaterial);
    mesh.scale.set(100, 100, 100);
    mesh.position.y += 40;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    meshEdge = mesh.clone();

    scene.add(mesh);
    sceneEdge.add(meshEdge);
  });

  // -----------------------------------------------------------------


  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setClearColor( 0xCCCCCC, 1 );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.sortObjects = false;
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;
  renderer.autoClear = false;

  container.appendChild(renderer.domElement);

  // set stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  window.addEventListener('resize', onWindowResize, false);

};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

};

let animate = function(){

  // insert your creativity :D

  requestAnimationFrame(animate);
  stats.update();
  render();

};

var radius = 800;
var theta = 0;
let duration = 1000;
let keyframes = 30, interpolation = duration / keyframes;
let lastKeyframe = 0, currentKeyframe = 0;

let y = 0;

let render = function(){

  camera.position.x = radius * Math.sin(THREE.Math.degToRad(theta));
  camera.position.z = radius * Math.cos(THREE.Math.degToRad(theta));
  camera.lookAt(scene.position);

  //theta += 0.1;

  if (mesh) {
    y += 0.3;
    mesh.position.y = 100 * Math.sin(THREE.Math.degToRad(y));
    meshEdge.position.y = 100 * Math.sin(THREE.Math.degToRad(y));
    // Alternate morph targets
    var time = Date.now() % duration;
    var keyframe = Math.floor( time / interpolation );

    if ( keyframe != currentKeyframe ) {
      mesh.morphTargetInfluences[ lastKeyframe ] = 0;
      mesh.morphTargetInfluences[ currentKeyframe ] = 1;
      mesh.morphTargetInfluences[ keyframe ] = 0;

      lastKeyframe = currentKeyframe;
      currentKeyframe = keyframe;
    }

    mesh.morphTargetInfluences[keyframe] = ( time % interpolation ) / interpolation;
    mesh.morphTargetInfluences[lastKeyframe] = 1 - mesh.morphTargetInfluences[ keyframe ];

    //cameraCube.rotation.copy(camera.rotation);

    renderer.clear();
    //renderer.render(sceneCube, cameraCube);

    //render front face.
    meshEdge.material.side = THREE.FrontSide;
    mesh.material.uniforms.edgeColor.value = new THREE.Vector4(0, 0, 0, 0);
    mesh.material.uniforms.edge.value = false;

    renderer.render(scene, camera);

    //render back face as edge.
    meshEdge.material.side = THREE.BackSide;
    meshEdge.material.uniforms.edgeColor.value = new THREE.Vector4(0, 0, 0, 1);
    meshEdge.material.uniforms.edge.value = true;
    renderer.render(sceneEdge, camera);

  }

  //renderer.render(scene, camera);

};

init();
animate();