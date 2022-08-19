'use strict';
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const kebabCase = require('kebab-case');
const glob = require('glob');
const ejs = require('ejs');
const userHome = require('user-home'); // 拿用户主目录
const Package = require('@ohh-cli/package');
const Command = require('@ohh-cli/command');
const log = require('@ohh-cli/log');
const { spinnerStart, sleep, execAsync } = require('@ohh-cli/utils');
const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';
const WHILE_COMMAND = ['npm', 'cnpm'];
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd._optionValues.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }
    async exec() {
        try {
            // 1. 准备阶段
            const projectInfo = await this.perpare()
            if (projectInfo) {
                log.verbose('projectInfo', projectInfo)
                this.projectInfo = projectInfo;
            // 2. 下载模板
                await this.downloadTemplate()
            // 3. 安装模板    
                await this.installTemplate()
            }
        } catch (error) {
            log.error(error);
            if(process.env.LOG_LEVEL === 'verbose'){
                console.log(error);
            }
        }

    }
    async installTemplate() {
        if(this.templateInfo) {
            if(!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if(this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                // 标准安装
                await this.installNormalTemplate()
            } else if(this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                // 自定义安装
                await this.installCustomTemplate()
            } else {
                throw Error('无法识别项目模板类型！')
            }  
        } else {
            throw Error('项目模板信息不存在！')
        }
    }
    // 白名单判断
    checktCommand(cmd) {
        if (WHILE_COMMAND.includes(cmd)) {
            return cmd
        } else{
            throw Error('命令不存在！命令：'+ cmd );
        }
    }
    // npm install 和 npm run serve 命令封装
    async execCommand(command, errMsg){
        let ret;
        if ( command ) {
            const cmdArray = command.split(" ")
            const cmd = this.checktCommand( cmdArray[0] );
            const args = cmdArray.slice(1);
            ret = await execAsync(cmd, args, {
                cwd: process.cwd(),
                stdio: 'inherit' 
            })            
        }
        if(ret !== 0){
            throw Error( errMsg );
        }
        return ret        
    }
    ejsRender(options) {
        const dir = process.cwd();
        const projectInfo = this.projectInfo;
        // console.log(options);
        return new Promise( (resolve, reject) => {
            glob('**',{
                cwd: dir,
                ignore: options.ignore,
                nodir: true, // 不显示文件夹
            }, (err, files) => {
                if(err){
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.resolve(dir, file);
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, projectInfo, {},(err, result) => {
                            if(err){
                                reject1(err);
                            } else {
                                fse.writeFileSync(filePath, result)
                                resolve1(result);
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch( e =>{
                    reject(e)
                })
            })
        });
    }
    async installNormalTemplate() {
        // console.log('安装标准模板');
        let spinner = spinnerStart('正在安装模板....');
        await sleep()
        try{
        // 拷贝模板代码到当前目录
        const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
        const targetPath = process.cwd()
        // 确保目录是存在的
        fse.ensureDirSync(templatePath);
        fse.ensureDirSync(targetPath);
        // 拷贝
        fse.copySync(templatePath, targetPath);
        spinner.stop(true);
        log.success('模板安装成功');
        }catch(e){
            throw Error(e);
        }
        const { installCommand, startCommand } = this.templateInfo;
        const templateIgnore = this.templateInfo.ignore || [];
        const ignore = ['**/node_modules/**', ...templateIgnore ];
        await this.ejsRender({ignore});
        // 依赖安装
        await this.execCommand(installCommand, '依赖安装失败!');
        // 启动命令行
        await this.execCommand(startCommand, '项目启动失败!');
    }
    async installCustomTemplate() {
        // 查询自定义模板的入口文件
        if (await this.templateNpm.exists()) {
          const rootFile = this.templateNpm.getRootFilePath();
          if (fs.existsSync(rootFile)) {
            log.notice('开始执行自定义模板');
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
            const options = {
              templateInfo: this.templateInfo,
              projectInfo: this.projectInfo,
              sourcePath: templatePath,
              targetPath: process.cwd(),
            }
            const code = `require('${rootFile}')(${JSON.stringify(options)})`;
            log.verbose('code', code);
            await execAsync('node', ['-e', code], { stdio: 'inherit', cwd: process.cwd() });
            log.success('自定义模板安装成功');
          } else {
            throw new Error('自定义模板入口文件不存在！');
          }
        }
    }
    async downloadTemplate() {
        //下载前准备工作------------
        // 1. 通过项目模板API获取项目信息
        // 1.1 通过egg.js 搭建一套后台系统
        // 1.2 通过npm存储项目模板
        // 1.3 将项目模板信息存储到mongodb数据库中
        // 1.4 通过egg.js 获取mongodb中的数据并且通过API返回
        // ---------------------------------------------

        const { projectTemplate } = this.projectInfo;
        this.templateInfo = this.template.find(item => item.npmName === projectTemplate);        
        const storeDir = path.resolve(userHome, '.ohh-cli', 'template');
        const targetPath = path.resolve(userHome, '.ohh-cli', 'template', 'node_modules');
        const {npmName, version} = this.templateInfo;
        const templateNpm = new Package({
            packageName: npmName,
            packageVersion: version,
            storeDir,
            targetPath
        })
        log.verbose('templateNpm',templateNpm)
        if(! await templateNpm.exists()){
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templateNpm.install();
            } catch (error) {
                throw error
            } finally {
                spinner.stop(true);
                if(await templateNpm.exists()) {
                    log.success('模板下载成功');
                    this.templateNpm = templateNpm
                }
            }
        }else{
            const spinner = spinnerStart('正在更新模板...');
            await sleep();
            try {
                await templateNpm.update();
            } catch(error) {
                throw error;
            } finally {
                spinner.stop(true);
                if(await templateNpm.exists()) {
                    log.success('模板更新成功');
                    
                    this.templateNpm = templateNpm
                }
            };
        };
    }
    async perpare() {
        // 1. 模板是否存在
        const template = await getProjectTemplate()
        if (!template || template.length === 0) {
            throw new Error( '项目模板不存在');
        }
        this.template = template
        // 2.当前目录是否为空
        const loaclPath = process.cwd();
        if (!this.isDirEmpty(loaclPath)) {
            let ifContinue = false;
            if (!this.force) {
                const  o  = await inquirer.prompt(
                    {
                        type: 'confirm',
                        name: 'ifContinue',
                        default: false,
                        message: '当前文件不为空，是否创建项目？'
                    }
                );
                ifContinue = o.ifContinue;
                if (!ifContinue) {
                    return;
                }
            }
            // 2. 是否强制更新
            if (ifContinue || this.force) {
                // 二次确认是否情况文件夹
                const { confirmDelete } = await inquirer.prompt(
                    {
                        type: 'confirm',
                        name: 'confirmDelete',
                        default: false,
                        message: '是否清空当前目录下的文件？'
                    }
                )
                if (confirmDelete) {
                    // 清空当前文件
                    fse.emptyDirSync(loaclPath);
                }
            };
        };
        // 选择创建项目或组建
        // 获取项目基本信息 return object
        return await this.getProjectInfo();
    }
    isDirEmpty(loaclPath) {
        const fsList = fs.readdirSync(loaclPath)
        // 过滤文件逻辑，后续有需要过滤的文件类型可以添加进去。
        const fileFsList = fsList.filter((file) => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ));
        return !fileFsList || fileFsList.length <= 0;
    }
    async getProjectInfo() {
        function isValidName(v) {
            // 1. 首字符必须是英文字符
            // 2. 尾字符必须是英文字符或者数字，不能为字符
            // 3. 字符只能是"_-"
            // 合法：a a1 a_b a-b a_b_c a-b-c a-b1 a-b1-c1 a1-b1-c1 
            // 不合法：a_ a- a-1 a_1 1
            // const r = /^[a-zA-Z]([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/            
            return /^[a-zA-Z]([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
        };
        let projectInfo = {};
        let isProjectNameVaild = false;
        if(isValidName(this.projectName)) {
            isProjectNameVaild = true;
            projectInfo.projectName = this.projectName; 
        }
        // 创建项目或组件
        const  { type }  = await inquirer.prompt(
            {
                type: 'list',
                name: 'type' ,
                message: '请选择初始化类型',
                default: TYPE_PROJECT,
                choices:[
                    {
                        value: TYPE_PROJECT,
                         name: '项目',
                    },
                    {
                        value:TYPE_COMPONENT, 
                        name: '组建',
                    }
                ] 
            },
        )
        log.verbose('type', type)
        const title = type === TYPE_PROJECT ? '项目' : '组件';
        this.template = this.template.filter( template => template.tag.includes(type));
        const projectNamePrompt = {
            type:'input',
            name:'projectName',
            message:`请输入${title}名称`,
            default:'',
            validate: function (v) {
                const done = this.async();
                setTimeout(()=>{
                    if(! isValidName (v) ){
                        done(`请输入合法${title}名称`)
                        return
                    }
                    done(null, true);
                },0)

            },
            filter:(v) => {
                return v
            }
        }
        let projectPrompt = [];
        if(!isProjectNameVaild) {
            projectPrompt.push(projectNamePrompt)
        }
        projectPrompt.push(
            {
                type: 'input',
                name: 'projectVersion',
                message: `请输入${title}版本号`,
                default: '1.0.0',
                validate:function (v) {
                    const done = this.async()
                    setTimeout(()=>{
                        if(!(!!semver.valid(v))){
                            done(`请输入合法${title}版本号`)
                            return 
                        }
                        done(null, true);
                    },0)
                },
                filter:(v) => {
                    if(!!semver.valid(v)){
                        return semver.valid(v)
                    }else{
                        return v
                    }
                }
            },
            {
                type: 'list',
                name: 'projectTemplate',
                message: `请选择${title}模板`,
                choices: this.createTemplateChoice(),
            }
        )
        // 项目
        if (type === TYPE_PROJECT) {
            const project = await inquirer.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...project,
            }
        // 组件
        }else if (type === TYPE_COMPONENT) {
            const descriptionPrompt = {
                type:'input',
                name:'componentDescription',
                message: '请输入组件描述信息',
                default:'',
                validate: function (v) {
                    const done = this.async();
                    setTimeout(() => {
                        if(!v) {
                            done('请输入组件描述信息')
                            return
                        }
                        done(null, true);
                    },0)
                }
            }
            projectPrompt.push(descriptionPrompt);
            const project = await inquirer.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...project,
            } 
        };
        //驼峰“userName转化成“user-name”形式
        if (projectInfo.projectName) {
            projectInfo.name = projectInfo.projectName;
            projectInfo.className = kebabCase(projectInfo.projectName).replace(/^-/, '');
        }
        if(projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion;
        }
        if(projectInfo.componentDescription){
            projectInfo.description = projectInfo.componentDescription;
        }
        return projectInfo;
    }
    createTemplateChoice() {
        return this.template.map( item =>(
            {
            name : item.name,
            value : item.npmName
            }
        ))
    }
}
function init(argv) {
    return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand;