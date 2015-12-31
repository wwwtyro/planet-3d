"use strict";

var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
var glslify = require('glslify');
var Geometry = require('gl-geometry');
var Texture2D = require('gl-texture2d');
var FBO = require('gl-fbo');
var hjson = require('hjson');
var defaultsDeep = require('lodash.defaultsdeep');
var saveAs = require('filesaver.js').saveAs;
var JSZip = require('jszip');
var sprintf = require('sprintf').sprintf;
var fs = require('fs');
var markdown = require('markdown').markdown;

var Quadsphere = require('./geo-quadsphere');
var Trackball = require('./trackball');
var PlanetTexturesRenderer = require('./generator/planet-textures') ;
var PlanetRenderer = require('./renderer/planet-renderer');

var presets = require('./presets/presets');

var help = markdown.toHTML(fs.readFileSync(__dirname + "/help.md", 'utf8'));

window.onload = function() {
    initialize();
};

function initialize() {

    var editor = ace.edit('editor');
    editor.getSession().setUseWorker(false); // disable syntax validation
    editor.$blockScrolling = Infinity; // prevent warning in console
    editor.setTheme('ace/theme/monokai');
    editor.getSession().setMode('ace/mode/javascript');
    editor.renderer.setShowGutter(true); // show line numbers
    editor.setShowPrintMargin(false); // hide the vertical line
    editor.setHighlightActiveLine(false);
    editor.setDisplayIndentGuides(false);
    editor.setValue(presets.lavarock, -1); // -1: don't select all text that is pasted
    editor.focus();

    editor.commands.addCommand({
        name: '...',
        exec: reload,
        bindKey: 'shift+enter'
    })

    var canvas = document.getElementById('render-canvas');
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;

    var initialized = false;
    var needRender = true;
    var dialoging = false;

    var PTR = new PlanetTexturesRenderer();
    var canvases;

    var PR = new PlanetRenderer(canvas);

    var trackball = new Trackball(canvas, {
        drag: 0.01,
        onRotate: function() {
            needRender = true;
        }
    });

    trackball.spin(10, 0);

    var fov = 70;
    var scale = 1.0;

    var opts = {};

    window.onfocus = function() {
        editor.focus();
    };

    window.onmouseup = function(e) {
        if (!dialoging) {
            editor.focus();
        }
    }

    window.onresize = function() {
        onResize();
    };

    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.shiftKey) {
            if (e.deltaX > 0 || e.deltaY > 0) {
                scale -= 0.1;
            } else {
                scale += 0.1;
            }
        } else {
            if (e.deltaY > 0) {
                fov += 1.0;
            } else {
                fov -= 1.0;
            }
        }
        fov = Math.min(170.0, Math.max(1.0, fov));
        scale = Math.min(1.0, Math.max(0.1, scale));
        loadOpts();
        needRender = true;
    })

    canvas.onresize = function() {
        onResize();
    };

    document.getElementById('buttons-help').onclick = function() {
        dialoging = true;
        vex.dialog.open({
            message: '<div style="width:100%;height: 480px;overflow:auto;font-size:0.75em">' + help + '</div>',
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Got it!'
                }),
            ],
        });
    };

    document.getElementById('buttons-save').onclick = function() {
        dialoging = true;
        vex.dialog.open({
            message: 'Enter your filename below.<br><i>Saving textures can take a while.</i>',
            input: '<input name="filename" type="text" placeholder="planet-textures.zip" required/>',
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Save'
                }),
                $.extend({}, vex.dialog.buttons.NO, {
                    text: 'Cancel'
                })
            ],
            callback: function(fields) {
                if (fields === false) {
                    dialoging = false;
                    editor.focus();
                    return;
                }
                var zip = new JSZip();
                zip.file('settings.txt', editor.getValue());
                var typeNames = ['clouds', 'diffuse', 'normal', 'emission', 'specular'];
                var tNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
                for (var i = 0; i < typeNames.length; i++) {
                    var typeName = typeNames[i];
                    for (var j = 0; j < tNames.length; j++) {
                        var tName = tNames[j];
                        var c = canvases[tName][typeName];
                        var data = c.toDataURL().split(',')[1];
                        zip.file(typeName + '-' + tName + '.png', data, {base64: true});
                    }
                }
                var blob = zip.generate({type: 'blob'});
                if (fields.filename.indexOf('.zip') < 0) {
                    fields.filename += '.zip';
                }
                saveAs(blob, fields.filename);
                editor.focus();
            }
        });
    };

    document.getElementById('buttons-presets').onclick = function() {
        dialoging = true;
        var presetKeys = Object.keys(presets);
        var select = '';
        select += '<select name="preset">';
        for (var i = 0; i < presetKeys.length; i++) {
            var key = presetKeys[i];
            if (key == 'default') continue;
            select += sprintf('<option value="%s">%s</option>', key, key);
        }
        select += '<select>';
        vex.dialog.open({
            message: 'Select a preset',
            input: select,
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Load'
                }),
                $.extend({}, vex.dialog.buttons.NO, {
                    text: 'Cancel'
                })
            ],
            callback: function(fields) {
                if (fields === false) {
                    dialoging = false;
                    editor.focus();
                    return;
                }
                editor.setValue(presets[fields.preset], -1); // -1: don't select all text that is pasted
                reload();
                editor.focus();
            }
        });
    };

    function onResize() {
        needRender = true;
    }

    function loadOpts() {
        var error = document.getElementById('error');
        error.style.display = 'none';
        try {
            opts = hjson.parse(editor.getValue());
        } catch (e) {
            error.style.display = 'block';
            error.innerHTML = e.toString();
            opts = {};
        }
        defaultsDeep(opts, hjson.parse(presets.default));
        // Transform texture.resolution into POT if it's not.
        var texres = 1;
        while (texres*2 <= opts.texture.resolution) {
            texres *= 2;
        }
        opts.texture.resolution = texres;
        opts.preview.fov = fov;
    }

    function reload() {
        needRender = true;
        var oldTextureOpts = JSON.stringify(opts.texture);
        loadOpts();
        if (JSON.stringify(opts.texture) !== oldTextureOpts) {
            document.getElementById('rendering').style.display = 'flex';
            setTimeout(function() {
                try {
                    canvases = PTR.render(opts.texture);
                } catch (e){
                    error.style.display = 'block';
                    error.innerHTML = "Couldn't render textures. Maybe there's something wrong with your HJSON? " + e.toString();
                }
                PR.setTextures(canvases, opts.texture.resolution);
                document.getElementById('rendering').style.display = 'none';
                document.getElementById('initializing').style.display = 'none';
                initialized = true;
                needRender = true;
            }, 33);
        }
    }

    reload();

    function render() {

        requestAnimationFrame(render);

        if (!initialized) {
            return;
        }

        if (needRender === false) {
            return;
        }

        needRender = false;

        var preview = opts.preview;

        canvas.width = canvas.clientWidth * scale;
        canvas.height = canvas.clientHeight * scale;

        opts.preview.rotation = trackball.rotation;
        PR.render(opts.preview);
    }

    render();

}
