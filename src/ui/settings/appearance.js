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

			// Same notes as in delays.js
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

					// button will always stay full width
					// coreSettings.coreUI.nodes.textElements.style.flexBasis 	= 'auto';
					// coreSettings.coreUI.nodes.barCenter.style.flexBasis 	= 'auto';

					// TODO: This is a duplicate from core. Need to call this all from one place

					// Let styles take effect, I hope... (https://stackoverflow.com/a/21043017)
					setTimeout(function updateWidth() {

						var DOMWidth 	= stepState.widthByEm,
							userWidth 	= stepState.maxNumCharacters_user,
							width 		= null;

						// Get the smaller between the element width and the user setting
						// Not undefined or 0
						if ( DOMWidth && DOMWidth <= userWidth ) { width = DOMWidth; }
						else { width = userWidth; }

						// console.log( 'core 4:', 'DOMWidth:', DOMWidth, '; userWidth:', userWidth, '; final width:', width );

						// Update the number of characters
						state.set( {id: 'stepper'}, { maxNumCharacters: width } );

						// button will always stay full width
						// var visualWidth =  width;
						// if ( DOMWidth && DOMWidth > userWidth ) {
						// 	// Add a little padding if possible
						// 	// if less than 2 is remaining, keep any value, otherwise use 2
						// 	var diff 	= DOMWidth - userWidth,
						// 		extra 	= Math.min( 2, DOMWidth );
						// 	visualWidth =  width + extra;
						// }

						// coreSettings.coreUI.nodes.textElements.style.flexBasis 	= visualWidth + 'em';
						// coreSettings.coreUI.nodes.barCenter.style.flexBasis 	= visualWidth + 'em';
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
							<input id="__tt_' + idName + '_input" class="__tt-slider-input" type="number"/>\n\
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
