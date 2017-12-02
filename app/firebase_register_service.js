var configDB = require('../config/database.js');

	var firebase = require('firebase');

	firebase.initializeApp({
	  	serviceAccount: configDB.serviceAccount,
	 	databaseURL: configDB.databaseURL,
	 	apiKey: configDB.apiKey,
	    authDomain: configDB.authDomain,
	    databaseURL: configDB.databaseURL,
	    projectId: configDB.projectId,
	    storageBucket: configDB.storageBucket,
	    messagingSenderId: configDB.messagingSenderId
	});

	var ref = firebase.app().database().ref();
	

	var ClientDelayedSet = function (client) {
		var clientRef = ref.child('clients/'+client.ci);
		return new Promise(function (resolve, reject) {
		    setTimeout(function () {
		      	clientRef.set(client)
		        	.then(resolve, reject);
		    }, 1);
		});
	};

	var StaffDelayedSet = function (staff) {
		var staffRef = ref.child('staff/'+staff.ci);
		return new Promise(function (resolve, reject) {
		    setTimeout(function () {
		      	staffRef.set(staff)
		        	.then(resolve, reject);
		    }, 1);
		});
	};

	var loginDelayedSet = function (login) {
		var todayDate = new Date();
		todayDate = todayDate.toISOString().substr(0,10);
		var accessRef = ref.child('logins/'+login.ci+"-"+todayDate);
		return new Promise(function (resolve, reject) {
		    setTimeout(function () {
		      	accessRef.set(login)
		        	.then(resolve, reject);
		    }, 1);
		});
	};

	var blacklistDelayedSet = function (banned) {
		var accessRef1 = ref.child('blacklist/'+banned.ci);
		return new Promise(function (resolve, reject) {
		    setTimeout(function () {
		      	accessRef1.set(banned)
		        	.then(resolve, reject);
		    }, 1);
		});
	};


	exports.addClient = function(nombres, apellidos, ci, email, tmovil, tref, bday, sexo, callback) {
		
		ClientDelayedSet({
		  		'nombres': nombres,
		  		'apellidos': apellidos,
		  		'ci': ci,
		  		'email': email,
		  		'tmovil': tmovil,
		  		'tref': tref,
		  		'bday': bday,
		  		'sexo': sexo,
		  		'fecha_alta': (new Date()).getTime(),
		  		'fecha_baja': null,
		  		'activo': true
		})
		.then(function() {
		  	//console.log('Exito');
	  		callback(null);
		})
		.catch(function(err) {
	  		//console.log('error', err);
	  		callback(err.code);
	  		
		});
	}
	/*
	exports.addStaffInfo = function(nombres, apellidos, ci, email, tmovil, tref, bday, sexo, area, callback) {
		
		StaffDelayedSet({
		  		'nombres': nombres,
		  		'apellidos': apellidos,
		  		'ci': ci,
		  		'email': email,
		  		'tmovil': tmovil,
		  		'tref': tref,
		  		'bday': bday,
		  		'sexo': sexo,
		  		'area': area,
		  		'fecha_alta': (new Date()).getTime(),
		  		'fecha_baja': null,
		  		'activo': true
		})
		.then(function() {
		  	//console.log('Exito');
	  		callback(null);
		})
		.catch(function(err) {
	  		//console.log('error', err);
	  		callback(err.code);
	  		
		});
	}
	*/


	exports.registerClientAccess = function(ci, isOk, callback) {
		verifyClientBlacklist(ci, function(){
			validateClientRegister(ci, function(client){
				loginDelayedSet({
			  		ci: ci,
			  		ingreso: (new Date()).getTime(),
			  		salida: null,
			  		acceso: "concedido",
				}).then(function() {
				  	//console.log('Exito');
			  		isOk(client);
				})
				.catch(function(err) {
			  		//console.log('error', err);
			  		callback(err.code);
				});
			},function(err){
				callback(err);
			});
		}, function(err){
			callback(err);
		});
	}

	exports.clientToBlacklist = function(ci, motivo, isOki, callback) {
		validateClientRegister(ci, 
		function(client){
			blacklistDelayedSet({
			  	ci: ci,
			  	fecha: (new Date()).getTime(),
			  	motivo: motivo
			}).then(function() {
				//console.log('Exito el registro en la BL');
			  	isOki();
			})
			.catch(function(err) {
			  	//console.log('error', err);
			  	callback(err.code);
			});
		},function(err){
			callback(err);
		});
	}

	var validateClientRegister = function(ci, isOk, callback) {
		//optimizar el codigo con promesas en lugar de callbacks
		// revisar si no hay una funcion que verifique si existe una ruta en la base de datos

		var clientRef = ref.child('clients/'+ci);
		clientRef.once("value", function(snapshot) {
		  	
		  	if(snapshot.val() == null){
		  		callback("Cliente no registrado.");
		  	}else{
		  		isOk(snapshot.val());
		  	}

		}, function (err) {
		  	//console.log("The read failed: " + err.code);
		  	callback(err.code);
		});
		
	}

	var verifyClientBlacklist = function(ci, isOk, callback) {
		//optimizar el codigo con promesas en lugar de callbacks
		// revisar si no hay una funcion que verifique si existe una ruta en la base de datos

		var clientRef = ref.child('blacklist/'+ci);
		clientRef.once("value", function(snapshot) {
		  	
		  	if(snapshot.val() == null){
		  		isOk();
		  	}else{
		  		callback("Cliente registrado en la lista negra. Acceso denegado.");
		  	}

		}, function (err) {
		  	//console.log("The read failed: " + err.code);
		  	callback(err.code);
		});
		
	}

	exports.calcularEdad = function (fecha) {
	    var hoy = new Date();
	    var cumpleanos = new Date(fecha);
	    var edad = hoy.getFullYear() - cumpleanos.getFullYear();
	    var m = hoy.getMonth() - cumpleanos.getMonth();

	    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
	        edad--;
	    }

	    return edad;
	}

	exports.addStaff = function (email, password, nombres, apellidos, ci, tmovil, tref, bday, sexo, area, callback) {
		firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function() {
		  	//console.log('Exito');
		  	/*
		  	StaffDelayedSet({
		  		'nombres': nombres,
		  		'apellidos': apellidos,
		  		'ci': ci,
		  		'email': email,
		  		'tmovil': tmovil,
		  		'tref': tref,
		  		'bday': bday,
		  		'sexo': sexo,
		  		'area': area,
		  		'fecha_alta': (new Date()).getTime(),
		  		'fecha_baja': null,
		  		'activo': true
			})
			.then(function() {
		  	//console.log('Exito');
		  		callback(null);
			})
			.catch(function(err) {
		  		//console.log('error', err);
		  		callback(err.code);
		  		
			});
			*/
		callback(null);
	  		
		})
		.catch(function(error) {
		  	var errorCode = error.code;
		  	var errorMessage = error.message;
		  	callback(errorMessage);
		});
	}

	exports.loginStaff = function (req, email, password, callback) {
		firebase.auth().signInWithEmailAndPassword(email, password)
		.then(function() {
			var user = firebase.auth().currentUser;
			if (user) {
				// User is signed in.
			    //var displayName = user.displayName;
			    req.session.user_email = user.email;
			    //var emailVerified = user.emailVerified;
			    //var photoURL = user.photoURL;
			    //var isAnonymous = user.isAnonymous;
			    req.session.user_id = user.uid;
			    //var providerData = user.providerData;

			    // ...
			    //return true
			} else {
			    // User is signed out.
			    // ...
			    //return false
			}

		  	//console.log('Exito');
	  		callback(null);
		})
		.catch(function(error) {
		  	var errorCode = error.code;
		  	var errorMessage = error.message;
		  	callback(errorMessage);
		});
	}
	/*
	exports.isLoggedIn = function(){
			if (user!=null) {
				// User is signed in.
			    //var displayName = user.displayName;
			    //var email = user.email;
			    //var emailVerified = user.emailVerified;
			    //var photoURL = user.photoURL;
			    //var isAnonymous = user.isAnonymous;
			    var uid = user.uid;
			    //var providerData = user.providerData;
			    // ...
			    return true
			} else {
			    // User is signed out.
			    // ...
			    return false
			}
	
	}*/
