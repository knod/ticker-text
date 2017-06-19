// main.js
// __dirname === '/src'

(function(){

	// console.log('__dirname:', __dirname);

	var constructors = {
		topLevel: {
			// TODO: These next:
			Storage: require( './data/storage.js' ),
			Emitter: require( 'wolfy87-eventemitter' ),
			State: require( './data/state.js' ),
			UI: require( './ui/ui-manager.js' )
		},
		ui: {
			PlaybackUI: require( './ui/playback' )
		}
	};

	var filepaths = {
		ui: {
			core: 'css/iframe.css',
			playback: 'css/playback.css',
			settings: 'css/settings.css'
		}
	};

	var TT = require( './ticker-text.js' );
	var tt = new TT( constructors, filepaths );

})();
