import * as THREE from './build/three.module.js';
//import * as ThreeCSG from 'https://rawgit.com/chandlerprall/ThreeCSG/master/ThreeCSG.js';

import Stats from './lib/stats.module.js';

import { OrbitControls } from './lib/OrbitControls.js';

import { OBJLoader } from './lib/OBJLoader.js';

import { GLTFLoader } from './lib/GLTFLoader.js';

import { MTLLoader } from './lib/MTLLoader.js';

import { Sky } from './lib/Sky.js';

//import { RectAreaLightUniformsLib } from './three.js-master/examples/jsm/lights/RectAreaLightUniformsLib.js';

var GAME_STATUS='loading';
// Graphics variables
var container, stats;
var camera, controls, scene, renderer;
var textureLoader;
var objLoader;
var clock = new THREE.Clock();
var transitionClock;
var textureURL = ["./textures/TexturesCom_Wood_BirchVeneer_512_albedo.png"];
var materials = [];
var sunEffects;
var sky;
var sunSphere;

// Physics variables
const SPEED = 10;
var gravityConstant = - 9.82;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var tama; //player
var rigidBodies = [];
var margin = 0.05;
var transformAux1;
var tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
var tmpTrans = null, ammoTmpPos = null, ammoTmpQuat = null;
//Non-rigid bodies that are moved
var platforms1 = [];
var platforms2 = [];
var tamaMoveDirection = { left: 0, right: 0, forward: 0, back: 0, y: 0, rotate: 0 };

var roomLength = 200;
var roomWidth = 15;
var roomHeight = 10;

var t=0;
var lastPlatform;

var loadingManager;


Ammo().then( function ( AmmoLib ) {

	Ammo = AmmoLib;

	init();
	animate();

} );

function init() {


	loadingManager = new THREE.LoadingManager( () => {
	
		const loadingScreen = document.getElementById( 'loading-screen' );
		loadingScreen.classList.add( 'fade-out' );
		
		// remove loader from DOM via event listener
		loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
		GAME_STATUS='start';
		
	} );

	tmpTrans = new Ammo.btTransform();
	ammoTmpPos = new Ammo.btVector3();
	ammoTmpQuat = new Ammo.btQuaternion();

	initGraphics();

	initPhysics();

	createObjects();

	createPlayer();
	
	loadObjects();

	setupEventHandlers();

}

function loadObjects(){

	//Load music
	var listener = new THREE.AudioListener();
	camera.add( listener );

	var sound = new THREE.Audio( listener );

	// load a sound and set it as the Audio object's buffer
	var audioLoader = new THREE.AudioLoader();
	audioLoader.load( 'music/HiroshiYoshimura_SLEEP.mp3', function( buffer ) {
		sound.setBuffer( buffer );
		sound.setLoop( true );
		sound.setVolume( 0.5 );
		sound.play();
	});
	
	var onProgress = function ( xhr ) {
	
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	};

	var onError = function ( xhr ) { console.log( 'An error occured while loading model' ); };

	//OBJ models
	objLoader = new OBJLoader(loadingManager);

	objLoader.load(
		// resource URL
		'./models/17484_Kendama_v1.obj',
		// called when resource is loaded
		function ( object ) {
	
			object.position.set(0, 0, lastPlatform.position.z);
			object.scale.x=object.scale.y=object.scale.z=0.2;
			object.rotateX(-Math.PI/2);
			scene.add( object );
	
		},onProgress,onError);

	objLoader.load(
		// resource URL
		'./models/portal-shinto/source/gate.obj',
		// called when resource is loaded
		function ( object ) {
	
			object.position.set(0, 0, 0);
			// object.scale.x=object.scale.y=object.scale.z=0.2;
			// object.rotateX(-Math.PI/2);
			scene.add( object );
	
		},onProgress,onError);

	// objLoader.load(
	// 	// resource URL
	// 	'./models/contenedor-de-sahumerios/source/stoneMisc.obj',
	// 	// called when resource is loaded
	// 	function ( object ) {
	
	// 		object.position.set(2, 0, lastPlatform.position.z);
	// 		//object.scale.x=object.scale.y=object.scale.z=0.2;
	// 		// object.rotateX(-Math.PI/2);
	// 		scene.add( object );
	
	// 	},onProgress,onError);

	// var mtlLoader = new MTLLoader(loadingManager);
	// mtlLoader.load( './models/musashi-plains-six-panel-screen-one-of-a-pair/source/171115_mia329_122161_Point_402_100Kfaces_OBJ.mtl', function( materials ) {

	// 	materials.preload();
	// 	materials.fog=false;
	// 	var objLoader = new OBJLoader();
	// 	objLoader.setMaterials( materials );
	// 	objLoader.load( './models/musashi-plains-six-panel-screen-one-of-a-pair/source/171115_mia329_122161_Point_402_100Kfaces_OBJ.obj', function ( object ) {

	// 		//object.material.fog=false;
	// 		var obj2 = object.clone();
	// 		var obj2 = object.clone();
	// 		var obj3 = object.clone();
	// 		var obj4 = object.clone();
	// 		object.position.set(-1.7,3,100);
	// 		object.rotateY(-Math.PI/2 + Math.PI/70);
	// 		object.rotateX(-Math.PI/100);

	// 		obj2.position.set(-1.7,3,75);
	// 		obj2.rotateY(-Math.PI/2 + Math.PI/70);
	// 		obj2.rotateX(-Math.PI/100);

	// 		obj3.position.set(-10-1.7,3,100);
	// 		obj3.rotateY(Math.PI + Math.PI/70);
	// 		obj3.rotateX(-Math.PI/100);

	// 		obj4.position.set(-10-1.7,3,75);
	// 		obj4.rotateY(-Math.PI/2 + Math.PI/70);
	// 		obj4.rotateX(-Math.PI/100);

	// 		scene.add(obj2);
	// 		scene.add(obj3);
	// 		scene.add(obj4);
	// 		scene.add( object );


	// 	}, onProgress, onError );

	// });


	//GLTF Models
	// var gltfLoader = new GLTFLoader(loadingManager);
	// gltfLoader.load('./models/takiyasha_the_witch_and_the_skeleton_spectre/scene.gltf', (gltf) => {
	// 	const root = gltf.scene;
	// 	root.traverse((o) => {
	// 		if (o.isMesh) o.material.fog=false;
	// 	});
	// 	root.scale.x=root.scale.y=3.2;
	// 	root.rotateY(-Math.PI/2);
	// 	root.position.set(-7,3.2,70);
	// 	scene.add(root);
	//   });
}

function initSky() {

	// Add Sky
	sky = new Sky();
	sky.scale.setScalar( 450000 );
	scene.add( sky );

	// Add Sun Helper
	sunSphere = new THREE.Mesh(
		new THREE.SphereBufferGeometry( 20000, 16, 8 ),
		new THREE.MeshBasicMaterial( { color: 0xffffff } )
	);
	scene.add( sunSphere );

	//Light properties
	sunEffects = {
		turbidity: 2.2,
		rayleigh: 0,
		mieCoefficient: 0.034,
		mieDirectionalG: 0.942,
		luminance: 1.1,
		inclination: 0.4978, // elevation / inclination
		azimuth: 0.25, // Facing front,
		sun: ! false
	};

	setSunEffect();
}

function setSunEffect(){
	var distance = 400000;

	var uniforms = sky.material.uniforms;
	uniforms[ "turbidity" ].value = sunEffects.turbidity;
	uniforms[ "rayleigh" ].value = sunEffects.rayleigh;
	uniforms[ "mieCoefficient" ].value = sunEffects.mieCoefficient;
	uniforms[ "mieDirectionalG" ].value = sunEffects.mieDirectionalG;
	uniforms[ "luminance" ].value = sunEffects.luminance;

	var theta = Math.PI * ( sunEffects.inclination - 0.5 );
	var phi = 2 * Math.PI * ( sunEffects.azimuth - 0.5 );

	sunSphere.position.x = distance * Math.cos( phi );
	sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
	sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

	sunSphere.visible = sunEffects.sun;

	uniforms[ "sunPosition" ].value.copy( sunSphere.position );
}

function setupEventHandlers(){

	window.addEventListener( 'keydown', handleKeyDown, false);
	window.addEventListener( 'keyup', handleKeyUp, false);

}


function handleKeyDown(event){

	let keyCode = event.keyCode;

	switch(keyCode){

		case 87: //W: FORWARD
			tamaMoveDirection.forward = 1;
			break;
			
		case 83: //S: BACK
			tamaMoveDirection.back = 1;
			//console.log(tama.position);
			break;
			
		case 65: //A: LEFT
			tamaMoveDirection.left = 1;
			break;
			
		case 68: //D: RIGHT
			tamaMoveDirection.right = 1;
			break;

		case 32: //SPACE
			if(GAME_STATUS==='start'&&tama.position.z<-10){
				GAME_STATUS="retry";
			}
			break;
			
	}
}


function handleKeyUp(event){
	let keyCode = event.keyCode;

	switch(keyCode){
		case 87: //FORWARD
			tamaMoveDirection.forward = 0;
			break;
			
		case 83: //BACK
			tamaMoveDirection.back = 0;
			break;
			
		case 65: //LEFT
			tamaMoveDirection.left = 0;
			break;
			
		case 68: //RIGHT
			tamaMoveDirection.right = 0;
			break;

	}

}

function initGraphics() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );

	var backgroundColour = 0xbfd1e5;
	scene = new THREE.Scene();
	scene.background = new THREE.Color( backgroundColour );
	scene.fog = new THREE.Fog(0xffffff, 10, 50);

	scene.add(camera);
	camera.position.set( 0 , 5, 190 );
	camera.lookAt(0,0,0);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	container.appendChild( renderer.domElement );

	initSky();

	controls = new OrbitControls( camera, renderer.domElement );
	controls.autoRotate = true;
    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.autoRotateSpeed = 0.7;

	textureLoader = new THREE.TextureLoader();

	//todo: fix light
	// var ambient = new THREE.AmbientLight( 0xffffff, 0.3 );
	// scene.add( ambient );

	// var light = new THREE.DirectionalLight( 0xffffff, 0.3 );
	// light.position.y=1000;
	// scene.add(light);

	var light = new THREE.HemisphereLight( 0xffffff, 0, 2.5 );
	scene.add( light );

	// RectAreaLightUniformsLib.init();

	// var rectLight = new THREE.RectAreaLight( 0xffffff, 5, 10, 10 );
	// rectLight.position.set( 0, roomHeight/2,  roomLength/2);
	// rectLight.lookAt(0, roomHeight/2,  roomLength/2+5)
	// scene.add( rectLight );

	// var rectLightMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { side: THREE.BackSide } ) );
	// rectLightMesh.scale.x = rectLight.width;
	// rectLightMesh.scale.y = rectLight.height;
	// rectLight.add( rectLightMesh );

	// var rectLightMeshBack = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { color: 0x080808 } ) );
	// rectLightMesh.add( rectLightMeshBack );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function initPhysics() {

	// Physics configuration

	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

	transformAux1 = new Ammo.btTransform();

}

function createPlayer(){
	var pos = new THREE.Vector3();
	var quat = new THREE.Quaternion();

	//Tama (the player)
	var tamaMass = 1.2;
	var tamaRadius = 0.6;

	var cubeCamera = new THREE.CubeCamera( 0.1, 1, 512 );
	cubeCamera.renderTarget.texture.generateMipmaps = true;
	cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;

	scene.background = cubeCamera.renderTarget;


	tama  = new THREE.Mesh( new THREE.SphereBufferGeometry( tamaRadius, 100, 100 ),new THREE.MeshStandardMaterial( {
		roughness: 0.1,
		envMap: cubeCamera.renderTarget.texture
	} ) );
	tama.castShadow = true;
	tama.receiveShadow = true;
	textureLoader.load(textureURL[0], function(texture){
		texture.repeat.set( 1, 1 );
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		tama.material.map = texture; // Applies this texture to the material and hence to the object.
		tama.material.needsUpdate = true;
	});
	var tamaShape =  new Ammo.btSphereShape( tamaRadius );
	tamaShape.setMargin( margin );
	//Set the player's initial position to be in the black room
	pos.set( 0, 0.1,  100);
	quat.set( 0, 0, 0, 1 );
	createRigidBody( tama, tamaShape, tamaMass, pos, quat );
	//These properties, along with tamaMass, influence how 'heavy'the tama feals to control i.e. how much momentum it has at a given speed
	tama.userData.physicsBody.setDamping(0.3, 0);
	tama.userData.physicsBody.setFriction(0.7);
	tama.userData.physicsBody.setRollingFriction(0.5);
}

function createRoom(){
	var pos = new THREE.Vector3();
	var quat = new THREE.Quaternion();



	//Starting Room
	var mat = new THREE.MeshStandardMaterial( { color: 0x0, roughness: 0, metalness: 0 } );
	//Floor
	pos.set( 0, - 0.5, 5+roomLength/2 );
	quat.set( 0, 0, 0, 1 );
	var floor = createParalellepiped( roomWidth, 1, roomLength, 0, pos, quat, mat );
	// floor.castShadow = true;
	// floor.receiveShadow = true;
	floor.material.fog=false;
	//Walls
	//right
	pos.set(roomWidth/2+0.5 , roomHeight/2, 5+roomLength/2 );
	quat.set( 0, 0, 0, 1 );
	var wallRight = createParalellepiped( 1, roomHeight, roomLength, 0, pos, quat, mat );
	wallRight.castShadow = true;
	wallRight.receiveShadow = true;
	wallRight.material.fog=false;
	//left
	pos.set(-(roomWidth/2+0.5) , roomHeight/2, 5+roomLength/2 );
	quat.set( 0, 0, 0, 1 );
	var wallLeft = createParalellepiped( 1, roomHeight, roomLength, 0, pos, quat, mat );
	wallLeft.castShadow = true;
	wallLeft.receiveShadow = true;
	wallLeft.material.fog=false;
	//back
	pos.set(0 , roomHeight/2, roomLength+0.5 );
	quat.set( 0, 0, 0, 1 );
	var wallBack = createParalellepiped( roomWidth, roomHeight, 1, 0, pos, quat, mat );
	wallLeft.castShadow = true;
	wallLeft.receiveShadow = true;
	wallLeft.material.fog=false;
	//Roof
	pos.set( 0, roomHeight+0.5, 5+roomLength/2 );
	quat.set( 0, 0, 0, 1 );
	var roof = createParalellepiped( roomWidth, 1, roomLength, 0, pos, quat,mat );
	roof.castShadow = true;
	roof.receiveShadow = true;
	roof.material.fog=false;
}

function createObjects() {


	createRoom();

	var pos = new THREE.Vector3();
	var quat = new THREE.Quaternion();


	var baseMaterial = new THREE.MeshStandardMaterial( {
		roughness: 0.1,
		emissive: 0x444444 
	} );
	// Ground1
	pos.set( 0, - 0.5, 0 );
	quat.set( 0, 0, 0, 1 );
	var ground1 = createParalellepiped( 10, 1, 10, 0, pos, quat, baseMaterial );
	ground1.castShadow = true;
	ground1.receiveShadow = true;

	
	//Add first platforms
	var platformMass = 0; //Kinematic bodies
	var platformSideLength = 4;
	var platformHeight = 0.5;
	var numPlatforms1 = 20;
	var spaceBetween = 0.05;

	for(let i=0; i<numPlatforms1; i++){
		pos.set(0,-platformHeight/2,-5-(platformSideLength/2)-platformSideLength*i - spaceBetween*(i!=0));
		quat.set( 0, 0, 0, 1 );
		var platform = createParalellepiped( platformSideLength, platformHeight, platformSideLength, platformMass, pos, quat, baseMaterial );
		platform.castShadow=true;
		platform.receiveShadow=true;
		//Make the physics body kinematic so that it can be animated and influences other
		//rigid bodies but is not influenced itself by dynamic rigid bodies (in particular the tama)
		platform.userData.physicsBody.setCollisionFlags(2);
		platform.userData.physicsBody.setActivationState(4);
		platform.userData.physicsBody.setFriction(0.8);
		platform.userData.physicsBody.setRollingFriction(0.5);
		platforms1.push(platform);
	}

	// Ground2
	pos.set( 0, - 0.5, platforms1[platforms1.length-1].position.z-platformSideLength/2-5 );
	quat.set( 0, 0, 0, 1 );
	var ground2 = createParalellepiped( 10, 1, 10, 0, pos, quat, baseMaterial );
	ground2.castShadow = true;
	ground2.receiveShadow = true;

	//Add second platforms
	var numPlatforms2 = 4
	for(let i=0; i<numPlatforms2; i++){
		pos.set(0,-platformHeight/2,ground2.position.z-5-(platformSideLength/2)-platformSideLength*i - spaceBetween*(i!=0));
		quat.set( 0, 0, 0, 1 );
		var platform = createParalellepiped( platformSideLength, platformHeight, platformSideLength, platformMass, pos, quat, baseMaterial );
		platform.castShadow=true;
		platform.receiveShadow=true;
		//Make the physics body kinematic so that it can be animated and influences other
		//rigid bodies but is not influenced itself by dynamic rigid bodies (in particular the tama)
		platform.userData.physicsBody.setCollisionFlags(2);
		platform.userData.physicsBody.setActivationState(4);
		platform.userData.physicsBody.setFriction(0.8);
		platform.userData.physicsBody.setRollingFriction(0.5);
		platforms2.push(platform);
	}

	//static thin platforms
	var thinplatformWidth = 1.5;
	var thinplatformlength = 20;
	pos.set(0,-platformHeight/2,platforms2[platforms2.length-1].position.z-(platformSideLength/2)-thinplatformlength/2);
	quat.set( 0, 0, 0, 1 ); 
	var platform = createParalellepiped( thinplatformWidth, platformHeight, thinplatformlength, platformMass, pos, quat, baseMaterial );
	platform.castShadow=true;
	platform.receiveShadow=true;
	platform.userData.physicsBody.setFriction(0.8);
	platform.userData.physicsBody.setRollingFriction(0.5);

	pos.set(0,-platformHeight/2,platform.position.z-thinplatformlength);
	quat.set( 0, 0, 0, 1 ); 
	var thinplatformWidth = 0.5;
	var platform = createParalellepiped( thinplatformWidth, platformHeight, thinplatformlength, platformMass, pos, quat, baseMaterial );
	platform.castShadow=true;
	platform.receiveShadow=true;
	platform.userData.physicsBody.setFriction(0.3);
	platform.userData.physicsBody.setRollingFriction(0.5);

	// Ground3
	pos.set( 0, - 0.5, platform.position.z-thinplatformlength/2-5 );
	quat.set( 0, 0, 0, 1 );
	lastPlatform = createParalellepiped( 10, 1, 10, 0, pos, quat, baseMaterial );
	lastPlatform.castShadow = true;
	lastPlatform.receiveShadow = true;
	

}

function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

	var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
	var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	shape.setMargin( margin );

	createRigidBody( threeObject, shape, mass, pos, quat );

	return threeObject;

}

function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

	threeObject.position.copy( pos );
	threeObject.quaternion.copy( quat );

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	var motionState = new Ammo.btDefaultMotionState( transform );

	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	if(mass!=0){
		physicsShape.calculateLocalInertia( mass, localInertia );
	}

	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	var body = new Ammo.btRigidBody( rbInfo );

	threeObject.userData.physicsBody = body;

	scene.add( threeObject );

	if ( mass > 0 ) {

		rigidBodies.push( threeObject );

		// Disable deactivation
		body.setActivationState( 4 );

	}

	physicsWorld.addRigidBody( body );

}

function createMaterial() {

	return new THREE.MeshPhongMaterial( { color: createRandomColor() } );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );

	render();

}

function render() {

	var deltaTime = clock.getDelta();

	if (tama&&GAME_STATUS === 'start') {
		moveTama();
		movePlatforms(deltaTime);

		updatePhysics( deltaTime );

		//Camera should follow tama
		camera.position.set(tama.position.x, tama.position.y+2,tama.position.z+7);
		camera.lookAt(tama.position)
		stats.update();
	}

	if(tama&&GAME_STATUS==='start'&&tama.position.y<-10){
		GAME_STATUS="retry";
	}

	if (GAME_STATUS === 'retry') {
		GAME_STATUS = 'start';
		scene.remove(tama);
		tama = null;
		createPlayer();
	  }

	  
	if(GAME_STATUS==='start'&&tama&&tama.position.z<=lastPlatform.position.z+4.5&&tama.position.y>=-0.5){
		GAME_STATUS='transition';
		transitionClock = new THREE.Clock();
	}

	if(GAME_STATUS==='transition'){
		var elapsed = transitionClock.getElapsedTime();

		//Chnge sun effects
		sunEffects.inclination-=elapsed/35000;
		sunEffects.turbidity-=elapsed/35000;
		sunEffects.rayleigh-=elapsed/50000;
		sunEffects.mieCoefficient+=elapsed/20000;
		sunEffects.mieDirectionalG-=elapsed/5000;
		setSunEffect();

		//Change camera position
		//Dolly out
		var tmpvec= new THREE.Vector3(0, 0.5, lastPlatform.position.z+20);
		camera.position.lerp(tmpvec, 0.002)
		//Rotate camera
		var rotationMatrix = new THREE.Matrix4();
		var targetQuaternion = new THREE.Quaternion()
		rotationMatrix.lookAt( new THREE.Vector3(0,5,lastPlatform.z), camera.position, camera.up );
		targetQuaternion.setFromRotationMatrix( rotationMatrix );
		camera.quaternion.rotateTowards( targetQuaternion, 0.05*deltaTime );
		
		if(elapsed>=9){
			GAME_STATUS='done'
			window.open("ken.html","_self")
		}
	}
	

	renderer.render( scene, camera );

}

function moveTama(){

    let moveX =  tamaMoveDirection.right - tamaMoveDirection.left;
    let moveZ =  tamaMoveDirection.back - tamaMoveDirection.forward;
    let moveY =  0; 

    if( moveX == 0 && moveY == 0 && moveZ == 0) return;

    let resultantImpulse = new Ammo.btVector3( moveX, moveY, moveZ )
    resultantImpulse.op_mul(SPEED);

    let physicsBody = tama.userData.physicsBody;
    physicsBody.applyForce ( resultantImpulse );


}

function movePlatforms(deltaTime){
	let speed = 0.9;
	let amp = 1;

	t+=speed;
	t=t%360;

	for(let i=0; i<platforms1.length; i++){
		
		let moveX =  (Math.sin(i*(Math.PI/20))/(1/amp))*Math.sin((Math.PI/180)*t);
		let moveZ =  0;
		let moveY =  0;


		let translateFactor = tmpPos.set(moveX, moveY, moveZ);
		translateFactor.multiplyScalar(10);


		platforms1[i].position.x=translateFactor.x;
		platforms1[i].translateY(translateFactor.y);
		platforms1[i].translateZ(translateFactor.z);
		
		//We move the physics body in the world space
		platforms1[i].getWorldPosition(tmpPos);
		platforms1[i].getWorldQuaternion(tmpQuat);

		let physicsBody = platforms1[i].userData.physicsBody;

		let ms = physicsBody.getMotionState();
		if ( ms ) {

			ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
			ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

			
			tmpTrans.setIdentity();
			tmpTrans.setOrigin( ammoTmpPos ); 
			tmpTrans.setRotation( ammoTmpQuat ); 

			ms.setWorldTransform(tmpTrans);

		}

	}

	for(let i=0; i<platforms2.length; i++){
		
		let moveX =  ((1-2*(i%2==0))/2)*Math.sin((Math.PI/180)*t);
		let moveZ =  0;
		let moveY =  0;


		let translateFactor = tmpPos.set(moveX, moveY, moveZ);
		translateFactor.multiplyScalar(10);


		platforms2[i].position.x=translateFactor.x;
		platforms2[i].translateY(translateFactor.y);
		platforms2[i].translateZ(translateFactor.z);
		
		//We move the physics body in the world space
		platforms2[i].getWorldPosition(tmpPos);
		platforms2[i].getWorldQuaternion(tmpQuat);

		let physicsBody = platforms2[i].userData.physicsBody;

		let ms = physicsBody.getMotionState();
		if ( ms ) {

			ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
			ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

			
			tmpTrans.setIdentity();
			tmpTrans.setOrigin( ammoTmpPos ); 
			tmpTrans.setRotation( ammoTmpQuat ); 

			ms.setWorldTransform(tmpTrans);

		}

	}

}

function updatePhysics( deltaTime ) {

	
	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );
	
	//Update Kinematic rigid bodies manually according to asscociated rendered object.

	// Update dynamic rigid bodies
	for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {

		var objThree = rigidBodies[ i ];
		var objPhys = objThree.userData.physicsBody;
		var ms = objPhys.getMotionState();
		if ( ms ) {

			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

		}

	}

}

function onTransitionEnd( event ) {

	const element = event.target;
	element.remove();
	
}