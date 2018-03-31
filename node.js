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
            else{
                connexion.query("SELECT*FROM reservation,driver WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+req.body.pseudo+"')",function(err1,rows1){
                    if(err1) throw err1;
                    else res.render(__dirname+'/html/driver.ejs', {v_nom : req.body.pseudo, data: rows, data2: rows1});
                });
            }
        });
    }else{
        connexion.query("INSERT INTO client (lastname, firstname, birthday, mail, phone, pseudo, passwd) VALUES ?", [data]);
        connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+cookie[0][5]+"') and reservation.id_driver = driver.id_driver",function(err,rows){
            if(err) throw err;
            else{
                res.render(__dirname+'/html/client.ejs', {v_nom : req.body.pseudo, data: rows});
            }
        });
    }
});


/**
 * check login
 * and display the right home page
 */
serv.post('/home', function(req,res){
    cookie = req.body.pseudo;
    var pseudo = req.body.pseudo;
    var password = req.body.password;
    connexion.query("SELECT pseudo FROM client WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err,rows){
        if(rows[0] == undefined){
            connexion.query("SELECT pseudo FROM driver WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err1,rows1){
                if(rows1[0] == undefined){
                    res.render(__dirname+'/html/login.ejs');
                }else{
                    connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                        if(err) throw err;
                        else{
                            connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+pseudo+"')",function(err1,rows1){
                                if(err1) throw err1;
                                else res.render(__dirname+'/html/driver.ejs', {v_nom : pseudo, data: rows, data2: rows1});
                            });
                            
                        }
                    });   
                }
            });

        }else{
            connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+pseudo+"') and reservation.id_driver = driver.id_driver",function(err,rows){
                if(err) throw err;
                else{
                    res.render(__dirname+'/html/client.ejs', {v_nom : pseudo, data: rows});
                }
            });
        }
    });
});

serv.post('/accueil',function(req,res){
    if(req.body.disconnect == "disconnect"){
        res.render(__dirname+'/html/home.ejs');
        cookie = null;
    }
});

/**
 * driver free or not?
 */
serv.post('/driverf', function(req, res){
    var choice = req.body.choice
    console.log(choice);
    console.log(cookie);
    if(choice == "yes"){
        connexion.query("UPDATE driver SET free = '"+1+"' WHERE pseudo='"+cookie+"'");
    }else if(choice == "no"){
        connexion.query("UPDATE driver SET free = '"+0+"' WHERE pseudo='"+cookie+"'");
    }
    connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
        if(err) throw err;
        else{
            connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie+"')",function(err1,rows1){
                if(err1) throw err1;
                else res.render(__dirname+'/html/driver.ejs', {v_nom : cookie, data: rows, data2: rows1});
            });
        }
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
    connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+cookie[0][5]+"') and reservation.id_driver = driver.id_driver",function(err,rows){
        if(err) throw err;
        else{
            res.render(__dirname+'/html/client.ejs', {v_nom : cookie[0][5], data: rows});
        }
    });
});

  serv.listen(8080);

/**
 * associate a reservation to a driver
 * A TESTER WILL MAKE SHIT AT 100% SURE
 */
serv.post('/driver', function(req,res){
    var resa = req.body.resa
    connexion.query("UPDATE reservation SET finish = '"+1+"',id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie+"') WHERE id_reservation = '"+resa+"'", function(err, rows){
        if(err) throw err;
        else{
            connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                if(err) throw err;
                else{
                    connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie+"')",function(err1,rows1){
                        if(err1) throw err1;
                        else res.render(__dirname+'/html/driver.ejs', {v_nom : req.body.pseudo, data: rows, data2: rows1});
                    });
                }
            });
        }
    });
});

serv.post('/profil', function(req,res){
    var client = req.body.client;
    var driver = req.body.driver;
    if(client == undefined) var query = "SELECT*from driver WHERE pseudo = '"+cookie+"'";
    else var query = "SELECT*from  WHERE pseudo = '"+cookie+"'";
    connexion.query(query,function(err,rows){
        if(err) throw err;
        else{
            res.render(__dirname+'/html/profil.ejs',{data: rows[0]})
        }
    });
});

serv.post('/modify', function(req,res){
    var lastname = req.body.lastname;
    var firstname = req.body.firstname;
    var birthday = req.body.birthday;
    var mail = req.body.mail;
    var phone = req.body.phone;
    var pseudo = req.body.pseudo;
    var passwd = req.body.password;

    var passwdConf = req.body.passwordConf;


    connexion.query("SELECT *FROM client WHERE pseudo = '"+cookie+"'",function(err,rows){
        if(rows[0] == undefined){
            if(passwd == passwdConf){
                var query = "UPDATE driver SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"', pseudo = '"+pseudo+"', passwd = '"+passwd+"' WHERE pseudo = '"+cookie+"'";
                connexion.query(query);
            }
            connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                if(err) throw err;
                else{
                    connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+pseudo+"')",function(err1,rows1){
                        if(err1) throw err1;
                        else res.render(__dirname+'/html/driver.ejs', {v_nom : pseudo, data: rows, data2: rows1});
                    }); 
                }
            });
        }else{
            if(passwd == passwdConf){
                var query = "UPDATE client SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"', pseudo = '"+pseudo+"', passwd = '"+passwd+"' WHERE pseudo = '"+cookie+"'";
                connexion.query(query);
            }
            connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+pseudo+"') and reservation.id_driver = driver.id_driver",function(err,rows){
                if(err) throw err;
                else{
                    res.render(__dirname+'/html/client.ejs', {v_nom : pseudo, data: rows});
                }
            });
        }
    });
    cookie = pseudo;
});
