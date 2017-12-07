// app/routes.js



module.exports = function(app, registerService, passport) {

	var maxDate = new Date();
	maxDate.setFullYear(maxDate.getFullYear() - 21);
	maxDate = maxDate.toISOString().substr(0,10);

	

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', isLoggedIn, function(req, res) {
		res.render('index.ejs', { userEmail: req.session.user_email}); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	//app.get('/login', isLoggedIn, function(req, res) {
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage'), msgtype:null, client:null, edad:null });
	});

	// process the login form
	// Antes de registrar un acceso se debe:
	// 1. Verificar que no sea un cliente en la lista negra
	// 2. Verificar que sea un cliente registrado [OK]
	// 3. verificar que no se encuentre ya con un acceso registrado para el mismo dia [OK]
	//app.post('/login', isLoggedIn, function(req, res) {
	app.post('/login', function(req, res) {
		
		var clientCi = req.body.ci;

		registerService.registerClientAccess(clientCi, 
			function(client) {	
				var edad = registerService.calcularEdad(client.bday);
				res.render('login.ejs', {
					message: "Acceso registrado. Bienvenido al Cortijo Pub.", 
					msgtype: "alert-success",
					client: client,
					edad: edad
				});		
													
			}, function(err){
				res.render('login.ejs', {
					message: "Ocurrio un error al registrar el accesso: " + err, 
					msgtype: "alert-danger",
					client: null
				});
			});

	});
	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	//app.get('/signup', isLoggedIn, function(req, res) {
	app.get('/signup', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage'), msgtype:  req.flash('msgType'), maxdate: maxDate});
	});

	// process the signup form
	app.post('/signup', function(req, res) {
		
		var newClientNombres = req.body.nombres;
		var newClientApellidos = req.body.apellidos;
		var newClientCi = req.body.ci;
		var newClientExp = req.body.exp;
		var newClientCiudad = req.body.ciudad;
		var newClientEmail = req.body.email;
		var newClientTmovil = req.body.tmovil;
		var newClientTref = req.body.tref;
		var newClienBday = req.body.bday;
		var newClientSexo = req.body.sexo;

		registerService.addClient(newClientNombres, 
								  newClientApellidos, 
								  newClientCi,
								  newClientExp, 
								  newClientCiudad,
								  newClientEmail, 
								  newClientTmovil, 
								  newClientTref, 
								  newClienBday, 
								  newClientSexo,
								  function(err) {	
								  	if(err != null){
										res.render('signup.ejs', {
											message: "Ocurrio un error al registrar al cliente: " + err, 
											msgtype: "alert-danger",
											maxdate: maxDate
										});
								  	}else{
								  		res.render('signup.ejs', {
											message: "Cliente registrado con exito..", 
											msgtype: "alert-success",
											maxdate: maxDate
										});
								  	}		
										
								  });
	});
	
	// =====================================
	// BLACKLIST ===========================
	// =====================================
	// show the login form
	app.get('/black', isLoggedIn, function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('black.ejs', { message: req.flash('loginMessage'), msgtype:null, list:null });
	});

	// process the login form
	// Antes de registrar un acceso se debe:
	// 1. Verificar que no sea un cliente en la lista negra
	// 2. Verificar que sea un cliente registrado [OK]
	// 3. verificar que no se encuentre ya con un acceso registrado para el mismo dia [OK]
	app.post('/black', isLoggedIn, function(req, res) {
		
		var clientCi = req.body.ci;
		var clientMotivo = req.body.motivo;

		registerService.clientToBlacklist(clientCi, clientMotivo,
			function() {	
				res.render('black.ejs', {
					message: "El cliente con CI: "+clientCi+" fue registrado en la lista negra del Cortijo Pub.", 
					msgtype: "alert-success",
					list: null
				});										
			}, function(err){
				res.render('black.ejs', {
					message: "Ocurrio un error al registrar al cliente en la lista negra: " + err, 
					msgtype: "alert-danger",
					list: null
				});
			});
	});

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	/*app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});*/

	//======================================
	// CREATE STAFF ========================
	//======================================
	// show the register security staff form
	app.get('/regstaff', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('staff.ejs', { message: req.flash('loginMessage'), msgtype:null});
	});

	//Create new user
	app.post('/regstaff', function(req, res) {

		var newStaffEmail = req.body.email;
		var newStaffPass = req.body.password;

		var newStaffNombres = req.body.nombres;
		var newStaffApellidos = req.body.apellidos;
		var newStaffCi = req.body.ci;
		var newStaffTmovil = req.body.tmovil;
		var newStaffTref = req.body.tref;
		var newStaffBday = req.body.bday;
		var newStaffSexo = req.body.sexo;
		var newStaffArea = req.body.area;
		/*
		registerService.addStaffInfo(newStaffNombres, 
								  newStaffApellidos, 
								  newStaffCi, 
								  newStaffEmail, 
								  newStaffTmovil, 
								  newStaffTref, 
								  newStaffBday, 
								  newStaffSexo,
								  newStaffArea,
								  function(err) {	
								  	if(err != null){
										res.render('staff.ejs', {
											message: "Ocurrio un error al registrar al personal de Staff: " + err, 
											msgtype: "alert-danger"
										});
								  	}		
								  });
		*/
		registerService.addStaff(newStaffEmail, 
								newStaffPass,
								newStaffNombres, 
								newStaffApellidos, 
								  newStaffCi, 
								  newStaffTmovil, 
								  newStaffTref, 
								  newStaffBday, 
								  newStaffSexo,
								  newStaffArea, 
			
			function(error) {
			
				if (error != null) {
					//console.log(error);
					res.render('staff.ejs', {
						message: "Ocurrio un error al registrar al personal de Staff. " + error, 
						msgtype: "alert-danger",
					});	
				} else {			
					res.render('staff.ejs', {
						message: "Personal de staff registrado con exito.", 
						msgtype: "alert-success",
					});	
			}
		});
	});

	//======================================
	// LOG-IN STAFF ========================
	//======================================
	// show the register security staff form
	app.get('/loginstaff', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('loginstaff.ejs', { message: req.flash('loginMessage'), msgtype:null});
	});

	//Create new user
	app.post('/loginstaff', function(req, res) {

		var staffEmail = req.body.email;
		var staffPass = req.body.password;

		registerService.loginStaff(req, staffEmail, staffPass, 
			
			function(error) {
			
				if (error != null) {
					//console.log(error);
					res.render('loginstaff.ejs', {
						message: "Error en la autentificación: " + error, 
						msgtype: "alert-danger",
					});	
				} else {	
					//console.log(req.session.user_id);		
					res.render('index.ejs', {
						userEmail: staffEmail,
					});	
			}
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		//req.logout();
		//req.end();
	    //res.redirect('/loginstaff');
		req.session.destroy(function(err){
	    	if(err){
	        	//console.log(err);
	     	}else{
	         	//console.log(req.session.user_email);
	         	//req.end();
	         	res.redirect('/loginstaff');
	     	}
	  	});
	});

	//test section
	app.get('/ajax', function(req, res){


		res.send(registerService.clientCounter());
	});

	// =====================================
	// VERIFY LOGIN ========================
	// =====================================
	function isLoggedIn(req, res, next) {

		// if user is authenticated in the session, carry on
		if (req.session.user_id!=null){
			//console.log(req.session.user_id);
			//if (req.isAuthenticated()){
			return next();
		}

		// if they aren't redirect them to the loginstuff page
		//console.log("redireccionando al login...");
		res.redirect('/loginstaff');
	}
};


