function loadObjects(){
	objLoader = new OBJLoader();

	objLoader.load(
		// resource URL
		'./models/17484_Kendama_v1.obj',
		// called when resource is loaded
		function ( object ) {
	
			object.position.set(0, 0, lastPlatform.position.z);
			object.scale.x=object.scale.y=object.scale.z=0.2;
			object.rotateX(-Math.PI/2);
			scene.add( object );
	
		},
		// called when loading is in progresses
		function ( xhr ) {
	
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	
		},
		// called when loading has errors
		function ( error ) {
	
			console.log( 'An error happened' );
	
		}
	);

	// objLoader.load(
	// 	// resource URL
	// 	'./models/portal-shinto/source/gate.obj',
	// 	// called when resource is loaded
	// 	function ( object ) {
	
	// 		object.position.set(0, 0, 0);
	// 		// object.scale.x=object.scale.y=object.scale.z=0.2;
	// 		// object.rotateX(-Math.PI/2);
	// 		scene.add( object );
	
	// 	},
	// 	// called when loading is in progresses
	// 	function ( xhr ) {
	
	// 		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	
	// 	},
	// 	// called when loading has errors
	// 	function ( error ) {
	
	// 		console.log( 'An error happened' );
	
	// 	}
	// );

	// objLoader.load(
	// 	// resource URL
	// 	'./models/portal-shinto/source/gate.obj',
	// 	// called when resource is loaded
	// 	function ( object ) {
	
	// 		object.position.set(0, 0, 0);
	// 		// object.scale.x=object.scale.y=object.scale.z=0.2;
	// 		// object.rotateX(-Math.PI/2);
	// 		scene.add( object );
	
	// 	},
	// 	// called when loading is in progresses
	// 	function ( xhr ) {
	
	// 		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	
	// 	},
	// 	// called when loading has errors
	// 	function ( error ) {
	
	// 		console.log( 'An error happened' );
	
	// 	}
	// );
}