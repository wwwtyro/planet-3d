
var mat4 = require('gl-mat4');

module.exports = function(segments) {

    var step = 1.0/segments;
    var positions = [];
    var uvs = [];
    for (var i = 0; i < segments; i++) {
        for (var j = 0; j < segments; j++) {
            var x0 = -0.5 + (i + 0) * step;
            var x1 = -0.5 + (i + 1) * step;
            var y0 = -0.5 + (j + 0) * step;
            var y1 = -0.5 + (j + 1) * step;
            positions.push.apply(positions, [
                x0, y0, 0.5,
                x1, y0, 0.5,
                x1, y1, 0.5,
                x0, y0, 0.5,
                x1, y1, 0.5,
                x0, y1, 0.5
            ]);
            uvs.push.apply(uvs, [
                (i + 0) * step, (j + 0) * step,
                (i + 1) * step, (j + 0) * step,
                (i + 1) * step, (j + 1) * step,
                (i + 0) * step, (j + 0) * step,
                (i + 1) * step, (j + 1) * step,
                (i + 0) * step, (j + 1) * step
            ]);
        }
    }
    
    for (var i = 0; i < positions.length/3; i++) {
        var x = positions[i * 3 + 0];
        var y = positions[i * 3 + 1]; 
        var z = positions[i * 3 + 2];
        var d = Math.sqrt(x*x + y*y + z*z);
        x = x/d;
        y = y/d;
        z = z/d;
        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }
    
    var I = mat4.create();
    
    return {
        positions: positions,
        uvs: uvs,
        front: I,
        back: mat4.rotateY(mat4.create(), I, Math.PI),
        left: mat4.rotateY(mat4.create(), I, Math.PI * 1.5),
        right: mat4.rotateY(mat4.create(), I, Math.PI/2),
        top: mat4.rotateX(mat4.create(), I, -Math.PI/2),
        bottom: mat4.rotateX(mat4.create(), I, Math.PI/2),
    }
    
}

