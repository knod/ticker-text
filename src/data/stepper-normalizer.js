// stepper-normalizer.js

'use strict';

(function (root, stepperNormFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ '../utils/math.js' ], function ( math ) { return ( root.TTStepperNormalizer = stepperNormFactory( math ) );});
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = stepperNormFactory( require( '../utils/math.js' ) );
    } else {
        // Browser globals
        root.TTStepperNormalizer = stepperNormFactory();
    }
}(this, function ( math ) {

	// var TTStepperNormalizer = function () {

		var stpN = {};
		stpN.id  = 'stepperNormalizer';

		// ======== Fragmentor/splitter ========
		stpN.get_maxNumCharacters = function ( val ) {
			return math.constrainInt( val, 1, 1000 )  // Minimum allowed characters = 1
		};

		// To put on the window object, or export into a module and
		// To be invoked in a script
		return stpN;

	// };  // End TTDefaults() -> {}

	// // To put on the window object, or export into a module
 //    return TTDefaults;
}));
