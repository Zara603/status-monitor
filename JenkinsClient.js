"use strict";

var Request = require('request');

module.exports = class JenkinsClient {

    constructor(host) {
        this._host = host;
    };

    _jenkinsGetJson(url, accessor) {
        let acc = accessor || (body => body);
        return new Promise((resolve, reject) => {
            Request({
                    uri: url,
                    method: 'GET', 
                    json: true,
                    headers: { 'Accept': 'application/json' }
                },
                (error, response, body) => { resolve(acc(body)); });
        });
    };

    getJobs() {
        var url = this._host + 'api/json';
        return this._jenkinsGetJson(url, body => body.jobs); 
    };

    getBuilds(job) { 
        var url = job.url + 'api/json';
        return this._jenkinsGetJson(url, body => body.builds);
    };

    getBuildDetail(build) { 
        var url = build.url + 'api/json';
        return this._jenkinsGetJson(url);
    };
}