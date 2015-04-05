'use strict';

module.exports = function (grunt) {
	
	// Project configuration.
	grunt.initConfig({
		jshint: {
			files: ['server.js', 'lib/**/*.js', 'test/**/*.js']
		},
		nodeunit: {
			files: ['test/**/*_test.js'],
		},
		watch: {
			jshit: {
				files: '<%=jshint.files%>',
				tasks: ['jshint']
			},
			test: {
				files: ['lib/**/*.js', 'test/**/*_test.js'],
				tasks: ['nodeunit']
			},
		},
	});
	
	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	// Default task.
	grunt.registerTask('default', ['jshint', 'nodeunit']);

};