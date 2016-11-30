"use strict";

const electron = require('electron');
const path = require('path');
// var async = require('async');
// var fs = require('fs');
var log = require('electron-log');
// const config = require('./config');

var logLevel = 'info';
if(process.env.NODE_ENV === 'DEVELOPMENT'){
  logLevel = 'debug';
}
log.transports.file.level = logLevel;
log.transports.console.level = logLevel;

//Determine os specifics
var baseFilePath = '';

if (process.platform == 'win32') {
  baseFilePath = path.normalize('resources');
} else if (process.platform == 'darwin') {
  baseFilePath = path.resolve(path.join(__dirname, '../'));
} else {
  throw new Error("cannot determine os " + process.platform);
}

log.transports.file.file = path.normalize(path.join(baseFilePath, 'mailclient.log'));
log.warn("!!!Starting Mail Client!!!");
log.info("Log level: "+logLevel);

//Import custom modules once logging has been established
var utils = require('./utils');


// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
// const Tray = electron.Tray;
// const dialog = electron.dialog;

// Keep a global reference of the window objects, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
global.windows = [];
global.startWindow = null;
global.mainWindow = null;
// var helpWindow;
var mainWindow;

// var tray;



function showDockTask(){
  if (process.platform === 'darwin'){
    app.dock.show();
  }
}
function hideDockTask(){
  if (process.platform === 'darwin'){
    app.dock.hide();
  }
}



function setMenu(){
  const template = [
    {
      label: 'Edit',
      submenu: [
        {
          role: 'undo'
        },
        {
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'paste'
        },
        {
          role: 'pasteandmatchstyle'
        },
        {
          role: 'delete'
        },
        {
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, focusedWindow) {
            if (focusedWindow) {focusedWindow.reload();}
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item, focusedWindow) {
            if (focusedWindow) {focusedWindow.webContents.toggleDevTools();}
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'resetzoom'
        },
        {
          role: 'zoomin'
        },
        {
          role: 'zoomout'
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    },
    {
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'close'
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('http://electron.atom.io'); }
        },{
          label: "Download Logs",
          click: utils.downloadLogs
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    });
    // Edit menu.
    template[1].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Speech',
        submenu: [
          {
            role: 'startspeaking'
          },
          {
            role: 'stopspeaking'
          }
        ]
      }
    );
    // Window menu.
    template[3].submenu = [
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Zoom',
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    ];
  }

  log.debug("Setting menu options. "+JSON.stringify(template));
  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Don't need a tray icon at the moment but maybe in the future
// function setTray(){
//   log.debug("Setting Tray Icon");
//   tray = new Tray(config.trayImage);
//   const contentMenu = Menu.buildFromTemplate([
//     { 
//       label:"Open Appvance Window", 
//       click: startWindow
//     },
//     {
//       label:"Shutdown Appvance",
//       click: stopAllProcess
//     }
//   ]);
//   tray.setToolTip('Start/Stop Appvance');
//   tray.setContextMenu(contentMenu);
// }

function openMainWindow(){
  showDockTask(); //Show Dock icon
  setMenu(); //Set Menu Bar
  // Create the browser window.
  var options = {
    width: 1400,
    height: 1000,
    show: false
  };

  mainWindow = new BrowserWindow(options);
  global.windows[0] = mainWindow;
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.on('ready-to-show', function() {
    showDockTask();
    mainWindow.show();
    mainWindow.focus();
    global.windows[0] = mainWindow;
  });


  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should devare the corresponding element.
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', openMainWindow);

// Create dummy window to handle different events set to global.windows[0]
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (global.windows[0] === null) {
   mainWindow();
  }
});


// process.on('uncaughtException', function (error) {
//   log.error("Handling uncaught error")
//   if (global.windows[0]){
//     global.windows[0].webContents.send('current-proc', 'error setting up Appvance.')
//   } else{
//     console.log(error)
//   }
//   log.error(error)
//     // Handle the error
// })


//