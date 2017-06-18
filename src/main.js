// main.js
// __dirname === '/src'

(function(){


	console.log('__dirname:', __dirname);

	var constructors = {
		UI: require( './ui/ui-manager.js' )
	};

	var filepaths = {
		ui: {core: 'css/iframe.css'}
	};

	var TT = require( './ticker-text.js' );
	var tt = new TT( constructors, filepaths );

})();
