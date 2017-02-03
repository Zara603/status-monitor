"use strict";

var Request = require('request');
var JenkinsClient = require('./JenkinsClient');
var OwBuildDataSource = require('./OwBuildDataSource');

var FS = require('fs');
var jenkinsClient = new JenkinsClient('http://j2.digitalent-labs.link/');
var buildDataSource = new OwBuildDataSource(jenkinsClient);
var report = require('./HtmlReport');

var getVersionTxt = (env) => {
    return new Promise((resolve, reject) => {
        Request({
                uri: env.siteUrl + '/diagnostics/version.txt',
                method: 'GET', 
                headers: { 'Accept': 'text/plain' },
                timeout: 2000
            },
            (error, response, body) => { resolve({
                name: env.name,
                status: (response ? response.statusCode : '?'),
                details: (response && response.statusCode == 200) ? body : null});
            });
    });
};

var environments = [
    {
        name: "Dev",
        code: "Dev",
        siteUrl: "http://ow-dev.digitalent-labs.link",
        backofficeUrl: "http://ow-dev.digitalent-labs.link/umbraco",
        current: null,
        deploys: null,
    },
    {
        name: "Tests",
        code: "Tests",
        siteUrl: "http://ow-tests.digitalent-labs.link",
        backofficeUrl: "http://ow-tests.digitalent-labs.link/umbraco",
        current: null,
        deploys: null,
    },
    {
        name: "Staging",
        code: "USStaging",
        siteUrl: "http://ow-usstaging.digitalent-labs.link",
        backofficeUrl: "http://ow-usstaging.digitalent-labs.link.digitalent-labs.link/umbraco",
        current: null,
        deploys: null,
    },
    {
        name: "UAT",
        code: "UAT",
        siteUrl: "http://ow-uat.digitalent-labs.link",
        backofficeUrl: "http://ow-uat.digitalent-labs.link/umbraco",
        current: null,
        deploys: null,
    },
    {
        name: "Prod",
        code: "USProd",
        siteUrl: "http://ow-usprod.digitalent-labs.link",
        backofficeUrl: "http://ow-usprod.digitalent-labs.link/umbraco",
        current: null,
        deploys: null,
    }
];

//environments = [environments[0]];

var versions = Promise.all(environments.map(env => getVersionTxt(env)))
    .then(versions => Promise.resolve(versions));

Promise.all([versions,buildDataSource.getDeploys()])
    .then(data => {
        console.log(data);
        let versionData = data[0];
        let deployData = data[1].builds.filter(d => !!d);
        versionData.forEach(v => {   
            v.detailsHtml = v.details ? v.details.replace(new RegExp('\n', 'g'), '<br/>').replace(new RegExp("([0-9a-f]{8})[0-9a-f]{32}"), '$1...'): "?";
        });
        deployData.forEach(d => {
            d.timeString = d.time.format('MMM DD HH:mm');
            d.result = d.result || "in-progress";
        });
        environments.forEach(env => {
           env.deploys = deployData.filter(b => b && b.environment == env.code).sort((a,b) => b.buildNumber - a.buildNumber);
           env.current = versionData.filter(v => v.name == env.name)[0];
        });
        console.log(environments);
        
        FS.writeFileSync('Status.json', JSON.stringify(environments), 'utf8');
        let environmentsHtml = report(environments);        
        FS.writeFileSync('Status.html', environmentsHtml, 'utf8');
    });
