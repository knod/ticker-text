/* ticker-text.js
* 
* TODO:
* - User option to start reading on opening
*/

'use strict';


(function (root, ttFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery' ], function ( jquery ) { return ( root.TT = ttFactory( jquery ) ); });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = ttFactory( require('jquery') );
    } else {
        // Browser globals
        root.TickerText = ttFactory( root.jQuery );
    }
}(this, function ( $ ) {

	'use strict';

	var TickerText = function ( constructors, filepaths ) {
	/* ( {}, {} ) -> TickerText
	* 
	* `constructors` has all the constructors for /everything/
	*/

		var ttxt = {};

		ttxt.close 	= function () { state.isOpen = false; };
		ttxt.open 	= function () { state.isOpen = true; };

		ttxt.storage, ttxt.state, ttxt.ui;




		// var UI = require( constructors.ui );
			// Settings 	= require('./lib/settings/Settings.js'),
			// Storage 	= require('./lib/ReaderlyStorage.js'),
			// WordNav 	= require('./lib/parse/WordNav.js'),
			// WordSplitter= require('./lib/parse/WordSplitter.js'),
			// Delayer 	= require('@knod/string-time'),
			// Timer 		= require('./lib/playback/ReaderlyTimer.js'),
			// Display 	= require('./lib/ReaderlyDisplay.js'),
			// PlaybackUI 	= require('./lib/playback/PlaybackUI.js'),
			// SettingsUI 	= require('./lib/settings/ReaderlySettings.js'),
			// SpeedSetsUI = require('./lib/settings/SpeedSettings.js'),
			// WordSetsUI 	= require('./lib/settings/WordSettings.js');

		ttxt._afterLoad = function ( oldSettings ) {

			var top = constructors.topLevel;

			ttxt.state 	= new top.State( oldSettings, ttxt.storage, top.Emitter );
			ttxt.ui 	= new top.UI( ttxt.state, document.body, constructors.ui, filepaths.ui );
			ttxt.ui.addTriggerable( ttxt );


		};  // End ttxt._afterLoad()


		ttxt._init = function () {

			var top = constructors.topLevel;

			ttxt.storage = new top.Storage();
			ttxt.storage.loadAll( ttxt._afterLoad );


			return ttxt;
		};  // End ttxt._init


		// ==============================
		// EXTENSION EVENT LISTENER
		// ==============================
		var browser = chrome || browser;

		browser.extension.onMessage.addListener(function (request, sender, sendResponse) {

			var func = request.functiontoInvoke;

			// if ( func === 'readSelectedText' ) { readSelectedText(); }

			// Don't show at start, only when prompted
			// else 
			if ( func === 'openTickerText' ) {
				if ( ttxt.state === undefined || !ttxt.state.isOpen ) {
					// ttxt._init();  // TEMP
					ttxt.ui.open();
				} else {
					// readArticle();
				}
			}

		});  // End extension event listener

		// TEMP so it's less annoying when starting each time
		ttxt._init();


		// To be used in a script
		return ttxt;
	};  // End TickerText() -> {}


	// To put on the window object, or export into a module
    return TickerText;
}));
