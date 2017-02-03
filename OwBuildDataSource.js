"use strict";

var Moment = require('moment');

module.exports = class OwBuildDataSource {

    constructor(client) {
        this._client = client;
    };
    
    _extractBuildData(buildData) {
        try {
            let params = buildData.actions.filter(x => x._class == "hudson.model.ParametersAction")[0].parameters;
            let deployedNumber = params.filter(x => x.name == "BUILD_TO_DEPLOY")[0].number;
            let deployedEnv = params.filter(x => x.name == "ENVIRONMENT")[0].value;
            let branch = buildData.displayName.match(/\((.*)\)/)[1];
            return { 
                buildNumber: buildData.number,
                time: Moment.unix(Math.floor(buildData.timestamp/1000)),
                result: buildData.result,
                culprits: buildData.culprits.map(c => c.fullName),
                deployed: deployedNumber,
                environment: deployedEnv || "none",
                branch: branch,
                link: buildData.url
            };
        }
        catch (err)
        {
            console.log(err);
        }
    }

    _sortByBuildNumber(a,b) {
        return (a .buildNumber < b.buildNumber)
            ? -1
            : (a .buildNumber == b.buildNumber)
                ? 0
                : 1;
    }

    _extractJobData(job, buildData) {
        let builds = buildData.map(x => this._extractBuildData(x));
        builds.sort((a,b) => this._sortByBuildNumber(a, b));
        return { 
            name: job.name,
            builds: builds
        };
    }

    _getJobData(job) {
        return this._client.getBuilds(job)
            .then(builds => {
                return Promise.all(builds.map(build => this._client.getBuildDetail(build)));
            })
            .then(buildData => {
                return Promise.resolve(this._extractJobData(job, buildData.filter(bd => bd)));
            });
    }

    getDeploys() {
        return this._getJobData({name: "OW Deploys", url: "http://j2.digitalent-labs.link/job/Oscar%20Winter/job/Deploy/"});
    }
}