'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      src: ['src/**/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        node: true,
        browser: true
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: ['build/*']
        }]
      }
    },
    copy: {
      dist: {
        files: [{
            expand: true,
            dot: true,
            cwd: 'src',
            dest: 'build',
            src: [
              '*.html',
              'img/*'
            ]
        }]
      }
    },
    useminPrepare: {
      html: 'src/index.html',
      options: {
        dest: 'build'
      }
    },
    usemin: {
      html: ['build/index.html'],
      css: ['build/**/*.css'],
      options: {
        basedir: 'build',
        dirs: ['build']
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            'build/{,*/}*.{js,css,png,jpg,jpeg,gif,webp}',
          ]
        }
      }
    },
    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeOptionalTags: false
        },
        files: [{
          expand: true,
          cwd: 'build',
          src: [
            '*.html'
          ],
          dest: 'build'
        }]
      }
    },
    watch: {
      all: {
        options: { },
        files: ['src/**', 'Gruntfile.js'],
        tasks: ['default'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  grunt.registerTask('default', [
    'clean:dist',
    /*'jshint',*/
    'copy:dist',
    'useminPrepare',
    'concat',
    'cssmin',
    'uglify',
    'rev',
    'usemin',
    'htmlmin:dist'
  ]);
};
