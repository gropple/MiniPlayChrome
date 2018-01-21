// The content script. This runs on every page while the extension is active. Can't access Chrome API, need to send
// messages to background.js for that.
// Use chrome.extension.sendRequest to communicate with background.js

function checkPlayer() {
    var hasPlayer = document.getElementsByClassName("material-player-middle").length > 0;
    console.info({hasPlayer: hasPlayer});
    setTimeout(checkPlayer, 2000);
}

function isPlaying() {
    return $("#player-bar-play-pause")[0].title === "Pause";
}


function pauseOrResume() {
    $('#player-bar-play-pause').click()
}

function clickFeelingLucky() {
    $('#iflFab').click();
}

function isThumbedUp() {
    return $("[icon='sj:thumb-up-outline']")[0].title === "Undo thumb-up";
}

function isThumbedDown() {
    return $("[icon='sj:thumb-down-outline']")[0].title === "Undo thumb-down";
}

function thumbsUp() {
    $("*[title='Thumb-up']").click();
}

function undoThumbsUp() {
    $("*[title='Undo thumb-up']").click();
}

function thumbsDown() {
    $("*[title='Thumb-down']").click();
}

function undoThumbsDown() {
    $("*[title='Undo thumb-down']").click();
}

function prevSong() {
        $("#player-bar-rewind").click();
}

function nextSong() {
    $("#player-bar-forward").click();
}

// Globals are good right?  Let's have lots of globals.
var lastMsg;
var webSocket;
var UPDATE_INTERVAL = 500;

function keepDetectingChanges() {
    try {
        var currentlyPlaying = document.getElementById("currently-playing-title");

        if (currentlyPlaying != null) {
            var songArtElem = document.getElementById("playerBarArt");
            var artistElem = document.getElementById("player-artist");
            var albumElem = document.getElementById("player-album");

            var songTitle = currentlyPlaying.title;
            var songArt = "Unknown";
            var artist = "Unknown";
            var album = "Unknown";

            if (songArtElem !== null) songArt = songArtElem.src;
            if (artistElem !== null) artist = artistElem.innerText;
            if (albumElem !== null) album = albumElem.innerText;

            var songTitle = currentlyPlaying.title;

            var fullmsg = {
                playing: isPlaying(),
                isThumbedUp: isThumbedUp(),
                isThumbedDown: isThumbedDown(),
                title: songTitle,
                artist: artist,
                album: album,
                art: songArt

            };
            var stringified = JSON.stringify(fullmsg);

            // This isn't guaranteed, as the enumeration order of JSON isn't defined, but is good enough to cut down on
            // message sending
            // Until we know for sure need the performance, probably better to spam these

            // if (lastMsg !== stringified) {
            //     lastMsg = stringified;
                console.info(fullmsg);

                if (webSocket) {
                    webSocket.send(stringified);
                }
            // }
        }
    }
    catch (e) {
        console.warn(e);
    }

    setTimeout(keepDetectingChanges, UPDATE_INTERVAL);
}


function tryConnect() {
    console.info("Trying to connect");

    if ("WebSocket" in window) {
        var innerWs;
        try {
            innerWs = new WebSocket("ws://localhost:8080/chat");

            // If this fails to connect, an error gets logged but no exception is thrown.  Need to hook up onclose which
            // is immediately called.  Weird.

            innerWs.onclose = function (e) {
                // if (!tryingToConnect) {
                console.warn("OMG CLOSED!");
                setTimeout(tryConnect, 2000);
                // keepTryingToConnect();
                // }
            };

        }
        catch (e) {
            console.info("Failed to connect " + e);
            setTimeout(tryConnect, 2000);
        }

        if (innerWs === undefined) {
            console.info("Failed to connect");
            setTimeout(tryConnect, 2000);
        }
        else {
            innerWs.onopen = function () {
                webSocket = innerWs;
                // detectChanges();
                // ws.send("hello");

                innerWs.onclose = function (e) {
                    // if (!tryingToConnect) {
                    console.warn("Closed");
                    setTimeout(keepTryingToConnect, 2000);
                    // keepTryingToConnect();
                    // }
                };
                innerWs.onerror = function (e) {
                    // if (!tryingToConnect) {
                    console.error("Error");
                    console.error(e);
                    // }
                };
                innerWs.onmessage = function (e) {
                    console.info(e);
                    var parsed = JSON.parse(e.data);
                    switch (parsed.action) {
                        case "play/pause":
                            pauseOrResume();
                            break;
                        case "lucky":
                            clickFeelingLucky();
                            break;
                        case "thumbsUp":
                            thumbsUp();
                            break;
                        case "thumbsDown":
                            thumbsDown();
                            break;
                        case "undoThumbsUp":
                            undoThumbsUp();
                            break;
                        case "undoThumbsDown":
                            undoThumbsDown();
                            break;
                        case "prev":
                            prevSong();
                            break;
                        case "next":
                            nextSong();
                            break;
                    }
                }
            }
        }
    }
    else {
        console.error("WebSockets not available, can't even deal");
    }
}

function keepTryingToConnect() {
    console.info("Trying to connect to server");
    webSocket = undefined;
    // tryingToConnect = true;
    tryConnect();
    // console.info(ws);

    // if (ws === undefined) {
    //     setTimeout(keepTryingToConnect, 1000)
    // }
    // else {
    //     tryingToConnect = false;
    //     console.info("Connected to server");
    // }
}

// Only setup when document is finished so we're properly ready to insert ourselves
$(document).ready(function () {
    var title = document.getElementsByTagName("title")[0].text;

    var isGooglePlayMusicTab = title.endsWith("Google Play Music");

    if (isGooglePlayMusicTab) {
        // var tryingToConnect = false;

        keepTryingToConnect();
        keepDetectingChanges();


        chrome.extension.sendRequest("Some Data");
        // chrome.extension.getBackgroundPage().sendRequest("Some Data");

        // if (isGooglePlayMusicTab) {
        //     console.info("isGooglePlayMusicTab");
        // }
        // else {
        //     console.info("not isGooglePlayMusicTab");
        // }
        // console.info("Doc ready test D");

        // These come from background.js
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                console.info("Message:");
                console.info(request);

                // Display, except if we're already displayed
                if (request.action == "display") {
                    appLoaded(false, false);
                    sendResponse({response: "loaded"});
                }
                // Display, except if we're already displayed, plus do research
                else if (request.action == "research") {
                    appLoaded(false, true);
                    sendResponse({response: "loaded"});
                }
                // Display again no matter what. Can lead to multiple extensions displayed.
                else if (request.action == "display2") {
                    appLoaded(true, true);
                    sendResponse({response: "loaded"});
                }
                // Fill in a contact form.
                else if (request.action == "contact_form") {
                    var app = appLoaded(false, false);
                    app.fillContactForm(request.from, request.email, request.subject, request.body, request.contactUuid, request.offerUuid, request.senderUuid);
                    sendResponse({response: "loaded"});
                }
                else if (request.action == "log") {
                    console.info("From background.js... ", request.msg);
                }
                else if (request.action == "play/pause") {
                    //pauseOrResume();
                    clickFeelingLucky();
                }
            });

        // var port = chrome.extension.connect();
        try {
            document.getElementById('blogFlogMessagePasser').addEventListener('message', function () {
                var eventData = document.getElementById('blogFlogMessagePasser').innerText;
                console.info(eventData);

                chrome.runtime.sendMessage({action: "open", data: eventData}, function (response) {
                    console.log(response);
                });
            });

            document.getElementById('blogFlogMessagePasser').addEventListener('contact-forms', function () {
                var eventData = document.getElementById('blogFlogMessagePasser').innerText;
                console.info(eventData);

                // Pass to background.js (we can't open tabs directly from a content script)
                chrome.runtime.sendMessage({action: "contact-forms", data: eventData}, function (response) {
                    console.log(response);
                });

            });
        }
        catch (t) {
            // Fine
            console.info("Didn't find blogFlogMessagePasser element");
        }
    }
});