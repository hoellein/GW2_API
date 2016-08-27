/**
    Copyright 2016 DON HOELLEIN - All rights reserved
*/


'use strict';

//var wbEvents = require('./WBevents');

//var wbEvents2 = require('./WBevents2');
///var wbInfo = require('./WBinfo');
//var maguumaEvents = require('./MaguumaEvents');
//var tzInfo = require('./timezoneInfo');

console.log('before requires');

var storage = require('./storage');
console.log('require 1');
var rp = require('request-promise');
console.log('require 2');
var ENDPOINT = 'https://api.guildwars2.com/v2/';  //achievements/daily

var moment = require('moment-timezone');

console.log('require 3');

var APP_ID = "amzn1.echo-sdk-ams.app.b6bf7422-2bde-400c-ac0a-a305aca7e430";


var Alexa = require('alexa-app');
console.log('require 4');
var http = require('http');
var https = require('https');

console.log('require 5');

var app = new Alexa.app("gw2-api");

//var gw2_dataHelper = require('./gw2_data_helper');
//var gw2_dataHelper = new GW2_DataHelper();

module.change_code=1;

// set up pre function always called before the intent code
app.pre = function(req,res,type) {
    if (req.sessionDetails.application.applicationId != APP_ID) {
        // Fail ungracefully
        response.fail("Invalid applicationId");
    }
    //else {
    //    console.log("Pre: increment");
    //    storage.incrementInvocations (req.userId, req.applicationId);
    //}
};

app.intent('GetDailiesToday', {
    'utterances':   ['{todays dailies']
    },
    function (req, res) {
        console.log("GetDailiesToday");

        /*-------------------------
        getDailiesToday().then(
            function (response) {
                console.log('success - received today\'s dailies');
                console.log(response);
                
            })
        .catch(function(error) {
            console.log(error);
        });
        ------------------*/

        var apiResp = null;
        makeGW2APIRequest('achievements/daily', null, function (err, apiResp){
            //console.log(apiResp);
            if(err) {
                console.log("ERROR");
                console.log(err);
                res.say("Error from API call");
                res.send();
            }
            else {
                //res.say("got a response from the API");
                console.log(apiResp);
                var pve = apiResp.pve;
                //console.log(pve);
                var ids = '';
                for(var ii=0; ii<pve.length; ii+=1) {
                    if(ii>0) ids+=',';
                    ids += pve[ii].id;
                }
                console.log(ids);
                makeGW2APIRequest('achievements', ids, function(err, apiResp2) {
                    if(err) {
                        console.log(err);
                        res.say("error from API call for ids");
                        res.send();
                    }
                    else {
                        console.log(apiResp2);
                        var names = '';
                        var namesCard = '';
                        for(var jj=0; jj<apiResp2.length; jj+=1) {
                            if(jj>0) names+=', ';
                            names += apiResp2[jj].name;
                            namesCard += apiResp2[jj].name + "\n";
                            
                        }
                        var speech = "Today's PVE dailies are " + names + ".";
                        res.say(speech);

                        var cardTitle = "Today's GW2 PvE Daily Achievements";

                        res.card({
                            type: 'Simple',
                            title: cardTitle,
                            content: namesCard
                        });
                        res.send();
                    }
                });
                
            }


        });

        if (apiResp == null) {
            console.log("apiResp null");
            //res.send();
        }
        else {
            console.log('apiResp non-null');
            console.log (apiResp);
            //res.send();
        }

        //var today = requestDailiesToday();
        //console.log("Today: ");
        //console.log(today);

        // IMPORTANT: this intent exits before the db call has completed
        // so must return false to prevent premature response before the asynch call has returned      
        return false;
        
    }
    );

app.intent('GetDailiesTomorrow', {
    'utterances':   ['{tomorrows dailies']
    },
    function (req, res) {
        console.log("GetDailiesTomorrow");

        var apiResp = null;
        makeGW2APIRequest('achievements/daily/tomorrow', null, function (err, apiResp){
            //console.log(apiResp);
            if(err) {
                console.log("ERROR");
                console.log(err);
                res.say("Error from API call");
                res.send();
            }
            else {
                //res.say("got a response from the API");
                console.log(apiResp);
                var pve = apiResp.pve;
                //console.log(pve);
                var ids = '';
                for(var ii=0; ii<pve.length; ii+=1) {
                    if(ii>0) ids+=',';
                    ids += pve[ii].id;
                }
                console.log(ids);
                makeGW2APIRequest('achievements', ids, function(err, apiResp2) {
                    if(err) {
                        console.log(err);
                        res.say("error from API call for ids");
                        res.send();
                    }
                    else {
                        console.log(apiResp2);
                        var names = '';
                        var namesCard = '';
                        for(var jj=0; jj<apiResp2.length; jj+=1) {
                            if(jj>0) names+=', ';
                            names += apiResp2[jj].name;
                            namesCard += apiResp2[jj].name + "\n";
                        }
                        var speech = "Tomorrow's PVE dailies are " + names + ".";
                        res.say(speech);

                        var cardTitle = "Tomorrow's GW2 PvE Daily Achievements (after Server reset)";

                        res.card({
                            type: 'Simple',
                            title: cardTitle,
                            content: namesCard
                        });
                        res.send();
                    }
                });
                
            }


        });

        if (apiResp == null) {
            console.log("apiResp null");
            //res.send();
        }
        else {
            console.log('apiResp non-null');
            console.log (apiResp);
            //res.send();
        }

        //var today = requestDailiesToday();
        //console.log("Today: ");
        //console.log(today);

        // IMPORTANT: this intent exits before the db call has completed
        // so must return false to prevent premature response before the asynch call has returned      
        return false;
        
    }
    );

app.intent('SetTimezoneIntent', {
        'slots':    {
            'Timezone': 'LIST_OF_TIMEZONES'
        },
        'utterances':   ['{set|save} {|my|the} {timezone}', '{-|Timezone}']
    },
    function(req, res) {
        console.log("SetTimezoneIntent");
        
        // check if the slot is filled or if this is a partial intent
        var tz;
        try {
            tz = req.slot("Timezone");
        } catch (e) {
            tz = null;
        }
        
        if (!tz) {
            // partial intent
            // didn't say a zone, so ask for it
            console.log("no timezone heard")
            res.shouldEndSession(false, "OK, tell me your time zone. You can say a US timezone such as Eastern or Hawaii, or Server, or don't save.")
        }
        else {
            console.log("timezone heard: " + tz);
            //res.session("timezone", tz);
            //res.say("Your time zone is " + tz);
            res.shouldEndSession(true);
            
            // find the timezone object in the array
            var tzObj = null;
            var found = false;
            
            for (var ii=0; ii<tzInfo.length; ii++) {
                tzObj = tzInfo[ii];
                // check against the aka list
                for (var jj=0; jj<tzObj.aka.length; jj++) {
                    if(tz == tzObj.aka[jj]) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            
            if (found) {
                // got a timezone object
                //console.log("found tz object");
                //console.log(tzObj);
                
                // timezone data object to store
                var tzData = {
                    optIn:  true,
                    timezone:   tzObj.tz,
                    displayName: tzObj.displayName
                };
                
                var ret = saveUserPrefs(req.userId, req.applicationId, tzData);
                
                //console.log("  after save");
                res.say("OK, your timezone for this skill, is " + tzObj.displayName);
                res.shouldEndSession(true, null);               
            }
            else {
                console.log("didn't find the timezone");
                if (tz == "don't save") {
                    res.say("OK, I won't save.");
                    res.shouldEndSession(true, null);
                }
                else {
                    res.say("I'm sorry, I didn't find that timezone.");
                    res.shouldEndSession(false, "Please say a US timezone, or server.");
                }
            }
        }
        
    }
    );


app.intent('GetTimezoneIntent', {
        
        'utterances':   ['{get|what\'s|what is} {|my|the} {timezone}']
    },
    function(req, res) {
        console.log("GetTimezoneIntent");
        
        var speech = null;
        
        storage.loadUserPrefsData(req.userId, req.applicationId)
            .then(function (prefs) {
                console.log("GetTimezoneIntent.loadPrefs " + prefs.timezonePref.timezone);        
                
                speech = "Your timezone for this skill, is " + prefs.timezonePref.displayName;
                res.say(speech);
                res.send();
            }).catch(function (error) {
            speech = "You haven't saved a timezone. If you want times in your timezone, say Set my timezone."
            res.shouldEndSession(false, "Please say Set my timezone, or stop.")
            res.say(speech);
            res.send();
            console.log(error);
        });
        
        // IMPORTANT: this intent exits before the db call has completed
        // so must return false to prevent premature response before the asynch call has returned      
        return false;

    }
);


app.intent("AMAZON.HelpIntent", {}, function(req, res ) {
    var speechText = "This is Magee's API for Guild Wars 2. You can ask a question like, what are the dailies. You can also say Set my timezone.  ... Now, what can I help you with?";
    res.say(speechText);
    res.shouldEndSession (false, "For instructions on what you can say, just say help me.");
        
    }
);

app.intent("AMAZON.CancelIntent", {}, function (req, res) {
    res.say("OK, goodbye");
});

app.intent("AMAZON.StopIntent", {}, function (req, res) {
    res.say("OK, goodbye");
});

app.launch(function(req,res) {
    var speechText = "Welcome to Magee's World Info for Guild Wars 2. You can ask a question like, what is the next boss, when is The Shatterer, or where is Megadestroyer. ... Now, what can I help you with?";
    res.say(speechText);
    res.shouldEndSession (false, "For instructions on what you can say, just say help me.");
    
});

app.sessionEnded(function(req, res) {
    // Clean up the user's server-side stuff, if necessary
    logout(req.userId );
    // No response necessary
});

//----------------------------------------------------------
function convertTime (baseTime) {
    // convert the base time from UTC to local using the local timezone
    
    var base = moment(baseTime, "HH:mm");
    console.log("convert: " + base.toString());
    // temp just convert to Eastern time
    //var base = baseTime.split(":");
    //var localHr = base[0] - 4;
    //console.log("local: " + localHr.toString());
    //return (localHr.toString() + ":" + base[1]);
    
    return base.subtract(5, "hours").format("h:mm A");
}

function convertTime (baseTime, tz) {
    // convert the base time from UTC to local using the local timezone
    //console.log(baseTime);
    var base = moment.tz(baseTime, "HH:mm", "Etc/UTC");  //.format("HH:mm");
    //console.log("convert: " + base.toString() +  tz);
    
    // now convert the UTC time to the preferred local timezone
    var converted = moment.tz(base, tz).format("h:mm A");
    console.log("converted: " + base.toString() + " to " + converted + " " + tz);
    
    return converted;
}

function getBoss(name) {
    var found = false;
    var boss = null;
    //console.log(" getBoss: " + name);
    for (var ii=0; ii<wbInfo.length; ii+=1) {
        boss = wbInfo[ii];
        for (var jj=0; jj<boss.aka.length; jj+=1) {
            //console.log(boss.aka[jj]);
            if (name === boss.aka[jj]) {
                //console.log(boss);
                found = true;
                break;
            }
        }
        if (found) break;
        
    }
    console.log("found " + boss.bossId);
    // should check for not found
    if (!found)
        boss = null;
    
    return boss; 
}

function getBossId (heardName) {
    var found = false;
    var boss = null;
    for (var ii=0; ii<wbInfo.length; ii+=1) {
        boss = wbInfo[ii];
        for (var jj=0; jj<boss.aka.length; jj+=11) {
            if (heardName === boss.aka[jj]) {
                found = true;
                break;
            }
        }
        if (found) break;
    }
    console.log("getBossId found: " + boss.bossId);
    return boss.bossId;
}



var saveUserPrefs = function (userId, appId, tzData){
    console.log("saveUserPrefs");
    //console.log(tzData);
    
    storage.saveUserPrefsData(userId, appId, tzData)
        .then(function(result) {
            console.log("  saved");
            //console.log(result);
            return result;
        }).catch(function(error) {
            console.log(error);
        });
};

var loadUserPrefs = function(userId, appId) {
    storage.loadUserPrefsData(userId, appId)
        .then(function(result) {
            console.log("load result");
            console.log(result);
            if (!result) console.log("No user prefs in db for " + userId);
            return result;
        }).catch(function (error) {
            console.log(error);
        });
};

var scan = function () {
    console.log("in scan");
    storage.scan()
        .then(function(result) {
            console.log(result);
        });
};

var remove = function (userId, appId) {
    console.log("in remove");
    storage.remove(userId, appId)
        .then(function(result) {
            console.log(result);
        }).catch(function(error) {
            console.log(error);
        });
};

var loadAndFindNext = function(userId, appId, nextEvt) {
    
        
};

var requestDailiesToday = function() {
        return getDailiesToday().then(
            function (response) {
                console.log('success - received today\'s dailies');
                console.log(response);
                return response.body;
            }
        )
        };

var getDailiesToday = function () {
    console.log("getDailiesToday"); 

    var options = {
        method: 'GET',
        uri: ENDPOINT + 'achievements/daily',
        resolveWithFullResponse: true,
        json: true
    };

    console.log(options);
    
    var res = rp(options)
        .then ( function(resp) {
            console.log(resp);
        }).catch(function(error) {
            console.log("ERROR");
            console.log(error);
        });
    
};

//-----------------------------------
function makeGW2APIRequest(api, data, apiResponseCallback) {

    //var ENDPOINT = 'https://api.guildwars2.com/v2/';
    var endpointAPI = ENDPOINT + api;
    if(data)
        endpointAPI += '?ids=' + data;

    console.log("makeGW2APIRequest: " + endpointAPI);

    https.get(endpointAPI, function (res) {
        var apiResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            console.log("returned error");
            apiResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            console.log("returned, in onData");
            apiResponseString += data;
        });

        res.on('end', function () {
            var apiResponseObject = JSON.parse(apiResponseString);

            if (apiResponseObject.error) {
                console.log("GW2 API error: " + apiResponseObject.error.message);
                apiResponseCallback(new Error(apiResponseObject.error.message));
            } else {
                // do something with the response object
                console.log("returned success");
                apiResponseCallback(null, apiResponseObject);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        apiResponseCallback(new Error(e.message));
    });
}


module.exports = app;
