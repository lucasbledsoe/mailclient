'use strict';
const electron = require('electron');
var exec = require('child_process').exec;
var async = require('async');
var request = require('request');
var fs = require('fs');
var log = require('electron-log');
var config = require('./config');
var jszip = require('jszip');
var path = require('path');
var rimraf = require('rimraf');

log.transports.file.level = 'warning';

var dialog = electron.dialog;
var utils = {};
utils.download_file = function(url, path, callback) {
  request({
      uri: url
    })
    .pipe(fs.createWriteStream(path))
    .on('error', function(err) {
      callback(err);
    })
    .on('close', function() {
      callback();
    });
};

utils.mac_unzip = function(inpath, outpath, callback) {
  var targz = require('targz');
  targz.decompress({
    src: inpath,
    dest: outpath
  }, function(err) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      log.info("Extracted file from " + inpath + " to " + outpath);
      callback(null);
    }
  });
};

utils.win_unzip = function(inpath, outpath, callback) {
  var unzip = require('unzip');
  fs.createReadStream(inpath).pipe(unzip.Extract({
      path: outpath
    }))
    .on('error', function(err) {
      callback(err);
    })
    .on('close', function() {
      callback(null);
    });
};

utils.copyFile = function(source, target, cb) {
  log.debug("Moving file from "+source+" to "+target);
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function() {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
};


utils.downloadLogs = function(){
  var zip = new jszip();
  // var zipfolder = jszip.folder("logs");
  var files = [ 
    log.transports.file.file,
  ];
  async.each(files, function(file, callback){
      fs.readFile(file, function(err, data){
        if(err){
          log.error("Failed to read file "+file);
          if (err.code === "ENOENT"){
            callback(null);
          } else{
            callback(err);
          }
        } else{
          var fileName = file.split('/').pop();
          zip.folder("logs").file(fileName, data.toString());
          callback(null);
        }
      });
    }, function(err){
      if(err){
        log.error("Failed to create log zip file");
        log.error(err);
      } else{
        var options = {
          title:"Save Logs",
          defaultPath:"logs.zip"
        };
        dialog.showSaveDialog(options, function (fileName) {
          if (fileName === undefined){
               log.error("You didn't save the file");
               return;
          }
          // fileName is a string that contains the path and filename created in the save file dialog.  
          zip
            .generateNodeStream({type:'nodebuffer',streamFiles:true})
            .pipe(fs.createWriteStream(fileName))
            .on('finish', function () {
              // JSZip generates a readable stream with a "end" event,
              // but is piped here in a writable stream which emits a "finish" event.
              log.warn(fileName+" written.");
            });          
        });
      }
    }
  );
};

utils.downloadInitSql = function(){
  log.debug("Download for init sql");
  var options = {
    title:"Save Init SQL",
    defaultPath:"/AppvanceInit.sql"
  };
  dialog.showSaveDialog(options, function (fileName) {
    if (fileName === undefined){
         log.error("You didn't save the file");
         return;
    } else{
      fs.readFile(config.mysqlInitSqlFile, function(err, data){
        if(err){
          log.error(err);
        } else{
          fs.writeFile(fileName, data, function(err){
            if(err){
              log.error(err);
            }else{
              log.info("saved init sql to "+fileName);
            }
          });
        } 
      });
    }
  });
};

module.exports = utils;
