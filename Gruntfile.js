/* eslint-env es6 */
module.exports = function(grunt) {
	'use strict';

	// Log time how long tasks take
	require("grunt-timer").init(grunt, { deferLogs: true, friendlyTime: true, color: "cyan"});

	const objectMerge = require('object-merge');

	// derive correct config from ".user.nabi.json" + ".nabi.json" in project root
	const nabiDefaultConfig = grunt.file.exists("defaults/.nabi.json") ? grunt.file.readJSON("defaults/.nabi.json") : {};
	const nabiProjectConfig = grunt.file.exists(".nabi.json") ? grunt.file.readJSON(".nabi.json") : {};
	const nabiUserConfig = grunt.file.exists(".user.nabi.json") ? grunt.file.readJSON(".user.nabi.json") : {};
	const nabiFinalCfg = objectMerge(nabiDefaultConfig, nabiProjectConfig, nabiUserConfig);
	// read sap deployment config file (only needed for sap nw abap deployment)
	const SAPDEPLOY_FILE_PATH = nabiFinalCfg.sapdeploy.configFile;
	let sapDeployConfig = grunt.file.exists(SAPDEPLOY_FILE_PATH) ? grunt.file.readJSON(SAPDEPLOY_FILE_PATH) : {};
	// read + merge credentials file for sap nw abap deployment
	const SAPDEPLOYUSER_FILE_PATH = nabiFinalCfg.sapdeploy.credentialsFile;
	const oCredentials = grunt.file.exists(SAPDEPLOYUSER_FILE_PATH) ? grunt.file.readJSON(SAPDEPLOYUSER_FILE_PATH) : {};
	sapDeployConfig = objectMerge(sapDeployConfig, oCredentials);

	//https://www.npmjs.com/package/multiparty
	var multiparty = require('multiparty');
	//var path = require('path');
	//var TMP_UPLOAD_PATH = path.join(__dirname, 'tmp/uploads');
	//console.log("TMP_UPLOAD_PATH = " + TMP_UPLOAD_PATH);

	var fnHandleFileUpload = function(bSave, req, res, next) {
		var bError, count, aFiles, form;

		bError = false;
		count = 0;
		aFiles = [];

		// see https://github.com/pillarjs/multiparty for API
		form = new multiparty.Form({
			//uploadDir : TMP_UPLOAD_PATH,
			maxFilesSize : 1024 * 1024 * 15 // 15 MB
		});

		if (bSave) {
			// make sure to manually delete the files afterwards from!!!
			// suggestion: DO NOT USE THIS ON PROD because it exposes internal folder structures
			form.parse(req, function(err, fields, files) {
				if (err) {
					res.writeHead(err.status, {'Content-Type': 'application/json;charset=utf-8'});
					res.end(JSON.stringify({errorCode: err.code}));
				} else {
					res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
					res.end(JSON.stringify({fields: fields, files: files}));
				}
			});
		} else {
			//files are not saved to local disk :-)
			form.on('error', function(err) {
				console.log('Error parsing form: ' + err.stack);
				bError = true;
			});

			form.on('part', function(part) {
				if (!part.filename) {
					// filename is not defined when this is a field and not a file
					//console.log('got field named ' + part.name);
					part.resume();
				} else if (part.filename) {
					// filename is defined when this is a file
					count++;
					aFiles.push({
						headers : part.headers,
						fieldName: part.name,
						filename: part.filename,
						//byteOffset: part.byteOffset,
						byteCount: part.byteCount
					});
					// ignore file's content here
					part.resume();
				}

				part.on('error', function(err) {
					console.log('Error parsing part: ' + err.stack);
					bError = true;
				});
			});

			form.on('close', function() {
				console.log('Upload completed!');
				res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
				res.end(
					JSON.stringify({
						success: bError === false,
						uploadedFiles: count,
						files : aFiles
					})
				);
			});
			// finally do the job for us
			form.parse(req);
		}
	};

	/**
	 * Rename JavaScript files, all others stay as they are. Examples:
	 * App.controller.js ==> App-dbg.controller.js
	 * Component.js ==> Component-dbg.js
	 *
	 * @param {string} dest the destination folder
	 * @param {string} src the filename
	 * @returns {string }the new file name for js files
	 */
	const fnFileRename = function(dest, src) {
		let destFilename = "";
		if (src.endsWith(".controller.js")) {
			destFilename = dest + src.replace(/\.controller\.js$/, "-dbg.controller.js");
		} else if (src.endsWith(".js")) {
			destFilename = dest + src.replace(/\.js$/, "-dbg.js");
		} else {
			destFilename = dest + src;
		}
		grunt.log.writeln(src + " ==>" + destFilename + "(dest = " + dest + ", src = " + src + ")");
		return destFilename;
	};

	grunt.initConfig({

		libraryName: 'nabi.demo',

		dir: {
			src: 'src',
			test: 'test',
			dist: 'dist',
			bower_components: 'bower_components',
			ui5lab_browser: 'node_modules/ui5lab-browser/dist'
		},

		connect: {
			options: {
				port: 8080,
				hostname: '*',
				middleware: function(connect, options, middlewares) {
					// inject a custom middleware into the array of default middlewares

					middlewares.unshift(
						connect().use('/upload', function(req, res, next) {
							//fnHandleFileUpload(false, req, res, next);
							fnHandleFileUpload(true, req, res, next);	//ONLY FOR LOCAL DEV!!!
							return undefined;
		        })
					);
					return middlewares;
				}

			},
			src: {},
			dist: {}
		},

		openui5_connect: {
			src: {
				options: {
					resources: [
						'<%= dir.bower_components %>/openui5-sap.ui.core/resources',
						'<%= dir.bower_components %>/openui5-sap.m/resources',
						'<%= dir.bower_components %>/openui5-sap.f/resources',
						'<%= dir.bower_components %>/openui5-sap.ui.layout/resources',
						'<%= dir.bower_components %>/openui5-sap.ui.unified/resources',
						'<%= dir.bower_components %>/openui5-themelib_sap_belize/resources',
						'<%= dir.src %>'
					],
					testresources: [
						'<%= dir.bower_components %>/openui5-sap.ui.core/test-resources',
						'<%= dir.bower_components %>/openui5-sap.m/test-resources',
						// TODO: how to get rid of these indirect dependencies only needed for the browser (f + layout)
						'<%= dir.bower_components %>/openui5-sap.f/test-resources',
						'<%= dir.bower_components %>/openui5-sap.ui.layout/test-resources',
						'<%= dir.bower_components %>/openui5-sap.ui.unified/test-resources',
						'<%= dir.bower_components %>/openui5-themelib_sap_belize/test-resources',
						'<%= dir.test %>',
						'<%= dir.ui5lab_browser %>/test-resources'
					]
				}
			},
			dist: {
				options: {
					resources: [
						'<%= dir.bower_components %>/openui5-sap.ui.core/resources',
						'<%= dir.bower_components %>/openui5-sap.m/resources',
						'<%= dir.bower_components %>/openui5-sap.f/resources',
						'<%= dir.bower_components %>/openui5-sap.ui.layout/resources',
						'<%= dir.bower_components %>/openui5-sap.ui.unified/resources',
						'<%= dir.bower_components %>/openui5-themelib_sap_belize/resources',
						'<%= dir.dist %>/resources'
					],
					testresources: [
						'<%= dir.bower_components %>/openui5-sap.ui.core/test-resources',
						'<%= dir.bower_components %>/openui5-sap.m/test-resources',
						'<%= dir.bower_components %>/openui5-sap.f/test-resources',
						'<%= dir.bower_components %>/openui5-sap.ui.layout/test-resources',
						'<%= dir.bower_components %>/openui5-sap.ui.unified/test-resources',
						'<%= dir.bower_components %>/openui5-themelib_sap_belize/test-resources',
						'<%= dir.dist %>/test-resources',
						'<%= dir.ui5lab_browser %>/test-resources'
					]
				}
			}
		},

		openui5_theme: {
			theme: {
				files: [
					{
						expand: true,
						cwd: '<%= dir.src %>',
						src: '**/themes/*/library.source.less',
						dest: '<%= dir.dist %>/resources'
					}
				],
				options: {
					rootPaths: [
						'<%= dir.bower_components %>/openui5-sap.ui.core/resources',
						'<%= dir.bower_components %>/openui5-themelib_sap_belize/resources',
						'<%= dir.src %>'
					],
					library: {
						name: '<%= libraryName %>'
					}
				}
			}
		},

		openui5_preload: {
			component : {
				options : {
					compatVersion : '1.44',
					resources: '<%= dir.src %>',
					dest: '<%= dir.dist %>/resources',
					// insead of the 2 previous lines we could use the following
					// (would even include the manifest,json in Component-preload.js file):
					// resources : {
					// 	cwd : 'src/nabi/demo/comp',
					// 	prefix : 'nabi/demo/comp',
					// 	src : [
					// 		"**/*.js",
					// 		"**/*.fragment.html",
					// 		"**/*.fragment.json",
					// 		"**/*.fragment.xml",
					// 		"**/*.view.html",
					// 		"**/*.view.json",
					// 		"**/*.view.xml",
					// 		"**/*.properties",
					// 		"**/manifest.json"
					// 	]
					// }
				},
				components : true
			},
			library: {
				options: {
					resources: '<%= dir.src %>',
					dest: '<%= dir.dist %>/resources',
					compatVersion : '1.44'
				},
				libraries: {
					'nabi/demo': {
						src : [
							'nabi/demo/**',
							'!nabi/demo/thirdparty/**'
						]
					}
				}
			}
		},

		clean: {
			dist: '<%= dir.dist %>/'
		},

		copy: {
			dist: {
				files: [
					{	//first all resources relevant for *-dbg.js
						expand: true,
						src: [ '**', '!nabi/demo/themes/**', '!nabi/demo/thirdparty/**' ],
						cwd: '<%= dir.src %>',
						dest: '<%= dir.dist %>/resources/',		//trailing slash is important
						rename: fnFileRename
					}, {
						//then everything else
						expand: true,
						cwd: '<%= dir.src %>',
						src: ["nabi/demo/themes/**", "nabi/demo/thirdparty/**", 'nabi/demo/.library'],
						dest: '<%= dir.dist %>/resources'
					}, {
						//finally the test resources
						expand: true,
						cwd: '<%= dir.test %>',
						src: ['**'],
						dest: '<%= dir.dist %>/test-resources'
					}
				]
			}
		},

		eslint: {
			src: ['<%= dir.src %>'],
			test: ['<%= dir.test %>'],
			gruntfile: ['Gruntfile.js']
		},

		compress: {
			dist : {
				options: {
					archive: "<%= dir.dist %>/nabi-demo.zip"
				},
				expand: true,
				cwd: "<%= dir.dist %>/resources",
				src: ["**/*"],
				dot : true,
				dest: "/"
			}
		},

		nwabap_ui5uploader: sapDeployConfig

	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-openui5');
	grunt.loadNpmTasks('grunt-eslint');
	grunt.loadNpmTasks('grunt-nwabap-ui5uploader');

	// Server task
	grunt.registerTask('serve', function(target) {
		grunt.task.run('openui5_connect:' + (target || 'src') + ':keepalive');
	});

	// Linting task
	grunt.registerTask('lint', ['eslint']);

	// Build task
	grunt.registerTask('build', ['clean', 'openui5_theme', 'openui5_preload', 'copy', 'compress:dist']);

	// SAP deployment
	grunt.registerTask("sapdeploy", ['lint', 'build', 'nwabap_ui5uploader']);

	// Default task
	grunt.registerTask('default', [
		'lint',
		'build',
		'serve:dist'
	]);
};
