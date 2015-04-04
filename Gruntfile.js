'use strict';

module.exports = function (grunt) {
	
	// Project configuration.
	grunt.initConfig({
		nodeunit: {
			files: ['test/**/*_test.js'],
		},
		watch: {
			test: {
				files: ['lib/**/*.js', 'test/**/*_test.js'],
				tasks: ['nodeunit']
			},
		},
	});
	
	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	// Default task.
	grunt.registerTask('default', ['nodeunit']);

};