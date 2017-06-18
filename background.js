
// For later Firefox integration
var browser = chrome || browser;

// Right click on page
function onContextCLick(info, tab) {
    browser.tabs.query({
        "active": true,
        "currentWindow": true
    }, function (tabs) {
        browser.tabs.sendMessage(tabs[0].id, {
            "functiontoInvoke": "readSelectedText",
			"selectedText": info.selectionText
        });
    });
}

// Icon clicked in toolbar
function onIconClick(info, tab) {
    browser.tabs.query({
        "active": true,
        "currentWindow": true
    }, function (tabs) {
        browser.tabs.sendMessage(tabs[0].id, {
            "functiontoInvoke": "readFullPage"
        });
    });
}

// Write this in an expandable way in case we want to move beyond selection
var contexts = ["selection"];
for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Read Selected Text";
    var id = browser.contextMenus.create({
        "title": title,
        "contexts": [context],
        "onclick": onContextCLick
    });
}

// Handle clicking on the toolbar icon
browser.browserAction.onClicked.addListener(function(tab) { onIconClick(); });
