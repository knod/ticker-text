/* state.js
* 
* TODO:
* - Pass in already constructed emitter?
* - Flatten storage structure?
* - Should user configs be in a particular runtime place (this
* 	would be in addition to being in local storage)
* 
* NOTES:
* - When you save a setting it normalizes your value and returns
* 	it back to you. If you need to use the value, don't use your
* 	own, use the one that this state object returns.
* - Things that save settings will have to save both wpm
* 	and then baseDelay using the wpm value.
* - `.settings` contains one level deep objects only
*/

'use strict';

(function (root, ttsFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [
        	'./defaults.js',
	        './delay-normalizer.js',
	        './stepper-normalizer.js'
	    ], function ( def, dn, sn ) { return ( root.TTState = ttsFactory( def, dn, sn ) ); });
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
        root.TTState = ttsFactory( root.TTDefaults, root.TTDelayNormalizer, root.TTStepperNormalizer );
    }
}(this, function ( defaults, delayNormer, stepperNormer ) {

	var TTState = function ( storage, Emitter, debug ) {
	/* ( {}, {} ) -> TTState
	* 
	*/

		var ttSt = {
			id: 'tickerTextState',
			keyPrefix: 'tickerText_',
			_debug: debug || false,
			emitter: new Emitter(),
			defaults: defaults,
			// settings: {}, // { stepper: {}, delayer: {}, playback: {} }
			stepper: {}, delayer: {}, playback: {},
			// getters: {
			// 	delays: delayNormer,  // ui settings name
			// 	stepper: stepperNormer,
			// 	playback: {}
			// },
			isOpen: false,
			index: 0,  // start at beginning of text
			parsedText: '',  // Till this is set
		};


		// ==== HELPERS ====

		ttSt.buildKey = function ( sender, key ) {
			var key = ttSt.keyPrefix + sender.id + '_' + key;
			// for ( let key in keyValPair ) {}
			return key;
		};  // End ttSt.buildKey()

		ttSt.objectFromKey = function ( str ) {
		// Returns the parent object of the property and
		// the property name itself
			var path = str.replace( ttSt.keyPrefix, '' );
				path = str.split('_');
			var obj = ttSt;

			for (var parti = 0; parti < path.length - 1; parti++) {
				var name = path[ parti ];
				obj = obj[ name ]
				if ( obj === undefined ) { obj = {} }
			};

			return { parentObject: obj, propertyName: path[ path.length - 1 ] };
		};  // End ttSt.objectFromKey()




		// ==== GETTERS AND SETTERS ====

		// Probably nothing outside here should be calling this
		// Things outside of here should just be using the state values.
		// ttSt.get = function ( sender, key, callback ) {
		ttSt.get = function ( sender, key ) {
			// TODO: Do the same thing as with loadAll?
			// TODO: ??: Use callback at all? That only returns local storage value
			// and may mix things up
			// TODO: ??: _only_ use callback, matching up with `.loadAll()` and others?
			// storage.get( keyOrKeys, callback );
			var val = ttSt[ sender.id ][ key ];

			return val;
		};  // End ttSt.get()


		// `sender` won't work - the UI is the sender, not the original state object
		ttSt.set = function ( sender, toSet, callback ) {
		// Objects with 'settable' values only go one level deep

			// TODO: ??: Update `_baseDelay` each time? Have ones that need updating each time?
			// ??: Recalculate in delayer itself? (probably a better idea - whenever accessing base delay)

			var stateObj = ttSt[ sender.id ];

			for ( let key in toSet ) {
				let val = toSet[ key ];
				// For now, lets assume all values have already been normalized	

				// Save normalized value
				stateObj[ key ] = val;
				// Flatten object for saving in local browser storage
				let localKey = ttSt.buildKey( sender, key );
				let obj = {};
				obj[ localKey ] = val;
				// ??: Don't use callback from browser storage?
				storage.set( obj );
			}  // end for everything that needs saving

			// Give results right away
			// Gives relevant state values
			if ( callback ) { callback( stateObj ); }

			return stateObj;
		};  // End ttSt.set()


		// // `sender` won't work - the UI is the sender, not the original state object
		// ttSt.set = function ( sender, settings, callback ) {
		// // FOR NOW JUST SAVE ONE SETTING AT A TIME

		// // Set any number of settings key/value pairs.
		// // It's an extension, so objects are valid values, but they
		// // can only be one deep as far as I can tell.
		// // `pathArr` is the way to dig into state to put the setting
		// // in the right place and a way to build the key for
		// // storing in chrome.

		// // TODO: ??: `pathArr` should be `sender` with owners?

		// 	// var keyPrefix = 'tickerText_';
		// 	// var obj = ttSt;
		// 	// var val;
		// 	// for ( let parti = 0; parti < pathArr.length; parti++ ) {

		// 	// 	let part 	= pathArr[ parti ];

		// 	// 	// Is this failing silently, or is it flexibility to
		// 	// 	// create new settings on the fly?
		// 	// 	if ( obj[ part ] === undefined ) { obj[ part ] = {}; }
		// 	// 	obj 		= obj[ part ];
		// 	// 	keyPrefix 	= keyPrefix + part + '_';
		// 	// }

		// 	var keyPrefix = 'tickerText_';
		// 	var obj = ttSt;
		// 	var val;
		// 	let older = sender;
		// 	while ( older ) {

		// 		let id = older.id

		// 		// Is this failing silently, or is it flexibility to
		// 		// create new settings on the fly?
		// 		if ( obj[ id ] === undefined ) { obj[ id ] = {}; }
		// 		obj = obj[ id ];

		// 		keyPrefix = keyPrefix + id + '_';
		// 		older = older.owner;
		// 	}

		// 	for ( let key in settings ) {

		// 		let fullKey = keyPrefix + key;

		// 		// TODO: Normalize value
		// 		val = settings[ key ];

		// 		// ---- save ----
		// 		// Save in local settings
		// 		obj[ key ] = val;
		// 		// (First make it possible to use fullKey as a key
		// 		// instead of the literal word "fullKey")
		// 		var toSave 			= {};
		// 		toSave[ fullKey ] 	= val;

		// 		// very awkward, but what to do?
		// 		if ( key === 'wpm' ) {
		// 			state.settings.delayer._baseDelay = state.getters.delayer.get_baseDelay( val );
		// 		}

		// 		// TODO: Problem with callback for multiple settings
		// 		storage.set( toSave, callback );

		// 	}  // end for( each key )

		// 	return val;
		// };  // End ttSt.set()


		// ????
		ttSt.loadAll = function ( callback ) {
			// ??: After loading all, set all the settings in here to those settings?
			storage.loadAll( function loadAndSetAllSettings( all ) {

				// // TODO: add more flexibility later
				// var setts = ttSt.settings,
				// 	step  = setts.stepper,
				// 	dely  = setts.delayer,
				// 	plab  = setts.playback;

				// var keyBase = 'tickerText_'

				// // For every key in every key in settings
				// for ( let catKey in setts ) {
				// 	// build a local storage name
				// 	let browserKey = keyBase + catKey + '_';

				// 	let category = setts[ catKey ];
				// 	for ( let setKey in category ) {
				// 		// build a local storage name
				// 		browserKey = browserKey + setKey;
				// 		let loadedVal = all[ browserKey ];
				// 		let stateVal  = category[ setKey ];

				// 		// if the name exists in the loaded values
				// 		if ( loadedVal !== undefined ) {
				// 			ttSt.set( { id: browserKey } )
				// 		}


				// 	}  // end for ( each setting )
				// }  // end for ( settings category )


				// for ( let key in all ) {
				// 	let obj = ttSt;
				// 	if ( /^tickerText_/.test( key ) ) {
				// 		let parts = newKey.split( '_' );
				// 		parts.shift();

				// 		for ( let parti = 0; parti < parts.length; parti++ ) {
				// 			let stateKey = parts[ parti ];
				// 			if ( obj[ stateKey ] === undefined ) {
				// 				obj[ stateKey ] = {};
				// 			}

				// 			// If it's the last part, just give it the value
				// 			if ( parti === parts.length - 1 ) { obj[ stateKey ] = all[ key ]; }
				// 			else { obj = obj[ stateKey ]; }

				// 		}  // end for( dig into state object )

				// 	}  // end if( setting belongs to tt )

				// }  // end for( every setting )

				// callback( all );

				// For every value in loaded values
					// If setting exists in state
						// Set that value (don't save it?)

				// For ever key that settings has
					// If there's no value in it
						// Use a default value
						// Save the value

				// or
				// For every key in every key in default settings
					// build a local storage name
					// if the name exists in the loaded values
						// Set that value in state (don't save it?)
					// Otherwise, if no value already there
						// Set using the default value
						// Save in local storage

				// and/or
				// Start with cloning defaults
				var defs = ttSt.defaults;
				for ( let catKey in defs ) {

					let stateObj = ttSt[ catKey ];
					let category = defs[ catKey ];

					for ( let prop in category ) {
						stateObj[ prop ] = category[ prop ];
					}  // end for ( every category property )
				}  // end for ( every default category )


				// Then override with local storage where needed
				// For every key in local storage
				for ( let key in all ) {

					console.log( 'testing key:', key, key.indexOf( ttSt.keyPrefix ) );

					// if it starts with 'tickerText_'
					if ( key.indexOf( ttSt.keyPrefix ) !== -1 ) {

						// Use the string to set the current state value
						// TODO: ??: Need to change from key to floats, etc?
						let val = all[ key ];
						console.log( 'value from loading:', key + ':', val)
						let objAndProp = ttSt.objectFromKey( key );
						// TODO: ??: Needs validation/normalization? Wouldn't
						// that have been taken care of when setting?
						objAndProp.parentObject[ objAndProp.propertyName ] = val;
					}
				}  // end for ( all browser-stored settings )

				// console.log( 'settings after loading all:', ttSt );
				// TODO: ??: Set defaults in local storage? Needed?

				callback( ttSt );
			});


			return ttSt;
		};  // End ttSt.loadAll()


		// ==== STATE ====

		// Doesn't belong here, not sure wher to put it
		// It's so we can use playback's processing without needing
		// playback to be present at the top level
		ttSt.setProcess = function ( func ) {
			ttSt.process = func;
			return ttSt;
		};  // End ttSt.setProcess()


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

		ttSt._init();

		// To be used in a script
		return ttSt;
	};  // End TTState() -> {}


	// To put on the window object, or export into a module
    return TTState;
}));
