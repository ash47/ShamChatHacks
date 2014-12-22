var newHead = '<style>\
#mainContainer {\
    width:100%;\
    height:100%;\
    overflow: hidden;\
    position: absolute;\
    left: 0px;\
    top: 0px;\
}\
.sexyWindow {\
  height: 100%;\
  width: 100%;\
  overflow-y: scroll;\
  font-family: monospace;\
}\
\
#windowSelector {\
  position: absolute;\
  width: 340px;\
  right:32px;\
  top: 4px;\
  border: 1px solid #000;\
  background: #fff7ee;\
  padding:4px;\
}\
#msgLog {\
    height:100%;\
    width:100%;\
}\
\
#chat {\
  position: absolute;\
  right: 32px;\
  bottom: 4px;\
  border: 1px solid #000;\
  padding: 4px;\
}\
</style>';

var newRoot = '\
<div id="mainContainer">\
    <div id="msgLog"></div>\
    <div id="windowSelector"><b>Windows</b><br></div>\
    <div id="chat"></div>\
</div>';

var ourClient = null;
var topLevelServer = '.shamchat.com';
var server = 'bee2' + topLevelServer;
function heyItsMeTheIFrame(server, client) {
    ourClient = client;
}

// Load a client
$(document.body).grab(new Element("iframe", {
    src: "http://" + server + "/iframe.html",
    width: 0,
    height: 0,
    frameBorder: 0,
    style: "display:none;"
}));

// Ensure we have jquery
var jQuery = null;
function tryToLoad() {
    if(jQuery == null || ourClient == null) {
        setTimeout(tryToLoad, 100);
        return;
    }

    findServers();
}
tryToLoad();

// Include jquery
var s = document.createElement("script");
s.type="text/javascript";
s.src="http://code.jquery.com/jquery-1.11.2.min.js";
document.body.appendChild(s);

var sendCapcha;

function findServers() {
    offWithItsHeader(new ourClient.Request.JSON({
        url: getRequestURL(server, "/whatsup"),
        data: {
            id: this.clientID
        },
        onSuccess: function(data) {
            if (!data) {
                return
            }

            // Tell them which servers are there
            console.log('Found the following servers: ' + data.servers.join());

            // Grab an answer
            var answer
            while(!answer) {
                answer = prompt('Please select a server', data.servers[0]);
            }

            // Update the server
            server = answer + topLevelServer;

            // Load
            doit();
        },
        onFailure: function() {
            console.log('Failed to locate servers, I am a SAD PANDA!');
        }
    })).send()
}

function doit() {
    // Ensure no conflicts
    jQuery.noConflict();

    jQuery(document.documentElement).children().each(function() {
        jQuery(this).hide();
    });
    jQuery(document.documentElement).html(newRoot);
    jQuery('body').append(newHead);

    var chat = jQuery('#chat');
    chat.append(jQuery('<input>').attr('type','input').attr('id', 'chatClientID'));
    chat.append(jQuery('<input>').attr('type','input').attr('id', 'chatClientMSG').on('keydown', function(e) {
        if (e.which == 13) {
            var toSend = jQuery('#chatClientID').val();
            var msg = jQuery('#chatClientMSG').val();
            jQuery('#chatClientMSG').val('');

            if(msg != '') {
                sendMessage(toSend, msg);
            }
        }
    }));
    chat.append(jQuery('<input>').attr('type','submit').click(function() {
        var toSend = jQuery('#chatClientID').val();
        var msg = jQuery('#chatClientMSG').val();
        jQuery('#chatClientMSG').val('');

        if(msg != '') {
            sendMessage(toSend, msg);
        }
    }));

    var windows = {};
    function newWindow(name) {
        windows[name] = jQuery('<div class="sexyWindow">');

        var con = jQuery('<span>');

        var clicker = jQuery('<a>').attr('href','#').click(function() {
            selectWindow(name);
        }).text(name);

        if(name != 'main') {
            con.append(jQuery('<a>').attr('href','#').click(function() {
                con.remove();
            }).text('X'));
        }

        con.append(' ');

        jQuery('#windowSelector').append(con);
        con.append(clicker);
        con.append('<br>');

        if(name != 'main') {
            listenToChat(name);
        }
    }
    newWindow('main');
    log('Click someone to watch their conversation.<br>');

    function selectWindow(name) {
        if(!windows[name]) {
            newWindow(name);
        }

        jQuery('#msgLog').empty();
        jQuery('#msgLog').append(windows[name]);
    }
    selectWindow('main');

    // Tabs out names
    function sexyName(name) {
        if(name == null) name = '';

        return ' (<pre style="display:inline-block;width:100px;overflow:hidden;margin:0px;padding:0px;">' + name + '</pre>)';
    }

    // Closes a tab
    function closeTab(name) {
        if(windows[name]) {
            windows[name].dispose();
        }

        for(var key in listenToID) {
            if(listenToID[key] == name) {
                delete listenToID[key];
            }
        }
    }

    function log(msg, window) {
        if(!window) window = 'main';

        // Grab it
        var div = windows[window];

        if(!div) {
            console.log('Failed to find window: '+window);
            console.log(msg);
            return;
        }

        // Scroll detection
        var shouldScroll = false;
        if(div.scrollTop() + div.innerHeight() + 10 >= div.prop('scrollHeight')) {
            shouldScroll = true;
        }

        // Add message
        div.append(msg);

        // Scroll to the bottom:
        if(shouldScroll) {
            div.scrollTop(div.prop('scrollHeight'));
        }
    }

    sendCapcha = function(client) {
        // Ensure we have a client
        if(!ourClient) return;

        // Pack ans send message
        offWithItsHeader(new ourClient.Request({
            url: getRequestURL(server, "/recaptcha"),
            data: {
                id: client,
                challenge: 'lol',
                response: 'lol'
            }
        })).send();
    };

    sendPair = function(client) {
        // Ensure we have a client
        if(!ourClient) return;

        // Pack ans send message
        offWithItsHeader(new ourClient.Request({
            url: getRequestURL(server, "/pair"),
            data: {
                id: client
            }
        })).send();
    };

    function sendMessage(client, msg) {
        // Ensure we have a client
        if(!ourClient) return;

        // Pack ans send message
        offWithItsHeader(new ourClient.Request({
            url: getRequestURL(server, "/send"),
            data: {
                msg: msg,
                id: client
            }
        })).send();
    };

    function sendDisconnect(client) {
        // Ensure we have a client
        if(!ourClient) return;

        // Pack ans send message
        offWithItsHeader(new ourClient.Request({
            url: getRequestURL(server, "/disconnect"),
            data: {
                id: client
            }
        })).send();
    };

    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 10; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    // Searches for a peer
    var neededPeers = {};
    function findPeer(clientID, callback) {
        var ourID = makeid();
        neededPeers[ourID] = {
            clientID: clientID,
            callback: callback
        }
        sendMessage(clientID, ourID);
    }

    var listenToID = {};
    function listenTo(clientID) {
        if(clientID) {
            listenToID[clientID] = [clientID];

            log('Listening to ', clientID);
            log(clickableID2(clientID), clientID);
            log('<br>', clientID);
        }
    }

    function listenToChat(clientID) {
        if(clientID) {
            listenToID[clientID] = clientID;

            // Locate their partner
            findPeer(clientID, function(np, theirID) {
                log('Listening to ', clientID);
                log(clickableID2(clientID), clientID);
                log('\'s partner: ', clientID)
                log(clickableID2(theirID), clientID);
                log('<br>', clientID);
                listenToID[theirID] = clientID;
            });

            log('Click someone to send that person a message.<br>', clientID);
            log('Listening to ', clientID);
            log(clickableID2(clientID), clientID);
            log('<br>', clientID);
        }
    }

    function clickableID(clientID) {
        return jQuery('<a>').attr('href','#').text(clientID).click(function() {
            selectWindow(clientID);
        });
    }

    function clickableID2(clientID) {
        return jQuery('<a>').attr('href','#').text(clientID).click(function() {
            jQuery('#chatClientID').val(clientID);
            jQuery('#chatClientMSG').focus();
        });
    }

    // Maps IDs to names
    characterMap = {};

    var ourFaye = new Faye.Client('http://'+server+'/faye');
    ourFaye.addExtension({
        incoming:function(message, callback){
            if(message.data){
                message.data.channel = message.channel
            };callback(message);
        }
    });
    ourFaye.disable("autodisconnect");
    ourFaye.subscribe('/*', function(g){
        var clientID = g.channel.substring(1);

        // Autosend a message
        var replyMessage = 'kBye!';
        if(g.event == 'chat') {
            if(g.data != replyMessage) {
                //sendMessage(clientID, replyMessage);
            }

            log(clickableID(clientID));
            log(sexyName(characterMap[clientID]) + ': ' + g.data + '<br>');

            if(listenToID[clientID]) {
                log(clickableID2(clientID), listenToID[clientID]);
                log(sexyName(characterMap[clientID]) + ': ' + g.data + '<br>', listenToID[clientID]);
            }

            if(neededPeers[g.data]) {
                var np = neededPeers[g.data];
                neededPeers[g.data] = null;

                if (typeof np.callback === "function") {
                    np.callback(np, clientID);
                } else {
                    log(neededPeers[g.data].clientID + ' IS CONNECTED TO ' + clientID + '<br>');
                }
            }
        }

        if(g.event == 'connect') {
            characterMap[clientID] = g.otherCharacter;
        }

        if(g.event == 'disconnect') {
            if(listenToID[clientID]) {
                log(clientID + (characterMap[clientID] ? (' (' + characterMap[clientID] + ')') : '') + ' has disconnected! <br>', listenToID[clientID]);
            }

            // Free memory
            delete characterMap[clientID];
        }

        //sendDisconnect(clientID);
    }, function(e){});
}