#! /usr/bin/env node 
 ;
const improtLocal = require('import-local');
const npmLog = require('npmlog');

if (improtLocal(__filename)) {
    npmLog.info('cli', '正在使用本地oh-cli');
} else {
  require('../lib')();
}
