// delays.js
/* TTDelays.js
* 
* UI elements for setting various speeds/delays for
* certain characteristics of words, like length and
* punctuation.
* 
* Based on https://github.com/jamestomasino/read_plugin/blob/master/Read.js
*/

(function (root, delaysFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'nouislider' ], function ( jquery, nouislider ) {
        	return ( root.TTDelays = delaysFactory( jquery ) );
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = delaysFactory( require( 'jquery' ), require( 'nouislider' ) );
    } else {
        // Browser globals
        root.TTDelays = delaysFactory( root.jQuery, root.noUiSlider );  // not sure noUi is here
    }
}(this, function ( $, noUiSlider ) {

	"use strict";

	var TTDelays = function ( state, coreSettings ) {

		var tDls = {};
		tDls.id  = 'delayer'; // TODO: Change all to 'delays'

		tDls.node 	 = null;
		tDls.tabText = 'Speeds';

		tDls._nodes  = {};
		var nodes 	 = tDls._nodes;

		nodes.wpmInput 				= null;
		nodes.wpmSlider 			= null;
		nodes.slowStartInput 		= null;
		nodes.slowStartSlider 		= null;
		nodes.sentenceDelayInput 	= null;
		nodes.sentenceDelaySlider 	= null;
		nodes.puncDelayInput 		= null;
		nodes.puncDelaySlider 		= null;
		nodes.shortWordDelayInput 	= null;
		nodes.shortWordDelaySlider 	= null;
		nodes.longWordDelayInput 	= null;
		nodes.longWordDelaySlider 	= null;
		nodes.numericDelayInput 	= null;
		nodes.numericDelaySlider 	= null;


		tDls._oneSlider = function ( data ) {
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

			// Special callback for `wpm`
			var callback = function(){};
			if ( data.operation === 'wpm' ) {
				callback = function ( delayerState ) {
					// TODO: check this value location
					var baseDelay = 1/( delayerState.wpm/60 )*1000;
					state.set( tDls, { '_baseDelay': baseDelay} );
				};
			}

			// TODO: ??: These should set themselves to normalized values at end?
			// We're kind of doing normalization/constraining here with min and
			// max, but we're also doing it with setting/getting in state.
			// TODO: Consolidate normalizing/constraining
			data.sliderNode.noUiSlider.on( 'update', function( values, handle ) {
				var val = parseFloat( values[ handle ] );
				data.inputNode.value = val;
				toSave[ data.operation ] = val;
				var stateVals = state.set( tDls, toSave, callback );
			});

			data.inputNode.addEventListener( 'change', function(){
				var val = parseFloat( this.value );
				data.sliderNode.noUiSlider.set( val );
				toSave[ data.operation ] = val;
				var stateVals = state.set( tDls, toSave, callback );
			});

			return data.sliderNode;
		};  // End tDls._oneSlider()


		tDls._makeSliders = function () {

			var slider 	= tDls._oneSlider,
				nodes 	= tDls._nodes,
				setts 	= state.delayer;

			slider({
				sliderNode: nodes.wpmSlider,
				range: 		{ min: 1, max: 1200 },
				startVal: 	setts.wpm,
				step: 		25,resolution: 1,
				inputNode: 	nodes.wpmInput,
				operation: 	'wpm'
			});

			slider({
				sliderNode: nodes.slowStartSlider,
				range: 		{ min: 0, max: 20 },
				startVal: 	setts.slowStartDelay,
				step: 		1,resolution: 1,
				inputNode: 	nodes.slowStartInput,
				operation: 	'slowStartDelay'
			});

			slider({
				sliderNode: nodes.sentenceDelaySlider,
				range: 		{ min: 0, max: 10 },
				startVal: 	setts.sentenceDelay,
				step: 		0.1, resolution: 0.1,
				inputNode: 	nodes.sentenceDelayInput,
				operation: 	'sentenceDelay'
			});

			slider({
				sliderNode: nodes.puncDelaySlider,
				range: 		{ min: 0, max: 5 },
				startVal: 	setts.otherPuncDelay,
				step: 		0.1, resolution: 0.1,
				inputNode: 	nodes.puncDelayInput,
				operation: 	'otherPuncDelay'
			});

			slider({
				sliderNode: nodes.shortWordDelaySlider,
				range: 		{ min: 0, max: 5 },
				startVal: 	setts.shortWordDelay,
				step: 		0.1, resolution: 0.1,
				inputNode: 	nodes.shortWordDelayInput,
				operation: 	'shortWordDelay'
			});

			slider({
				sliderNode: nodes.longWordDelaySlider,
				range: 		{ min: 0, max: 5 },
				startVal: 	setts.longWordDelay,
				step: 		0.1, resolution: 0.1,
				inputNode: 	nodes.longWordDelayInput,
				operation: 	'longWordDelay'
			});

			slider({
				sliderNode: nodes.numericDelaySlider,
				range: 		{ min: 0, max: 5 },
				startVal: 	setts.numericDelay,
				step: 		0.1, resolution: 0.1,
				inputNode: 	nodes.numericDelayInput,
				operation: 	'numericDelay'
			});

			return tDls;
		};  // End tDls._makeSliders()


		tDls._assignSettingItems = function () {

			var nodes = tDls._nodes,
				$menu = $(nodes.menu);

			nodes.wpmInput 				= $menu.find('#__rdly_wpm_input')[0];
			nodes.wpmSlider 			= $menu.find('#__rdly_wpm_slider')[0];
			nodes.slowStartInput 		= $menu.find('#__rdly_slowstart_input')[0];
			nodes.slowStartSlider 		= $menu.find('#__rdly_slowstart_slider')[0];
			nodes.sentenceDelayInput 	= $menu.find('#__rdly_sentencedelay_input')[0];
			nodes.sentenceDelaySlider 	= $menu.find('#__rdly_sentencedelay_slider')[0];
			nodes.puncDelayInput 		= $menu.find('#__rdly_puncdelay_input')[0];
			nodes.puncDelaySlider 		= $menu.find('#__rdly_puncdelay_slider')[0];
			nodes.shortWordDelayInput 	= $menu.find('#__rdly_shortworddelay_input')[0];
			nodes.shortWordDelaySlider 	= $menu.find('#__rdly_shortworddelay_slider')[0];
			nodes.longWordDelayInput 	= $menu.find('#__rdly_longworddelay_input')[0];
			nodes.longWordDelaySlider 	= $menu.find('#__rdly_longworddelay_slider')[0];
			nodes.numericDelayInput 	= $menu.find('#__rdly_numericdelay_input')[0];
			nodes.numericDelaySlider 	= $menu.find('#__rdly_numericdelay_slider')[0];

			return tDls;
		};  // End tDls._assignSettingItems()

		tDls._oneSetting = function ( idName, label ) {
			// Should the very specific classes be ids?
			return $('<div id="__rdly_' + idName + '_setting" class="__rdly-setting">\
						<label class="__rdly-slider-label">' + label + '</label>\
						<div class="__rdly-slider-controls">\
							<input id="__rdly_' + idName + '_input" class="__rdly-slider-input" type="text"/>\
							<div id="__rdly_' + idName + '_slider" class="__rdly-slider"></div>\
						</div>\
					</div>')
		};  // End tDls._oneSetting()

		tDls._addNodes = function ( coreSettings ) {

			var one = tDls._oneSetting;

			// Maybe this should belong to something else - a settings manager
			var $menu = $('<div id="__rdly_speed_settings_menu"></div>');
			tDls.node = $menu[0];

			coreSettings.addMenu( tDls );

			tDls._nodes.menu = $menu[0];

			one( 'wpm', 'Words Per Minute' ).appendTo($menu);
			one( 'slowstart', 'Slow Start Speed' ).appendTo($menu);
			one( 'sentencedelay', 'Sentence Delay' ).appendTo($menu);
			one( 'puncdelay', 'Other Punctuation Delay' ).appendTo($menu);
			one( 'shortworddelay', 'Short Word Delay' ).appendTo($menu);
			one( 'longworddelay', 'Long Word Delay' ).appendTo($menu);
			one( 'numericdelay', 'Numeric Delay' ).appendTo($menu);

			return tDls;
		};  // End tDls._addNodes()


		// =========== DELAY NORMALIZERS =========== \\




		tDls._init = function ( coreSettings ) {

			tDls._addNodes( coreSettings );
			tDls._assignSettingItems();
			tDls._makeSliders();

			// Events assigned with noUiSlider creation

			return tDls;
		};


		// =========== ADD NODE, ETC. =========== \\
		// Don't show at start, only when prompted
		tDls._init( coreSettings );


		// To be called in a script
		return tDls;
	};  // End TTDelays() -> {}

	// To put on the window object, or export into a module
    return TTDelays;
}));
