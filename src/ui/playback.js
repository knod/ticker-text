/* playback.js
* 
* Pause, play, rewind, fast-forward, and scrub
* controls. Includes progress bar. Name is not
* accurate, but it is clear and recognizable.
* 
* Inspired by https://github.com/jamestomasino/read_plugin/blob/master/Read.js
* 
* TODO:
* - click on 'timer' pauses, lift off plays if was playing
*/

'use strict';


(function (root, ttpFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', '@knod/playback' ], function ( jquery, playback ) {
        	return ( root.TT = ttpFactory( jquery , playback ) );
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = ttpFactory( require('jquery'), require('@knod/playback') );
    } else {
        // Browser globals
        root.TTPlaybackUI = ttpFactory( root.jQuery, root.Playback );
    }
}(this, function ( $, PlaybackControl ) {

	'use strict';

	var PlaybackUI = function ( state, coreUIObj, filepaths ) {
	/* ( {}, {} ) -> PlaybackUI
	* 
	* 
	*/
		var tPUI = {};
		tPUI.id = 'playbackUI';

		var browser = chrome || browser;

		tPUI.modifierKeysDown = [];  // Will be emptied when app is closed
		tPUI.sentenceModifierKey = 18;  // 'alt'

		tPUI.isOpen 	 = false;
		tPUI.isScrubbing = false;
		tPUI.nodes 		 = {};
		var nodes 		 = tPUI.nodes;

		var progressNode, percentDone, scrubber;
		var indicator, textButton, loading;
		var playPauseFeedback, playFeedback, pauseFeedback;
		var controls;  // We'll see how this one shapes up
		var rewindSentence;

		var progStr = '<div id="__tt_progress"></div>';

		var indicatorStr 	= '<div id="__tt_indicator" class="__tt-transform-centered"></div>',
			textButtonStr 	= '<button id="__tt_text_button"></button>';

		var loadingPath 	= browser.extension.getURL('images/swirl.svg'),
			loadingStr 		= '<div id="__tt_loading" class="__tt-hidden"><img src="' + loadingPath + '"></img></div>';

		var feedbackStr = '<div id="__tt_play_pause_feedback" class="__tt-transform-centered">\
	<div id="__tt_pause_feedback" class="__tt-playback-feedback __tt-transform-centered">||</div>\
	<div id="__tt_play_feedback" class="__tt-playback-feedback __tt-transform-centered">></div>\
</div>';

// 		var controlsStr = '<div id="__tt_playback_controls">\
// 	<button id="__tt_rewind_sentence" class="__tt-playback-button"></button>\
// 	<button id="__tt_rewind_word" class="__tt-playback-button"></button>\
// 	<button id="__tt_fastforward_word" class="__tt-playback-button"></button>\
// 	<button id="__tt_fastforward_sentence" class="__tt-playback-button"></button>\
// </div>';

		var rewPath = browser.extension.getURL('images/back-one-sentence.svg');
		// TODO: Credit for icon (color altered): <div>Icons made by <a href="http://www.flaticon.com/authors/madebyoliver" title="Madebyoliver">Madebyoliver</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
		var rewindSentenceStr = '<button id="__tt_rewind-sentence" class="__tt-big-menu-button">\
	<img src="' + rewPath + '"></img>\
</button>';



		// =========== RUNTIME ACTIONS =========== \\

		tPUI.clearModKeys = function () {
			tPUI.modifierKeysDown = [];
			return tPUI;
		};
		tPUI.open = function () {
			tPUI.isOpen = true;
			tPUI.controller.current();  // show current fragment
			$(playPauseFeedback).hide();
			return tPUI;
		};
		tPUI.close = function () {
			tPUI.isOpen = false;
			return tPUI;
		};

		tPUI.hideText = function () {
			$(textButton).addClass('__tt-hidden');
			return tPUI;
		};
		tPUI.showText = function () {
			$(textButton).removeClass('__tt-hidden');
			return tPUI;
		};


		tPUI.wait = function () {
			tPUI.hideText();
			$(loading).addClass('__tt-rotating');
			$(loading).removeClass('__tt-hidden');
			return tPUI;
		};
		tPUI.stopWaiting = function () {
			$(loading).addClass('__tt-hidden');
			$(loading).removeClass('__tt-rotating');
			tPUI.showText();
			return tPUI;
		};


		tPUI.clearText = function () {
			$(textButton).html("");
			return tPUI;
		};



		// ----- DOM EVENTS ----- \\
		tPUI.play = function () {
			$(playFeedback).removeClass('__tt-hidden');
			$(pauseFeedback).addClass('__tt-hidden');
			// https://jsfiddle.net/aL7kxe78/3/ fadeOut (ends with display: none)
			// http://stackoverflow.com/a/4549418/3791179 <- opacity
			$(playPauseFeedback).fadeTo(0, 0.7).fadeTo(700, 0)
			return tPUI;
		};

		tPUI.pause = function () {
			$(pauseFeedback).removeClass('__tt-hidden');
			$(playFeedback).addClass('__tt-hidden');
			$(playPauseFeedback).fadeTo(0, 0.7).fadeTo(700, 0)
			return tPUI;
		};

		tPUI._togglePlayPause = function () {
			tPUI.controller.toggle();
			return tPUI;
		};


		tPUI._rewindSentence = function () {
			tPUI.controller.prevSentence();
			return tPUI;
		};


		// ----- TIMER EVENTS ----- \\
		var whiteSpaceRegexp = /[\n\r\s]/;
		var paragraphSymbol  = '';
		tPUI._showNewFragment = function ( evnt, control, fragment ) {
			var chars = fragment;
			// Adds pauses for line breaks
			// TOOD: Deal with line breaks in control instead? Or state?
			if ( !whiteSpaceRegexp.test(chars) ) {
				$(textButton).html( chars );
			} else {
				$(textButton).html( paragraphSymbol );
			}
			tPUI.stopWaiting();
			return tPUI;
		};


		tPUI._showProgress = function ( evnt, control, fraction ) {
		// TODO: Needs some work
			// if ( !tPUI.isScrubbing ) {  // Don't mess timing up with transitions
			// 	progressNode.noUiSlider.set( control.getIndex() );  // version 8 nouislider
			// }
			return tPUI;
		};


		tPUI._start = function () {
			// progressNode.noUiSlider.updateOptions({
			// 	range: { min: 0, max: ( tPUI.controller.getLength() - 1 ) }
			// });
			return tPUI;
		}


		// --------- SCRUBBER EVENTS --------- \\
		tPUI._startScrubbing = function ( values, handle ) {
			tPUI.isScrubbing = true;
			return tPUI;
		};  // End tPUI._startScrubbing()


		tPUI._updateScrubbedWords = function ( values, handle ) {
			// tPUI.controller.jumpTo( parseInt( values[ handle ] ) );
			return tPUI;
		};  // End tPUI._updateScrubbedWords()


		tPUI._stopScrubbing = function ( values, handle ) {
			// tPUI.isScrubbing = false;
			// // tPUI.controller.disengageJumpTo();
			return tPUI;
		};  // End tPUI._stopScrubbing()


		tPUI.keyUp = function ( evnt ) {

			// If it was closed, the list of keys down is destroyed anyway
			if (!tPUI.isOpen) { return tPUI; };

			var keyCode = evnt.keyCode || evnt.which || evnt.charCode;
			var smod 	= tPUI.sentenceModifierKey;

			// Modifier keys
			if ( keyCode === smod ) {

				var smodi = tPUI.modifierKeysDown.indexOf( smod );
				if ( smodi > -1 ) { tPUI.modifierKeysDown.splice( smodi ) }
			}

			return tPUI;
		};  // End tPUI.keyUp()


		tPUI.keyDown = function ( evnt ) {

			// If the app isn't open, don't want to get errors for trying
			// to do impossible stuff and don't want to change position in text
			if (!tPUI.isOpen) { return tPUI; };

			var keyCode = evnt.keyCode || evnt.which || evnt.charCode;
			var smod = tPUI.sentenceModifierKey;

			// Modifier keys
			if ( keyCode === smod && tPUI.modifierKeysDown.indexOf( smod ) === -1 ) {
				tPUI.modifierKeysDown.push( smod )
			}

			if ( tPUI.modifierKeysDown.indexOf( smod ) > -1 ) {
				if ( keyCode === 39 ) { tPUI.controller.nextSentence(); }
				else if ( keyCode === 37 ) { tPUI.controller.prevSentence(); }
			} else {
				if ( keyCode === 39 ) { tPUI.controller.nextWord(); }
				else if ( keyCode === 37 ) { tPUI.controller.prevWord(); }
			}

			return tPUI;
		};  // End tPUI.keyDown()


		// =========== INITIALIZE =========== \\

		tPUI._progressSlider = function ( progNode ) {
		/* ( DOM Node ) -> same DOM Node
		* 
		* Turn the given data into one noUiSlider slider
		*/
			// // To keep handles within the bar
			// $(progNode).addClass('noUi-extended');

			// var slider = noUiSlider.create( progNode, {
			// 	range: { min: 0, max: 1 },
			// 	start: 0,
			// 	step: 1,
			// 	connect: [true, false],
			// 	handles: 1,
			// 	behaviour: 'tap'
			// });

			// return progNode;
		};  // End tPUI._progressSlider()


		tPUI._addEvents = function ( coreUIObj ) {
			// Timer events
			state.emitter.on( 'playBegin', tPUI.play );
			state.emitter.on( 'pauseFinish', tPUI.pause );
			state.emitter.on( 'startFinish', tPUI._start );
			state.emitter.on( 'newWordFragment', tPUI._showNewFragment );
			// state.emitter.on( 'progress', tPUI._showProgress );

			// // Scrubber events
			// progressNode.noUiSlider.on( 'start', tPUI._startScrubbing );
			// progressNode.noUiSlider.on( 'slide', tPUI._updateScrubbedWords );
			// progressNode.noUiSlider.on( 'change', tPUI._stopScrubbing );

			// DOM events
			$(textButton).on( 'touchend click', tPUI._togglePlayPause );
			$(rewindSentence).on( 'touchend click', tPUI._rewindSentence );

			// Keyboard input
			// Arrow keys only listen to the keydown and keyup event, not keypress
			$(coreUIObj.nodes.doc).on( 'keydown', tPUI.keyDown );
			$(coreUIObj.nodes.doc).on( 'keyup', tPUI.keyUp );
			$(document.body).on( 'keydown', tPUI.keyDown );
			$(document.body).on( 'keyup', tPUI.keyUp );

			return tPUI;
		};  // End tPUI._addEvents()


		tPUI._init = function ( coreUIObj ) {

			tPUI.controller = new PlaybackControl( state );
			state.setProcessor( tPUI.controller );

			tPUI.modifierKeysDown = [];  // TODO: Empty non-destructively
			tPUI.sentenceModifierKey = 18;  // 'alt' TODO: Modifiable?

			// progressNode = nodes.progressNode = $(progStr)[0];
			// tPUI._progressSlider( progressNode );

			indicator = nodes.indicator = $(indicatorStr)[0];
			// ??: Should this really be a button? How do the rest of the controls fit into this?
			// ??: Should there just be an invisible set of controls that accessible aids can grab hold of
			textButton 	= nodes.textButton 	= $(textButtonStr)[0];
			loading 	= nodes.loading 	= $(loadingStr)[0];

			playPauseFeedback 	= nodes.playPauseFeedback 	= $(feedbackStr)[0];
			playFeedback 		= nodes.playFeedback  		= $(playPauseFeedback).find('#__tt_play_feedback')[0];
			pauseFeedback 		= nodes.pauseFeedback 		= $(playPauseFeedback).find('#__tt_pause_feedback')[0];

			// // Go in .tt-bar-center .tt-below?
			// controls = nodes.controls = $(controlsStr)[0];

			rewindSentence = nodes.rewindSentence = $(rewindSentenceStr)[0];

			var coreNodes = coreUIObj.nodes;
			// $(progressNode).appendTo( coreNodes.above );
			$(playPauseFeedback).appendTo( coreNodes.barCenter );

			$(indicator).appendTo( coreNodes.textElements );
			$(textButton).appendTo( coreNodes.textElements );
			$(loading).appendTo( coreNodes.textElements );
			
			$(controls).appendTo( coreNodes.bar );
			$(rewindSentence).appendTo( coreNodes.barLeft );

			// STYLES

			var styles1 	= coreNodes.doc.createElement("link");
			styles1.href 	= browser.runtime.getURL( filepaths.playback );
			styles1.type 	= "text/css";
			styles1.rel 	= "stylesheet";
			$(styles1).appendTo( coreNodes.head );

			coreUIObj.addTriggerable( tPUI );

			tPUI._addEvents( coreUIObj );

			return tPUI;
		};  // End tPUI._init()


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		tPUI._init( coreUIObj );

		// To be called in a script
		return tPUI;
	};  // End PlaybackUI() -> {}


	// To put on the window object, or export into a module
    return PlaybackUI;
}));
