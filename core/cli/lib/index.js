'use strict';


module.exports = core;
const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const { Command } = require('commander');
const pathExists = require('path-exists').sync;
const pkg = require('../package.json');
const log = require('@ohh-cli/log');
const init = require('@ohh-cli/init');
const exec = require('@ohh-cli/exec');
const { getNpmSemverVersions } = require('@ohh-cli/get-npm-info');
const constant = require('./const.js');

// let args;
const program = new Command;
async function core() {
    try {
        await prepare()
        // 注册命令
        registerCommand()
    } catch (error) {
        console.error(error.message)
    };
}

//注册命令
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .version(pkg.version)
        .usage("<command> [option]")
        .option("-d, --debug", "是否开启调试模式", false)
        .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", " ")
    program
        .command("init [projectName]")
        .option("-f, --force", "是否强制初始化项目")
        .action(exec)
    //开启本地代码调试
    program.on("option:targetPath", () => {
        process.env.CLI_TARGET_PATH = program.opts().targetPath;
    })

    // 开启debug模式
    program.on("option:debug", () => {
        // console.log(program.opts());
        process.env.LOG_LEVEL = "verbose";
        log.level = process.env.LOG_LEVEL;
    })
    // 对未知命令监听
    program.on("command:*", (obj) => {
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red('未知命令', obj[0]))
        if (availableCommands.length > 0) {
            console.log(colors.red('已知命令', availableCommands.join(',')));
        }
    })
    program.parse()

    if (program.args && program.args.length < 1) {
        program.outputHelp();
        console.log()
    }
}
// 脚手架启动阶段
async function prepare() {
    // cli 脚手架版本号
    checkPkgVersion();
    // 当前node版本号
    checkNodeVesion();
    // 检查当前启动用户是否为root
    checkRoot();
    // 检查用户主目录
    checkUserHome()
    // 检查入参
    // checkInputArgs()
    // 检查环境变量
    checkEnv()
    // 检查版本号
    await checkGlobalUpdate()
}
// 检查版本号，更新到最新版本
async function checkGlobalUpdate() {
    // 1. 获取当前版本号
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    // 2. 调用npmAPI，获取所有版本号
    // const data = await getNpmVersions(npmName)
    // 3. 提取所有版本号，比对那些版本号大于当前版本号
    const lastVersion = await getNpmSemverVersions({ baseVersion: currentVersion, npmName: npmName });
    // 4. 给出最新的版本号，提示用户更新到该版本
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn('更新提示', colors.yellow(`请手动更新${npmName}, 当前版本是${currentVersion}, 最新版本是${lastVersion},
        更新命令: npm install -g ${npmName}`))
    }
}
// 检查环境变量
function checkEnv() {
    const dotenv = require('dotenv');
    // 获取到本地的.env文件
    // console.log(userHome);
    const dotenvPath = path.resolve(userHome, '.env');
    console.log(dotenvPath);
    if (pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
    //  ('环境变量', process.env.CLI_HOME_PATH, dotenv.config())
}
function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    };
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}
// 检查入参数
// function checkInputArgs() {
//     const minimist = require('minimist');
//     args = minimist(process.argv.slice(2))
//     checkArgs(args);
// }
// function checkArgs() {
//     if (args.debug) {
//         process.env.LOG_LEVEL = 'verbose';
//     } else {
//         process.env.LOG_LEVEL = 'info';
//     }
//     log.level = process.env.LOG_LEVEL;
//     //log.verbose('debug', 'test debug log');
// }
// 检查用户主目录是否存在
function checkUserHome() {
    // 直接可以获取到主目录 console.log(userHome); /Users/ohh
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在！'));
    }
}
// 检查当前启动项是否为root；如果是 进行降级
function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck()
    // console.log(process.getuid());
}
// 检查当前node版本
function checkNodeVesion() {
    // 获取到当前的版本号
    const currentNodeVersion = process.version;
    // 设置最小版本号
    const lowestNodeVersion = constant.LOWEST_NODE_VERSION;

    // 进行对比，小于最小版本号，报错
    if (semver.lt(currentNodeVersion, lowestNodeVersion)) {
        throw new Error(colors.red(`oh-cli 需要安装 v${lowestNodeVersion} 以上版本的Node.js`))
    }
}
// 检查当前脚手架版本号
function checkPkgVersion() {
    log.info('cli', pkg.version)
}

