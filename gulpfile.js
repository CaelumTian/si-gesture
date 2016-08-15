var gulp = require("gulp"),
    gulpLoadPlugins = require('gulp-load-plugins');
var Browsersync = require('browser-sync').create();
const $ =  gulpLoadPlugins();

gulp.task("js", function() {
	return gulp.src("./lib/*.js")
			.pipe($.jshint(".jshintrc"))
			.pipe($.jshint.reporter('default'))
			.pipe(gulp.dest("./build"));
});
gulp.task("es6", function() {
	return gulp.src('./lib/*.js')
        	.pipe($.babel({
            	presets: ['es2015']
        	}))
        	.pipe(gulp.dest('./build'))
});
gulp.task('server', function() {
    Browsersync.init({
        server: {
            baseDir: "./"
        }
    });
});
