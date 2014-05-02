drop database if exists freedom ;
create database freedom;
use freedom;

drop table if exists channel;
CREATE TABLE channel(
	_id varchar(64) primary key,
	network_id int(11),
	network_name varchar(256) ,
	partnership_status boolean  default false,
	channel_name varchar(256)  not null,
	channel_username varchar(512)  not null,	/*  from gdata */
	access_token varchar(128) not null,
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
	created_at int(11)  not null,
	updated_at int(11)
);

drop table if exists channel_stats;
CREATE TABLE  channel_stats (
	channel_id int(11) not null,
	date int(11)   not null,
	views int(11)  not null,
	subscribers int(11)  not null,
	videos int(11)  not null,
	comment int(11)  not null,
	overall_goodstanding boolean not null,
	communityguidelines_goodstanding boolean not null,
	copyrightstrikes_goodstanding boolean not null,
	contentidclaims_goodstanding boolean not null,
	created_at int(11) not null
);

