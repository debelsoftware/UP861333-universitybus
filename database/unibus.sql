DROP DATABASE IF EXISTS unibus;
CREATE DATABASE unibus;
USE unibus;

CREATE TABLE USERS(
	userID VARCHAR(25) PRIMARY KEY,
	homeStop INT
);

CREATE TABLE EVENTS(
	userID VARCHAR(25) NOT NULL,
	eventID VARCHAR(35) NOT NULL PRIMARY KEY,
	name VARCHAR(50) NOT NULL,
	location VARCHAR(50) NOT NULL,
	day VARCHAR(25) NOT NULL,
	startTime BIGINT NOT NULL,
	hour int NOT NULL,
	FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE
);
