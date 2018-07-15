function UI(paperObject) {
    var self = this;
    var paper = paperObject;
    var fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    var fontSize = '12pt';
    var fpsText = null;
    var color = '#fff';

    var score = {label: null, value: null};
    var level = {label: null, value: null};
    var gameover = {label: null, button: null};

    this.initScore = function() {
        var dim = ac.renderer.getDimensions();
        var tx = dim.offsetX+dim.width + 80;
        var ty = dim.offsetY+1;
        score.label = paper.text(tx, ty, 'Score').toFront();
        score.label.transform(['r',90,tx,ty].join(','));
        ac.renderer.view.addElementToGroup(score.label);
        score.label.attr({
            fill: '#fff',
            'text-anchor': 'start',
            'font-family': fontFamily,
            'font-size': '32pt',
            'font-weight': 'bold'
        });

        tx = dim.offsetX+dim.width + 33;
        ty = dim.offsetY;
        score.value = paper.text(tx, ty, '0').toFront();
        score.value.transform(['r',90,tx,ty].join(','));
        ac.renderer.view.addElementToGroup(score.value);
        score.value.attr({
            fill: '#fff',
            'text-anchor': 'start',
            'text-align': 'left',
            'font-family': fontFamily,
            'font-size': '68pt',
            'font-weight': 'bold'
        });
    };

    this.onScoreChanged = function(options) {
        // update score
        var val = options.total;
        if(val > 1000000) {
            val = ((options.total) / 1000000).toFixed(4) + 'MM';
        }
        score.value.attr({text: val});
    };

    this.initLevel = function() {
        var dim = ac.renderer.getDimensions();
        var tx = dim.offsetX - 80;
        var ty = dim.offsetY+dim.height;
        level.label = paper.text(tx, ty, 'Go for ' + ac.game.getNextExpGoal()).toFront();
        level.label.transform(['r',-90,tx,ty].join(','));
        ac.renderer.view.addElementToGroup(level.label);
        level.label.attr({
            fill: '#fff',
            'text-anchor': 'start',
            'font-family': fontFamily,
            'font-size': '32pt',
            'font-weight': 'bold'
        });

        tx = dim.offsetX - 33;
        ty = dim.offsetY + dim.height;
        level.value = paper.text(tx, ty, 'INTINSITY ' + ac.game.getLevel()).toFront();
        level.value.transform(['r',-90,tx,ty].join(','));
        ac.renderer.view.addElementToGroup(level.value);
        level.value.attr({
            fill: '#fff',
            'text-anchor': 'start',
            'text-align': 'left',
            'font-family': fontFamily,
            'font-size': '70.5pt',
            'font-weight': 'bold'
        });
    };

    this.onLevelChanged = function(lvl) {
        if(ac.game.getLevel() == 9) {
            level.label.attr({text: 'Over 9000? Impossible'});
            level.value.attr({text: 'INTINSITY ' + lvl});
        } else {
            level.label.attr({text: 'Next big score ' + ac.game.getNextExpGoal()});
            level.value.attr({text: 'INTINSITY ' + lvl});
        }
    };

    this.onGameOver = function() {
        var dim = ac.renderer.getDimensions();
        var cx = dim.offsetX + (dim.width/2);
        var cy = dim.offsetY + (dim.height/2);
        gameover.label = paper.text(cx, cy, "Game\nOver");
        ac.renderer.view.addElementToGroup(gameover.label);
        gameover.label.attr({
            'font-size': '70pt',
            'font-weight': 'bold',
            'font-family': fontFamily,
            fill: '#fff',
            opacity: 0
        });
        gameover.label.animate({opacity: 1}, 2000);
    };
    this.onReset = function(game) {};

    this.initScore();
    this.initLevel();

    PubSub.subscribe('game.scorechanged', self.onScoreChanged);
    PubSub.subscribe('game.levelchanged', self.onLevelChanged);
    PubSub.subscribe('game.gameover', self.onGameOver);
    PubSub.subscribe('game.reset', self.onReset);
}
