// main.js
// __dirname === '/src'

(function(){

	// TODO: Fix playback repo to use state.settings instead

	// console.log('__dirname:', __dirname);

	var constructors = {
		topLevel: {
			Storage: 	require( './data/storage.js' 	),
			Emitter: 	require( 'wolfy87-eventemitter' ),
			State: 		require( './data/state.js' 		),
			Parser: 	require( './parse/parser.js' 	),
			Player: 	require( '@knod/playback' ),
			UI: 		require( './ui/core-ui.js' 	)
		},
		ui: {
			PlaybackUI: require( './ui/playback.js' ),
			SettingsUI: require( './ui/settings/settings-core.js' ),
			settings: {
				Delays: require( './ui/settings/delays.js' ),
				Appearance: require( './ui/settings/appearance.js' )
			}
		}
	};

	var filepaths = {
		ui: {
			core: 		'css-iframe/iframe.css',
			playback: 	'css-iframe/playback.css',
			settings: 	'css-iframe/settings.css',
			sliders: 	'css-iframe/noUI.css'
		}
	};

	var TT = require( './ticker-text.js' );
	var tt = new TT( constructors, filepaths );

})();
