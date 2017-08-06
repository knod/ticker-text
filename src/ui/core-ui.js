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
* - Consider setting up some tab-able controls (that are invisible?)
* 	that are outside of the iframe so they can be accessed by
* 	keypresses even when the document has been clicked on already -
* 	can't be navigated to with tab if in main document (I believe)
* - Re-fetch word on view update in case the word is now too long for the
* 	viewport. (Doing this, but not reliably)
*/

'use strict';

(function (root, uiFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', '@knod/playback' ], function ( jquery ) { return ( root.TTCoreUI = uiFactory( jquery ) ); });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = uiFactory( require('jquery') );
    } else {
        // Browser globals
        root.TTCoreUI = uiFactory( root.jQuery );
    }
}(this, function ( $ ) {

	var TTCoreUI = function ( state, parentNode, constructors, filepaths, callback ) {
	/*
	* 
	* `filepaths` has paths for child modules and iframe filepaths
	* for css files.
	*/
		var browser = chrome || browser;

		var tCui = {};
		tCui.id = 'coreUI'

		var mainElem, textElems, $iframe;
		tCui._toTrigger = {};

		var originalBodyMarginTop = window.getComputedStyle( document.body ).marginTop;



		// =========== DOM STRINGS =========== \\

		var iframeStr 	= '<iframe id="__tt_iframe" title="Ticker Text article reader."></iframe>';

		//  TODO: Change (almost) all these to id's
		var contentStr = '<main id="__tt">\n\
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
			<button id="__tt_read_full_article" class="__tt-big-menu-button"></button>\n\
			<button id="__tt_close" class="__tt-sup-menu-button">X</button>\n\
		</div>\n\
	</div>\n\
	<div id="__tt_below_bar" class="__tt-main-section __tt-hidden"></div>\n\
</main>';


	'<div id="__tt_below_bar" class="__tt-main-section __tt-hidden"></div>\n\''

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
				if ( obj[ theirFuncName ] ) obj[ theirFuncName ]();
			};
			// Important note: This object always updates last. May matter.
			if ( ourFuncName ) { tCui[ ourFuncName ](); }
			return tCui;
		};  // End tCui.triggerTriggerable()

		tCui.close = function () {
		// This is where everything gets closed, paused, put away
			return tCui.triggerTriggerable( 'hide', 'close' );
		};

		tCui.open = function () {
			return tCui.triggerTriggerable( 'show', 'open' );
		};

		tCui.start = function () {
			// return tCui.triggerTriggerable( 'show', 'play' );
			return tCui.triggerTriggerable( 'show', 'test' );
		};

		tCui.play = tCui.start;


		tCui.show = function ( overrideDuration ) {
			// // $iframe.show();
			// $iframe[0].style.display = '';
			// $(mainElem).slideDown( 200, function updateAfterShow() { tCui.update(); } );  // can't `.update()` at end

			var duration = overrideDuration || 200;
			$iframe.slideDown( 200, function updateAfterShowTickerText() { tCui.update(); } );  // can't `.update()` at end
			return tCui;
		};

		tCui.wait = function () {
			tCui._toTrigger.playbackUI.wait();
		}

		tCui.hide = function ( overrideDuration ) {
			// // $iframe.hide();
			// $iframe[0].style.display = 'none';
			// $(mainElem).slideUp( 200 );
			var duration = overrideDuration || 200;
			$iframe.slideUp( 200 );
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
			$(mainElem).remove();
			return tCui;
		};


		tCui._resizeBarElements = function () {

			// TODO: resize height of button based on 100% - outline-width
			// Just in case user has custom styles or adds custom styles
			// (~1/2 of the border is the 'blur' width, which is outside of
			// the border-box, but 1/2 + 1/2 = 1)

			if ( !tCui.nodes ) { return tCui; }

			// Works, but sometimes not till the update after the one that has the change
			// Problem with element not being rendered yet, but no solution
			// yet found.

			// Let styles take effect, I hope... (https://stackoverflow.com/a/21043017)
			setTimeout(function() {
				// Set what the max number of characters could be if based only on the DOM
				var styles 		= window.getComputedStyle( tCui.nodes.barCenter ),
					width 		= parseFloat( styles.width ),
					fontSize 	= parseFloat( styles.fontSize ),
					elemChars 	= Math.floor( width / fontSize );
				state.set( { id: 'stepper' }, { widthByEm: elemChars } );

				var DOMWidth 	= state.stepper.widthByEm,
					userWidth 	= state.stepper.maxNumCharacters_user,
					width 		= null;

				// Get the smaller between the element width and the user setting
				// Not undefined or 0
				if ( DOMWidth && DOMWidth <= userWidth ) { width = DOMWidth; }
				else { width = userWidth; }
				// console.log( 'core 4:', 'DOMWidth:', DOMWidth, '; userWidth:', userWidth, '; final width:', width );

				// Update the number of characters
				state.set( {id: 'stepper'}, { maxNumCharacters: width } );
			}, 0);

		};  // End tCui._resizeBarElements()


		// iframe element sizing
		// XXX https://jsfiddle.net/fpd4fb80/31/
		// Check out new plan: https://jsfiddle.net/pewka5ju/4/
		tCui._resizeIframeAndContents = function () {

			// console.trace( '~~~~~~~~~~~~~~~~' );

			var nodes 	= tCui.nodes,
				ibody 	= nodes.body;

			var main = nodes.main;

			$(main).find( '.__tt-scrollable-y' ).addClass( 'expanded' );
			// console.log( $(main).find( '.__tt-scrollable-y' )[0] );
			main.classList.remove( 'contracted' );

			// main.style.display = 'block';
			// ibody.style.height 	= 'auto';
			// ibody.style.display = 'inline-block';
			// console.log( 'force reflow, body scroll:', ibody.scrollHeight );

			var ibodyStyles 	= window.getComputedStyle( ibody );
			var mainStyles		= window.getComputedStyle( main );

			// console.log( 'body offset, scroll, margin, main bottom:', ibody.offsetHeight, ibody.scrollHeight, ibodyStyles.marginTop, main.clientBottom, mainStyles.borderBottomWidth );
			// console.log( ibody.offsetHeight, ibody.getBoundingClientRect().height, window.getComputedStyle( ibody ).height, ibody );

			//var ibodyHeight 	= ibody.getBoundingClientRect().height;
			// Total expanded height of the whole iframe
			// Has to be main. Body won't resize to something smaller than the iframe, even on `height: auto;`
			var ibodyHeight = main.scrollHeight
				+ parseInt( mainStyles.marginTop ) + parseInt( mainStyles.marginBottom )
				+ parseInt( ibodyStyles.marginTop ) + parseInt( ibodyStyles.marginBottom )
				+ parseInt( mainStyles.borderTopWidth ) + parseInt( mainStyles.borderBottomWidth )
				+ parseInt( ibodyStyles.borderTopWidth ) + parseInt( ibodyStyles.borderBottomWidth );
			// var ibodyHeight 	= ibody.scrollHeight + parseInt( ibodyStyles.marginTop ) + parseInt( ibodyStyles.marginBottom );

			// console.log( 'main offset, scroll, margin:', main.offsetHeight, main.scrollHeight, parseInt( mainStyles.marginTop ) );
			// console.log( 'iframe total:', ibodyHeight );
			var viewportHeight 	= document.documentElement.clientHeight;// - 30;
			// console.log( 'viewport height:', viewportHeight );
			var finalHeight 	= Math.min( ibodyHeight, viewportHeight );
			// console.log( 'final:', finalHeight );

			$iframe[0].style.height = finalHeight + 'px';
			// ibody.style.display 	= 'flex';
			// ibody.style.height 		= '100%';

			console.log( 'after change:', ibody, ibody.clientHeight, ibody.getBoundingClientRect().height, window.getComputedStyle( ibody ).height );

			// body position relative so everything moves down properly
			// (google search result pages don't even seem to get it right,
			// just use html as the parent)
			// Afraid this will mess up other people's attempts to work with
			// the page, especially since it keeps getting re-applied, but I'm
			// not sure what else I can do.
			document.body.style.position = 'relative';
			document.body.style.marginTop = finalHeight + parseInt(originalBodyMarginTop) + 'px';

			// Allow stuff to scroll again
			$(main).find( '.__tt-scrollable-y' ).removeClass( 'expanded' );
			// Make the containers (of the containers) of the scrolling stuff
			// the right short height
			main.classList.add( 'contracted' );

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

			// // Force reflow
			// console.log( tCui.nodes.body.clientHeight );

			// setTimeout(tCui._resizeIframeAndContents, 0);
			// setTimeout(tCui._resizeBarElements, 0);
			tCui._resizeIframeAndContents();
			tCui._resizeBarElements();
			// Delay probably won't work when there's a lot of lag.
			// TODO: Wait for an element to appear properly before calling resize
 
 			// Update the number of characters currently showing
			tCui.triggerTriggerable( null, 'update' );

			return tCui;
		};



		// =========== INITIALIZE =========== \\

		tCui._addEvents = function () {
			$(tCui.nodes.close).on( 'touchend click', tCui.close );
			// $(mainElem).on( 'mousedown mouseup touchstart touchend', tCui.update );
			$(window).on( 'resize', tCui.update );
			// Event for content zooming?
			return tCui;
		};


		var styleCount 	 = 0,
			stylesNeeded = 0;
		tCui._afterStyles = function () {

			styleCount++;

			if ( styleCount < stylesNeeded ) {
				console.log( 'count:', styleCount );
				return;
			} else {
				console.log( 'styles loaded!' );
				callback( state, tCui );
			}

			return tCui;
		};  // End tCui._afterStyles()

		tCui._listenForStyleLoad = function ( node ) {
			node.addEventListener( 'load', tCui._afterStyles );
			return node;
		};  // End tCui._listenForStyleLoad()


		tCui._addNodes = function () {

			if (!parentNode) { parentNode = document.body; }

			$iframe = $(iframeStr);
			$iframe.prependTo( parentNode );

			// DO NOT SET $iframe[0].contentWindow.location.href to ANYTHING DIFFERENT
			// Learned that the hard way. There was a reason, though

			var iDoc = $iframe[0].contentDocument;

			mainElem = $(contentStr)[0];
			$(mainElem).appendTo( iDoc.body );

			// Styles for all of Ticker Text here!

			// Styles that affect the parent document
			var stylesFrame 	= iDoc.createElement("link");
			stylesFrame.href 	= browser.runtime.getURL( filepaths.core );
			stylesFrame.type 	= "text/css";
			stylesFrame.rel 	= "stylesheet";

			// This should only affect settings, but atm there's stuff that
			// affects playback buttons, etc.
			var stylesSetts 	= iDoc.createElement("link");
			stylesSetts.href 	= browser.runtime.getURL( filepaths.settings );
			stylesSetts.type 	= "text/css";
			stylesSetts.rel 	= "stylesheet";

			var stylesSliders 	= iDoc.createElement("link");
			stylesSliders.href 	= browser.runtime.getURL( filepaths.sliders );
			stylesSliders.type 	= "text/css";
			stylesSliders.rel 	= "stylesheet";

			var stylesPlab 		= iDoc.createElement("link");
			stylesPlab.href 	= browser.runtime.getURL( filepaths.playback );
			stylesPlab.type 	= "text/css";
			stylesPlab.rel 		= "stylesheet";

			state.doc = iDoc;

			// For everyone else to access
			tCui.nodes 	= {
				doc: 			iDoc,
				head: 			iDoc.head,
				body: 			iDoc.body,
				main: 			mainElem,
				above: 			$(mainElem).find('#__tt_above_bar')[0],
				bar: 			$(mainElem).find('#__tt_bar')[0],
				barLeft: 		$(mainElem).find('#__tt_bar_left')[0],
				barCenter: 		$(mainElem).find('#__tt_bar_center')[0],
				aboveText: 		$(mainElem).find('#__tt_above_text_elements')[0],
				leftOfText: 	$(mainElem).find('#__tt_left_text_elements')[0],
				textElements: 	$(mainElem).find('#__tt_text_elements')[0],
				rightOfText: 	$(mainElem).find('#__tt_right_text_elements')[0],
				belowText: 		$(mainElem).find('#__tt_below_text_elements')[0],
				barRight: 		$(mainElem).find('#__tt_bar_right')[0],
				readFullArticle:$(mainElem).find('#__tt_read_full_article')[0],
				close: 			$(mainElem).find('#__tt_close')[0],
				below: 			$(mainElem).find('#__tt_below_bar')[0],
				styles: 		[ stylesFrame, stylesSetts, stylesSliders, stylesPlab ]
			}

			return tCui;
		};  // End tCui._addNodes()


		tCui._init = function () {

			$('#__tt_iframe').remove();
			tCui._addNodes()
				._addEvents()

			for ( let key in constructors ) {
				let Constr = constructors[ key ];
				if ( typeof Constr === 'function' ) {
					new Constr( state, tCui, constructors, filepaths );
				}
			}

			// Convert svg files into svg nodes so their styles can
			// be manipulated. https://stackoverflow.com/a/11978996/3791179
			// TODO: Can browserify build those into the files somehow?
			$(tCui.nodes.doc.body).find( 'img' ).each( function() {
				var $img 	= $( this ),
					imgURL 	= $img.attr( 'src' );

				$.get( imgURL, function convertSVGToNode( data ) {
					// Get the SVG tag, ignore the rest
					var $svg = $( data ).find( 'svg' );
					if ( $svg ) {
						// Remove any invalid XML tags as per http://validator.w3.org
						$svg = $svg.removeAttr( 'xmlns:a' );
						// Replace image with new SVG
						$img.replaceWith( $svg );
					}
				}, 'xml' );
			});

			var iDoc 		= tCui.nodes.doc,
				styleNodes 	= tCui.nodes.styles;
			stylesNeeded 	= styleNodes.length;

			for (let nodei = 0; nodei < styleNodes.length; nodei++) {
				let node = styleNodes[ nodei ];
				tCui._listenForStyleLoad( node );
				iDoc.head.appendChild( node );
			};

			// This should not be visible until it's .show()n
			// $iframe.hide();
			// $(mainElem).hide( 0, tCui.update )  // breaks things?
			// $('#__tt_iframe').hide(0);
			// tCui.update();

			// tCui.hide( 0 );

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


