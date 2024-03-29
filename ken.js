import * as THREE from './build/three.module.js';
//import * as ThreeCSG from 'https://rawgit.com/chandlerprall/ThreeCSG/master/ThreeCSG.js';

import { GUI } from './lib/dat.gui.module.js';

import Stats from './lib/stats.module.js';

import { OBJLoader } from './lib/OBJLoader.js';

import { GLTFLoader } from './lib/GLTFLoader.js';

import { OrbitControls } from './lib/OrbitControls.js';


var GAME_STATUS='loading';
var loadingManager;
//Influences the scale of all objects in the graphics and physics world
var SCALE = 1;
// Graphics variables
var container, stats;
var camera, controls, scene, renderer;
var renderedHandle;
var cup;
var textureLoader;
var clock = new THREE.Clock();
var zoomClock;
var textureURL = ["./textures/TexturesCom_Wood_BirchVeneer_512_albedo.png"];
var guiElement = {
	mouseSensitivity: 2,
	horizontalSpeed: 3
};

// Physics variables
var gravityConstant = - 10;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var physicsWorld;
var rigidBodies = [];
var margin = 0.03;
var transformAux1;
var tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
var tmpTrans = null, ammoTmpPos = null, ammoTmpQuat = null;
//Non-rigid bodies that are moved
var string;
var renderedBall;

var bMass = SCALE/2;
var bRadius = SCALE/10;
var handleMoveDirection = { left: 0, right: 0, forward: 0, back: 0, y: 0, rotate: 0 };
var mouseCoords = new THREE.Vector2();
var isDraging = false;

//Initialize Ammo
Ammo().then( function ( AmmoLib ) {

	Ammo = AmmoLib;

	init();
	animate();

} );

function init() {
	tmpTrans = new Ammo.btTransform();
	ammoTmpPos = new Ammo.btVector3();
	ammoTmpQuat = new Ammo.btQuaternion();

	//Monitors loading status of external resources (music, models...)
	loadingManager = new THREE.LoadingManager( () => {//Callback called when everything loaded
		zoomClock = new THREE.Clock();
		GAME_STATUS='zoom';
		
	} );

	//Initialize the three.js stuff
	initGraphics();

	//Initialize the Ammo.js stuff
	initPhysics();

	//Populate physics and rendered world
	createObjects();

	//Load external resources
	loadObjects();

	//Initialize player control
	setupEventHandlers();

	//Initialize GUI for settings
	setupGUI();

}

function setupGUI(){
	var gui = new GUI();
	gui.add( guiElement, "mouseSensitivity", 1.0, 10.0, 0.1 )
	gui.add( guiElement, "horizontalSpeed", 1.0, 10.0, 0.1 )
}

function loadObjects(){

	//Load music
	var listener = new THREE.AudioListener();
	camera.add( listener );

	var sound = new THREE.Audio( listener );
	// load a sound and set it as the Audio object's buffer
	var audioLoader = new THREE.AudioLoader();
	audioLoader.load( 'music/HiroshiYoshimura_CREEK.mp3', function( buffer ) {
		sound.setBuffer( buffer );
		sound.setLoop( true );
		sound.setVolume( 0.5 );
		sound.play();
	});


	const onProgress = function ( xhr ) {
	
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	};

	const onError = function ( xhr ) { console.log( 'An error happened' ); };

	//OBJ models
	const objLoader = new OBJLoader(loadingManager);

	objLoader.load(
		// resource URL
		'./models/17484_Kendama_v1.obj',
		// called when resource is loaded
		function ( object ) {
	
			renderedHandle.add(object);
			object.scale.x=object.scale.y=object.scale.z=SCALE/60;
			object.rotateX(-Math.PI/2);
			object.rotateZ(-Math.PI);
			object.rotateY(Math.PI/2);
			object.position.x=SCALE/5;
	
		},onProgress,onError);

	
	//GLTF Models
	const gltfLoader = new GLTFLoader(loadingManager);
	gltfLoader.load('./models/japanese_-_cherry_tree_diorama/scene.gltf', (gltf) => {
		const root = gltf.scene;
		root.scale.x=root.scale.y=root.scale.z=1.2;
		root.rotateY(-Math.PI/2.3);
		root.position.set(-1.3,0.6,-4);
		scene.add(root);
	  });
}

function setupEventHandlers(){

	window.addEventListener( 'keydown', handleKeyDown, false);
	window.addEventListener( 'keyup', handleKeyUp, false);
	window.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'mousemove', onMouseMove, false );
	window.addEventListener( 'mouseup', onMouseUp, false );

}


function handleKeyDown(event){

	let keyCode = event.keyCode;

	switch(keyCode){

		case 87: //W: FORWARD
			handleMoveDirection.forward = 1;
			break;
			
		case 83: //S: BACK
			handleMoveDirection.back = 1;
			break;
			
		case 65: //A: LEFT
			handleMoveDirection.left = 1;
			break;
			
		case 68: //D: RIGHT
			handleMoveDirection.right = 1;
			break;
		case 32: //SPACE
			GAME_STATUS='reset';
		break;
			
	}
}


function handleKeyUp(event){
	let keyCode = event.keyCode;

	switch(keyCode){
		case 87: //FORWARD
			handleMoveDirection.forward = 0;
			break;
			
		case 83: //BACK
			handleMoveDirection.back = 0;
			break;
			
		case 65: //LEFT
			handleMoveDirection.left = 0;
			break;
			
		case 68: //RIGHT
			handleMoveDirection.right = 0;
			break;

	}

}

function onMouseDown ( event ) {

	mouseCoords.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1
	);
	isDraging=true;
}

function onMouseMove ( event ) {
	if(isDraging){
		var newPos = new THREE.Vector2();
		newPos.set(
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1
		);
		var speed = newPos.y - mouseCoords.y;
		handleMoveDirection.y=speed*guiElement.mouseSensitivity*100;
		mouseCoords=newPos.clone();
	}
}

function onMouseUp ( event ) {
	isDraging=false;
	handleMoveDirection.y=0;
}

function initGraphics() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xFFC0CB );
	scene.fog = new THREE.Fog(0xFFC0CB, 4, 10);

	//Start camera zoomed out
	camera.position.set( 6.021071921767972 , 7.214750345237588, 12.042143843535944 );
	camera.lookAt(0,3,0);

	renderer = new THREE.WebGLRenderer({ antialias: true });//Add antialiasing
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	//initialize controller to allow player to zoom in and out
	//enableZoom is set to true once the initial zoom in, see render()
	controls = new OrbitControls( camera, renderer.domElement );
	controls.autoRotate = false;
    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
	controls.target.set( 0, 3, 0 );
	controls.update();

	textureLoader = new THREE.TextureLoader();

	var ambientLight = new THREE.AmbientLight( 0x404040 );
	scene.add( ambientLight );

	var light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( - 10, 10, 5 );
	light.castShadow = true;
	var d = 10;
	light.shadow.camera.left = - d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = - d;

	light.shadow.camera.near = 2;
	light.shadow.camera.far = 50;

	light.shadow.mapSize.x = 1024;
	light.shadow.mapSize.y = 1024;

	scene.add( light );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

}

function initPhysics() {

	// Physics configuration

	collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	softBodySolver = new Ammo.btDefaultSoftBodySolver();
	physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
	physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
	physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

	transformAux1 = new Ammo.btTransform();

}

function createObjects() {

	var pos = new THREE.Vector3();
	var quat = new THREE.Quaternion();

	//Create the tama physics body and THREE Mesh.
	renderedBall  = new THREE.Mesh( new THREE.SphereBufferGeometry( bRadius, 20, 20 ), new THREE.MeshPhongMaterial() );
	textureLoader.load(textureURL[0], function(texture){
		texture.repeat.set( 1, 1 );
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		renderedBall.material.map = texture; // Applies this texture to the material and hence to the object.
		renderedBall.material.needsUpdate = true;
	});
	var bShape =  new Ammo.btSphereShape( bRadius );
	bShape.setMargin( margin );
	pos.set( 0, 2, 0 );
	quat.set( 0, 0, 0, 1 );
	createRigidBody( renderedBall, bShape, bMass, pos, quat );
	renderedBall.userData.physicsBody.setFriction( 0.1 );

	var stringLength = SCALE;
	
	//Handle
	var handleMass = 0;
	var handleLength = SCALE/2.5;
	var baseMaterial = new THREE.MeshBasicMaterial( { color: 0x606060 } );
	baseMaterial.visible=false;
	pos.set(renderedBall.position.x+handleLength/2, renderedBall.position.y+bRadius+stringLength, renderedBall.position.z);
	quat.set( 0, 0, 0, 1 );
	renderedHandle = createParalellepiped( handleLength, handleLength/10, handleLength/10, handleMass, pos, quat, baseMaterial );
	//Make the rigid body kinematic so that it can be moved by user and influences other rigid bodies but is not influenced itself by dynamic rigid bodies
	renderedHandle.userData.physicsBody.setCollisionFlags(2);
	renderedHandle.userData.physicsBody.setActivationState(4);
	
	
	//Cup
	var geometry = new THREE.ConeGeometry( bRadius+0.02, handleLength/4, 6, 5, true );
	var material = new THREE.MeshPhongMaterial({
	  color: 0x606060,
	  side: THREE.DoubleSide
	});


	//Create collison shape using the Geometry.faces of the cup mesh.
	//Taken from physijs source, see https://github.com/chandlerprall/Physijs/blob/7a5372647f5af47732e977c153c0d1c2550950a0/physi.js#L1259-L1283

	//First get description of shape in terms of triangles making up the faces of the three geometry
	var vertices = geometry.vertices;
	var triangles = [];

	for ( let i = 0; i < geometry.faces.length; i++ ) {
		var face = geometry.faces[i];
		if ( face instanceof THREE.Face3) {

			triangles.push([
				{ x: vertices[face.a].x, y: vertices[face.a].y, z: vertices[face.a].z },
				{ x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
				{ x: vertices[face.c].x, y: vertices[face.c].y, z: vertices[face.c].z }
			]);

		} else if ( face instanceof THREE.Face4 ) {

			triangles.push([
				{ x: vertices[face.a].x, y: vertices[face.a].y, z: vertices[face.a].z },
				{ x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
				{ x: vertices[face.d].x, y: vertices[face.d].y, z: vertices[face.d].z }
			]);
			triangles.push([
				{ x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
				{ x: vertices[face.c].x, y: vertices[face.c].y, z: vertices[face.c].z },
				{ x: vertices[face.d].x, y: vertices[face.d].y, z: vertices[face.d].z }
			]);

		}
	}


	//Second, create an Ammo.btBvhTriangleMeshShape instance from these triangles
	var i, triangle, triangle_mesh = new Ammo.btTriangleMesh;
	var _vec3_1 = new Ammo.btVector3(0,0,0);
	var _vec3_2 = new Ammo.btVector3(0,0,0);
	var _vec3_3 = new Ammo.btVector3(0,0,0);
	var btConvexHullShape = new Ammo.btConvexHullShape();

	//Setting up param for Ammo.btBvhTriangleMeshShape from 
	for ( i = 0; i < triangles.length; i++ ) {
		triangle = triangles[i];

		_vec3_1.setX(triangle[0].x);
		_vec3_1.setY(triangle[0].y);
		_vec3_1.setZ(triangle[0].z);
		btConvexHullShape.addPoint(_vec3_1,true);
		_vec3_2.setX(triangle[1].x);
		_vec3_2.setY(triangle[1].y);
		_vec3_2.setZ(triangle[1].z);
		btConvexHullShape.addPoint(_vec3_2,true);
		_vec3_3.setX(triangle[2].x);
		_vec3_3.setY(triangle[2].y);
		_vec3_3.setZ(triangle[2].z);
		btConvexHullShape.addPoint(_vec3_3,true);
		triangle_mesh.addTriangle(
			_vec3_1,
			_vec3_2,
			_vec3_3,
			true
		);
	}

	var shape = new Ammo.btBvhTriangleMeshShape(
		triangle_mesh,
		true,
		true
	);


	cup = new THREE.Mesh(geometry, material);
	cup.rotateX(Math.PI);
	cup.position.x=-(handleLength/2.1);
	cup.position.y=+SCALE/7;
	console.log(cup.position);
	//Make sure cup attached to handle
	renderedHandle.add(cup);
	renderedHandle.updateMatrixWorld(); //makes sure cup matrixWorld updated to reflect that it is now attached to handle. This is called automatically by renderer when animating, but must do so manually initially 
	pos.setFromMatrixPosition( cup.matrixWorld );
	cup.getWorldQuaternion(quat);
	createRigidBody(cup, shape, 0, pos, quat, true);
	//Make cup kinematic like handle
	cup.userData.physicsBody.setCollisionFlags(2);
	cup.userData.physicsBody.setActivationState(4);
	//We just need the physics body to approximate Kendama model's cup which is already displayed, so we can make THREE Mesh invisible.
	cup.visible=false;

	
	// String

	// String graphics object
	var stringNumSegments = 10;
	var stringMass = bMass/3;
	var stringPos = renderedBall.position.clone();
	stringPos.y += bRadius-0.01;
	
	var segmentLength = stringLength / stringNumSegments;
	var stringGeometry = new THREE.BufferGeometry();
	var stringMaterial = new THREE.LineBasicMaterial( {
		color: 0xffffff,
		linewidth: 10
	} );
	var stringPositions = [];
	var stringIndices = [];
	
	for ( var i = 0; i < stringNumSegments + 1; i ++ ) {
	
		stringPositions.push( stringPos.x, stringPos.y + i * segmentLength, stringPos.z );
	
	}
	
	for ( var i = 0; i < stringNumSegments; i ++ ) {
	
		stringIndices.push( i, i + 1 );
	
	}
	
	stringGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( stringIndices ), 1 ) );
	stringGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( stringPositions ), 3 ) );
	stringGeometry.computeBoundingSphere();
	string = new THREE.LineSegments( stringGeometry, stringMaterial );
	scene.add( string );
	
	// string physics object
	var softBodyHelpers = new Ammo.btSoftBodyHelpers();
	var stringStart = new Ammo.btVector3( stringPos.x, stringPos.y, stringPos.z );
	var stringEnd = new Ammo.btVector3( stringPos.x, stringPos.y + stringLength, stringPos.z );
	var stringSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), stringStart, stringEnd, stringNumSegments - 1, 0 );
	var sbConfig = stringSoftBody.get_m_cfg();
	sbConfig.set_viterations( 10 );
	sbConfig.set_piterations( 100 );
	sbConfig.set_kAHR(0.9);
	stringSoftBody.setTotalMass( stringMass, false );
	Ammo.castObject( stringSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
	physicsWorld.addSoftBody( stringSoftBody, 1, - 1 );
	string.userData.physicsBody = stringSoftBody;
	// Disable deactivation
	stringSoftBody.setActivationState( 4 );
	
	
	// Glue the string extremas to the ball and the handle using joints
	var influence = 1;
	stringSoftBody.appendAnchor( 0, renderedBall.userData.physicsBody, true, influence );
	stringSoftBody.appendAnchor( stringNumSegments, renderedHandle.userData.physicsBody, true, influence );

	


}

//Builder for Paralellepiped objects that should exist in physics and rendered world
function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

	var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
	var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	shape.setMargin( margin );

	createRigidBody( threeObject, shape, mass, pos, quat );

	return threeObject;

}

//Builder for Rigid bodies
//Attaches them to the provided THREE Mesh
//Note that Ammo deals with world coordinates so pos and quat should be world coordinates
function createRigidBody( threeObject, physicsShape, mass, pos, quat, isChild=false ) {

	if(!isChild){
		threeObject.position.copy( pos );
		threeObject.quaternion.copy( quat );
	}

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	var motionState = new Ammo.btDefaultMotionState( transform );

	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	if(mass!=0){//In Bullet: mass>0 => rigid body, mass=0 => kinematic/static body. So we take in param mass so this method can be used to create the kinematic bodies in the world too
		physicsShape.calculateLocalInertia( mass, localInertia );
	}

	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	var body = new Ammo.btRigidBody( rbInfo );

	threeObject.userData.physicsBody = body;

	if(!isChild){
		scene.add( threeObject );
	}

	if ( mass > 0 ) {

		rigidBodies.push( threeObject );

		// Disable deactivation
		body.setActivationState( 4 );

	}

	physicsWorld.addRigidBody( body );

}

//Adapts renderer projection matrix to comply with window size
function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

//Called every frame of animation
function animate() {

	requestAnimationFrame( animate );

	render();
	stats.update();

}

//Applies changes to physics and graphics world. Then updates the rendered scene.
function render() {

	var deltaTime = clock.getDelta();

	isTamaInCup();

	//'start' indicates that the game is in the state in which it should accept user input to control the kendanma
	if(GAME_STATUS==='start'){
		moveKinematic();
	
		updatePhysics( deltaTime );

	}

	//'zoom'is the state in which the initial zoom in to the kendama should proceed
	if(camera&&GAME_STATUS=='zoom'){
		if(zoomClock.getElapsedTime()<0.5){
			//This is a hacky fix to get the string moving slightly laterally to begin with.
			//Since the string soft body behaves weirdly if one tries to move it straight up without any initial lateral motion
			handleMoveDirection.left=1;
			moveKinematic();
			updatePhysics( deltaTime );
		}
		else{
			
			handleMoveDirection.left=0;
			
			//zoom in
			var targetPosition= new THREE.Vector3(SCALE , SCALE*3.7, SCALE*2);
			camera.position.lerp(targetPosition, 0.0035)

			//Check if we are sufficiently zoomed in
			if((camera.position.x-targetPosition.x)<=0.6){
				controls.enableZoom = true;
				zoomClock.stop();
				GAME_STATUS='start';
			}
		}
	}

	renderer.render( scene, camera );

}

//Check if the tama is in the cup. If so, change the game state
function isTamaInCup(){

	var tmpV = new THREE.Vector3();
	//I presume the only event in which the distance between the tama and cup's centre is less than 0.085, is when  it is in the cup
	//Have found this is the case during all times I have played. 
	if(renderedBall.position.distanceTo(cup.getWorldPosition(tmpV))<=0.085){
		//The player has achieved the main goal. Display a congrats.
		document.getElementById("success").style.display = "block";
	}
}

function moveKinematic(){


	let moveX =  (guiElement.horizontalSpeed/1000)*(handleMoveDirection.right - handleMoveDirection.left);
	let moveZ =  (guiElement.horizontalSpeed/1000)*(handleMoveDirection.back - handleMoveDirection.forward);
	let moveY =  0.003*handleMoveDirection.y;


	let translateFactor = tmpPos.set(moveX, moveY, moveZ);


	renderedHandle.translateX(translateFactor.x);
	renderedHandle.translateY(translateFactor.y);
	renderedHandle.translateZ(translateFactor.z);
	renderedHandle.updateMatrixWorld();
	
	renderedHandle.getWorldPosition(tmpPos);
	renderedHandle.getWorldQuaternion(tmpQuat);

	let physicsBody = renderedHandle.userData.physicsBody;

	let ms = physicsBody.getMotionState();
	if ( ms ) {

		ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
		ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

		
		tmpTrans.setIdentity();
		tmpTrans.setOrigin( ammoTmpPos ); 
		tmpTrans.setRotation( ammoTmpQuat ); 

		ms.setWorldTransform(tmpTrans);

	}

	var ammoTmpPosCup = new Ammo.btVector3();
	var ammoTmpQuatCup = new Ammo.btQuaternion();
	var tmpTransCup = new Ammo.btTransform();
	//Also move cup
	cup.getWorldPosition(tmpPos);
	cup.getWorldQuaternion(tmpQuat);
	physicsBody = cup.userData.physicsBody;

	ms = physicsBody.getMotionState();
	if ( ms ) {

		ammoTmpPosCup.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
		ammoTmpQuatCup.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

		
		tmpTransCup.setIdentity();
		tmpTransCup.setOrigin( ammoTmpPosCup ); 
		tmpTransCup.setRotation( ammoTmpQuatCup ); 

		ms.setWorldTransform(tmpTransCup);

	}

}

function updatePhysics( deltaTime ) {

	
	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Update string
	var softBody = string.userData.physicsBody;
	var stringPositions = string.geometry.attributes.position.array;
	var numVerts = stringPositions.length / 3;
	var nodes = softBody.get_m_nodes();
	var indexFloat = 0;
	for ( var i = 0; i < numVerts; i ++ ) {

		var node = nodes.at( i );
		var nodePos = node.get_m_x();
		stringPositions[ indexFloat ++ ] = nodePos.x();
		stringPositions[ indexFloat ++ ] = nodePos.y();
		stringPositions[ indexFloat ++ ] = nodePos.z();

	}
	string.geometry.attributes.position.needsUpdate = true;

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