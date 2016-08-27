/**
    Copyright 2016 DON HOELLEIN - All rights reserved
*/


'use strict';
module.change_code = 1;

var _ = require('lodash');
var moment = require('moment-timezone');

var USERPREFSTABLE = "UserPrefsData";
//var AWS = require("aws-sdk");
var dynasty = require("dynasty")({});

//var localUrl = "http://localhost:8000";
//var localCredentials = {
//    region: "us-west-2",
//    accessKeyId: 'fake',
//    secretAccessKey: 'fake'
//}
//var localDynasty = require('dynasty')(localCredentials, localUrl);
//var dynasty = localDynasty;

var userPrefsTable = function() {
    //console.log("  calling userPrefsTable");
    var tbl = dynasty.table(USERPREFSTABLE);
    //console.log(tbl);
    return tbl;
};


/*------
AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000",
  accessKeyId: 'fake',
  secretAccessKey: 'fake'
});
--------*/

var storage = (function () {
    //var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The UserPrefs class stores info for a user id 
     */
    function UserPrefs(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                userId: "",
                appId: "",
                timezonePref:     {
                    optIn:          false,
                    timezone:     "Etc/UTC",
                    tzDisplayName:     "Universal Time (UTC)"
                },
                numberInvocations:  0,
                latestInvocation:   ""
            };
        }
        this._session = session;
    }

    UserPrefs.prototype = {

        /*---------
        isEmptyUserPrefs: function () {
            //check if invocations is non-zero
            
            return ((this.data.numberInvocations==0)?(true):(false));
        },
        save: function (callback) {
            //save the UserPrefs states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentUserPrefs = this.data;
            dynamodb.putItem({
                TableName: 'UserPrefsData',
                Item: {
                    UserId: {
                        S: this._session.user.userId
                    },
                    AppId: {
                        S:  this._session.user.appId
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
        -------*/
    };

    return {
        /*-------
        loadUserPrefs: function (session, callback) {
            if (session.attributes.currentUserPrefs) {
                console.log('get UserPrefs from session=' + session.attributes.currentUserPrefs);
                callback(new UserPrefs(session, session.attributes.currentUserPrefs));
                return;
            }
            else console.log('no session attributes found');
            
            console.log(session.userId);
            console.log(session.application.applicationId);
            dynamodb.getItem({
                TableName: 'UserPrefs',
                Key: {
                    userId: {
                        S: session.userId
                    },
                    appId:  {
                        S: session.application.applicationId
                    }
                }
            }, function (err, data) {
                var currentUserPrefs;
                if (err) {
                    console.log(err, err.stack);
                    currentUserPrefs = new UserPrefs(session);
                    session.attributes.currentUserPrefs = currentUserPrefs.data;
                    callback(currentUserPrefs);
                } else if (data.Item === undefined) {
                    currentUserPrefs = new UserPrefs(session);
                    session.attributes.currentUserPrefs = currentUserPrefs.data;
                    callback(currentUserPrefs);
                } else {
                    console.log('get UserPrefs from dynamodb=' + data.Item.Data.S);
                    currentUserPrefs = new UserPrefs(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentUserPrefs = currentUserPrefs.data;
                    callback(currentUserPrefs);
                }
            });
        },
        createUserPrefsTable: function (callback) {
            //console.log("create table 1");
            // TODO refactor to use dynasty
            var params = {
                TableName : "UserPrefs",
                KeySchema: [       
                    { AttributeName: "userId", KeyType: "HASH"},  //Partition key
                    { AttributeName: "appId", KeyType: "RANGE" }  //Sort key
                ],
                AttributeDefinitions: [       
                    { AttributeName: "userId", AttributeType: "S" },
                    { AttributeName: "appId", AttributeType: "S" }
                ],
                ProvisionedThroughput: {       
                    ReadCapacityUnits: 4, 
                    WriteCapacityUnits: 4
                }
                
            };

            //console.log("create table 2");
            dynamodb.createTable(params, function(err, data) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    
                    console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
                }
                if (callback) {
                    callback();
                }
            });
        },
        newUserPrefs: function (session) {
            return new UserPrefs(session);
        },
        ------*/
        saveUserPrefsData: function(userId, appId, tzData) {
            console.log("saveUserPrefsData");
            // get current time
            var now = moment.tz().format();

            var promise = userPrefsTable().update({ hash: appId, range: userId },
                    { 
                        timezonePref:       tzData,
                        latestInvocation:   now
                    })
                .catch(function (error) {
                    console.log(error);
                });
            //console.log(ret);
            return promise;
        },
        loadUserPrefsData: function (userId, appId) {
            console.log("loadUserPrefsData");
            //console.log (userId + " ** " + appId);
            var promise = userPrefsTable().find({ hash: appId, range: userId })
                .catch(function(error) {
                    console.log(error);
                });
            //console.log(promise);
            return promise;
        },
        
        incrementInvocations: function (userId, appId) {
            console.log("increment invocations");
            var now = moment.tz().format();
            var num=0;
            
            var promise = userPrefsTable().find (
                {
                    hash:   appId,
                    range:  userId
                }
            ).then (function (prefs) {
                console.log("increment: " + prefs.numberInvocations);
                
                if(prefs.numberInvocations >= 0) {
                    num = prefs.numberInvocations + 1;
                }
                else num = 0;
                //console.log('num: ' + num);
                userPrefsTable().update({ hash: appId, range: userId },
                    { 
                        numberInvocations:  num,
                        latestInvocation:   now
                    })
                    .then(function () {
                        console.log("update completed");
                    });
            })
            .catch(function(error) {
                console.log(error);
            });
        },
        
        createUserPrefsTable2:  function() {
            console.log('in createtable2');
            return dynasty.describe(USERPREFSTABLE)
                .catch(function(error) {
                    console.log('no table, creating');
                    return dynasty.create(USERPREFSTABLE, {
                        key_schema: {
                            hash: ['appId',
                            'appId']
                        }
                    });
                });
        },
        scan:   function() {
            console.log("SCAN");
            return userPrefsTable().scan()
            .catch(function(error) {
                console.log(error);
        });
        },
        remove:   function(userId, appId) {
            console.log("REMOVE");
            return userPrefsTable().remove(
                {
                    hash:   appId,
                    range:  userId
                }
            );
            //.catch(function(error) {
            //    console.log(error);
            //});
        }
    };
})();
module.exports = storage;
