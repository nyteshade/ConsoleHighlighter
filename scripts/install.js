#!/usr/bin/env node

function Promise() {
  this.resolved = false;
  this.rejected = false;
  this.data = null;
  this.cbsOK = [];
  this.cbsBAD = [];
}

Promise.prototype = {
  resolve: function(data) {
    if (this.resolved || this.rejected) return;
    this.resolved = true;
    this.data = data;
    this.doCBsOK();
  },
  reject: function(data) {
    if (this.resolved || this.rejected) return;
    this.rejected = true;
    this.data = data;
    this.dbCBsBAD();
  },
  ok: function(callback) {
    if (this.resolved) {
      try {callback.call(null, this.data);} catch(e) {}
    }
    this.cbsOK.push(callback);
  },
  bad: function(callback) {
    if (rejected) {
      try {callback.call(null, this.data);} catch(e) {}
    }
    this.cbsBAD.push(callback);
  },
  doCBsOK: function() {
    for (var i = 0; i < this.cbsOK.length; i++) {
      try {this.cbsOK[i].call(null, this.data);} catch(e) {}
    }
  },
  doCBsBAD: function() {
    for (var i = 0; i < this.cbsBAD.length; i++) {
      try {this.cbsBAD[i].call(null, this.data);} catch(e) {}
    }
  },
  done: function() { return this.resolved || this.rejected; },
  toString: function() { return "[object Promise]"; }
};

var fs = require('fs'),
    path = require('path'),
    child = require('child_process'),

    REPO = 'https://github.com/nyteshade/SyntaxHighlighter.git',
    CWD = process.cwd(),
    BASE = path.resolve(path.join(__dirname, '..')),
    SHDIR = path.join(BASE, 'lib', 'SyntaxHighlighter'),
    SHGIT = path.join(SHDIR, '.git'),
    DONE = new Promise();

if (!fs.existsSync(SHDIR)) {
  process.chdir(BASE);
  child.exec('git clone ' + REPO + ' ' + SHDIR,
      function(stdin, stdout, error) {
    DONE.resolve(true);
  });
}
else {
  if (!fs.existsSync(SHGIT)) {
    var prCLONE = new Promise(),
        prMV = new Promise(),
        prRM = new Promise(),
        prRESET = new Promise(); 

    process.chdir(SHDIR);
    console.log('Obtaining repo information...');
    child.exec('git clone --no-checkout --no-hardlinks ' + REPO + ' tmp', function() {
      prCLONE.resolve(true);
    });
    prCLONE.ok(function() {
      console.log('Moving directories around...');
      child.exec('mv tmp/.git .git', function() { 
        prMV.resolve(true); 
      });
    });
    prMV.ok(function() {
      console.log('Cleaning up...');
      child.exec('rm -rf tmp', function() { 
        prRM.resolve(true); 
      })
    });
    prRM.ok(function() {
      console.log('Resetting state...');
      child.exec('git reset --hard HEAD', function() { 
        prRESET.resolve(true); 
      });
    });
    prRESET.ok(function() {
      DONE.resolve(true);
    });
  }
  else {
    DONE.resolve(true);
  }
}

DONE.ok(function() {
  process.chdir(CWD);
  console.log('Install complete');
});

