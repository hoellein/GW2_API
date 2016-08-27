'use strict';

//var _ = require('lodash');

var rp = require('request-promise');
var ENDPOINT = 'https://api.guildwars2.com/v2/';  //achievements/daily



var gw2_datahelper = (function () {

    function GW2_DataHelper() {}

    GW2_DataHelper.prototype = {

    };
    return {
        requestDailiesToday = function() {
        return this.getDailiesToday().then(
            function (response) {
                console.log('success - received today\'s dailies');
                console.log(response);
                return response.body;
            }
        )
        },
        getDailiesToday = function () {
            var options = {
            method: 'GET',
            uri: ENDPOINT + 'achievements/daily',
            resolveWithFullResponse: true,
            json: true
        };
        return rp(options);
        }
    }
})();

module.exports = gw2_datahelper;