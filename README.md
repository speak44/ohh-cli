# ohh-cli
### 介绍
ohh-cli脚手架开发框架，是企业效率前端团队打造的**前端工程化体系**，减少团队开发成本，快速接入业务。

### 特性

- 集成社区中的优质工具，提供流畅的开发体验
- 支持通过插件进行扩展、灵活组合
- 支持通过预设配置封装最佳实践，开箱即用


### 模版、组建的配置数据结构
- 数据结构需要配合后端设置，自行测试可以启动本地mongodb
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
