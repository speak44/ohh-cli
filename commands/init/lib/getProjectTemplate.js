const request = require('@ohh-cli/request');

module.exports = function(){
  return request({
    url:'project/template'
  })
}