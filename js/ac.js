var ac = new (function() {
    var self = this;
    var paper = null;
    var interval = null;

    // global variables
    self.timer = null;
    self.game = null;
    self.renderer = null;
    self.audio = null;

    this.getPaper = function() { return paper; };

    // interval event handler
    this.onInterval = function() {
        self.timer.update();
        self.game.tick(self.timer.getTickCount());
    };

    // html ready entry point
    this.onLoad = function() {
        paper = new Raphael(document.getElementById('screen'), 600, 800);

        // initialize a new fps timer
        self.timer = new Timer();
        // init elements
        self.audio = new ACAudio();
        self.audio.load();
        self.game = new Game();
        self.renderer = new Renderer(paper);
        // kick off render
        self.renderer.render();
        self.ui = new UI(paper);
        // setup a loop
        self.game.reset();
        interval = setInterval(self.onInterval, 10);
        // setup input handlers
        document.addEventListener('keyup', self.onKeyUp);
    };

    this.onKeyUp = function(e){
        var code = (e.charCode ? e.charCode : e.keyCode);
        switch(code) {
            case 37: // left
                if(self.game.canActivePieceMoveLeft())
                    self.game.moveActivePieceLeft(ac.timer.getTickCount());
                else
                    PubSub.publish('ac.badcommand', 'left');
                break;
            case 38: // up
                if(self.game.canActivePieceRotate())
                    self.game.rotateActivePiece(ac.timer.getTickCount());
                else
                    PubSub.publish('ac.badcommand', 'rotate');
                break;
            case 39: // right
                if(self.game.canActivePieceMoveRight())
                    self.game.moveActivePieceRight(ac.timer.getTickCount());
                else
                    PubSub.publish('ac.badcommand', 'right');
                break;
            case 40: // down
                if(self.game.canActivePieceMoveDown())
                    self.game.moveActivePieceDown(ac.timer.getTickCount());
                else
                    PubSub.publish('ac.badcommand', 'down');
                break;
            case 82: // r
                if(self.game.canActivePieceRotate())
                    self.game.rotateActivePiece(ac.timer.getTickCount());
                else
                    PubSub.publish('ac.badcommand', 'rotate');
                break;
            case 32: // drop
                if(self.game.canActivePieceMoveDown())
                    self.game.moveActivePieceAllTheWayDown(ac.timer.getTickCount());
                break;
            default:
                console.log('pressed ' + code);
        }
    };
})();

window.onload = ac.onLoad;
