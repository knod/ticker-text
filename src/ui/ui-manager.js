/* ui-manager.js
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
*/

'use strict';

(function (root, uiFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', '@knod/playback' ], function ( jquery ) { return ( root.TTUI = uiFactory( jquery ) ); });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = uiFactory( require('jquery') );
    } else {
        // Browser globals
        root.TTUI = uiFactory( root.jQuery );
    }
}(this, function ( $ ) {

	var TTUI = function ( state, parentNode, constructors, filepaths ) {
	/*
	* 
	* `filepaths` has paths for child modules and iframe filepaths
	* for css files.
	*/
		var browser = chrome || browser;

		var ttui = {};

		var tickerText, textElems, $iframe;
		ttui._toTrigger = {};



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
		<div id="__tt_bar_center" class="__tt-bar-section __tt-transform-centered">\n\
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

		ttui.addToTriggerList = function ( triggerable ) {
		/* {} -> TTUI */

			if ( !ttui._toTrigger[ triggerable.id ] ) {
				ttui._toTrigger[ triggerable.id ] = triggerable;
			}

			return ttui;
		};



		// =========== RUNTIME ACTIONS =========== \\

		ttui.close = function () {
		// This is where everything gets closed, paused, put away
			ttui.hide();
			for ( var trigID in ttui._toTrigger ) {
				let obj = ttui._toTrigger[ trigID ]
				if ( obj.close ) obj.close();
			};
			return ttui;
		};

		ttui.open = function () {
			ttui.show();
			console.log( 'toTrigger', ttui._toTrigger );
			for ( var trigID in ttui._toTrigger ) {
				let obj = ttui._toTrigger[ trigID ]
				if ( obj.open ) obj.open();
			};
			return ttui;
		};


		ttui.show = function () {
			$iframe.show();
			$(tickerText).slideDown( 200 );
			return ttui;
		};

		ttui.hide = function () {
			$iframe.hide();
			$(tickerText).slideUp( 200 );
			return ttui;
		};

		ttui.destroy = function () {
			$(tickerText).remove();
			return ttui;
		};


		// iframe element sizing
		// https://jsfiddle.net/fpd4fb80/31/
		ttui._resizeIframeAndContents = function () {
			// There should only be one (for now...)
			var grower = $(tickerText).find('.__tt-to-grow')[0];

			// For when the element isn't made yet or isn't visible
			if ( !grower ) { return ttui; }

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
				height 			= grower.getBoundingClientRect().height,
			// The bottom of where the contents would end if you weren't
			// scrolled and no adjustments for size were made.
				potentialBottom = top + height,
			// The bottom of the the visible window
				screenBottom 	= document.documentElement.clientHeight,
			// How much needs to be subtracted (almost, see below) from the
			// scrollable node's height (not contents) in order to fit on the page.
				diff 			= (potentialBottom - screenBottom);

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

			$iframe[0].style.height = currentOuterHeight + 'px';

			return ttui;
		};  // End ttui._resizeIframeAndContents()


		ttui.update = function () {
		// Callable from outside to have the display resize what it needs it

			// Note on previous bug. Solution was to call function first without a delay
			// then with one.
			// Seemed to be a Chrome issue going on. Needed to call this twice with a delay.
			// Don't remember what it was, but it wasn't from lag. Something really didn't
			// work until this was called for the second time. Something to do with going
			// from height: 0 to whatever height

			setTimeout(ttui._resizeIframeAndContents, 4);
			// Delay probably won't work when there's a lot of lag.
			// TODO: Wait for an element to appear properly before calling resize
			return ttui;
		};



		// =========== INITIALIZE =========== \\

		ttui._addEvents = function () {
			$(ttui.nodes.close).on( 'touchend click', ttui.close );
			$(tickerText).on( 'mousedown mouseup touchstart touchend', ttui.update );
			$(window).on( 'resize', ttui.update );
			// Event for content zooming?
			return ttui;
		};


		ttui._addNodes = function () {

			if (!parentNode) { parentNode = document.body; }

			$iframe = $(iframeStr);
			$iframe.prependTo( parentNode );

			// DO NOT SET $iframe[0].contentWindow.location.href = ANYTHING DIFFERENT
			// Learned that the hard way

			var iDoc = $iframe[0].contentDocument;
			// console.log( 'iDoc', iDoc );
			// console.log( 'iframe', $iframe[0] );

			tickerText = ttui._tickerTextNode = $(contentStr)[0];
			$(tickerText).appendTo( iDoc.body );
			// console.log( "in body?:", tickerText );

			var styles1 	= iDoc.createElement("link");
			styles1.href 	= browser.runtime.getURL( filepaths.core );
			styles1.type 	= "text/css";
			styles1.rel 	= "stylesheet";

			$(styles1).appendTo( iDoc.head );

			// ??: Is this useful?
			ttui.nodes 	= {
				iDoc: 			iDoc,
				head: 			iDoc.head,
				body: 			iDoc.body,
				tickerText: 	tickerText,
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

			for ( let coni = 0; coni < constructors.length; coni++ ) {
				let Constr = constructors[ coni ];
				new Constr( state, ttui );
			}

			return ttui;
		};  // End ttui._addNodes()


		ttui._init = function () {

			$('#__tt_iframe').remove();
			ttui._addNodes()
				._addEvents()
				// This is in the wrong place
				// Reconfig needed. This should construct state?
				// Create parent object instead?
				.addToTriggerList( state );

			// This should not be visible until it's .show()n
			$iframe.hide();
			// $(tickerText).hide( 0, ttui.update )
			$('#__tt_iframe').hide(0);

			return ttui;
		};


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		ttui._init();

		// To be called in a script
		return ttui;
	};  // End TTUI() -> {}

	// To put on the window object, or export into a module
    return TTUI;
}));


