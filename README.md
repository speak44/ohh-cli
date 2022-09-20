# ohh-cli
### 介绍
ohh-cli脚手架开发框架，是一款**前端工程化体系**，减少团队开发成本，快速接入业务。
- 通用的研发脚手架
    - 解决项目/组件时，存在大量重复代码拷贝，快速复用已有沉淀
- 通用的模板组件创建能力
    - 模板支持定制，定制后能够发布生效
    - 模板支持快速接入，极低的接入成本

### 后期展望
本框架目前还处于公司内部使用阶段，对外还处于测试阶段，对应的源码已经发布在git上，可供参考和学习；
-  一期实现 (完成)
  - 统一集团项目初始化
  - 项目模板和组件模板的定制化
  - 项目可自定义init包
- 二期实现 （未实现）
  - 发布过程自动完成标准的git操作
  - 发布成功后自动删除开发分支并创建tag
  - 发布后自动完成云构建、CDN、域名绑定
  - 发布过程支持测试、正式两种模式

### 特性

- 集成社区中的优质工具，提供流畅的开发体验
- 支持通过插件进行扩展、灵活组合
- 支持通过预设配置封装最佳实践，开箱即用

### 目录结构描述
```
├── commands                  // 命令
│   ├── init                  // 项目创建模块
├── core
│   ├── cli                  // cli初始化，执行准备
│   ├── exec                  // 注册命令
├── models
│   ├── command
│   ├── package
├── utils
│   ├── format-path
│   ├── get-npm-info
│   ├── log
│   ├── request
│   ├── utils
└── package.json
```
### 执行命令
```
Usage: ohh-cli <command> [option]

Options:
  -V, --version                   output the version number
  -d, --debug                     是否开启调试模式 (default: false)
  -tp, --targetPath <targetPath>  是否指定本地调试文件路径 (default: " ")
  -h, --help                      display help for command

Commands:
  init [options] [projectName]
  help [command]                  display help for command
```


### 初始化项目、组建的配置数据结构
> 数据结构需要配合后端设置，自行测试可以启动本地mongodb
```
const json =[
  {
  "name": "vue2标准模板",
  "npmName": "ohh-cli-template-vue2",
  "version": "1.0.0",
  "type": "normal",
  "installCommand": "npm install",
  "startCommand": "npm run serve",
  "tag": [
      "project"
  ],
  "ignore": [
    "**/public/**"
  ]
  }
]
```

### 测试环境（本地调试）
- 命令执行
```
ohh-cli init project-test --targetPath /Users/ohh/Desktop/ohh-cli/ohh-cli/commands/init
```

 - 启动mogodb
 ```
 mongod --dbpath=/Users/ohh/data/db
 ```

 - 设置通用模板 JSON
```
const json =[
  {
  "name": "vue2标准模板",
  "npmName": "ohh-cli-template-vue2",
  "version": "1.0.0",
  "type": "normal",
  "installCommand": "npm install",
  "startCommand": "npm run serve",
  "tag": [
      "project"
  ],
  "ignore": [
    "**/public/**"
  ]
  }
]
```