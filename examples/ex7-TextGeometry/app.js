'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;
let attributes, uniforms, geometry;

const text = "RESAS",
  height = 15,
  size = 50,
  curveSegments = 10,
  steps = 20,
  bevelThickness = 0,
  hover = 30,
  bevelSize = 1.5,
  bevelSegments = 1,//10,
  bevelEnabled = true,
  font = "helvetiker", 		// helvetiker, optimer, gentilis, droid sans, droid serif
  weight = "bold",		// normal bold
  style = "normal";		// normal italic

let object;
let material;
let textGeo,textMesh1,group;



let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
  //camera.position.z = 350;
  camera.position.set( 0, 400, 700 );
  controls = new OrbitControls( camera, container );

  // -----------------------------------------------------------------
  let cameraTarget = new THREE.Vector3( 0, 150, 0 );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
  dirLight.position.set( 0, 0, 1 ).normalize();
  scene.add( dirLight );

  var pointLight = new THREE.PointLight( 0xffffff, 1.5 );
  pointLight.position.set( 0, 110, 90 );
  scene.add( pointLight );

  material = new THREE.MeshFaceMaterial([new THREE.MeshPhongMaterial({
    color  : 0xffffff,
    shading: THREE.FlatShading
  }), // front
    new THREE.MeshPhongMaterial({
      color  : 0xffffff,
      shading: THREE.SmoothShading
    }) // side
  ]);

  group = new THREE.Group();
  group.position.y = 100;

  scene.add( group );

  createText();

  var plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( 10000, 10000 ),
    new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 0.5, transparent: true } )
  );
  plane.position.y = 100;
  plane.rotation.x = - Math.PI / 2;
  scene.add( plane );


  // -----------------------------------------------------------------

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0x050505 );
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

let createText = function() {

  textGeo = new THREE.TextGeometry( text, {

    size: size,
    height: height,
    curveSegments: curveSegments,

    font: font,
    weight: weight,
    style: style,

    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelEnabled: bevelEnabled,

    material: 0,
    extrudeMaterial: 1

  });

  textGeo.computeBoundingBox();
  textGeo.computeVertexNormals();

  // "fix" side normals by removing z-component of normals for side faces
  // (this doesn't work well for beveled geometry as then we lose nice curvature around z-axis)

  if ( ! bevelEnabled ) {

    var triangleAreaHeuristics = 0.1 * ( height * size );

    for ( var i = 0; i < textGeo.faces.length; i ++ ) {

      var face = textGeo.faces[ i ];

      if ( face.materialIndex == 1 ) {

        for ( var j = 0; j < face.vertexNormals.length; j ++ ) {

          face.vertexNormals[ j ].z = 0;
          face.vertexNormals[ j ].normalize();

        }

        var va = textGeo.vertices[ face.a ];
        var vb = textGeo.vertices[ face.b ];
        var vc = textGeo.vertices[ face.c ];

        var s = THREE.GeometryUtils.triangleArea( va, vb, vc );

        if ( s > triangleAreaHeuristics ) {

          for ( var j = 0; j < face.vertexNormals.length; j ++ ) {

            face.vertexNormals[ j ].copy( face.normal );

          }
        }
      }
    }
  }

  var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

  textMesh1 = new THREE.Mesh( textGeo, material );

  textMesh1.position.x = centerOffset;
  textMesh1.position.y = hover;
  textMesh1.position.z = 0;

  textMesh1.rotation.x = 0;
  textMesh1.rotation.y = Math.PI * 2;

  group.add( textMesh1 );

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

let render = function(){

  //group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;

  //camera.lookAt( cameraTarget );

  renderer.render( scene, camera );

};

init();
animate();