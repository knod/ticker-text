/* settings-core.js
* 
* Should manage settings input. Extendable (I hope).
* 
* TODO:
* ??: Add events/buttons for things like opening and closing settings?
* - ??: Don't close settings when closing tickerText? If they were there
* 	on close, should they be there on re-open?
* - Stop scrolling on doc when being scrolled
*/

(function (root, settingsFactory) {  // root is usually `window`
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define( [ 'jquery' ], function ( jquery ) {
        	return ( root.TTSettingsCore = settingsFactory( jquery ) );
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = settingsFactory( require('jquery') );
    } else {
        // Browser globals
        root.TTSettingsCore = settingsFactory( root.jQuery );
    }
}(this, function ( $ ) {

	"use strict";
 
	var TTSettingsCore = function ( state, coreUI, uiConstructors, filepaths ) {

		var tSet = {};
		tSet.id  = 'coreSettings';

		tSet.settings = {};

		tSet.nodes 		= {};
		tSet.menuNodes 	= {};

		tSet._isOpen 	= false;

		var opener, container, menus, tabs;


		// =========== ALLOW EXTENTIONS OF SETTINGS =========== \\

		// ---- Add a tab to go with the settings ---- \\
		tSet._hideLoneTab = function () {
		/* Make sure that if there's only one settings element,
		* the tabs don't show
		*/
			if ( Object.keys(tSet.menuNodes).length <= 1 ) {
				$(tabs).addClass( '__tt-hidden' );
				$(tabs).css( {'display': 'none'} );
			} else {
				$(tabs).removeClass( '__tt-hidden' );
				$(tabs).css( {'display': 'flex'} );
			}
			return tSet;
		};

		tSet._showMenu = function ( evnt ) {
		// Sent from a tab, DOES NOT SHOW THE NODE THAT CONTAINS ALL THE MENUS
		// Shows one individual menu, hiding the other menu nodes
			var $thisTab = $(evnt.target),
				id 		 = evnt.target.id.replace(/_tab$/, ''),
				$menus 	 = $(menus).find( '.__tt-settings-menu' ),
				$tabs 	 = $(tabs).children(),
				thisMenu = tSet.menuNodes[ id ];

			// Hide all, then show this one
			$menus.addClass( '__tt-hidden' );
			$menus.css( {'display': 'none'} );
			$(thisMenu).removeClass( '__tt-hidden' );
			$(thisMenu).css( {'display': 'flex'} );

			// There should only be one (for now...). It's height gets adjusted.
			// Should only have one child, which can grow.
			$menus.removeClass( '__tt-to-grow' );
			$(thisMenu).addClass( '__tt-to-grow' );

			// Same type of thing, showing this tab as active
			$tabs.removeClass( '__tt-active-ui' );
			$thisTab.addClass( '__tt-active-ui' );

			return tSet;
		};

		// Not used or tested yet
		tSet.destroyMenu = function ( evnt ) {
			var id = evnt.target.id;  // Not a jQuery element

			$(tSet.menuNodes[ id ]).remove();
			tSet.menuNodes[ id ] = null;
			$($(tabs).find('#' + id + '_tab' )).remove();

			return tSet;
		};

		tSet._addTab = function ( id, tabText ) {
			var html = '<div id="' + id + '_tab" class="__tt-settings-tab">' + tabText + '</div>',
				$tab = $( html );
			$tab.appendTo( tabs );
			tSet._hideLoneTab();

			$tab.on( 'touchend click', tSet._showMenu )

			return $tab;
		};

		tSet.addMenu = function ( menu ) {// node, tabText ) {

			var node 	= menu.node,
				tabText = menu.tabText;

			var id = node.id;

			// Abort if already exists
			if ( tSet.menuNodes[ id ] ) {
				// Not sure how else to handle this gracefully...
				// Just refuse to add something with this ID? That seems cruel.
				console.warn( "A settings menu of this id is already in here. Please pick a different id or use mySettingsManager.destroyMenu( 'someID' ) to destroy it. Existing menu:", tSet.menuNodes[ id ] );
				return node;
			}

			tSet.menuNodes[ id ] = node;

			// Otherwise keep going
			var $newNode = $(node);
			$newNode.addClass( '__tt-settings-menu' );

			$(menus).append( $newNode );
			$newNode[0].addEventListener( 'destroyOneSettingsMenu', tSet._removeMenu, false );  // TODO: Remove this line
			tSet.settings[ menu.id ] = menu;

			var $tab = tSet._addTab( id, tabText );

			// Show the first menu added each time, just in case?
			$($(tabs).children()[0]).trigger( 'click' );

			return tSet;
		};  // End tSet.addMenu()


		// =========== BASE OBJECT =========== \\
		// Doesn't get opened by the thing that opens everything at the start
		tSet._open = function () {
			$(coreUI.nodes.below).removeClass('__tt-hidden');
			$(opener).addClass( '__tt-active-ui' );  // different style

			tSet._isOpen = true;
			coreUI.update();
			
			return tSet;
		};

		tSet.close = function ( evnt ) {
		// Allowed to be called externally
			$(coreUI.nodes.below).addClass('__tt-hidden');
			$(opener).removeClass( '__tt-active-ui' );  // different style
			
			tSet._isOpen = false;
			coreUI.update();
			
			return tSet;
		};

		tSet._toggleOpenClose = function () {
			if ( tSet._isOpen ) { tSet.close(); }
			else { tSet._open(); }
			return tSet;
		};


		tSet._addEvents = function () {
			$(opener).on( 'touchend click', tSet._toggleOpenClose );
			return tSet;
		};


		tSet._addBase = function ( coreUI ) {
			var setPath = state.browser.extension.getURL('images/settings_2.svg');
			var $open = $('<button id="__tt_open_settings" class="__tt-big-menu-button"><img src="' + setPath + '"></button>'),
				$cont = $('<div id="__tt_settings_container"></div>'),
				$taby = $('<div id="__tt_settings_tabs"></div>'),
				$sets = $('<div id="__tt_settings_menus" class="__tt-scrollable-y"></div>');

			var coreNodes 	= coreUI.nodes,
				head 		= coreNodes.head,
				left  		= coreNodes.barLeft,
				below 		= coreNodes.below;

			var nodes 	= tSet.nodes;
			opener 		= nodes._openSettings 	 	= $open.prependTo( left )[0];
			container 	= nodes._settingsContainer 	= $cont.prependTo( below )[0];
			tabs 		= nodes._tabs 			 	= $taby.appendTo( $cont )[0];
			menus 		= nodes._menus 		 		= $sets.appendTo( $cont )[0];

			return tSet;	
		};


		tSet._init = function ( coreUI ) {

			tSet._addBase( coreUI )
				._addEvents();

			coreUI.addTriggerable( tSet );

			tSet.coreUI = coreUI;

			var constructors = uiConstructors.settings;
			for ( var key in constructors ) {
				let Constr = constructors[ key ];
				new Constr( state, tSet, constructors, filepaths );
			}

			return tSet;
		};



		// =========== CREATE =========== \\
		// Don't show at start, only when prompted
		tSet._init( coreUI );

		// To be called in a script
		return tSet;
	};  // End TTSettingsCore() -> {}

	// To put on the window object, or export into a module
    return TTSettingsCore;
}));
