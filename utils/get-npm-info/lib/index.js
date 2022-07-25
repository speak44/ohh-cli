'use strict';
console.log(1);
const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');
function getNpmInfo(npmName, registry) {
    if (!npmName) return;
    
    const registryUrl = registry || defaultRegistry();
    const npmInfoUrl = urlJoin(registryUrl, npmName);
    // console.log(npmInfoUrl);
    return axios.get(npmInfoUrl).then(response => {
        if (response.status === 200) {
            return response.data;
        }
        // return  null;
    }).catch(error => {
        return Promise.reject(error)
    })

};

function defaultRegistry(isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
};

async function getNpmVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry);
    if (data) {
        return Object.keys(data.versions);
    } else {
        return [];
    }
};
// 获取高于当前版本号的所有版本
function getSemverVersions(baseVersion, versions) {
    return versions
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
        .sort((a, b) => {
            if (!semver.gt(b, a)) {
                return -1
            } else if (semver.gt(b, a)) {
                return 1
            } else {
                return 0
            }
        });
};

async function getNpmSemverVersions({ baseVersion, npmName, registry }) {
    const versions = await getNpmVersions(npmName, registry);
    const newVersions = getSemverVersions(baseVersion, versions);
    if (newVersions && newVersions.length > 0) {
        return newVersions[0];
    }
};

async function getNpmLatestVersion(npmName, registry){
    const versions = await getNpmVersions(npmName, registry);
    if (versions && versions.length>0) {
        return versions.sort((a, b) => {
            if (!semver.gt(b, a)) {
                return -1
            } else if (semver.gt(b, a)) {
                return 1
            } else {
                return 0
            }
        })[0];
    }
    return null;
}
module.exports = {
    getNpmSemverVersions,
    defaultRegistry,
    getNpmLatestVersion
};