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
serv.use(express.static(__dirname + '/public'));


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
    console.log(__dirname);
    m.readFile(__dirname+'/views/home.ejs',function(erreur,donnees){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(donnees);
        res.end();
    });
});


/**
 * sign in or sign up
 */
serv.post('/login', function(req, res) {
    res.render(__dirname+'/views/login.ejs');
  });

serv.post('/signUp', function(req,res){
    res.render(__dirname+'/views/createAccount.ejs');
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
        var query="SELECT*FROM driver WHERE pseudo = '"+req.body.pseudo+"'";
        connexion.query(query,function(err,rows){
            if(rows.length <= 0){
                connexion.query("INSERT INTO driver (lastname, firstname, birthday, mail, phone, pseudo, passwd) VALUES ?", [data]);
                connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                    if(err) throw err;
                    else{
                        connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+req.body.pseudo+"')",function(err1,rows1){
                            if(err1) throw err1;
                            else res.render(__dirname+'/views/driver.ejs', {v_nom : req.body.pseudo, data: rows, data2: rows1});
                        });
                    }
                });
            }else{
                res.render(__dirname+'/views/createAccount.ejs');
            }
        });
    }else{
        var query="SELECT*FROM client WHERE pseudo = '"+req.body.pseudo+"'";
        connexion.query(query,function(err,rows){
            if(rows <= 0){
                connexion.query("INSERT INTO client (lastname, firstname, birthday, mail, phone, pseudo, passwd) VALUES ?", [data]);
                connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+cookie[0][5]+"') and reservation.id_driver = driver.id_driver",function(err,rows){
                    if(err) throw err;
                    else{
                        res.render(__dirname+'/views/client.ejs', {v_nom : req.body.pseudo, data: rows});
                    }
                });
            }else{
                res.render(__dirname+'/views/createAccount.ejs');
            }
        });
    }
});


/**
 * check login
 * and display the right home page
 */
serv.post('/home', function(req,res){
    var pseudo = req.body.pseudo;
    var password = req.body.password;
    connexion.query("SELECT*FROM client WHERE pseudo = '"+pseudo+"'",function(err,rows){
        if(rows.length <= 0){
            connexion.query("SELECT*FROM driver WHERE pseudo = '"+pseudo+"'",function(err1,rows1){
                cookie = [[
                    rows1[0].lastname,
                    rows1[0].firstname,
                    rows1[0].birthday,
                    rows1[0].mail,
                    rows1[0].phone,
                    rows1[0].pseudo,
                    rows1[0].password,
                ]];
            });
        }else{
            cookie = [[
                rows[0].lastname,
                rows[0].firstname,
                rows[0].birthday,
                rows[0].mail,
                rows[0].phone,
                rows[0].pseudo,
                rows[0].password,
            ]];
        }
    });

    connexion.query("SELECT pseudo FROM client WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err,rows){
        if(rows[0] == undefined){
            connexion.query("SELECT pseudo FROM driver WHERE pseudo = '"+pseudo+"' and passwd = '"+password+"'", function(err1,rows1){
                if(rows1[0] == undefined){
                    res.render(__dirname+'/views/login.ejs');
                }else{
                    connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                        if(err) throw err;
                        else{
                            connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+pseudo+"')",function(err1,rows1){
                                if(err1) throw err1;
                                else res.render(__dirname+'/views/driver.ejs', {v_nom : pseudo, data: rows, data2: rows1});
                            });
                            
                        }
                    });   
                }
            });

        }else{
            connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+pseudo+"') and reservation.id_driver = driver.id_driver",function(err,rows){
                if(err) throw err;
                else{
                    res.render(__dirname+'/views/client.ejs', {v_nom : pseudo, data: rows});
                }
            });
        }
    });
});

/**
 * disconnect client or driver when button for deconnexion is pressed
 */
serv.post('/accueil',function(req,res){
    if(req.body.disconnect == "disconnect"){
        res.render(__dirname+'/views/home.ejs');
        cookie = null;
    }
});

/**
 * driver free or not?
 */
serv.post('/driverf', function(req, res){
    var choice = req.body.choice
    if(choice == "yes"){
        connexion.query("UPDATE driver SET free = '"+1+"' WHERE pseudo='"+cookie[0][5]+"'");
    }else if(choice == "no"){
        connexion.query("UPDATE driver SET free = '"+0+"' WHERE pseudo='"+cookie[0][5]+"'");
    }
    connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
        if(err) throw err;
        else{
            connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie[0][5]+"')",function(err1,rows1){
                if(err1) throw err1;
                else res.render(__dirname+'/views/driver.ejs', {v_nom : cookie[0][5], data: rows, data2: rows1});
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
            res.render(__dirname+'/views/client.ejs', {v_nom : cookie[0][5], data: rows});
        }
    });
});

/**
 * associate a reservation to a driver
 */
serv.post('/driver', function(req,res){
    var resa = req.body.resa
    connexion.query("UPDATE driver SET free = '"+0+"' WHERE pseudo = '"+cookie[0][5]+"'");
    connexion.query("UPDATE reservation SET finish = '"+1+"',id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie[0][5]+"') WHERE id_reservation = '"+resa+"'", function(err, rows){
        if(err) throw err;
        else{
            connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                if(err) throw err;
                else{
                    connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie[0][5]+"')",function(err1,rows1){
                        if(err1) throw err1;
                        else res.render(__dirname+'/views/driver.ejs', {v_nom : cookie[0][5], data: rows, data2: rows1});
                    });
                }
            });
        }
    });
});

/**
 * display the profile
 */
serv.post('/profil', function(req,res){
    var client = req.body.client;
    var driver = req.body.driver;
    console.log(client);
    console.log(driver);
    console.log(cookie);
    console.log(cookie[0][5]);
    if(client == undefined) var query = "SELECT*FROM driver WHERE pseudo = '"+cookie[0][5]+"'";
    else var query = "SELECT*FROM client WHERE pseudo = '"+cookie[0][5]+"'";
    connexion.query(query,function(err,rows){
        if(err) throw err;
        else{
            res.render(__dirname+'/views/profil.ejs',{data: rows[0]})
        }
    });
});

/**
 * modify the profil
 */
serv.post('/modify', function(req,res){
    var lastname = req.body.lastname;
    var firstname = req.body.firstname;
    var birthday = req.body.birthday;
    var mail = req.body.mail;
    var phone = req.body.phone;
    var passwd = req.body.password;

    var passwdConf = req.body.passwordConf;

    if(req.body.submit == "cancel"){
        var query = "SELECT*FROM client WHERE lastname = '"+lastname+"' and firstname = '"+firstname+"' AND birthday = '"+birthday+"' AND mail = '"+mail+"' AND phone = '"+phone+"'";
        connexion.query(query,function(err,rows){
            if(rows[0] == undefined){
                connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                    if(err) throw err;
                    else{
                        connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie[0][5]+"')",function(err1,rows1){
                            if(err1) throw err1;
                            else res.render(__dirname+'/views/driver.ejs', {v_nom : cookie[0][5], data: rows, data2: rows1});
                        });
                    }
                });
            }else{
                connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+cookie[0][5]+"') and reservation.id_driver = driver.id_driver",function(err,rows){
                    if(err) throw err;
                    else{
                        res.render(__dirname+'/views/client.ejs', {v_nom : cookie[0][5], data: rows});
                    }
                });
            }
        });
    }else{
        connexion.query("SELECT*FROM client WHERE pseudo = '"+cookie[0][5]+"'",function(err,rows){
            if(rows.length <= 0){
                if(passwd == "" && passwdConf == ""){
                    var query = "UPDATE driver SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"' WHERE pseudo = '"+cookie[0][5]+"'";
                    connexion.query(query);
                }else if(passwd == passwdConf){
                    var query = "UPDATE driver SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"', passwd = '"+passwd+"' WHERE pseudo = '"+cookie[0][5]+"'";
                    connexion.query(query);
                }else{
                    var query = "UPDATE driver SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"' WHERE pseudo = '"+cookie[0][5]+"'";
                    connexion.query(query);
                }
                connexion.query("SELECT *FROM reservation WHERE finish = '"+0+"'",function(err,rows){
                    if(err) throw err;
                    else{
                        connexion.query("SELECT*FROM reservation WHERE finish = '"+1+"' and id_driver = (SELECT id_driver FROM driver WHERE pseudo = '"+cookie[0][5]+"')",function(err1,rows1){
                            if(err1) throw err1;
                            else res.render(__dirname+'/views/driver.ejs', {v_nom : cookie[0][5], data: rows, data2: rows1});
                        }); 
                    }
                });
            }else{
                if(passwd == "" && passwdConf == ""){
                    var query = "UPDATE client SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"' WHERE pseudo = '"+cookie[0][5]+"'";
                    connexion.query(query);
                }else if(passwd == passwdConf){
                    var query = "UPDATE client SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"', passwd = '"+passwd+"' WHERE pseudo = '"+cookie[0][5]+"'";
                    connexion.query(query);
                }else{
                    var query = "UPDATE driver SET lastname = '"+lastname+"', firstname = '"+firstname+"',birthday = '"+birthday+"', phone = '"+phone+"', mail = '"+mail+"' WHERE pseudo = '"+cookie[0][5]+"'";
                    connexion.query(query);
                }
                connexion.query("SELECT*FROM reservation,driver WHERE id_client = (SELECT id_client FROM client WHERE pseudo = '"+cookie[0][5]+"') AND reservation.id_driver = driver.id_driver",function(err,rows){
                    if(err) throw err;
                    else{
                        res.render(__dirname+'/views/client.ejs', {v_nom : cookie[0][5], data: rows});
                    }
                });
            }
        });
    }
});

serv.listen(8080);