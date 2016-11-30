'use strict';

var config = {};

if(process.env.NODE_ENV === 'DEVELOPMENT'){
  config.isDevEnv = true;
}

//Haven't set an image for tray icon yet.
config.trayImage = "";

module.exports = config;
