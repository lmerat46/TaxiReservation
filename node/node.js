/**
 * required modules
 */
var http = require('http');
var m = require('fs');
var mysql = require('mysql');
var express = require('express');
var body = require('body-parser');

var serv = express();

serv.use( body.json() );       // to support JSON-encoded bodies
serv.use(body.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

serv.use(express.static(__dirname + '/public'));

/**
 * connection to database
 */
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mathildemerat1999",
    database: "taxiReservation"
  });
  
  connection.connect();


serv.get('/home', function(req, res) {
    if(req.body.hasOwnProperty("client")){
       console.log("client clicked");
    }else{
       console.log("driver clicked");
    }
    res.render('/home', { title: 'post' });
  });


/**
 * create account Mysql request
 */
serv.post('/', function(req, res) {
    var lastname = req.body.lastname;
    var firstname = req.body.firstname;
    var birthday = req.body.birthday;
    var mail = req.body.mail;
    var phone = req.body.phone;
    var pseudo = req.body.pseudo;
    var password = req.body.password;
    if(req.body.category == "driver"){
        connection.query("INSERT INTO driver (lastname, firstname, pseudo, birthday, mail, phone, passwd,free) VALUES ('lastname', 'firstname', 'pseudo', 'birthday', 'mail', 'phone', 'password', 1)");
    }else{
        connection.query("INSERT INTO client (lastname, firstname, pseudo, birthday, mail, phone, passwd) VALUES ('lastname', 'firstname', 'pseudo', 'birthday', 'mail', 'phone', 'password')");
    }
    res.redirect('../html/home.html');
});

/**
 * check login
 */
serv.post('/', function(req,res){
    var pseudo = req.body.pseudo;
    var password = req.body.password;
    if(connection.query("SELECT pseudo, password FROM client WHERE pseudo = 'pseudo' and password = 'password")){
        /**
         * TODO connection to client page
         */
        res.redirect('../html/client.html');

    }else if(connection.query("SELECT pseudo, password FROM driver WHERE pseudo = 'pseudo' and password = 'password")){
        /**
         * TODO connection to driver page
         */
        res.redirect('../html/driver.html');
    }else{
        /**
         * TODO throw error and permitte reconnection
         */
    }
});


/**
 * affiche home page
 */
serv.get('/',function(req, res) {
    m.readFile('../html/client.html',function(erreur,donnees){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(donnees);
        res.end();
    });
});

  serv.listen(8080);


   /*
    var server = http.createServer(function(req, res) {
        m.readFile('home.html',function(erreur,donnees){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(donnees);
            res.end();
        });
    });*/

