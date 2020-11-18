CREATE TABLE tomcat_users (
	user_name varchar(20) NOT NULL PRIMARY KEY,
	md5password varchar(32) NOT NULL,
	plainPassword varchar(32),
	passwordHint varchar(128)
);


CREATE TABLE tomcat_roles (
	role_name varchar(20) NOT NULL PRIMARY KEY
);
CREATE TABLE tomcat_users_roles (
	user_name varchar(20) NOT NULL,
	role_name varchar(20) NOT NULL,
	PRIMARY KEY (user_name, role_name),
	CONSTRAINT tomcat_users_roles_foreign_key_1 FOREIGN KEY (user_name) REFERENCES tomcat_users (user_name),
	CONSTRAINT tomcat_users_roles_foreign_key_2 FOREIGN KEY (role_name) REFERENCES tomcat_roles (role_name)
);


insert into tomcat_roles values('vodml-mapper')

-- using https://www.md5online.org/md5-encrypt.html
insert into tomcat_users values('gerard','22441651c8b51dad1b7b4c6fa17a1788',NULL,'...123') --
update tomcat_users set md5password='7fba90c63738bea9cd122977c168c6be',plainPassword=NULL,passwordHint='koosnaampje' where user_name='gerard'

insert into tomcat_users values('jkim','338f3eed7637a648a75f0b2aed85c726','jkim123')
update tomcat_users set plainPassword=NULL,passwordHint='...123' where user_name='jkim'


insert into tomcat_users_roles values('gerard','vodml-mapper')
insert into tomcat_users_roles values('jkim','vodml-mapper')
