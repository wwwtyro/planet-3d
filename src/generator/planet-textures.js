
'use strict';

var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
var glslify = require('glslify');
var Geometry = require('gl-geometry');
var Texture2D = require('gl-texture2d');
var FBO = require('gl-fbo');
var assign = require('lodash.assign');
var hjson = require('hjson');
var rng = require('rng');

var presets = require('../presets/presets');

module.exports = function() {

    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl');

    var pData = glShader(gl, glslify('./glsl/data.vert'), glslify('./glsl/data.frag'));
    var pClouds = glShader(gl, glslify('./glsl/data.vert'), glslify('./glsl/clouds.frag'));
    var pDiffuse = glShader(gl, glslify('./glsl/quad.vert'), glslify('./glsl/diffuse.frag'));
    var pNormal = glShader(gl, glslify('./glsl/quad.vert'), glslify('./glsl/normal.frag'));
    var pSpecular = glShader(gl, glslify('./glsl/quad.vert'), glslify('./glsl/specular.frag'));
    var pEmission = glShader(gl, glslify('./glsl/quad.vert'), glslify('./glsl/emission.frag'));

    var sphereQuad = Geometry(gl)
        .attr('aPosition', [
            -0.5, -0.5, -0.5,
            +0.5, -0.5, -0.5,
            +0.5, +0.5, -0.5,
            -0.5, -0.5, -0.5,
            +0.5, +0.5, -0.5,
            -0.5, +0.5, -0.5
        ]);

    var quad = Geometry(gl)
        .attr('aPosition', [
            -1, -1, 0,
            +1, -1, 0,
            +1, +1, 0,
            -1, -1, 0,
            +1, +1, 0,
            -1, +1, 0
        ]);

    var textures = {};

    var dirKeys = Object.keys(dirs);

    var fbo = FBO(gl, [1, 1]);

    for (var i = 0; i < dirKeys.length; i++) {
        var name = dirKeys[i];
        textures[name] = {};
        textures[name].clouds = document.createElement('canvas');
        textures[name].clouds.ctx = textures[name].clouds.getContext('2d');
        textures[name].diffuse = document.createElement('canvas');
        textures[name].diffuse.ctx = textures[name].diffuse.getContext('2d');
        textures[name].normal = document.createElement('canvas');
        textures[name].normal.ctx = textures[name].normal.getContext('2d');
        textures[name].specular = document.createElement('canvas');
        textures[name].specular.ctx = textures[name].specular.getContext('2d');
        textures[name].emission = document.createElement('canvas');
        textures[name].emission.ctx = textures[name].emission.getContext('2d');
    }

    this.render = function(opts) {

        var defaults = hjson.parse(presets.default);

        opts = assign({
            seed: 'seed',
            resolution: 512,
            heightGradient: defaults.texture.heightGradient,
            normalGradient: defaults.texture.normalGradient,
            specularGradient: defaults.texture.specularGradient,
            emissionGradient: defaults.texture.emissionGradient,
            scale: [1,1,1]
        }, opts);

        var rand = new rng.MT(hashcode(opts.seed));
        var uOffset = [
            rand.random() * 100.0,
            rand.random() * 100.0,
            rand.random() * 100.0
        ];
        var uCloudsOffset = [
            rand.random() * 100.0,
            rand.random() * 100.0,
            rand.random() * 100.0
        ];

        var tDiffuseGradient = Texture2D(gl, colorGradient(opts.heightGradient));
        var tNormalGradient = Texture2D(gl, colorGradient(opts.normalGradient));
        var tSpecularGradient = Texture2D(gl, colorGradient(opts.specularGradient));
        var tEmissionGradient = Texture2D(gl, colorGradient(opts.emissionGradient));

        canvas.width = canvas.height = opts.resolution;

        var view = mat4.create();
        var projection = mat4.create();
        mat4.perspective(projection, Math.PI/2, 1, 0.1, 10.0);

        for (var i = 0; i < dirKeys.length; i++) {
            var name = dirKeys[i];
            var dir = dirs[name];

            mat4.lookAt(view, [0,0,0], dir.target, dir.up);

            gl.viewport(0, 0, opts.resolution, opts.resolution);
            gl.clearColor(1,0,1,1);

            fbo.shape = opts.resolution;
            fbo.bind();
            gl.clear(gl.COLOR_BUFFER_BIT);
            pData.bind();
            sphereQuad.bind(pData);
            pData.uniforms.uProjection = projection;
            pData.uniforms.uNormalMagGrad = tNormalGradient.bind(0);
            pData.uniforms.uScale = opts.scale;
            pData.uniforms.uOffset = uOffset;
            pData.uniforms.uFalloff = opts.falloff;
            pData.uniforms.uView = view;
            pData.uniforms.uModel = dir.model;
            pData.uniforms.uDetail = opts.detail;
            sphereQuad.draw();

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.clear(gl.COLOR_BUFFER_BIT);
            pClouds.bind();
            pClouds.uniforms.uProjection = projection;
            pClouds.uniforms.uView = view;
            pClouds.uniforms.uModel = dir.model;
            pClouds.uniforms.uOffset = uCloudsOffset;
            pClouds.uniforms.uScale = opts.clouds.scale;
            pClouds.uniforms.uColor = opts.clouds.color;
            pClouds.uniforms.uOpacity = opts.clouds.opacity;
            pClouds.uniforms.uFalloff = opts.clouds.falloff;
            pClouds.uniforms.uDetail = opts.clouds.detail;
            sphereQuad.bind(pClouds);
            sphereQuad.draw();
            textures[name].clouds.width = textures[name].clouds.height = opts.resolution;
            textures[name].clouds.ctx.drawImage(canvas, 0, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);
            pDiffuse.bind();
            pDiffuse.uniforms.uData = fbo.color[0].bind(0);
            pDiffuse.uniforms.uGradient = tDiffuseGradient.bind(1);
            quad.bind(pDiffuse);
            quad.draw();
            textures[name].diffuse.shape = opts.resolution;
            textures[name].diffuse.width = textures[name].diffuse.height = opts.resolution;
            textures[name].diffuse.ctx.drawImage(canvas, 0, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);
            pNormal.bind();
            pNormal.uniforms.uData = fbo.color[0].bind(0);
            quad.bind(pNormal);
            quad.draw();
            textures[name].normal.width = textures[name].normal.height = opts.resolution;
            textures[name].normal.ctx.drawImage(canvas, 0, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);
            pSpecular.bind();
            pSpecular.uniforms.uData = fbo.color[0].bind(0);
            pSpecular.uniforms.uGradient = tSpecularGradient.bind(1);
            quad.bind(pSpecular);
            quad.draw();
            textures[name].specular.width = textures[name].specular.height = opts.resolution;
            textures[name].specular.ctx.drawImage(canvas, 0, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);
            pEmission.bind();
            pEmission.uniforms.uData = fbo.color[0].bind(0);
            pEmission.uniforms.uGradient = tEmissionGradient.bind(1);
            quad.bind(pEmission);
            quad.draw();
            textures[name].emission.width = textures[name].emission.height = opts.resolution;
            textures[name].emission.ctx.drawImage(canvas, 0, 0);
        }

        tDiffuseGradient.dispose();
        tNormalGradient.dispose();
        tSpecularGradient.dispose();
        tEmissionGradient.dispose();

        return textures;
    };

    this.dispose = function() {
        pData.dispose();
        sphereQuad.dispose();
    };
};

var I = mat4.create();

var dirs = {
    front: {
        target: [0, 0, -1],
        up: [0, 1, 0],
        model: mat4.rotateY(mat4.create(), I,  Math.PI * 0.0)
    },
    back: {
        target: [0, 0, 1],
        up: [0, 1, 0],
        model: mat4.rotateY(mat4.create(), I, -Math.PI * 1.0)
    },
    left: {
        target: [-1, 0, 0],
        up: [0, 1, 0],
        model: mat4.rotateY(mat4.create(), I,  Math.PI * 0.5)
    },
    right: {
        target: [1, 0, 0],
        up: [0, 1, 0],
        model: mat4.rotateY(mat4.create(), I, -Math.PI * 0.5)
    },
    top: {
        target: [0, 1, 0],
        up: [0, 0, 1],
        model: mat4.rotateX(mat4.create(), I,  Math.PI * 0.5)
    },
    bottom: {
        target: [0, -1, 0],
        up: [0, 0, -1],
        model: mat4.rotateX(mat4.create(), I, -Math.PI * 0.5)
    }
};


function smootherstep(t) {
    var t3 = t * t * t;
    var t4 = t3 * t;
    var t5 = t4 * t;
    return 6*t5 - 15*t4 + 10*t3;
}

function mix(a, b, t) {
    t = (t - a.stop) / (b.stop - a.stop);
    var s = smootherstep(t);
    return [
        (1.0 - s) * a.val[0] + s * b.val[0],
        (1.0 - s) * a.val[1] + s * b.val[1],
        (1.0 - s) * a.val[2] + s * b.val[2]
    ];
}


function colorGradient(stops) {
    // Clone stops so that we don't overwrite anything.
    stops = JSON.parse(JSON.stringify(stops));
    // Make sure each stop has 3 components.
    for (var i = 0; i < stops.length; i++) {
        var stop = stops[i];
        if (!Array.isArray(stop.val)) {
            stop.val = [stop.val];
        }
        while (stop.val.length < 3) {
            stop.val.push(1);
        }
        stop.val = stop.val.slice(0, 3);
    }
    // Make sure the first and last stop are at 0.0 and 1.0, respectively.
    if (stops[0].stop > 0) {
        stops.unshift({
            stop: 0.0,
            val: stops[0].val
        });
    }
    if (stops[stops.length - 1] < 1.0) {
        stops.push({
            stop: 1.0,
            val: stops[stops.length - 1].val
        });
    }
    // Prevent overflow.
    stops.push({
        stop: 1.01,
        val: stops[stops.length-1].val
    });
    // Make the canvas and context.
    var width = 256;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = 1;
    var ctx = canvas.getContext('2d');
    // Fill out the canvas.
    for (i = 0; i < width; i++) {
        var pct = i/(width - 1);
        var s = 0;
        while (stops[s + 1].stop < pct) {
            s++;
        }
        var left = stops[s];
        var right = stops[s + 1];
        var c = mix(left, right, pct);
        var r = Math.round(c[0] * 255);
        var g = Math.round(c[1] * 255);
        var b = Math.round(c[2] * 255);
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect(i, 0, 1, 1);
    }
    return canvas;
}

function hashcode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash += (i + 1) * char;
    }
    return hash;
}
