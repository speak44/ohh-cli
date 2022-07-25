'use strict';

function init(projectNmame, cmdObj) {
    console.log(projectNmame,'cmdObj');
    console.log('init', projectNmame, cmdObj.force, process.env.CLI_TARGET_PATH);
}
module.exports = init;