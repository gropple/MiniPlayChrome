// background script is always running.  Only one instance across all Chrome tabs and windows I think.
// View log on Chrome extensions page.
// chrome.tabs sends messages to tabs
// chorome.extenion sneds messages to all other extension components





function sendToContent(msg) {
    // Comm with insert.js content script
    chrome.tabs.query({title: "Google Play Music"}, function(tabs){
        console.info("Query 1");
        console.info(tabs);
        if (tabs !== undefined) {
            console.info(tabs[0]);
            console.info(tabs[0].title);
            chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
            });
        }
    });

    chrome.tabs.query({title: "*Google Play Music"}, function(tabs){
        console.info("Query 2");
        console.info(tabs);
        if (tabs !== undefined) {
            console.info(tabs[0]);
            console.info(tabs[0].title);
            chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
            });
        }
    });

}

function onNativeMessage(v) {
    console.info("Native message: ");
    console.info(v);
    console.log(chrome.runtime.lastError);
    sendToContent({action: v.command});
}

function onDisconnected(v) {
    console.info("Disconnected: ");
    console.info(chrome.runtime.lastError);
    console.info(v);
    // console.log("Disconnected: " + chrome.runtime.lastError);
}


var port;
function connect() {
    // chrome.runtime.sendNativeMessage('com.grahampople.musicgizmo',
    //     { text: "Hello" },
    //     function(response) {
    //         console.log("Received " + response);
    //     });


    // connect to local program com.a.chrome_interface
    port = chrome.extension.connectNative('com.grahampople.musicgizmo');
    // console.log("connectNative: " + chrome.runtime.lastError);
    console.log("connectNative: ");
    console.info(chrome.runtime.lastError);
    console.info(port);
    port.onMessage.addListener(onNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
}

function sendNativeMessage(data) {
    port.postMessage({ text: "Hello, my_application" });
    console.log("postMessage: ");
    console.info(chrome.runtime.lastError);
}

chrome.extension.onRequest.addListener(function (data, sender) {
    // sendToContent({action: "play/pause"});

    if (data.length > 0) {
        connect();
        sendNativeMessage(data);
    }
});
