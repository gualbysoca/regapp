// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var body_parser = require('body-parser');
var port     = process.env.PORT || 8181;
var flash    = require('connect-flash');

app.use(body_parser.urlencoded({extended:true}));


// configuration ===============================================================
// Functions that connect to our Firebase database
var registerService = require('./app/firebase_register_service.js');

app.configure(function() {

	// set up our express application
	//app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating (motor de vistas)

	// required for sessions
	app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	app.use(flash()); // use connect-flash for flash messages stored in session

});

// routes ======================================================================
require('./app/routes.js')(app, registerService);

// launch ======================================================================
app.listen(port);
//console.log('The magic happens on port ' + port);
