/* state.js
* 
* TODO:
*/

(function (root, ttsFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [], function () { return ( root.TT = ttsFactory() ); });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = ttsFactory();
    } else {
        // Browser globals
        root.TTState = ttsFactory();
    }
}(this, function () {

	'use strict';


	var TTState = function ( oldSettings, storage, Emitter ) {
	/* ( {}, {} ) -> TTState
	* 
	*/

		var ttst = {
			id: 'state',
			emitter: new Emitter(),
			stepper: {},
			delayer: {},
			playback: {},
			isOpen: false,
			index: 0,  // start at beginning of text
			parsedText: '',  // Till this is set
		};

		ttst.id = 'tickerTextState';


		// ==== GETTERS AND SETTERS ====

		ttst.get = function ( keyOrKeys, callback ) {
			// TODO: Do the same thing as with loadAll
			storage.get( keyOrKeys, callback );
			return ttst;
		};  // End ttst.get()


		ttst.set = function ( pathArr, settings, callback ) {
		// FOR NOW JUST SAVE ONE SETTING AT A TIME

		// Set any number of settings key/value pairs.
		// It's an extension, so objects are valid values, but they
		// can only be one deep as far as I can tell.
		// `pathArr` is the way to dig into state to put the setting
		// in the right place and a way to build the key for
		// storing in chrome.

			var keyPrefix = 'tickerText_';
			var obj = ttst;
			for ( let parti = 0; parti < pathArr.length; parti++ ) {

				let part 	= pathArr[ parti ];

				// Is this failing silently, or is it flexibility to
				// create new settings on the fly?
				if ( obj[ part ] === undefined ) { obj[ part ] = {}; }
				obj 		= obj[ part ];
				keyPrefix 	= keyPrefix + part + '_';

			}

			for ( let key in settings ) {

				let fullKey = keyPrefix + key;
				// TODO: Normalize value
				let val = settings[ key ];

				// ---- save ----
				// Save in local settings
				obj[ key ] = val;
				// (First make it possible to use fullKey as a key
				// instead of the literal word "fullKey")
				var toSave 			= {};
				toSave[ fullKey ] 	= val;
				// TODO: Problem with callback for multiple settings
				storage.set( toSave, callback );

			}  // end for( each key )

			return ttst;
		};  // End ttst.set()

		ttst.loadAll = function ( callback ) {
			storage.loadAll( function setAllSettings( all ) {

				for ( let key in all ) {
					let obj = ttst;
					if ( /^tickerText_/.test( key ) ) {
						let parts = newKey.split( '_' );
						parts.shift();

						for ( let parti = 0; parti < parts.length; parti++ ) {
							let stateKey = parts[ parti ];
							if ( obj[ stateKey ] === undefined ) {
								obj[ stateKey ] = {};
							}

							// If it's the last part, just give it the value
							if ( parti === parts.length - 1 ) { obj[ stateKey ] = all[ key ]; }
							else { obj = obj[ stateKey ]; }

						}  // end for( dig into state object )

					}  // end if( setting belongs to tt )

				}  // end for( every setting )

				callback( all );
			});


			return ttst;
		};  // End ttst.loadAll()


		// TODO: put some defaults up in here

		// ==== STATE ====
		ttst.process = function ( text ) { return text; };  // default

		// So we can use playback's processing without needing
		// playback to be present at the top level
		ttst.setProcessor = function ( obj ) {
			ttst.process = obj.process;
			return ttst;
		};  // End ttst.setProcessor()


		// ==== DELAYER ====

		// ==== STEPPER ====

		// ==== PLAYBACK ====
		ttst.playback.transformFragment = function ( frag ) {
			// In future skip whitespace sometimes
			return frag;
		};  // End ttst.playback.transformFragment()


		ttst._init = function () {
			return ttst;
		};

		// To be used in a script
		return ttst;
	};  // End TTState() -> {}


	// To put on the window object, or export into a module
    return TTState;
}));

