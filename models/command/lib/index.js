'use strict';

const colors = require('colors/safe');
const semver = require('semver');
const log = require('@ohh-cli/log');
const LOWEST_NODE_VERSION = '12.0.0';
class Command {
    constructor(argv) {
        if (!argv) {
            throw new Error('参数不能为空！');
        }
        if(!Array.isArray(argv)) {
            throw new Error('参数必须是数组！');
        }
        if(argv.length < 1) {
            throw new Error('参数列表不能为空！');
        }
        this._argv = argv;
        // 模拟learn源码中，使用promise来实现异步代码执行
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve();
            chain = chain.then(() => this.checkNodeVesion());
            chain = chain.then(() => this.initArgs());
            chain = chain.then(() => this.init());
            chain = chain.then(() => this.exec());
            chain.catch((err) => { log.error(err.message); })
        })
    }
    initArgs() {
        this._cmd = this._argv[this._argv.length-1];
        this._argv = this._argv.slice(0, this._argv.length-1);
    }
    // 检查当前node版本
    checkNodeVesion() {
        // 获取到当前的版本号
        const currentNodeVersion = process.version;
        // 设置最小版本号
        const lowestNodeVersion = LOWEST_NODE_VERSION;
        // 进行对比，小于最小版本号，报错
        if (semver.lt(currentNodeVersion, lowestNodeVersion)) {
            throw new Error(colors.red(`ohh-cli 需要安装 v${lowestNodeVersion} 以上版本的Node.js`))
        }
    }
    init() {
        throw new Error('init必须实现!');
    }
    exec() {
        throw new Error('exec必须实现!')
    }
}
module.exports = Command;