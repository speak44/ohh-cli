'use strict';
const path = require('path');
console.log(1);
function formatPath(p) {
    if (p && typeof(p) === "string") {
        const sep = path.sep;
        if (sep === '/') {
            return p;
        } else {
            return p.replace(/\\/g, '/');
        }
    }    
}
module.exports = formatPath;