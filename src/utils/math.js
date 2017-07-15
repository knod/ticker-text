// math.js

'use strict';

(function (root, mathFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [], function () { return ( root.TTMathUtils = mathFactory() );});
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = mathFactory();
    } else {
        // Browser globals
        root.TTMathUtils = mathFactory();
    }
}(this, function () {

	var uMat = {};

	uMat.constrain = function ( val, min, max ) {
		var minLimited = Math.max( min, val );
		return Math.min( max, minLimited );
	};

	uMat.constrainFloat = function ( val, min, max ) {
		var num = parseFloat(val);
		return uMat.constrain( num, min, max );
	};

	// To be invoked in a script and
	// To put on the window object, or export into a module
	return uMat;
}));
