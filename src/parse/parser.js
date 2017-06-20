/* parser.js
* 
* Sets up options/functions for parser, then return
* the parser.
*/


(function (root, parserFactory) {  // root is usually `window`
    if ( typeof define === 'function' && define.amd) {  // amd if possible
        // AMD. Register as an anonymous module.
        define( [ 'jquery', 'franc', './iso-639.json', '@knod/unfluff', '@knod/sbd', '@knod/plug-n-parse' ],
        	function (jQuery, franc, langCodes, unfluff, sbd, ParsePiper) {
        		return (root.Parser = parserFactory(jQuery, franc, langCodes, unfluff, sbd, ParsePiper) );
        });
    } else if ( typeof module === 'object' && module.exports) {  // Node-ish next
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = parserFactory( require('jquery'), require('franc'), require('./iso-639.json'), require('@knod/unfluff'), require('@knod/sbd'), require('@knod/plug-n-parse') );
    } else {  // Global if nothing else
        // Browser globals
        console.warn('If this isn\'t running off browserify, I\'m not sure how to get the necessary libs in here.')
        // root.Parser = parserFactory( JQuery );
    }
}( this, function ( $, franc, langCodes, unfluff, sbd, ParsePiper ) {
	/* (jQuery, {}, {}, {}, {}) -> Parser */

    "use strict";


    var Parser = function () {
    /* () -> Parser
    * 
    * Builds the options needed for the parser
    */
    	var tPar = {};

    	tPar.debug 		= false;
    	tPar.parsedText = null;

    	tPar.cleanNode = function ( node ) {
    	/* ( DOM Node ) -> same DOM Node
    	* 
    	* Removes unwanted elements from the node and returns it.
        * TODO: Add 'head' (not 'iframe', though)
	    */
    		var $node     = $(node),
                // 'sup' has been declared distracting
                // 'script' and 'style' have English, skewing language detection results
                toRemove  = ['sup', 'script', 'style', 'head'];

            for (let tagi = 0; tagi < toRemove.length; tagi++) {
                let tag = toRemove[tagi];
                $node.find(tag).remove();
            };

    		return $node[0];
    	};


    	tPar.detectLanguage = function ( text ) {
    	/* ( Str ) -> iso6391 language code Str
    	* 
    	* Best guess. Defaults to English if none other is found.
    	*/
    		var lang = franc( text,
    			// The languages unfluff can handle atm
    				{ 'whitelist': ['ara', 'bul', 'ces', 'dan', 'deu', 'ell',
    					'eng', 'spa', 'fin', 'fra', 'hun', 'ind', 'ita', 'kor',
    					'nob', 'nor', 'pol', 'por', 'rus', 'swe', 'tha', 'tur', 'zho']
    			});
    		if (lang === 'und') {lang = 'eng';}

    		var iso6391Lang = langCodes[lang].iso6391;

    		if (tPar.debug) {  // Help non-coder devs identify some bugs
        	    console.log( '~~~parse debug~~~ language detected:', lang, '->', iso6391Lang );
    		}

    		return iso6391Lang;
    	};  // End tPar.detectLanguage()


    	tPar.findArticle = function ( node, lang ) {
    	/* ( DOM Node, Str ) -> Str
    	* 
    	* Uses the language `lang` and a DOM Node to return
    	* the best guess at the main text of the article
	    */
	    	var html = $(node).html(),
				cmds = unfluff.lazy( html, lang ),
				text = cmds.text();

            // Last ditch effort to get something if unfluff doesn't
            // get anything
            if (!text) { text = $(node).text(); }

    		if (tPar.debug) {  // Help non-coder devs identify some bugs
        	    console.log( '~~~parse debug~~~ article text identified (a string):', text );
    		}

			return text;
    	};  // End tPar.findArticle()


    	tPar.cleanText = function ( text ) {
    	/* (Str) -> Str
    	* 
    	* Does whatever further text filtering, cleaning, and parsing needs
    	* to be done. Default does nothing
    	*/
    		var cleaned = text;

    		// Add your code here
    		if (tPar.debug) {  // Help non-coder devs identify some bugs
        	    console.log( '~~~parse debug~~~ plain text cleaned (a string):', cleaned );
    		}

    		return cleaned;
    	};  // End tPar.cleanText()


    	tPar.splitSentences = function ( text ) {
    	/* ( Str ) -> [[Str]
    	* 
    	* Returns a list of sentences, which are each a list of words (strings).
        * Best results with English.
	    */
            var sentences = sbd.sentences( text, {parse_type: 'words'} );

    		if (tPar.debug) {  // Help non-coder devs identify some bugs
        	    console.log( '~~~parse debug~~~ sentences (an array of arrays of strings):', sentences );
    		}

            return sentences;
    	};


    	// Use the Piper to build the final parser

    	// PlugNParse( cleanNode, detectLanguage, findArticle, cleanText, splitSentences )
    	tPar.piper = new ParsePiper(
    		tPar.cleanNode,
    		tPar.detectLanguage,
    		tPar.findArticle,
    		tPar.cleanText,
    		tPar.splitSentences
		);

    	// RUNTIME
		tPar.parse = function ( input, debug ) {
			if ( debug ) { tPar.debug = debug; }
			tPar.parsedText = tPar.piper.parse( input, debug );	
			return tPar.parsedText;
		};


		return tPar;
    };  // End Parser() -> {}

    return Parser;
}));
