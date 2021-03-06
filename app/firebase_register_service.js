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

	var todayDate = function(){
		var today = new Date();  
		var localoffset = -(today.getTimezoneOffset()/60);
		var destoffset = -4;

		var offset = destoffset-localoffset;
		var d = new Date().getTime() + offset * 3600 * 1000

		return d;
	}

	var clientGenderGet = function(){
		const checkinsRef = ref.child('checkins');
		const clientsRef = ref.child('clients');
		var countH = 0;
		var countM = 0;

		return new Promise(function (resolve, reject) {
		    setTimeout(function () {
		      	checkinsRef.orderByChild("checkedin").equalTo(true).once("value").then(function(checkinSnapshot) {
					myCounter = checkinSnapshot.numChildren();
						console.log(myCounter);
					checkinSnapshot.forEach(function(aCheckinSnapshot) {

						let clientRef = clientsRef.child(aCheckinSnapshot.key);
						clientRef.once("value", function(clientSnapshot) {
							
					 		//console.log(clientSnapshot.val());

					 		if(clientSnapshot.child("sexo").val() == "hombre"){
					 			//console.log(clientSnapshot.child("sexo").val());
					 			++countH;
					 			--myCounter;
					 			console.log(countH);
					 		} else {
					 			++countM;
					 			console.log(countM);
					 		}
						});
					});
				})
		        	.then(resolve, reject);
		    }, 1);
		});
	}
	

	var ClientDelayedSet = function (client) {
		var clientRef = ref.child('clients/'+client.ci);
		return new Promise(function (resolve, reject) {
		    setTimeout(function () {
		      	clientRef.set(client)
		        	.then(resolve, reject);
		    }, 1);
		});
	};

	var CheckinDelayedSet = function (client) {
		var clientRef = ref.child('checkins/'+client.ci);
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

	var loginDelayedSet = function (login, date) {
		//var todayDate = new Date();
		//todayDate = todayDate.toISOString().substr(0,10);
		var accessRef = ref.child('logins/'+login.ci+"-"+date);
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


	exports.addClient = function(nombres, apellidos, ci, exp, ciudad, email, tmovil, tref, bday, sexo, callback) {
		
		ClientDelayedSet({
		  		'nombres': nombres,
		  		'apellidos': apellidos,
		  		'ci': ci,
		  		'exp': exp,
		  		'ciudad': ciudad,
		  		'email': email,
		  		'tmovil': tmovil,
		  		'tref': tref,
		  		'bday': bday,
		  		'sexo': sexo,
		  		'fecha_alta': todayDate(),
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
			validateClientRegister(ci, function(clientReg){
				registerClientCheckin(ci, function(checkinDate){
					loginDelayedSet({
				  		ci: ci,
				  		ingreso: checkinDate,
				  		salida: null,
				  		acceso: "Acceso concedido",
					}, checkinDate).then(function() {
					  	//console.log('Exito'+ new Date(todayDate()));
				  		isOk(clientReg);
					})
					.catch(function(err) {
				  		console.log('este es el error:', err);
				  		callback(err.code);
					});
				},function(err){
					callback(err);
				});
			},function(err){
				callback(err);
			});
		}, function(err){
			callback(err);
		});
	}

	exports.retriveAllClientData = function(ci, isOk, callback) {
		retriveClientRegister(ci, function(clientReg){
			retriveClientBlacklist(ci, function(clientBL){
				clientCheckinInfo(ci, function(clientCheckin){
					//console.log("Aqui "+clientReg.nombres);
					isOk({cr:clientReg, cbl:clientBL, cci:clientCheckin});
				},function(err){
					callback(err);
				});
			},function(err){
				callback(err);
			});
		}, function(err){
			callback(err);
		});
	}

	var registerClientCheckin = function(ci, isOki, callback) {
		validateClientCheckin(ci, 
		function(){
			var checkinDate = todayDate();
			CheckinDelayedSet({
			  	ci: ci,
			  	fechain: checkinDate,
			  	fechaout: null,
			  	checkedin: true
			}).then(function() {
				//console.log('Exito el registro en la BL');
			  	isOki(checkinDate);
			})
			.catch(function(err) {
			  	//console.log('error', err);
			  	callback(err.code);
			});
		},function(err){
			callback(err);
		});
	}

	exports.clientToBlacklist = function(ci, motivo, isOki, callback) {
		validateClientRegister(ci, 
		function(client){
			blacklistDelayedSet({
			  	ci: ci,
			  	fecha: todayDate(),
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

	var retriveClientRegister = function(ci, isOk, callback) {
		//optimizar el codigo con promesas en lugar de callbacks
		// revisar si no hay una funcion que verifique si existe una ruta en la base de datos

		var clientRef = ref.child('clients/'+ci);
		//console.log(clientRef.toString());
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

	var validateClientRegister = function(ci, isOk, callback) {
		//optimizar el codigo con promesas en lugar de callbacks
		// revisar si no hay una funcion que verifique si existe una ruta en la base de datos

		var clientRef = ref.child('clients/'+ci);
		clientRef.once("value", function(snapshot) {
		  	
		  	if(snapshot.val() == null){
		  		loginDelayedSet({
				  	ci: ci,
				  	ingreso: null,
				  	salida: null,
				  	acceso: "Acceso denegado:Cliente no registrado"
				}, todayDate()).then(function() {
					//console.log('Exito');
				  	callback("Cliente no registrado.");
				});
		  	}else{
		  		isOk(snapshot.val());
		  	}

		}, function (err) {
		  	//console.log("The read failed: " + err.code);
		  	callback(err.code);
		});
		
	}

	var validateClientCheckin = function(ci, isOk, callback) {
		//optimizar el codigo con promesas en lugar de callbacks
		// revisar si no hay una funcion que verifique si existe una ruta en la base de datos

		var clientRef = ref.child('checkins/'+ci+'/checkedin');
		clientRef.once("value", function(snapshot) {
		  	
		  	if(snapshot.val() == null || snapshot.val() == false){
		  		isOk();
		  	}else{
		  		loginDelayedSet({
				  	ci: ci,
				  	ingreso: null,
				  	salida: null,
				  	acceso: "Acceso denegado:Cliente ya realizó un checkin"
				}, todayDate()).then(function() {
					  //console.log('Exito');
				  	callback("El CI "+ci+" ya realizó un check-in.");
				});
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
		  		loginDelayedSet({
				  	ci: ci,
				  	ingreso: null,
				  	salida: null,
				  	acceso: "Acceso denegado:Cliente registrado en la lista negra"
				}, todayDate()).then(function() {
					  //console.log('Exito');
				  	callback("Cliente registrado en la lista negra. Acceso denegado.");
				});
		  	}

		}, function (err) {
		  	//console.log("The read failed: " + err.code);
		  	callback(err.code);
		});
		
	}

	var retriveClientBlacklist = function(ci, isOk, callback) {
		//optimizar el codigo con promesas en lugar de callbacks
		// revisar si no hay una funcion que verifique si existe una ruta en la base de datos

		var clientRef = ref.child('blacklist/'+ci);
		clientRef.once("value", function(snapshot) {
		  		isOk(snapshot.val());
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

	var clientCheckinInfo = function (ci, isOK, callback) {
		var checkinRef = ref.child('checkins/'+ci);
		var count = 0;
		checkinRef
		.on("value", function(snapshot) {
	    	//console.log(snapshot.val());
	    	isOK(snapshot.val());
		}, function (err) {
		  	//console.log("The read failed: " + err.code);
		  	callback(err.code);
		});
	}

	exports.clientCounter = function () {
		var checkinRef = ref.child('checkins');
		var count = 0;
		checkinRef
		.orderByChild("checkedin")
		.equalTo(true)
		.on("value", function(snapshot) {
		 	count = snapshot.numChildren();
		 	//console.log(count);
		 	//snapshot.forEach(function(childSnapshot) {
	            //console.log(childSnapshot.val());
		    //});
		});
		//checkinRef.off("value");
	    return count.toString();
	}

	exports.registredClientsCounter = function (callback) {
		var clientsRef = ref.child('clients');
		var count = 0;
		clientsRef
		.on("value", function(snapshot) {
		 	count = snapshot.numChildren();
		 	//return count;
		 	//console.log(count);
		 	//snapshot.forEach(function(childSnapshot) {
	            //console.log(childSnapshot.val());
		    //});
		    //return count.toString();
		    callback(count);
		});
		//return count.toString();
	}

	/*var function2 = function(ref, callback){
		var countH = 0;
		ref.once("value", function(clientSnapshot) {
				
		 		console.log(clientSnapshot.val());

		 		if(clientSnapshot.child("sexo").val() == "hombre"){
		 			//console.log(clientSnapshot.child("sexo").val());
		 			++countH;
		 			//myCounter - 1;
		 			console.log(countH);
		 		} else {
		 			++countM;
		 			console.log(countM);
		 		}
		});
		callback(countH);
	} */

	exports.clientGenderCounter = function (callback) {
		const checkinsRef = ref.child('checkins');
		const clientsRef = ref.child('clients');
		var countH = 0;
		var countM = 0;
		var totalClientsCheckedinCounter = 0;

		//const list = [{h:8, m:5}];

		/*checkinsRef.orderByChild("checkedin").equalTo(true).on("child_added", function(checkinSnapshot) {
			totalClientsCheckedinCounter = checkinSnapshot.numChildren();
			let clientRef = clientsRef.child(checkinSnapshot.key);

			clientRef.once("value", function(clientSnapshot) {
				
		 		//console.log(clientSnapshot.val());

		 		if(clientSnapshot.child("sexo").val() == "hombre"){
		 			//console.log(clientSnapshot.child("sexo").val());
		 			++countH;
		 			//myCounter - 1;
		 			console.log(countH);
		 		} else {
		 			++countM;
		 			console.log(countM);
		 		}


			});
			setTimeout(function() {
		      console.log("m: "+countH+countM);
		      callback({h:countH, m:countM});
		    }, 500);
			
		});*/

		/*

		checkinsRef.orderByChild("checkedin").equalTo(true).once("value", function(checkinSnapshot) {
			//totalClientsCheckedinCounter = checkinSnapshot.numChildren();
			function2(list, checkinSnapshot, clientsRef).then(function(list1){
				console.log("mirame... "+list1.m);
			});
		});

		*/
		
		checkinsRef.orderByChild("checkedin").equalTo(true).once("value", function(checkinSnapshot) {
			//totalClientsCheckedinCounter = checkinSnapshot.numChildren();
			checkinSnapshot.forEach(function(aCheckinSnapshot) {

				let clientRef = clientsRef.child(aCheckinSnapshot.key);
				clientRef.once("value", function(clientSnapshot) {
					
			 		//console.log(clientSnapshot.val());

			 		if(clientSnapshot.child("sexo").val() == "hombre"){
			 			//console.log(clientSnapshot.child("sexo").val());
			 			++countH;
			 			//console.log(countH);
			 		} else {
			 			++countM;
			 			//console.log(countM);
			 		}
				});
				
			});
			setTimeout(function() {
		      //console.log("m: "+countH+countM);
		      callback({h:countH, m:countM});
		      //return ({h:8, m:8});
		      //return ({h:countH.toString(), m:countM.toString()});
		    }, 2000);
			
		}); 	
		
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
