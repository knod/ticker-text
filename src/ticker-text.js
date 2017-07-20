/* ticker-text.js
* 
* TODO:
* - User option to start reading on opening
* - Skipping words when all user settings set to 0. Fix
* 	- Putting values in input is validated, so that's not
* 	the problem
* - Maybe remove user delay settings that are fractions. Yes
* 	it allows users to speed things up as well as slow things
* 	down, but it seems like it would be unclear to the average
* 	user. Maybe create a button for 'slower' and 'faster'.
* - Add text that says '# times slower' to delays to clarify
* - Prevent scrolling on body of document when scrolling on app.
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
		ttxt.id = 'tickerText';

		var startingNew = true;

		ttxt.storage, ttxt.state, ttxt.ui;

		ttxt._afterLoad = function ( oldSettings ) {

			var top = constructors.topLevel;

			// ttxt.state 			= new top.State( ttxt.storage, top.Emitter );
			ttxt.state.owner 	= ttxt;
			ttxt.parser 		= new top.Parser();
			ttxt.parser.owner 	= ttxt;
			ttxt.ui 			= new top.UI( ttxt.state, document.body, constructors.ui, filepaths.ui );
			ttxt.ui.owner 		= ttxt;

			// TEMP (For less annoying dev for now)
			ttxt.processFullPage();
			ttxt.readFullPage();

		};  // End ttxt._afterLoad()


		ttxt._init = function () {

			var top = constructors.topLevel;

			ttxt.storage = new top.Storage();

			ttxt.state = new top.State( ttxt.storage, top.Emitter, true );
			ttxt.state.loadAll( ttxt._afterLoad );

			return ttxt;
		};  // End ttxt._init


		// ==============================
		// RUNTIME HANDLERS
		// ==============================

		ttxt.close = function () {
			ttxt.state.isOpen = false;
			ttxt.ui.close();
		};
		ttxt.open = function () {
			ttxt.state.isOpen = true;
			ttxt.ui.wait();  // Will be hidden elsewhere
			ttxt.ui.open();
		};


		ttxt.read = function () {

			// var sentenceWords = ttxt.parser.parse( node, false );
			// console.log( sentenceWords );

			// if ( ttxt.parser.debug ) {  // Help non-coder devs identify some bugs
			// 	console.log('~~~~~parse debug~~~~~ If any of those tests failed, the problem isn\'t with Ticker Text, it\'s with one of the other libraries. That problem will have to be fixed later.');
			// }

			// ttxt.state.process( sentenceWords );
			// ttxt.ui.start();

			ttxt.state.emitter.trigger( 'playTT', [ ttxt, ttxt.state ] );
			ttxt.ui.play();

			startingNew = false;

			return ttxt;
		};


		ttxt.process = function ( node ) {
			var sentenceWords = ttxt.parser.parse( node, false );

			if ( ttxt.parser.debug ) {  // Help non-coder devs identify some bugs
				console.log('~~~~~parse debug~~~~~ If any of those tests failed, the problem isn\'t with Ticker Text, it\'s with one of the other libraries. That problem will have to be fixed later.');
			}

			startingNew = true;

			return ttxt.state.process( sentenceWords );
		};


		ttxt.processSelectedText = function () {
			var contents = document.getSelection().getRangeAt(0).cloneContents();
			var $container = $('<div></div>');
			$container.append(contents);
			// if ( !ttxt.state.isOpen ) { ttxt.ui.open(); }
			// // Always start reading right away
			// ttxt.read( $container[0] );

			return ttxt.process( $container[0] );
		};


		ttxt.processFullPage = function () {
			var $clone = $('html').clone();
			// // First time opens, when open, starts reading (customizable so can start right away?)
			// if ( !ttxt.state.isOpen ) { ttxt.ui.open(); }
			// else { ttxt.read( $clone[0] ); }

			return ttxt.process( $clone[0] );
		};


		ttxt.readSelectedText = function () {
			if ( !ttxt.state.isOpen ) { ttxt.open(); }
			// Always start reading right away
			ttxt.read();

			return ttxt;
		};


		ttxt.readFullPage = function () {
			// First time opens. When open, starts reading
			// TODO: ??: customizable so can start right away?
			if ( !ttxt.state.isOpen ) { ttxt.open(); }
			// else { ttxt.read(); }

			return ttxt;
		};


		// ==============================
		// EXTENSION EVENT LISTENER
		// ==============================
		var browser = chrome || browser;

		browser.extension.onMessage.addListener( function ( request, sender, sendResponse ) {

			var action = request.action;

			// if ( action === 'readSelectedText' ) { processSelectedText(); }

			// Don't show at start, only when prompted
			// else 
			if ( action === 'openTickerText' ) {
				if ( ttxt.state === undefined || !ttxt.state.isOpen ) {
					// ttxt._init();  // TEMP
					// ttxt.ui.open();
					ttxt.processFullPage();
				// } else {
				// 	// ttxt.processFullPage();
					ttxt.readFullPage();
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
