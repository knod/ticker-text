/* appearance.js
* 
* UI elements for setting various appearance for
* certain characteristics of words, like font-size,
* maximum characters shown, etc.
*/

'use strict';

(function (root, appearanceFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'nouislider' ], function ( jquery, nouislider ) {
        	return ( root.TTAppearance = appearanceFactory( jquery ) );
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = appearanceFactory( require( 'jquery' ), require( 'nouislider' ) );
    } else {
        // Browser globals
        root.TTAppearance = appearanceFactory( root.jQuery, root.noUiSlider );  // not sure noUi is here
    }
}(this, function ( $, noUiSlider ) {

	'use strict';

	var TTAppearance = function ( state, coreSettings ) {

		var tAnc = {};
		tAnc.id  = 'appearance';

		tAnc.stepper 	= { id: 'stepper' };
		tAnc.styler 	= { id: 'styler' };

		tAnc.node 	 = null;
		tAnc.tabText = 'Appearance';

		tAnc._nodes  = {};
		var nodes 	 = tAnc._nodes;

		nodes.minLengthForSeparator = null;
		// TODO: Must calculate, somewhere, using user setting and width of space available
		nodes.maxNumChars = null;


		tAnc._oneSlider = function ( data ) {
		/* ( {} ) -> Node (??)
		* 
		* Turn the given data into one noUiSlider slider
		*/
			// To keep handles within the bar
			$(data.sliderNode).addClass('noUi-extended');

			var slider = noUiSlider.create( data.sliderNode, {
				range: { min: data.range.min, max: data.range.max },
				start: data.startVal,
				step: data.step,
				connect: 'lower',
				handles: 1,
				behaviour: 'extend-tap',
				// Not sure the below does anything
				serialization: {
					to: [data.inputNode],
					resolution: data.resolution
				}
			});

			// To get right format for saving with state
			var toSave = {};

			var callback = data.callback || function(){};

			// TODO: ??: These should set themselves to normalized values at end?
			// We're kind of doing normalization/constraining here with min and
			// max, but we're also doing it with setting/getting in state.
			// TODO: Consolidate normalizing/constraining
			data.sliderNode.noUiSlider.on( 'update', function( values, handle ) {
				var val = parseFloat( values[ handle ] );
				data.inputNode.value = val;
				toSave[ data.operation ] = val;
				var stateVals = state.set( data.parent, toSave, callback );
			});

			data.inputNode.addEventListener( 'change', function(){
				var val = parseFloat( this.value );
				data.sliderNode.noUiSlider.set( val );
				toSave[ data.operation ] = val;
				var stateVals = state.set( data.parent, toSave, callback );
			});

			return data.sliderNode;
		};  // End tAnc._oneSlider()


		tAnc._makeSliders = function () {

			var slider 		= tAnc._oneSlider,
				nodes 		= tAnc._nodes,
				stepSetts 	= state.stepper;

			// slider({
			// 	sliderNode: nodes.minLengthForSeparator,
			// 	range: 		{ min: 2, max: 20 },
			// 	startVal: 	stepSetts.minLengthForSeparator,
			// 	step: 		1, resolution: 1,
			// 	inputNode: 	nodes.minLengthForSeparatorInput,
			// 	operation: 	'minLengthForSeparator'
			// });

			slider({
				parent: 	tAnc.stepper,
				sliderNode: nodes.maxNumChars,
				range: 		{ min: 1, max: 30 },
				startVal: 	stepSetts.maxNumCharacters,
				step: 		1, resolution: 1,
				inputNode: 	nodes.maxNumCharsInput,
				operation: 	'maxNumCharacters_user',
				callback: 	function ( stepState ) {

					coreSettings.coreUI.nodes.textElements.style.flexBasis 	= 'auto';
					coreSettings.coreUI.nodes.barCenter.style.flexBasis 	= 'auto';


					// TODO: Need to update this whenever size (viewport, font, etc.) changes
					
					// // get width of text element
					// var elem = coreSettings.coreUI.nodes.textElements;
					// console.log( 'text elements:', elem );
					// if ( elem ) {
					// 	var styles = window.getComputedStyle( elem.querySelector( '#__tt_text_button' ) )
					// 	var width = parseInt( styles.width );
					// 	var fontSize = parseInt( styles.fontSize );
					// 	console.log( 'font size:', width );
					// 	var elemChars = Math.floor( width / fontSize );
					// 	console.log( elemChars );
					// 	// Get the smaller between the element width and the user setting
					// 	if ( elemChars <= stepState.maxNumCharacters_user ) { state.set( tAnc.stepper, { maxNumCharacters: elemChars } ); }
					// 	else { state.set( tAnc.stepper, { maxNumCharacters: stepState.maxNumCharacters_user } ); }
					// } else {
					// 	state.set( tAnc.stepper, { maxNumCharacters: stepState.maxNumCharacters_user } );
					// }

					// Let styles take effect, I hope... (https://stackoverflow.com/a/21043017)
					setTimeout(function updateWidth() {

						var DOMWidth 	= stepState.widthByEm,
							userWidth 	= stepState.maxNumCharacters_user,
							width 		= null;
						// Get the smaller between the element width and the user setting
						if ( DOMWidth && DOMWidth <= userWidth ) { width = DOMWidth; }
						else {
							// Give a little padding if possible
							if ( DOMWidth >= userWidth + 2 ) { width = userWidth + 2; }
							else { width = userWidth; }
						}

						console.log( 'DOMWidth:', DOMWidth, '; userWidth:', userWidth, '; final width:', width );

						var elem = coreSettings.coreUI.nodes.textElements,
							text = elem.querySelector( '#__tt_text_button' );
						state.set( tAnc.stepper, { maxNumCharacters: width } );
						// text.style.maxWidth = width + 'em';
						elem.style.flexBasis = width + 'em';
						coreSettings.coreUI.nodes.barCenter.style.flexBasis = width + 'em';

					}, 0);
				}  // End callback()
			});

			return tAnc;
		};  // End tAnc._makeSliders()


		tAnc._assignSettingItems = function () {

			var nodes = tAnc._nodes,
				$menu = $(nodes.menu);

			nodes.maxNumCharsInput 	= $menu.find('#__tt_max_num_chars_input')[0];
			nodes.maxNumChars 		= $menu.find('#__tt_max_num_chars_slider')[0];

			return tAnc;
		};  // End tAnc._assignSettingItems()


		tAnc._oneSetting = function ( idName, label ) {
			// Should the very specific classes be ids?
			return $('<div id="__tt_' + idName + '_setting" class="__tt-setting">\n\
						<label class="__tt-slider-label">' + label + '</label>\n\
						<div class="__tt-slider-controls">\n\
							<input id="__tt_' + idName + '_input" class="__tt-slider-input" type="text"/>\n\
							<div id="__tt_' + idName + '_slider" class="__tt-slider"></div>\n\
						</div>\n\
					</div>')
		};  // End tAnc._oneSetting()

		tAnc._addNodes = function ( coreSettings ) {

			var one = tAnc._oneSetting;

			// Maybe this should belong to something else - a settings manager
			var $menu = $('<div id="__tt_appearance_settings_menu"></div>');
			tAnc.node = $menu[0];

			coreSettings.addMenu( tAnc );

			tAnc._nodes.menu = $menu[0];

			one( 'max_num_chars', 'Max Number Of Letters At One Time' ).appendTo($menu);

			return tAnc;
		};  // End tAnc._addNodes()


		tAnc._init = function ( coreSettings ) {

			tAnc._addNodes( coreSettings )
				._assignSettingItems()
				._makeSliders();

			// Events assigned with noUiSlider creation

			return tAnc;
		};


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		tAnc._init( coreSettings );


		// To be called in a script
		return tAnc;
	};  // End TTAppearance() -> {}

	// To put on the window object, or export into a module
    return TTAppearance;
}));
