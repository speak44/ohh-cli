'use strict';

const path = require('path')
const { spawn } =require('child_process');
const Package = require('@ohh-cli/package');
const log = require('@ohh-cli/log');
const SETTINGS = {
    init: "@ohh-cli/init"
}
const CACHE_DIR = 'dependencies';
async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    let storeDir='';
    let pkg;
    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);
    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name();
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';
    if (!targetPath) {
        // 生成缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR)
        storeDir = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        })
        if (await pkg.exists()) {
            // 存在,更新package
           await pkg.update()

        } else {
            // 不存在 安装最新的package
            await pkg.install()
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        })
        const exists = await pkg.exists()
    }
    const rootFile = pkg.getRootFilePath();
    if (rootFile)  {
        try {
            // 在当前的进程中调用
            // require(rootFile)(Array.from(arguments))
            // 在node子进程中调用
            const args =Array.from(arguments);
            const cmd = args[args.length-1];
            const o = Object.create(null);
            Object.keys(cmd).forEach( key =>{
                // 存在于对象本身，过滤原型链上属性&& 过滤“_”开头属性&&不是parent下属性
                if(cmd.hasOwnProperty(key) && key !== 'parent'){
                    o[key] = cmd[key]
                }
            })
            args[args.length - 1] = o;
            const code = `require('${rootFile}')(${JSON.stringify(args)})`;
            const child = platformSpawn('node', ['-e',code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            });
            child.on('error',e=>{
                log.error(e.message);
                process.exit(1); // 错误 code:1
            })
            child.on('exit', e=>{
                log.verbose('命令执行成功：'+ e);
                process.exit(e)  // 成功 code：0
            })
        } catch (error) {
            log.error(error)
        }

    }
}
function platformSpawn(command, args, options) {
    const win32 = process.platform === 'win32';
    const cmd = win32 ? 'cmd' : command;
    const cmdArgs = win32? ['/c'].concat(command, args) : args;
    return spawn(cmd, cmdArgs, options || {});
}
module.exports = exec;