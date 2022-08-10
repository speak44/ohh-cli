'use strict';
const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const Command = require('@ohh-cli/command');
const log = require('@ohh-cli/log');
const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

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
                this.downloadTemplate()
            // 3. 安装模板     
            }
        } catch (error) {
            log.error(error);
        }

}
    downloadTemplate() {
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find(item => item.npmName === projectTemplate);
        console.log(templateInfo);
        // 1. 通过项目模板API获取项目信息
        // 1.1 通过egg.js 搭建一套后台系统
        // 1.2 通过npm存储项目模板
        // 1.3 将项目模板信息存储到mongodb数据库中
        // 1.4 通过egg.js 获取mongodb中的数据并且通过API返回

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
        let projectInfo = {};
        // const  project = {}
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
        if (type === TYPE_PROJECT) {
            const project = await inquirer.prompt([
            {
                type:'input',
                name:'projectName',
                message: '请输入项目名称',
                default:'',
                validate: function (v) {
                    // 1. 首字符必须是英文字符
                    // 2. 尾字符必须是英文字符或者数字，不能为字符
                    // 3. 字符只能是"_-"
                    // 合法：a a1 a_b a-b a_b_c a-b-c a-b1 a-b1-c1 a1-b1-c1 
                    // 不合法：a_ a- a-1 a_1 1
                    const r = /^[a-zA-Z]([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/
                    const done = this.async();
                    setTimeout(()=>{
                        if(! r.test (v) ){
                            done('请输入合法项目名称')
                            return
                        }
                        done(null, true);
                    },0)

                },
                filter:(v) => {
                    return v
                }
            },
            {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate:function (v) {
                    const done = this.async()
                    setTimeout(()=>{
                        if(!(!!semver.valid(v))){
                            done('请输入合法项目版本号')
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
                message: '请选择项目模板',
                choices: this.createTemplateChoice(),
            }
        ])

        return projectInfo = {
            type,
            ...project
        }
        }else if (type === TYPE_COMPONENT) {

        };

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