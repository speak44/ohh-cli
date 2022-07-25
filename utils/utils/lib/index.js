'use strict';
console.log(1);
function isObject(o) {
    return Object.prototype.toString.call(o) === "[object Object]";
}
module.exports = {
    isObject
};