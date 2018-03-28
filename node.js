/**
 * required modules
 */
var http = require('http');
var m = require('fs');
var mysql = require('mysql');
var express = require('express');
var body = require('body-parser');
var session = ('cookie-session');

var serv = express();

var cookie = null;

serv.use( body.json() );       // to support JSON-encoded bodies
serv.use(body.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

serv.set('view engine', 'ejs');

console.log(__dirname + '/html');
//serv.use(express.static(__dirname + '/html'));

/**
 * connection to database
 */
var connexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mathildemerat1999",
    database: "taxiReservation"
  });
  
connexion.connect();


/**
 * affiche home page
 */
serv.get('/',function(req, res) {
    m.readFile('html/home.ejs',function(erreur,donnees){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(donnees);
        res.end();
    });
});

serv.post('/home', function(req, res) {
    var connexion = req.body.connexion;
    var inscription = req.body.inscription;
    if(new String(inscription).valueOf() == "inscription".valueOf()) res.render(__dirname+'/html/createAccount.ejs');
    else if(new String(connexion).valueOf() == "connexion".valueOf())res.render(__dirname+'/html/login.ejs');
    else res.send("Failure in load");
  });


/**
 * create account Mysql request
 */
serv.post('/createAccount', function(req, res) {
    var data = [[
        req.body.lastname,
        req.body.firstname,
        req.body.birthday,
        req.body.mail,
        req.body.phone,
        req.body.pseudo,
        req.body.password,
    ]];
    cookie = data;

    if(req.body.category == "driver"){
        connexion.query("INSERT INTO driver (lastname, firstname, birthday, mail, phone, pseudo, passwd) VALUES ?", [data]);
        res.render(__dirname+'/html/driver.ejs', {v_nom: req.body.pseudo});
    }else{
        connexion.query("INSERT INTO client (lastname, firstname, birthday, mail, phone, pseudo, passwd) VALUES ?", [data]);
        res.render(__dirname+"/html/client.ejs",{v_nom: req.body.pseudo});
    }
});


/**
 * check login
 */
serv.post('/login', function(req,res){
    var pseudo = req.body.pseudo;
    var password = req.body.password;
    connexion.query("SELECT pseudo FROM client WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err,rows){
        if(rows[0] == undefined){
            connexion.query("SELECT pseudo FROM driver WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err1,rows1){
                if(err) throw err;
                else res.render(__dirname+'/html/driver.ejs', {v_nom : pseudo});
            });

        }else res.render(__dirname+'/html/client.ejs', {v_nom : pseudo});
    });
});

/**
 * save a new reservation
 */
serv.post('/reservation', function(req,res){
    var departure = req.body.departure;
    var destination = req.body.destination;
    var typeOfReservation = req.body.typeOfReservation;
    var date = req.body.date;
    var time = req.body.time;
    var query = "SELECT id_client FROM client WHERE pseudo = '"+cookie[0][5]+"'";
    connexion.query(query,function(err,rows){
        if(err) throw err;
        if(typeOfReservation == "now"){
            connexion.query("INSERT INTO reservation (departure, destination, id_client) VALUES ('"+departure+"', '"+destination+"', '"+rows[0].id_client+"')");
        }else{
            connexion.query("INSERT INTO reservation (day, hour, departure, destination, id_client) VALUES ('"+date+"', '"+time+"', '"+departure+"', '"+destination+"', '"+rows[0].id_client+"')");
        }
    });
    res.render(__dirname+'/html/client.ejs', {v_nom : cookie[0][5]});
});

  serv.listen(8080);

/**
 * associate a reservation to a driver
 * A TESTER
 */
serv.post('/driver', function(req,res){
    var id_driver = req.body.id_driver;
    connexion.query("SELECT * FROM driver where id_driver = '"+id_driver+"')", function(err, rows){
        var i = 0;
        while(rows[i]){
            res.render('html/driver.ejs', 
            {item : '<li>day rows[i].day, departure rows[i].departure, destination rows[i].destination<li>'});
            i++;
        }
    });
});

/**
 * driver accepts a reservation
 */
serv.post('/accept', function(res, req){
    
});
