'use strict'

var FS = require('fs');
var Handlebars = require('handlebars');
require('handlebars-intl').registerWith(Handlebars);

function toHtml(templateName, data) {
    var templateString = FS.readFileSync(`views/${templateName}.hbs`, 'utf-8'); 
    var template = Handlebars.compile(templateString);
    return template(data);
}

module.exports = function(data)
{
    return toHtml('page', data);
};