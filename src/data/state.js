/* state.js
* 
* TODO:
* Pass in already constructed emitter?
* 
* NOTES:
* - When you save a setting it normalizes your value and returns
* 	it back to you. If you need to use the value, don't use your
* 	own, use the one that this state object returns.
* - Things that save settings will have to save both wpm
* 	and then baseDelay using the wpm value.
*/

'use strict';

(function (root, ttsFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [
        	'./defaults.js',
	        './delay-normalizer.js',
	        './stepper-normalizer.js'
	    ], function ( d, dn, sn ) { return ( root.TT = ttsFactory( d, dn, sn ) ); });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = ttsFactory(
        	require( './defaults.js' ),
			require( './delay-normalizer.js' ),
			require( './stepper-normalizer.js' )
		);
    } else {
        // Browser globals
        root.TTState = ttsFactory();
    }
}(this, function ( defaults, delayNormer, stepperNormer ) {

	var TTState = function ( storage, Emitter ) {
	/* ( {}, {} ) -> TTState
	* 
	*/

		var ttSt = {
			id: 'tickerTextState',
			debug: false,
			emitter: new Emitter(),
			defaults: defaults,
			stepper: {},
			delayer: {},
			playback: {},
			getters: {
				delayer: delayNormer,
				stepper: stepperNormer,
				playback: {}
			},
			isOpen: false,
			index: 0,  // start at beginning of text
			parsedText: '',  // Till this is set
		};


		// ==== GETTERS AND SETTERS ====

		ttSt.get = function ( keyOrKeys, callback ) {
			// TODO: Do the same thing as with loadAll
			storage.get( keyOrKeys, callback );
			return ttSt;
		};  // End ttSt.get()


		ttSt.set = function ( sender, settings, callback ) {
		// FOR NOW JUST SAVE ONE SETTING AT A TIME

		// Set any number of settings key/value pairs.
		// It's an extension, so objects are valid values, but they
		// can only be one deep as far as I can tell.
		// `pathArr` is the way to dig into state to put the setting
		// in the right place and a way to build the key for
		// storing in chrome.

		// TODO: ??: `pathArr` should be `sender` with owners?

			// var keyPrefix = 'tickerText_';
			// var obj = ttSt;
			// var val;
			// for ( let parti = 0; parti < pathArr.length; parti++ ) {

			// 	let part 	= pathArr[ parti ];

			// 	// Is this failing silently, or is it flexibility to
			// 	// create new settings on the fly?
			// 	if ( obj[ part ] === undefined ) { obj[ part ] = {}; }
			// 	obj 		= obj[ part ];
			// 	keyPrefix 	= keyPrefix + part + '_';
			// }

			var keyPrefix = 'tickerText_';
			var obj = ttSt;
			var val;
			let older = sender;
			while ( older ) {

				let id = older.id

				// Is this failing silently, or is it flexibility to
				// create new settings on the fly?
				if ( obj[ id ] === undefined ) { obj[ id ] = {}; }
				obj = obj[ id ];

				keyPrefix = keyPrefix + id + '_';
				older = older.owner;
			}

			for ( let key in settings ) {

				let fullKey = keyPrefix + key;

				// TODO: Normalize value
				val = settings[ key ];

				// ---- save ----
				// Save in local settings
				obj[ key ] = val;
				// (First make it possible to use fullKey as a key
				// instead of the literal word "fullKey")
				var toSave 			= {};
				toSave[ fullKey ] 	= val;

				// very awkward, but what to do?
				if ( key === 'wpm' ) {
					state.delayer._baseDelay = state.getters.delayer.get_baseDelay( val );
				}

				// TODO: Problem with callback for multiple settings
				storage.set( toSave, callback );

			}  // end for( each key )

			return val;
		};  // End ttSt.set()

		// ????
		ttSt.loadAll = function ( callback ) {
			// ??: After loading all, set all the settings in here to those settings?
			storage.loadAll( function setAllSettings( all ) {

				// For ever key that settings has
					// get the key from storage
						// if key doesn't exist
							// set using the default value
						// otherwise
							// set using the storage value

				for ( let key in all ) {
					let obj = ttSt;
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


			return ttSt;
		};  // End ttSt.loadAll()


		// TODO: put some defaults up in here

		// ==== STATE ====

		// Doesn't belong here, not sure wher to put it
		// It's so we can use playback's processing without needing
		// playback to be present at the top level
		ttSt.setProcess = function ( func ) {
			ttSt.process = func;
			return ttSt;
		};  // End ttSt.setProcessor()


		// ==== DELAYER ====

		// ==== STEPPER ====


		// ==== PLAYBACK ====
		ttSt.playback.transformFragment = function ( frag ) {
			// In future skip whitespace sometimes
			return frag;
		};  // End ttSt.playback.transformFragment()


		ttSt._init = function () {
			// FOR DEBUGGING
			if ( ttSt._debug ) { storage.clear(); }

			// if (!oldTTDefaults) {
			// 	oldTTDefaults = ttSt.defaults;
			// 	storage.set( ttSt.defaults, function(val){console.log('TTDefaults saved for first time:', val)} )
			// }

			// for ( let key in _settings ) {
			// 	let val = oldTTDefaults[key] || _settings[key];
			// 	ttSt.set( key, val );
			// }

			return ttSt;
		};

		// To be used in a script
		return ttSt;
	};  // End TTState() -> {}


	// To put on the window object, or export into a module
    return TTState;
}));

