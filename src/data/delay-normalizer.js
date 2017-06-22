// delay-normalizer.js

'use strict';

(function (root, delayNormFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ '../utils/math.js' ], function ( math ) { return ( root.TTDelayNormalizer = delayNormFactory( math ) );});
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = delayNormFactory( require( '../utils/math.js' ) );
    } else {
        // Browser globals
        root.TTDelayNormalizer = delayNormFactory();
    }
}(this, function ( math ) {

	// var TTDelayNormalizer = function () {

		var delN = {};
		delN.id  = 'delayNormalizer';


		// ======== Word Delays ========

		// PLEASE SEND IN AN ALREADY NORMALIZED wpm VALUE
		// me = this  // be careful here that you have the right `this`
		// wpm = state.set( me, { wpm: # } );
		// delay = state.calcBaseDelay( wpm );
		delN.calcBaseDelay = function ( wpm ) {
			return 1/(wpm/60)*1000;  // to milliseconds
		}

		// PLEASE SEND IN AN ALREADY NORMALIZED wpm VALUE
		// DO THIS WHENEVER YOU SET EITHER ONE:
		// me = this  // be careful here that you have the right `this`
		// wpm = state.set( me, { wpm: # } );
		// baseDelay = state.set( me, { baseDelay: wpm } );
		delN.get_baseDelay = function ( wpm ) {
			return delN.calcBaseDelay( wpm );  // to milliseconds
		};
		delN.get_wpm = function ( val ) {
			return math.constrainInt( val, 1, 5000 );
		};
		delN.get_slowStartDelay = function ( val ) {
			return math.constrainInt( val, 0, 10 );
		};
		delN.get_sentenceDelay = function ( val ) {
			return math.constrainInt( val, 1, 10 );
		};
		delN.get_otherPuncDelay = function ( val ) {
			return math.constrainInt( val, 1, 10 );
		};
		delN.get_numericDelay = function ( val ) {
			return math.constrainInt( val, 1, 10 );
		};
		delN.get_shortWordDelay = function ( val ) {
			return math.constrainInt( val, 1, 10 );
		};
		delN.get_longWordDelay = function ( val ) {
			return math.constrainInt( val, 1, 10 );
		};
		// delN.get_wordLengthDelays = function ( val ) {
		// 	return math.constrainInt( val, 1, 10 );
		// };

		// To put on the window object, or export into a module and
		// To be invoked in a script
		return delN;

	// };  // End TTDefaults() -> {}

	// // To put on the window object, or export into a module
 //    return TTDefaults;
}));
