drop database if exists freedom ;
create database freedom;
use freedom;

drop table if exists channel;
CREATE TABLE channel(
	_id varchar(64) primary key,
	user_id varchar(64) not null,
	linked_cms enum('Manage', 'Affiliated') default null,
	network_id varchar(64),
	network_name varchar(256) ,
	recruiter varchar(64) default null,
	recruited_date bigint(15) default null,
	partnership_status boolean  default false,
	channel_name varchar(256)  not null,
	channel_username varchar(512)  not null,	/*  from gdata */
	access_token varchar(128) not null,
	refresh_token varchar(128) not null,
	total_views int(11)  not null,
	total_comments int(11)  not null,
	total_subscribers int(11) not null,
	total_videos int(11)  not null default 0,
	last30_days int(11) ,
	active boolean default true,
	overall_goodstanding boolean not null,
	communityguidelines_goodstanding boolean not null,
	copyrightstrikes_goodstanding boolean not null,
	contentidclaims_goodstanding boolean not null,
	date_approved int(11) default null,
	published_at bigint(15) not null,
	created_at bigint(15)  not null,
	updated_at bigint(15)
);

drop table if exists channel_stats;
CREATE TABLE  channel_stats (
	channel_id varchar(64) not null,
	date bigint(15)   not null,
	views int(11)  not null,
	subscribers int(11)  not null,
	videos int(11)  not null,
	comment int(11)  not null,
	overall_goodstanding boolean not null,
	communityguidelines_goodstanding boolean not null,
	copyrightstrikes_goodstanding boolean not null,
	contentidclaims_goodstanding boolean not null,
	created_at bigint(15) not null
);


drop table if exists prospects;
CREATE TABLE prospects (
	_id int(10) unsigned NOT NULL AUTO_INCREMENT,
	recruiter_id varchar(266)  NOT NULL,
	recruiter_email varchar(255) NOT NULL,
	username varchar(255) NOT NULL,
	owner varchar(255) NOT NULL,
	status varchar(255) NOT NULL,
	thumbnail varchar(255) NOT NULL,
	note varchar(500),
	created_at bigint(15)  not null,
	updated_at bigint(15),
	PRIMARY KEY (_id)
);

drop table if exists network;
CREATE TABLE network (
	_id int(10) unsigned NOT NULL AUTO_INCREMENT,
	owner_id varchar(64) not null,
	name varchar(64) not null,
	email varchar(64),
	accept_email_message TEXT,
	reject_email_message TEXT,
	description TEXT,
	tags varchar(255),
	banner varchar(1024),
	created_at bigint(15)  not null,
	updated_at bigint(15),
	PRIMARY KEY (_id)
);

insert into network values(1, 'fd51bda2fcd2f9ef22fbe4214547cce4', 'Ravnetwork', 'This is a description. Promise.', 'tag,tags,tagses', 'http://www.avatecpower.com/images/banner_sale_network.gif', 1401739516480, null);
