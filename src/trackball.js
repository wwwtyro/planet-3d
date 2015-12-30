
var mat4 = require('gl-mat4');

module.exports = function Trackball(element, opts) {
    
    var self = this;
    
    var speed = opts.speed || 0.005;
    var container = opts.container || window;
    var onRotate = opts.onRotate || function() {};
    var drag = opts.drag || 0.0;
    
    self.rotation = mat4.create();


    var mouse = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        dz: 0,
        down: false
    };

    self.rotate = function(dx, dy) {
        var rot = mat4.create();
        mat4.rotateY(rot, rot, dx * speed);
        mat4.rotateX(rot, rot, dy * speed);
        mat4.multiply(self.rotation, rot, self.rotation);
        onRotate();
    }
    
    self.spin =function(dx, dy) {
        mouse.dx = dx;
        mouse.dy = dy;
    }

    function update() {
        requestAnimationFrame(update);
        if (mouse.down) {
            mouse.dx = 0;
            mouse.dy = 0;
            return;
        }
        if (Math.abs(mouse.dx * speed) < 0.0001) mouse.dx = 0.0;
        if (Math.abs(mouse.dy * speed) < 0.0001) mouse.dy = 0.0;
        if (mouse.dx === 0 && mouse.dy === 0) return;
        mouse.dx -= mouse.dx * drag;
        mouse.dy -= mouse.dy * drag;
        self.rotate(mouse.dx, mouse.dy);
    };

    update();

    element.addEventListener('mousedown', function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.dx = 0;
        mouse.dy = 0;
        mouse.down = true;
        e.preventDefault();
    });
    
    container.addEventListener('mouseup', function(e) {
        mouse.down = false;
    });

    container.addEventListener('mousemove', function(e) {
        if (!mouse.down) return;
        mouse.dx = e.clientX - mouse.x;
        mouse.dy = e.clientY - mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        self.rotate(mouse.dx, mouse.dy);
    });
    
    
}
