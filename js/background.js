function Background (paperObject) {
    var paper = paperObject;
    var self = this;

    var background = paper.rect(-10, -10, paper.width+10, paper.height+10);
//382A41
    var gradient = {
        animating: false,
        startColor: '#42334A', stopColor:  '#1E1723',
        anim: [{angle: 91, startColor: '#42334A', stopColor:  '#1E1723', time: 30000},
               {angle: 179, startColor: '#42334A', stopColor:  '#1E1723', time: 30000}],
        index: 0,
        animCallback: function() {
            if(!gradient.animating)
                return;
            // increment animation frame counter
            if(++gradient.index > gradient.anim.length-1) {
                gradient.index = 0;
                // disable callback cycle
                gradient.animating = false;
            }
            // get next frame of animation
            var f = gradient.anim[gradient.index];
            // animate next frame
            console.log('animating to', f.angle, f.startColor, f.stopColor, f.time);
            background.animate({animGradient: Raphael.util.toAnimGradientParam(f.angle, f.startColor, f.stopColor)}, f.time, gradient.animCallback);
        }
    };



    // define custom attribute for animating gradient
    paper.customAttributes.animGradient = Raphael.util.animGradient;
    // set initial gradient
    background.attr({animGradient: Raphael.util.toAnimGradientParam(90, gradient.startColor, gradient.stopColor)});


    // do cool stuff with our background
    this.render = function() { };

    this.animateGradient = function () {
        if(gradient.animating)
            return;
        gradient.animating = true;
        // kick off animation
        gradient.animCallback();
    };

    this.getPaperElement = function() { return background; };

    this.animateGradient();
}
