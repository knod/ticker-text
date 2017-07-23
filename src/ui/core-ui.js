/* core-ui.js
* 
* Just the TT text display, including areas for
* future buttons. No settings, etc.
* 
* Inspired by https://github.com/jamestomasino/read_plugin/blob/master/Read.js
* 
* NOTES:
* - name - TTBar? TTSee?
* 
* TODO:
* - Consider prepending main element as opposed to appending it. Possibly
* 	easer for screen readers/tabing to find more quickly (so the controls
* 	can be accessed more quickly). Though now it's an iframe, so how does
* 	that work for accessibility...? Maybe set up some tab-able controls
* 	that are invisibile that are outside of the iframe...
* - Re-fetch word on view update in case the word is now to long for the
* 	viewport.
*/

'use strict';

(function (root, uiFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery' ], function ( jquery ) { return ( root.TTCoreUI = uiFactory( jquery ) ); });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = uiFactory( require('jquery') );
    } else {
        // Browser globals
        root.TTCoreUI = uiFactory( root.jQuery );
    }
}(this, function ( $ ) {

	var TTCoreUI = function ( state, parentNode, constructors, filepaths ) {
	/*
	* 
	* `filepaths` has paths for child modules and iframe filepaths
	* for css files.
	*/
		var browser = chrome || browser;

		var tCui = {};
		tCui.id = 'coreUI'

		var tickerText, textElems, $iframe;
		tCui._toTrigger = {};

		var originalBodyMarginTop = window.getComputedStyle( document.body ).marginTop;
		console.log( originalBodyMarginTop );



		// =========== DOM STRINGS =========== \\

		var iframeStr = '<iframe id="__tt_iframe" title="Ticker Text article reader."></iframe>';
		// var cssStr = '<link>' + coreCSSstr + '\n' + nouiCSSstr + '</link>';

		var css1 = '<link rel="stylesheet" href="' + filepaths.core + '">';
		// var css2 = '<link rel="stylesheet" href="' + filepaths.noui + '">';

		//  TODO: Change (almost) all these to id's
		var contentStr = '<div id="__tt">\n\
	<div id="__tt_above_bar" class="__tt-main-section"></div>\n\
	<div id="__tt_bar" class="__tt-main-section">\n\
		<div id="__tt_bar_left" class="__tt-bar-section"></div>\n\
		<div id="__tt_bar_center" class="__tt-bar-section">\n\
			<div id="__tt_above_text_elements"></div>\n\
			<div id="__tt_left_text_elements"></div>\n\
			<div id="__tt_text_elements"></div>\n\
			<div id="__tt_right_text_elements"></div>\n\
			<div id="__tt_below_text_elements"></div>\n\
		</div>\n\
		<div id="__tt_bar_right" class="__tt-bar-section">\n\
			<button id="__tt_close" class="__tt-sup-menu-button">X</button>\n\
		</div>\n\
	</div>\n\
	<div id="__tt_below_bar" class="__tt-main-section __tt-hidden"></div>\n\
</div>';



		// =========== HOOKS =========== \\

		tCui.addTriggerable = function ( triggerable ) {
		/* {} -> TTCoreUI */

			if ( !tCui._toTrigger[ triggerable.id ] ) {
				tCui._toTrigger[ triggerable.id ] = triggerable;
			}

			return tCui;
		};



		// =========== RUNTIME ACTIONS =========== \\

		tCui.triggerTriggerable = function ( ourFuncName, theirFuncName ) {
			for ( var trigID in tCui._toTrigger ) {
				let obj = tCui._toTrigger[ trigID ]
				if ( obj[ theirFuncName ] ) { console.log( 'triggering', theirFuncName, 'in', obj ); obj[ theirFuncName ](); }
			};
			// Important note: This object always updates last. May matter.
			if ( ourFuncName ) { tCui[ ourFuncName ](); }
			return tCui;
		};  // End tCui.triggerTriggerable()

		tCui.close = function () {
		// This is where everything gets closed, paused, put away
			// tCui.hide();
			// for ( var trigID in tCui._toTrigger ) {
			// 	let obj = tCui._toTrigger[ trigID ]
			// 	if ( obj.close ) obj.close();
			// };
			// return tCui;
			return tCui.triggerTriggerable( 'hide', 'close' );
		};

		tCui.open = function () {
			// tCui.show();
			// for ( var trigID in tCui._toTrigger ) {
			// 	let obj = tCui._toTrigger[ trigID ]
			// 	if ( obj.open ) obj.open();
			// };
			// return tCui;
			return tCui.triggerTriggerable( 'show', 'open' );
		};

		tCui.loadData = function ( stepper ) {
			tCui.playbackUI.loadPlayer( stepper );
			return tCui;
		};  // End tCui.loadData()

		tCui.start = function () {
			// tCui.show();
			// for ( var trigID in tCui._toTrigger ) {
			// 	let obj = tCui._toTrigger[ trigID ]
			// 	if ( obj.play ) obj.play();
			// };
			// return tCui;
			return tCui.triggerTriggerable( 'show', 'play' );
		};

		tCui.play = function () {
			return tCui.triggerTriggerable( 'show', 'play' );
		}


		tCui.show = function () {
			$iframe.show();
			$(tickerText).slideDown( 200, function updateAfterShow() { tCui.update(); } );  // can't `.update()` at end
			return tCui;
		};

		tCui.wait = function () {
			tCui._toTrigger.playbackUI.wait();
		}

		tCui.hide = function () {
			$iframe.hide();
			$(tickerText).slideUp( 200 );
			// Other stuff is in a setTimeout and this needs to run after those
			// They're waiting for other DOM updates, so have to be in a setTimeout
			// We're kind of hosed.
			setTimeout(function restoreBodyMargin() {
				// Nested for the same reason
				// setTimeout(function(){
					setTimeout(function(){
						document.body.style.marginTop = originalBodyMarginTop;
						// console.log( 'hiding', originalBodyMarginTop, window.getComputedStyle(document.body).marginTop );
					}, 0);
				// }, 0);
			}, 0);
			return tCui;
		};

		tCui.destroy = function () {
			$(tickerText).remove();
			return tCui;
		};


		tCui._resizeBarElements = function () {

			if ( !tCui.nodes ) { return tCui; }

			// var left 	= tCui.nodes.barLeft,
			// 	right 	= tCui.nodes.barRight,
			// 	center 	= tCui.nodes.barCenter;

			// var lStyles = window.getComputedStyle( left ),
			// 	rStyles = window.getComputedStyle( right ),
			// 	cStyles = window.getComputedStyle( center );

			// var lWidth = parseFloat( lStyles.width ),
			// 	rWidth = parseFloat( rStyles.width );

			// // This assumes that left is always bigger than right,
			// // which is a shame, but maybe necessary so that we don't
			// // get stuck with something tiny
			// if ( lWidth > rWidth ) {
			// 	right.style.width = lWidth + 'px';  // TODO: ??: How to change to `em`?
			// }

			// Works, but sometimes not till the update after the one that has the change
			// Problem with element not being rendered yet, but no solution
			// yet found.

			// tCui.nodes.textElements.style.overflow 	= 'hidden';
			tCui.nodes.textElements.style.flexBasis = 'auto';
			tCui.nodes.barCenter.style.flexBasis 	= 'auto';
			// Let styles take effect, I hope... (https://stackoverflow.com/a/21043017)
			// Set what the max number of characters could be if based only on the DOM
			setTimeout(function() {
				// var styles 		= window.getComputedStyle( tCui.nodes.doc.querySelector( '#__tt_text_button' ) ),
				var styles 		= window.getComputedStyle( tCui.nodes.barCenter ),
					width 		= parseFloat( styles.width ),
					fontSize 	= parseFloat( styles.fontSize ),
					elemChars 	= Math.floor( width / fontSize );
				state.set( { id: 'stepper' }, { widthByEm: elemChars } );



				var DOMWidth 	= state.stepper.widthByEm,
					userWidth 	= state.stepper.maxNumCharacters_user,
					width 		= null;
				// Get the smaller between the element width and the user setting
				if ( DOMWidth && DOMWidth <= userWidth ) { width = DOMWidth; }
				else {
					// Give a little padding if possible
					if ( DOMWidth === undefined || DOMWidth >= userWidth + 2 ) { width = userWidth + 2; }
					else { width = userWidth; }
				}

				// console.log( 'DOMWidth:', DOMWidth, '; userWidth:', userWidth, '; final width:', width );

				// Update the size of the elements
				var elem = tCui.nodes.textElements,
					text = elem.querySelector( '#__tt_text_button' );
				state.set( {id: 'stepper'}, { maxNumCharacters: width } );
				// text.style.maxWidth = width + 'em';
				elem.style.flexBasis = width + 'em';
				// elem.style.width = 2 + 'em';
				tCui.nodes.barCenter.style.flexBasis = width + 'em';

			}, 0);

		};  // End tCui._resizeBarElements()


		// iframe element sizing
		// https://jsfiddle.net/fpd4fb80/31/
		tCui._resizeIframeAndContents = function () {
			// There should only be one (for now...)
			var grower = $(tickerText).find('.__tt-to-grow')[0];

			// For when the element isn't made yet or isn't visible
			if ( !grower ) { return tCui; }

			var scrollable = $(grower).parent()[0],
				scrollRect = scrollable.getBoundingClientRect();

			// Get the difference between the lowest point of the
			// unscrolled scrollable content and the lowest visible point
			// Takes into account everything above and including, but not
			// below, the scrollable content

			// Takes into account everything above the scrollable element
			// including borders/padding/etc.
			var top 			= scrollable.getBoundingClientRect().top,
			// Takes into account the height of the element that's
			// currently going to be scrolled
				height 			= grower.getBoundingClientRect().height || 0,
			// The bottom of where the contents would end if you weren't
			// scrolled and no adjustments for size were made.
				potentialBottom = top + height,
			// The bottom of the the visible window
				screenBottom 	= document.documentElement.clientHeight,
			// How much needs to be subtracted (almost, see below) from the
			// scrollable node's height (not contents) in order to fit on the page.
				diff 			= (potentialBottom - screenBottom);
			// console.log("height", height)

			// Have taken care off stuff above and in the contents
			// Now will account for all the padding/borders, etc at
			// the bottom that may otherwise get cut off in some browsers
			// (Have to calcuate this again because the viewport might have changed on scroll)
			var scrollBottom = scrollable.getBoundingClientRect().bottom,
			// The bottom of the outer-most node, so we can pull everything
			// up to be visible
				outerBottom  = tickerText.getBoundingClientRect().bottom,
				bottomDiff 	 = outerBottom - scrollBottom;

			diff = diff + bottomDiff;

			var newHeight = height;
			if ( diff > 0 ) {
				newHeight = height - diff;
			}
			scrollable.style.height = newHeight + 'px';

			// Since the outer element is being used to determine the height of
			// the iframe, I assume it's at the very top of the iframe, so no
			// extra 'outer top' value needs to be subtracted.
			var currentOuterHeight 	= top + newHeight + bottomDiff;

			var val = currentOuterHeight + 'px'
			$iframe[0].style.height = val;
			document.body.style.marginTop = val;


			return tCui;
		};  // End tCui._resizeIframeAndContents()


		tCui.update = function () {
		// Callable from outside to have the display resize what it needs it

			// Note on previous bug. Solution was to call function first without a delay
			// then with one.
			// Seemed to be a Chrome issue going on. Needed to call this twice with a delay.
			// Don't remember what it was, but it wasn't from lag. Something really didn't
			// work until this was called for the second time. Something to do with going
			// from height: 0 to whatever height

			setTimeout(tCui._resizeIframeAndContents, 4);
			setTimeout(tCui._resizeBarElements, 4);
			// Delay probably won't work when there's a lot of lag.
			// TODO: Wait for an element to appear properly before calling resize
 
 			// Update the number of characters currently showing
			tCui.triggerTriggerable( null, 'update' );

			return tCui;
		};



		// =========== INITIALIZE =========== \\

		tCui._addEvents = function () {
			$(tCui.nodes.close).on( 'touchend click', tCui.close );
			$(tickerText).on( 'mousedown mouseup touchstart touchend', tCui.update );
			$(window).on( 'resize', tCui.update );
			// Event for content zooming?
			return tCui;
		};


		tCui._addNodes = function () {

			if (!parentNode) { parentNode = document.body; }

			$iframe = $(iframeStr);
			$iframe.prependTo( parentNode );

			// DO NOT SET $iframe[0].contentWindow.location.href = ANYTHING DIFFERENT
			// Learned that the hard way

			var iDoc = $iframe[0].contentDocument;
			// console.log( 'iDoc', iDoc );
			// console.log( 'iframe', $iframe[0] );

			tickerText = tCui._tickerTextNode = $(contentStr)[0];
			$(tickerText).appendTo( iDoc.body );
			// console.log( "in body?:", tickerText );

			// Styles that affect multiple levels of stuff
			var styles1 	= iDoc.createElement("link");
			styles1.href 	= browser.runtime.getURL( filepaths.core );
			styles1.type 	= "text/css";
			styles1.rel 	= "stylesheet";
			$(styles1).appendTo( iDoc.head );

			// This should only affect settings, but atm there's stuff that
			// affects playback buttons, etc.
			var styles2 	= iDoc.createElement("link");
			styles2.href 	= browser.runtime.getURL( filepaths.settings );
			styles2.type 	= "text/css";
			styles2.rel 	= "stylesheet";
			$(styles2).appendTo( iDoc.head );

			var stylesSliders 	= iDoc.createElement("link");
			stylesSliders.href 	= browser.runtime.getURL( filepaths.noui );
			stylesSliders.type 	= "text/css";
			stylesSliders.rel 	= "stylesheet";
			$(stylesSliders).appendTo( iDoc.head );

			// ??: Is this useful?
			tCui.nodes 	= {
				doc: 			iDoc,
				head: 			iDoc.head,
				body: 			iDoc.body,
				app: 			tickerText,
				above: 			$(tickerText).find('#__tt_above_bar')[0],
				bar: 			$(tickerText).find('#__tt_bar')[0],
				barLeft: 		$(tickerText).find('#__tt_bar_left')[0],
				barCenter: 		$(tickerText).find('#__tt_bar_center')[0],
				aboveText: 		$(tickerText).find('#__tt_above_text_elements')[0],
				leftOfText: 	$(tickerText).find('#__tt_left_text_elements')[0],
				textElements: 	$(tickerText).find('#__tt_text_elements')[0],
				rightOfText: 	$(tickerText).find('#__tt_right_text_elements')[0],
				belowText: 		$(tickerText).find('#__tt_below_text_elements')[0],
				barRight: 		$(tickerText).find('#__tt_bar_right')[0],
				close: 			$(tickerText).find('#__tt_close')[0],
				below: 			$(tickerText).find('#__tt_below_bar')[0]
			}

			return tCui;
		};  // End tCui._addNodes()


		tCui._init = function () {

			$('#__tt_iframe').remove();
			tCui._addNodes()
				._addEvents()
				// // This is in the wrong place
				// // Reconfig needed. This should construct state?
				// // Create parent object instead?
				// .addTriggerable( state );

			for ( let key in constructors ) {
				let Constr = constructors[ key ];
				if ( typeof Constr === 'function' ) {
					var obj = new Constr( state, tCui, constructors, filepaths );
					tCui[ obj.id ] = obj;
					console.log( obj );
				}
			}

			// This should not be visible until it's .show()n
			$iframe.hide();
			// $(tickerText).hide( 0, tCui.update )  // breaks things?
			$('#__tt_iframe').hide(0);

			return tCui;
		};


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		tCui._init();

		// To be called in a script
		return tCui;
	};  // End TTCoreUI() -> {}

	// To put on the window object, or export into a module
    return TTCoreUI;
}));


