'use strict';

const path = require('path');
const colors = require('colors');
const fse = require('fs-extra');
const pkgDir = require('pkg-dir').sync;
const pathExists =require('path-exists').sync;
const npminstall = require('npminstall');
const { isObject } = require('@ohh-cli/utils');
const formatPath = require('@ohh-cli/format-path');
const { defaultRegistry, getNpmLatestVersion } = require('@ohh-cli/get-npm-info');
class Package {
    constructor(options) {
        if (!options) {
            throw new Error(colors.red('Package类的options参数不能为空!'))
        }
        if (!isObject(options)) {
            throw new Error(colors.red('Package类的option参数必须为对象!'))
        }
        // package的目标路径
        this.targetPath = options.targetPath;
        // 存储路径
        this.storeDir = options.storeDir;
        //package的name
        this.packageName = options.packageName;
        //package的version
        this.packageVersion = options.packageVersion;
        // 缓存路径
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }
    async prepare(){
        if(this.storeDir && !pathExists(this.storeDir)){
            fse.mkdirpSync(this.storeDir);
        }
        if(this.packageVersion === 'latest'){
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }
    get catchFilePath(){
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
    }
    getSpecificCacheFilePath(packageVersion){
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
    }
    // package是否存在
    async exists() {
        // 缓存模式
        if (this.storeDir) {
            await this.prepare()
            return pathExists(this.catchFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }
    // 安装依赖
    async install() {
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: defaultRegistry(),
            pkgs:[{
                name: this.packageName,
                version: this.packageVersion
            }]
        })
    }
    // 更新package
    async update() {
        await this.prepare()
        // 1. 获取最新的版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName);
        // 2. 判断最新版本号的路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
        // 3. 如果不存在，则安装最新版本
        if(!pathExists(latestFilePath)){
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: defaultRegistry(),
                pkgs:[{
                    name: this.packageName,
                    version: latestPackageVersion
                }]
            })
            this.packageVersion  = latestPackageVersion;
        }
    }
    // 获取入口文件路径
    getRootFilePath() {
        function _getRootFile(targetPath){
            // 1. 获取主目录，package.json 存在的目录
            const dir = pkgDir(targetPath)
            // 2. 读取 package.json，用require
            if (dir) {
                const pkgFile = require(path.resolve(dir, 'package.json'));
                // 3. 寻找main/lib
                if (pkgFile && pkgFile.main) {
                    // 4. 路径的兼容 （macOS / window）
                    return formatPath(path.resolve(dir, pkgFile.main));
                }
            }
            return null
        }
        // 缓存
        if (this.storeDir) {
           return _getRootFile(catchFilePath)
        } else {
           return _getRootFile(this.targetPath)
        }
    }
}
module.exports = Package;