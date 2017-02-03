"use strict";

var Request = require('request');

module.exports = class VsoClient {

    constructor(host, user, password) {
        let token = new Buffer(`${user}:${password}`).toString('base64');
        this._host = host;
        this._authorizationHeader = `Basic ${token}`;
    };

    _vsoGetJson(url, accessor) {
        let acc = accessor || (body => body.value);
        return new Promise((resolve, reject) => {
            Request({
                uri: url,
                method: 'GET', 
                json: true,
                headers: {
                     'Authorization': this._authorizationHeader,
                     'Accept': 'application/json'
                }},
                (error, response, body) => { resolve(acc(body)); });
        });
    };

    _vsoPostJson(url, data, accessor) {
        let acc = accessor || (body => body.value);
        return new Promise((resolve, reject) => {
            Request({
                uri: url,
                method: 'POST', 
                body: data,
                json: true,
                headers: {
                     'Authorization': this._authorizationHeader,
                     'Accept': 'application/json'
                }},
                (error, response, body) => { 
                    if (body.value) {
                        resolve(acc(body));
                    }
                    else {
                        console.log("FAILED REQUEST ", url);
                        resolve([]);
                    }});
        });
    };

    getRepositories() {
        return this._vsoGetJson(this._host + '/DefaultCollection/_apis/git/repositories'); 
    };

    getCommits(repoUrl, period) { 
        return this._vsoGetJson(`${repoUrl}/commits?fromDate=${period.from}&toDate=${period.to}`);
    };

    getCommitsByBranch(repoUrl, period, branch) { 

        let requestBody = { 
          itemVersion:{
            versionType: 'branch',
            version: branch},
          fromDate: period.from,
          toDate: period.to};

        return this._vsoPostJson(`${repoUrl}/commitsBatch?api-version=1.0`, requestBody);
    };
}


// example get workitems related to commit
// https://pacificmags.visualstudio.com/87fc88eb-6495-4752-8031-cb450fbc3a55/_apis/git/repositories/920fa32f-4c41-4cbd-941c-f318e3d65004/pullRequests/2692/workitems

