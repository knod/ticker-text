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


		// ????
		ttSt.loadAll = function ( callback ) {
			// ??: After loading all, set all the settings in here to those settings?
			storage.loadAll( function loadAndSetAllSettings( all ) {

				// Start by cloning defaults
				var defs = ttSt.defaults;
				for ( let catKey in defs ) {

					let stateObj = ttSt[ catKey ];
					let category = defs[ catKey ];

					for ( let prop in category ) {
						stateObj[ prop ] = category[ prop ];
					}  // end for ( every category property )
				}  // end for ( every default category )

				// Gets any key with 'tickerText_' at the start - is
				// this flexibility good or bad?

				// Then override with local storage where needed
				// For every key in local storage
				for ( let key in all ) {

					// console.log( 'testing key:', key, key.indexOf( ttSt.keyPrefix ) );

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

			// Don't return anything to be clear that a valid value
			// has not yet been achieved
			return;
		};  // End ttSt.loadAll()



		// ==== UNFORTUNATE ====

		// Doesn't belong here, not sure wher to put it
		// It's so we can use playback's processing without needing
		// playback to be present at the top level
		ttSt.setProcess = function ( func ) {
			ttSt.process = func;
			return ttSt;
		};  // End ttSt.setProcess()



		// ==== DO STARTING STUFF ====

		ttSt._init = function () {
			// FOR DEBUGGING
			if ( ttSt._debug ) { storage.clear(); }
			return ttSt;
		};

		ttSt._init();

		// To be used in a script
		return ttSt;
	};  // End TTState() -> {}


	// To put on the window object, or export into a module
    return TTState;
}));
