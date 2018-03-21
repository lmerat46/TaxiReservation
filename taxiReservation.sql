DROP TABLE IF EXISTS client;
DROP TABLE IF EXISTS driver;
DROP TABLE IF EXISTS reservation;

CREATE TABLE client(id_client INTEGER AUTO_INCREMENT,
                    lastname varchar(255),
                    firstname varchar(255),
                    pseudo varchar(255),
                    birthday varchar(255),
                    mail varchar(255),
                    phone varchar(255),
                    passwd varchar(255),
                    PRIMARY KEY(id_client)
                    );
                
CREATE TABLE driver(id_driver INTEGER AUTO_INCREMENT,
                    lastname varchar(255),
                    firstname varchar(255),
                    pseudo varchar(255),
                    birthday varchar(255),
                    mail varchar(255),
                    phone varchar(255),
                    passwd varchar(255),
                    free tinyint(1),
                    PRIMARY KEY(id_driver)
                    );

CREATE TABLE reservation(id_reservation INTEGER AUTO_INCREMENT,
                         day date,
                         hour time,
                         departure varchar(255),
                         destination varchar(255),
                         id_client INTEGER,
                         id_driver INTEGER,
                         PRIMARY KEY(id_reservation),
                         FOREIGN KEY(id_client) REFERENCES client(id_client),
                         FOREIGN KEY(id_driver) REFERENCES driver(id_driver)
                         );