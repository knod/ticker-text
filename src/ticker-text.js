// ticker-text.js

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

	"use strict";

	var TickerText = function ( constructors, filepaths ) {
	/*
	* 
	* `constructors` has all the constructors for /everything/
	*/

		var ttxt = {};
		
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

		var ui = new constructors.UI( {}, document.body, constructors, filepaths );

		ttxt._init = function () {

			return ttxt;
		};


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		ttxt._init();

		// To be called in a script
		return ttxt;
	};  // End TickerText() -> {}

	// To put on the window object, or export into a module
    return TickerText;
}));
