'use strict';
const { spawn } =require('child_process');

function isObject(o) {
    return Object.prototype.toString.call(o) === "[object Object]";
}
function spinnerStart(msg, spinnerString = '|/-\\') {
    const Spinner = require('cli-spinner').Spinner;
    const spinner = new Spinner(msg + '%s');
    spinner.setSpinnerString(spinnerString);
    spinner.start();
    // var Spinner = require('cli-spinner').Spinner;
    // var spinner = new Spinner('processing.. %s');
    // spinner.setSpinnerString('|/-\\');
    // spinner.start();
    return spinner;
}


function sleep( timeout = 1000 ) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

function platformSpawn(command, args, options) {
    const win32 = process.platform === 'win32';
    const cmd = win32 ? 'cmd' : command;
    const cmdArgs = win32? ['/c'].concat(command, args) : args;
    return spawn(cmd, cmdArgs, options || {});
}
function execAsync(command, args, options) {
    return new Promise((resolve, reject) => {
       const p =  platformSpawn(command, args, options)
       p.on('error',e => reject(e));
       p.on('exit', c => resolve(c));
    })
}
module.exports = {
    isObject,
    spinnerStart,
    sleep,
    platformSpawn,
    execAsync,
};