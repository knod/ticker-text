// defaults.js

'use strict';

(function (root, defaultsFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [], function () { return ( root.TTDefaults = defaultsFactory() );});
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = defaultsFactory();
    } else {
        // Browser globals
        root.TTDefaults = defaultsFactory();
    }
}(this, function () {

	// var TTDefaults = function () {

		var tDef = {
			misc: { playOnOpen: true },
			delayer: {
				// ==== word delays ====
				wpm: 			250,
				_baseDelay: 	1/(250/60)*1000,  // based on wpm
				slowStartDelay: 5,
				sentenceDelay: 	5,
				otherPuncDelay: 2.5,
				numericDelay: 	2.0,
				shortWordDelay: 1.3,  // Will be obsolete
				longWordDelay: 	1.5,  // Will be obsolete
				// wordLengthDelays: { 1: 1.3, 2: 1.3, 3: 1.3,
				// 	4: 1, 5: 1, 6: 1,
				// 	7: 1.3, 8: 1.3, 9: 1.3,
				// 	10: 1.5, 11: 1.5, 12: 1.5, 13: 1.5,
				// 	14: 1.8, 15: 1.8, 16: 1.8  // Anything more will be 2?
				// },
			},
			stepper: {
				// ==== fragmentor/splitter ====
				maxNumCharacters: 24,
				minLengthForSeparator: 3
			},
			playback: {
				transformFragment: function ( frag ) {
					// In future skip whitespace sometimes
					return frag;
				}
			}
		};

		// To be invoked in a script
		return tDef;

	// };  // End TTDefaults() -> {}

	// // To put on the window object, or export into a module
//     return TTDefaults;
}));
