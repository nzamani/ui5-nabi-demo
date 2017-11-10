/*!
 * ${copyright}
 */

/**
 * Initialization code and shared classes of library nabi.m.
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/core/library'],
	function(jQuery, library) {
	"use strict";


	/**
	 * A library containing mobile controls
	 *
	 * @namespace
	 * @name nabi.demo
	 * @public
	 */

	// library dependencies

	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "nabi.demo",
		dependencies : ["sap.ui.core", "sap.m" , "sap.ui.unified"],
		types: [],
		interfaces: [],
		controls: [
			"nabi.demo.ProductRating"
		],
		elements: [],
		noLibraryCSS: true,
		version: "0.1.0"
	});

	return nabi.demo;

});
