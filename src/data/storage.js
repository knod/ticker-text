/* storage.js
* 
* Destructive, unfortunately - doesn't mutate settings,
* just recreates them. All async :/
* 
* For now, chrome extension storage. Migrate in future.
* https://developer.chrome.com/extensions/storage
*/

'use strict';


(function (root, storeFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [], function () {
        	return ( root.TTStorage = storeFactory() );
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = storeFactory();
    } else {
        // Browser globals
        root.TTStorage = storeFactory();
    }
}(this, function () {

	var TTStorage = function () {
	/* ( None ) -> TTStorage
	* 
	*/
		var tSto = {};
		tSto.id = 'storage';

		var browser = browser || chrome;


		tSto.get = function ( keyOrKeys, callback ) {
			callback = callback || function(){};
			browser.storage.sync.get( keyOrKeys, function loadOldTTSettings( settings ) {
				callback( arguments );
			});
		};  // End tSto.get()


		tSto.set = function ( settings, callback ) {
		// Set any number of settings key/value pairs.
		// It's an extension, so objects are valid values, but they
		// can only be one deep as far as I can tell.
			// Docs say no args returned
			callback = callback || function(){};
			browser.storage.sync.set( settings, callback );
		};  // End tSto.set()

		tSto.save = tSto.set;


		tSto.loadAll = function ( callback ) {
			callback = callback || function(){};
			browser.storage.sync.get( null, function loadAllOldTTSettings( settings ) {
				callback( arguments );
			});
		};  // End tSto.loadAll()


		tSto.cleanSave = function ( settings, callback ) {
			callback = callback || function(){};
			browser.storage.sync.clear( function clearTTSettings() {
				// Docs say no args returned
				browser.storage.sync.set( settings, callback );
			});
		};  // End tSto.cleanSave()


		tSto.clear = function ( callback ) {
			// Docs say no args returned
			callback = callback || function(){};
			browser.storage.sync.clear( callback );
		};  // End tSto.clear()


		tSto.remove = function ( keyOrKeys, callback ) {
			// Docs say no args returned
			callback = callback || function(){};
			browser.storage.sync.remove( keyOrKeys, callback );
		};  // End tSto.remove()


		return tSto;
	};  // End TTStorage() -> {}

    return TTStorage;
}));
