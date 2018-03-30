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

serv.set('view engine', 'jade');

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


/**
 * sign in or sign up
 */
serv.post('/login', function(req, res) {
    res.render(__dirname+'/html/login.ejs');
  });

serv.post('/signUp', function(req,res){
    res.render(__dirname+'/html/createAccount.ejs');
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
        connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
            if(err) throw err;
            else res.render(__dirname+'/html/driver.ejs', {v_nom : req.body.pseudo, data: rows});
        });
    }else{
        connexion.query("INSERT INTO client (lastname, firstname, birthday, mail, phone, pseudo, passwd) VALUES ?", [data]);
        res.render(__dirname+"/html/client.ejs",{v_nom: req.body.pseudo});
    }
});


/**
 * check login
 */
serv.post('/home', function(req,res){
    var pseudo = req.body.pseudo;
    var password = req.body.password;
    connexion.query("SELECT pseudo FROM client WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err,rows){
        if(rows[0] == undefined){
            connexion.query("SELECT pseudo FROM driver WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err1,rows1){
                if(err) throw err;
                else{
                    connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                        if(err) throw err;
                        else{
                            connexion.query("SELECT*FROM reservation,driver WHERE finish = '"+1+"' and pseudo = '"+pseudo+"'",function(err1,rows1){
                                if(err1) throw err1;
                                else res.render(__dirname+'/html/driver.ejs', {v_nom : pseudo, data: rows, data2: rows1});
                            });
                            
                        }
                    });
                    
                }
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
 * A TESTER WILL MAKE SHIT AT 100% SURE
 */
serv.post('/driver2', function(req,res){
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
