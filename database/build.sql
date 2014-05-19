drop database if exists freedom ;
create database freedom;
use freedom;

drop table if exists channel;
CREATE TABLE channel(
	_id varchar(64) primary key,
	network_id varchar(64),
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
	date_approved int(11) default null,
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


drop table if exists `prospects`;
CREATE TABLE `prospects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `recruiter_id` int(10) unsigned NOT NULL,
  `recruiter` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `thumbnail` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `link` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `published` varchar(255) NOT NULL,
  `subs` varchar(255) NOT NULL,
  `views` varchar(255) NOT NULL,
  `rate` varchar(255) NOT NULL,
  `daterecruited` datetime NOT NULL,
  `note` varchar(500) NOT NULL,
  `notedate` datetime NOT NULL,
  `messaging_link` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

