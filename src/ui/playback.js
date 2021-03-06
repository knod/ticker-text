/* playback.js
* 
* Pause, play, rewind, fast-forward, and scrub ui. Includes
* progress bar. Name is not accurate, but it is clear and
* recognizable.
* 
* Inspired by https://github.com/jamestomasino/read_plugin/blob/master/Read.js
* 
* TODO:
* - ??: How to prevent play/pause flashes when not wanted? Maybe
* 	default `player` shouldn't fire playBegin, etc. if already
* 	playing, etc?
* - click on 'timer' pauses, lift off plays if was playing (?)
* - Organize into `state` events and dom events
* - If only one letter at a time, blink/pulse letters so double
* 	letters are clearer.
*/

'use strict';


(function (root, ttpFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', '@knod/playback', 'nouislider' ], function ( jquery, playback, noUi ) {
        	return ( root.TT = ttpFactory( jquery , playback, noUi ) );
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = ttpFactory( require('jquery'), require('@knod/playback'), require( 'nouislider' ) );
    } else {
        // Browser globals
        root.TTPlaybackUI = ttpFactory( root.jQuery, root.Playback, root.noUiSlider );
    }
}(this, function ( $, Player, noUiSlider ) {

	'use strict';

	var PlaybackUI = function ( state, coreUIObj, constructors, filepaths ) {
	/* ( {}, {} ) -> PlaybackUI
	* 
	* 
	*/
		var tPUI = {};
		tPUI.id = 'playbackUI';

		var browser = state.browser;

		tPUI.modifierKeysDown = [];  // Will be emptied when app is closed
		tPUI.sentenceModifierKey = 18;  // 'alt'

		tPUI.isOpen 	 = false;
		tPUI.isScrubbing = false;
		tPUI.nodes 		 = {};
		var nodes 		 = tPUI.nodes;

		var progressNode, percentDone, scrubber;
		var indicator, textButton, loading;
		var playPauseFeedback, playFeedback, pauseFeedback;
		var controls;  // We'll see how this one shapes up. May need it outside the iframe
		var rewindSentence, readFullArticle;

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

		var fullArticlePath = browser.extension.getURL('images/full-article.svg');
		var fullArticleStr 	= '<img src="' + fullArticlePath + '"></img>';



		// =========== RUNTIME ACTIONS =========== \\

		tPUI.clearModKeys = function () {
			tPUI.modifierKeysDown = [];
			return tPUI;
		};

		// -- iterable -- \\
		tPUI.open = function () {
			tPUI.isOpen = true;
			state.player.current();  // show current fragment
			// get it in a non-jump state and, ideally, back to its previous play/pause state...
			state.player.revert();

			// For scrubber bar when something new is processed
			// TODO: ??: Give `player` a 'processBegin' and 'processFinish'?
			 tPUI._setInitialValues();
			$(playPauseFeedback).hide();

			textButton.focus();
			// TODO: Brainstorm better indicator for clicking/activating on text

			return tPUI;
		};
		tPUI.play = function () {
			state.player.play();
			tPUI._showPlay( true ); // (how to do the same with pause on open...?)
			return tPUI;
		};
		tPUI.close = function () {
			tPUI.isOpen = false;
			return tPUI;
		};
		tPUI.update = function () {
			// state.player.current();  // show current fragment
			// // get it in a non-jump state and, ideally, back to its previous play/pause state...
			// state.player.revert();
			// return tPUI;
		};  // End tPUI.update()

		// -- non-iterable -- \\

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

		// TODO: Add requirements for when showing play/pause or not...
		// When user gives play/pause input - toggles button
		// ??: When rewind/ffwd stops and play/pause is resumed?
		// ??: When arrow is no longer held down and play/pause is resumed?
		// ??: When scrubber is released?

		var wasJustToggled = false;

		tPUI._shouldShow = function () {
			var doShow = false;
			
			if ( typeof override === 'boolean' ) {
				doShow = override
			} else if ( wasJustToggled ) {
				// console.log( 'was toggled before:', wasJustToggled );
				wasJustToggled = false;
				doShow = true;
			}

			return doShow;
		};  // End tPUI._shouldShow()


		tPUI._showPlay = function ( doShow ) {

			// For scrubber bar when something new is processed
			// TODO: ??: Give `player` a 'processBegin' and 'processFinish'?
			if ( state.player.getIndex() === 0 ) { tPUI._setInitialValues(); }

			var shouldShow = tPUI._shouldShow();
			if ( doShow === true || shouldShow ) {
				$(playFeedback).removeClass('__tt-hidden');
				$(pauseFeedback).addClass('__tt-hidden');
				// https://jsfiddle.net/aL7kxe78/3/ fadeOut (ends with display: none)
				// http://stackoverflow.com/a/4549418/3791179 <- opacity
				$(playPauseFeedback).fadeTo(0, 0.7).fadeTo(700, 0)
			}

			return tPUI;
		};

		tPUI._showPause = function ( doShow ) {

			var shouldShow = tPUI._shouldShow();
			if ( doShow === true || shouldShow ) {
				$(pauseFeedback).removeClass('__tt-hidden');
				$(playFeedback).addClass('__tt-hidden');
				$(playPauseFeedback).fadeTo(0, 0.7).fadeTo(700, 0)
			}

			return tPUI;
		};

		tPUI._togglePlayPause = function () {
			state.player.revert();
			wasJustToggled = true;
			state.player.toggle();
			return tPUI;
		};


		tPUI._rewindSentence = function () {
			state.player.prevSentence();
			state.player.revert();
			return tPUI;
		};


		// ----- TIMER EVENTS ----- \\
		var whiteSpaceRegexp = /[\n\r\s]/;
		var paragraphSymbol  = '';
		tPUI._showNewFragment = function ( evnt, player, fragment ) {
			var chars = fragment;
			// Adds pauses for line breaks
			// TODO: Deal with line breaks in player instead? Or state?
			// TODO: Allow customization of pause for paragraph
			if ( !whiteSpaceRegexp.test(chars) ) {
				$(textButton).html( chars );
			} else {
				$(textButton).html( paragraphSymbol );
			}
			tPUI.stopWaiting();
			return tPUI;
		};


		tPUI._showProgress = function ( evnt, player, fraction ) {
		// TODO: Needs some work
			if ( !tPUI.isScrubbing ) {  // Don't mess timing up with transitions
				progressNode.noUiSlider.set( player.getIndex() );  // version 8 nouislider
			}
			return tPUI;
		};


		tPUI._setInitialValues = function () {
			progressNode.noUiSlider.updateOptions({
				range: { min: 0, max: ( state.player.getLength() - 1 ) }
			});
			return tPUI;
		}


		// --------- SCRUBBER EVENTS --------- \\
		tPUI._startScrubbing = function ( values, handle ) {
			tPUI.isScrubbing = true;
			return tPUI;
		};  // End tPUI._startScrubbing()


		tPUI._updateScrubbedWords = function ( values, handle ) {
			state.player.jumpTo( parseInt( values[ handle ] ) );
			return tPUI;
		};  // End tPUI._updateScrubbedWords()


		tPUI._stopScrubbing = function ( values, handle ) {
			tPUI.isScrubbing = false;
			state.player.revert();
			return tPUI;
		};  // End tPUI._stopScrubbing()


		tPUI.keyUp = function ( evnt ) {

			// If it was closed, the list of keys down is destroyed anyway
			if ( !tPUI.isOpen ) { return tPUI; };

			var keyCode = evnt.keyCode || evnt.which || evnt.charCode;
			var smod 	= tPUI.sentenceModifierKey;

			// Modifier keys
			if ( keyCode === smod ) {

				var smodi = tPUI.modifierKeysDown.indexOf( smod );
				if ( smodi > -1 ) { tPUI.modifierKeysDown.splice( smodi ) }

			// If it's not a modifier key, revert
			} else {
				state.player.revert()
			}

			return tPUI;
		};  // End tPUI.keyUp()


		tPUI.keyDown = function ( evnt ) {

			// If the app isn't open, don't want to get errors for trying
			// to do impossible stuff and don't want to change position in text
			if ( !tPUI.isOpen ) { return tPUI; };

			var keyCode = evnt.keyCode || evnt.which || evnt.charCode;
			var smod = tPUI.sentenceModifierKey;

			// Modifier keys
			if ( keyCode === smod && tPUI.modifierKeysDown.indexOf( smod ) === -1 ) {
				tPUI.modifierKeysDown.push( smod )
			}

			if ( tPUI.modifierKeysDown.indexOf( smod ) > -1 ) {
				if ( keyCode === 39 ) { state.player.nextSentence(); }
				else if ( keyCode === 37 ) { state.player.prevSentence(); }
			} else {
				if ( keyCode === 39 ) { state.player.nextWord(); }
				else if ( keyCode === 37 ) { state.player.prevWord(); }
			}

			return tPUI;
		};  // End tPUI.keyDown()


		// =========== INITIALIZE =========== \\

		tPUI._progressSlider = function ( progNode ) {
		/* ( DOM Node ) -> same DOM Node
		* 
		* Turn the given data into one noUiSlider slider
		*/
			// To keep handles within the bar
			$(progNode).addClass('noUi-extended');

			var slider = noUiSlider.create( progNode, {
				range: { min: 0, max: 1 },
				start: 0,
				step: 1,
				connect: [true, false],
				handles: 1,
				behaviour: 'tap'
			});

			return progNode;
		};  // End tPUI._progressSlider()


		tPUI._addEvents = function () {
			// Timer events
			state.emitter.on( 'playBegin', tPUI._showPlay );
			state.emitter.on( 'pauseFinish', tPUI._showPause );
			// state.emitter.on( 'startFinish', tPUI._start );
			state.emitter.on( 'newWordFragment', tPUI._showNewFragment );
			state.emitter.on( 'progress', tPUI._showProgress );

			// Scrubber events
			progressNode.noUiSlider.on( 'start', tPUI._startScrubbing );
			progressNode.noUiSlider.on( 'slide', tPUI._updateScrubbedWords );
			progressNode.noUiSlider.on( 'change', tPUI._stopScrubbing );

			// DOM events
			$(textButton).on( 'touchend click', tPUI._togglePlayPause );
			$(rewindSentence).on( 'touchend click', tPUI._rewindSentence );

			// Keyboard input
			// Arrow keys only listen to the keydown and keyup event, not keypress
			$(coreUIObj.nodes.doc).on( 'keydown', tPUI.keyDown );
			$(coreUIObj.nodes.doc).on( 'keyup', tPUI.keyUp );
			// TODO: ??: Should we really listen to the rest of the document?
			$(document.body).on( 'keydown', tPUI.keyDown );
			$(document.body).on( 'keyup', tPUI.keyUp );

			return tPUI;
		};  // End tPUI._addEvents()


		tPUI._init = function () {

			state.player._stepper.id 	= 'stepper';
			state.player._delayer.id 	= 'delayer';

			tPUI.modifierKeysDown = [];  // TODO: Empty non-destructively
			tPUI.sentenceModifierKey = 18;  // 'alt' TODO: Modifiable?

			progressNode = nodes.progressNode = $( progStr )[0];

			indicator = nodes.indicator = $( indicatorStr )[0];
			// ??: Should this really be a button? How do the rest of the controls fit into this?
			// ??: Should there just be an invisible set of controls that accessible aids can grab hold of
			textButton 	= nodes.textButton 	= $( textButtonStr )[0];
			loading 	= nodes.loading 	= $( loadingStr )[0];

			playPauseFeedback 	= nodes.playPauseFeedback 	= $( feedbackStr )[0];
			playFeedback 		= nodes.playFeedback  		= $( playPauseFeedback ).find( '#__tt_play_feedback' )[0];
			pauseFeedback 		= nodes.pauseFeedback 		= $( playPauseFeedback ).find( '#__tt_pause_feedback' )[0];

			// // Go in .tt-bar-center .tt-below? Go outside of iframe?
			// controls = nodes.controls = $(controlsStr)[0];

			rewindSentence = nodes.rewindSentence = $( rewindSentenceStr )[0];

			readFullArticle = nodes.readFullArticle = $( fullArticleStr )[0];

			var coreNodes = coreUIObj.nodes;
			
			$(progressNode).appendTo( coreNodes.above );
			// Must add it after it belongs ot the right document so nouislider
			// is listening to the right document
			// TODO: ??: File issue with nouislider that owner of slider should
			// always be checked? Still an issue?
			tPUI._progressSlider( progressNode );

			$(indicator).appendTo( coreNodes.textElements );
			$(textButton).appendTo( coreNodes.textElements );
			$(loading).appendTo( coreNodes.textElements );
			$(playPauseFeedback).appendTo( coreNodes.textElements );
			
			$(controls).appendTo( coreNodes.bar );
			$(rewindSentence).appendTo( coreNodes.barLeft );
			$( readFullArticle ).appendTo( coreNodes.readFullArticle );

			coreUIObj.addTriggerable( tPUI );

			tPUI._addEvents();

			textButton.focus();

			return tPUI;
		};  // End tPUI._init()


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		tPUI._init();

		// To be called in a script
		return tPUI;
	};  // End PlaybackUI() -> {}


	// To put on the window object, or export into a module
    return PlaybackUI;
}));
