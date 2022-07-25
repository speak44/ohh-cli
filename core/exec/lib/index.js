'use strict';

const path = require('path')
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
        require(rootFile)(...arguments)
    }
}
module.exports = exec;