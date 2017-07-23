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
* - Merits of some aspects of caching need to be debated - if you're
* 	part way through a selected section and read something else and
* 	then select it again and read it, should you really start in 
* 	the middle of it?
* - Some kind of UI for switching back to reading full text and,
* 	possibly, for reading a selection as well
* - Show saved cached selections as options that can be re-read?
* 	Allow deletion of those?
* - Don't initialize till button is first pressed.
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

		ttxt.storage, ttxt.state;
		var state;

		ttxt._afterLoad = function ( oldSettings ) {

			var top = constructors.topLevel;

			ttxt.state.owner 	= ttxt;
			state.parser 		= new top.Parser();
			// TODO: Can we move this into just reading instead of up here?
			// Does `.ui` need it? I think it does.
			state.player 	= ttxt.newPlayer( 'initial' );
			state.ui 		= new top.UI( ttxt.state, document.body, constructors.ui, filepaths.ui );

			// TEMP (For less annoying dev for now)
			ttxt.fullPage();

		};  // End ttxt._afterLoad()


		ttxt._init = function () {

			var top = constructors.topLevel;

			ttxt.storage = new top.Storage();

			state = ttxt.state = new top.State( ttxt.storage, top.Emitter, true );
			ttxt.state.loadAll( ttxt._afterLoad );

			return ttxt;
		};  // End ttxt._init


		// ==============================
		// RUNTIME HANDLERS
		// ==============================

		ttxt.close = function () {
			ttxt.state.isOpen = false;
			state.ui.close();
		};
		ttxt.open = function () {
			ttxt.state.isOpen = true;
			state.ui.wait();  // Will be hidden elsewhere
			state.ui.open();
		};


		ttxt.newPlayer = function ( id ) {
			var player 	= new constructors.topLevel.Player( state );
			player.id 	= "playback";

			state.cache( player, id );  // One for each text read
			return player;
		};  // End ttxt.newPlayer()


		ttxt.getPlayer = function ( id, $node ) {

			var player = null;
			if ( !state.cached[ id ] ) {

				player = ttxt.newPlayer( id );
				ttxt.process( $node, player );

			} else {
				player = state.cached[ id ];
			}

			state.player = player;

			return player;
		};  // End ttxt.getPlayer()


		ttxt.read = function () {
			ttxt.state.emitter.trigger( 'playTT', [ ttxt, ttxt.state ] );
			state.ui.play();
			return ttxt;
		};


		ttxt.process = function ( node, player ) {
			var sentenceWords = state.parser.parse( node, false );

			if ( state.parser.debug ) {  // Help non-coder devs identify some bugs
				console.log('~~~~~parse debug~~~~~ If any of those tests failed, the problem isn\'t with Ticker Text, it\'s with one of the other libraries. That problem will have to be fixed later.');
			}

			return player.process( sentenceWords );
		};


		ttxt.selectedText = function () {

			var contents = document.getSelection().getRangeAt(0).cloneContents(),
				$container = $('<div></div>');
			$container.append(contents);
			var id = $container.text();

			var player = ttxt.getPlayer( id, $container );

			if ( !ttxt.state.isOpen ) { ttxt.open(); }
			// When reading selected text, always read right away
			ttxt.read();

			return ttxt;
		};  // End ttxt.selectedText()


		ttxt.fullPage = function () {

			// Not using `.getPlayer()` because don't want to clone the node
			// each time. How much memory would it use? (thinking of mobile)
			var player = null;
			if ( !state.cached[ 'fullPage' ] ) {

				player = ttxt.newPlayer( 'fullPage' );
				var $clone = $('html').clone();
				ttxt.process( $clone[0], player );

			} else { player = state.cached[ 'fullPage' ]; }

			state.player = player;

			if ( !ttxt.state.isOpen ) {
				ttxt.open();
				if ( ttxt.state.misc.playOnOpen ) { ttxt.read(); }
			} else {
				ttxt.read();
			}

			return ttxt;
		};  // End ttxt.fullPage()


		// ==============================
		// EXTENSION EVENT LISTENER
		// ==============================
		var browser = chrome || browser;

		browser.extension.onMessage.addListener( function ( request, sender, sendResponse ) {

			var action = request.action;

			if ( action === 'openTickerText' ) {
				ttxt.fullPage();
			} else if ( action === 'readSelectedText' ) {
				ttxt.selectedText();
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
