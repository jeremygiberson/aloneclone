var Timer = function () {
    var frames = 0;
    var lastUpdate = (new Date()).getTime();
    var lastTime = lastUpdate;
    this.fps = 0;
    this.deltaTime = 0;
    this.timeScale = 1;

    this.getTickCount = function() {
        return lastTime;
    };

    this.update = function () {
        frames++;
        var now = (new Date()).getTime();
        if (now - lastUpdate > 1000) {
            this.fps = frames;
            frames = 0;
            lastUpdate = now;
        }
        // keep track of time between update frames
        var diff = now - lastTime;
        lastTime = now;

        // mod delta time by a timeScale to allow for slow motion settings
        this.deltaTime = (diff / 1000) * this.timeScale;
    };
}