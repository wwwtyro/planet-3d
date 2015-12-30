'use strict';

var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
var glslify = require('glslify');
var Geometry = require('gl-geometry');
var Texture2D = require('gl-texture2d');
var FBO = require('gl-fbo');

var Quadsphere = require('../geo-quadsphere');

module.exports = function PlanetRenderer(canvas) {

    var gl = canvas.getContext('webgl');
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    var pPlanet = glShader(gl, glslify('./glsl/planet.vert'), glslify('./glsl/planet.frag'));
    var pEmission = glShader(gl, glslify('./glsl/planet.vert'), glslify('./glsl/emission.frag'));
    var pAtmosphere = glShader(gl, glslify('./glsl/generic.vert'), glslify('./glsl/atmosphere.frag'));
    var pDisplay = glShader(gl, glslify('./glsl/generic.vert'), glslify('./glsl/display.frag'));
    var pBlur = glShader(gl, glslify('./glsl/generic.vert'), glslify('./glsl/blur.frag'));

    var qs = Quadsphere(64);

    var geom = Geometry(gl)
        .attr('aPosition', qs.positions)
        .attr('aUV', qs.uvs, {size: 2});

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
    var tNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    var tTypes = ['clouds', 'diffuse', 'normal', 'specular', 'emission'];
    for (var i = 0; i < tNames.length; i++) {
        var name = tNames[i];
        textures[name] = {};
        for (var j = 0; j < tTypes.length; j++) {
            var _type = tTypes[j];
            textures[name][_type] = Texture2D(gl, [1,1]);
            textures[name][_type].magFilter = gl.LINEAR;
            textures[name][_type].minFilter = gl.LINEAR_MIPMAP_LINEAR;
        }
    }

    var fboPlanet     = FBO(gl, [canvas.width, canvas.height]);
    var fboEmission   = FBO(gl, [canvas.width, canvas.height]);
    var fboAtmosphere = FBO(gl, [canvas.width, canvas.height]);

    var blurSize  = [512,512];
    var fboHBlur  = FBO(gl, blurSize);
    var fboVBlur  = FBO(gl, blurSize);
    fboHBlur.color[0].magFilter = gl.LINEAR;
    fboVBlur.color[0].magFilter = gl.LINEAR;

    this.setTextures = function setTextures(canvases, resolution) {
        for (var i = 0; i < tNames.length; i++) {
            var name = tNames[i];
            for (var j = 0; j < tTypes.length; j++) {
                var _type = tTypes[j];
                textures[name][_type].shape = resolution;
                textures[name][_type].setPixels(canvases[name][_type]);
                textures[name][_type].generateMipmap();
            }
        }
    };

    this.render = function render(opts) {

        var width = gl.drawingBufferWidth;
        var height = gl.drawingBufferHeight;

        gl.clearColor(0,0,0,0);
        gl.viewport(0, 0, width, height);

        fboPlanet.shape = [width, height];
        fboPlanet.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var view = mat4.create();
        var projection = mat4.create();

        var fov = opts.fov/360 * Math.PI*2;
        mat4.perspective(projection, fov, width/height, 0.1, 10);
        mat4.lookAt(view, [0, 0, 2], [0, 0, 0], [0, 1, 0]);

        pPlanet.bind();
        pPlanet.uniforms.uView = view;
        pPlanet.uniforms.uProjection = projection;
        pPlanet.uniforms.uRotation = opts.rotation;
        pPlanet.uniforms.uAmbient = opts.light.ambient;
        pPlanet.uniforms.uLightPos = opts.light.position;
        pPlanet.uniforms.uLightColor = opts.light.color;
        pPlanet.uniforms.uSpecularPower = opts.light.specularFalloff;
        geom.bind(pPlanet);
        for (var i = 0; i < tNames.length; i++) {
            var name = tNames[i];
            pPlanet.uniforms.uClouds = textures[name].clouds.bind(0);
            pPlanet.uniforms.uDiffuse = textures[name].diffuse.bind(1);
            pPlanet.uniforms.uNormal = textures[name].normal.bind(2);
            pPlanet.uniforms.uSpecular = textures[name].specular.bind(3);
            pPlanet.uniforms.uEmission = textures[name].emission.bind(4);
            pPlanet.uniforms.uModel = mat4.multiply(mat4.create(), opts.rotation, qs[name]);
            geom.draw();
        }

        fboEmission.shape = [width, height];
        fboEmission.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        pEmission.bind();
        pEmission.uniforms.uView = view;
        pEmission.uniforms.uProjection = projection;
        geom.bind(pEmission);
        for (i = 0; i < tNames.length; i++) {
            name = tNames[i];
            pEmission.uniforms.uEmission = textures[name].emission.bind(0);
            pEmission.uniforms.uModel = mat4.multiply(mat4.create(), opts.rotation, qs[name]);
            geom.draw();
        }

        fboAtmosphere.shape = [width, height];
        fboAtmosphere.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        pAtmosphere.bind();
        var vc = 2; // distance from camera to sphere center.
        var alpha = Math.asin(1/vc);
        var vp = vc - (1/vc);
        var hp = vp * Math.tan(alpha);
        var fp = vp * Math.tan(fov * 0.5);
        pAtmosphere.uniforms.uFrac = hp/fp;
        pAtmosphere.uniforms.uRes = [width, height];
        pAtmosphere.uniforms.uLightPos = opts.light.position;
        pAtmosphere.uniforms.uWrap = opts.atmosphere.wrap;
        pAtmosphere.uniforms.uWidth = opts.atmosphere.width;
        pAtmosphere.uniforms.uColor = opts.atmosphere.color;
        quad.bind(pAtmosphere);
        quad.draw();

        gl.viewport(0, 0, blurSize[0], blurSize[1]);
        fboVBlur.bind();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (opts.glow.iterations > 0) {
            fboHBlur.bind();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            pBlur.bind();
            pBlur.uniforms.uTexture = fboEmission.color[0].bind(0);
            pBlur.uniforms.uRes = blurSize;
            pBlur.uniforms.uDir = [1, 0];
            pBlur.uniforms.uStrength = opts.glow.strength;
            quad.bind(pBlur);
            quad.draw();

            fboVBlur.bind();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            pBlur.bind();
            pBlur.uniforms.uTexture = fboHBlur.color[0].bind(0);
            pBlur.uniforms.uRes = blurSize;
            pBlur.uniforms.uDir = [0, 1];
            pBlur.uniforms.uStrength = opts.glow.strength;
            quad.bind(pBlur);
            quad.draw();

            for (i = 1; i < opts.glow.iterations; i++) {
                fboHBlur.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                pBlur.bind();
                pBlur.uniforms.uTexture = fboVBlur.color[0].bind(0);
                pBlur.uniforms.uRes = blurSize;
                pBlur.uniforms.uDir = [1, 0];
                pBlur.uniforms.uStrength = opts.glow.strength;
                quad.bind(pBlur);
                quad.draw();

                fboVBlur.bind();
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                pBlur.bind();
                pBlur.uniforms.uTexture = fboHBlur.color[0].bind(0);
                pBlur.uniforms.uRes = blurSize;
                pBlur.uniforms.uDir = [0, 1];
                pBlur.uniforms.uStrength = opts.glow.strength;
                quad.bind(pBlur);
                quad.draw();
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        pDisplay.bind();
        pDisplay.uniforms.uTexture = fboPlanet.color[0].bind(0);
        pDisplay.uniforms.uBlur = fboVBlur.color[0].bind(1);
        pDisplay.uniforms.uAtmosphere = fboAtmosphere.color[0].bind(2);
        pDisplay.uniforms.uRes = [width, height];
        quad.bind(pDisplay);
        quad.draw();
    };
};
