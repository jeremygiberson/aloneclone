var View = function(paperObject, x, y, w, h) {
    var self = this;
    var paper = paperObject;
    var tilt = 0;
    var shiftMagnitude = 7;
    var group = paper.group();
    var animate = true;

    var next = {anim: null, m: null, r: 0, x: 0, y: 0, s: 1, tick: ac.timer.getTickCount()+1000};

    var origMatrix = group.matrix.clone();
    // view clipping (these sizes get us scaling to .21 @ 600x800)
    var viewRects = {
        top: paper.rect(x-2000, y-2000, 4000+w, 2000),
        left: paper.rect(x-2000, y, 2000, h),
        right: paper.rect(x+w, y, 2000, h),
        bottom: paper.rect(x-2000, y+h, 4000+w, 2000)
    };

    for(var i in viewRects) {
        viewRects[i].attr({fill: '#000'});
        group.node.appendChild(viewRects[i].node);
    }

    this.getGroup = function() { return group; };
    this.addElementToGroup = function (element) {
        group.node.appendChild(element.node);
    };

    this.animTo = function(scale, rot, x, y, ms) {
        var m = group.matrix.clone();
        m.rotate(rot, paper.width/2, paper.height/2);
        m.translate(x, y);
        next.m = m;
        next.tick = ac.timer.getTickCount() + ms;
        group.animate({
            transform: m.toTransformString()
        }, ms);
    };

    // ideally, this would set tilt based on balance of board
    this.onLockedPiece = function(piece) {
        return;
        var board = ac.game.getBoard();
        var lCount = 0, rCount = 0, yLevel = ac.game.getPlayRowCount();
        var maxYLevel = ac.game.getPlayRowCount();
        var half = parseInt(board[0].length/2);
        for(var row = 0; row < board.length; row++) {
            for(var col = 0; col < board[0].length; col++) {
                if(board[row][col] != 1)
                    continue;
                if(col <= half)
                    lCount++;
                else
                    rCount++;
                if(row < yLevel)
                    yLevel = row;
            }
        }
        // calc tilt
        var angle = lCount < rCount ? 30 : -30;
        tilt = parseInt(angle * ((maxYLevel - yLevel)/maxYLevel));
        console.log(tilt, lCount, rCount, half, angle, yLevel, maxYLevel, group);
        group.animate({transform: 'R'+tilt+','+(paper.width/2)+','+(paper.height/2)}, 1000);
    };
    this.onClearedRows = function(clearedRows) {
        shiftMagnitude = clearedRows.length * 7;
    };
    this.onShiftedRows = function() {
        // stop current animation
        group.stop(next.anim);
        var m = group.matrix.clone();

        var jiggles = [m];
        for(var i = 0; i < 4; i++) {
            m = group.matrix.clone();
            m.translate(Math.floor(Math.random()*shiftMagnitude+1), Math.floor(Math.random()*shiftMagnitude+1));
            jiggles.push(m);
        }
        var shake = function() {
            if(jiggles.length < 1) {
                var dt = next.tick - ac.timer.getTickCount();
                if(dt <= 0) {
                    // set transform
                    console.log('dt elapsed');
                    group.transform(next.m.toTransformString());
                    self.animateView();
                } else {
                    console.log('resume anim');
                    group.animate({transform: next.m.toTransformString()}, dt, 'elastic', self.animateView);
                }
                return;
            }
            var matrix = jiggles.pop();
            group.animate({transform: matrix.toTransformString()}, 75, 'bounce', shake);
        };
        shake();
    };

    this.toTransformString = function(x, y, r, s) {
        var cx = paper.width/2;
        var cy = paper.height/2;
        var s = ['T',x,y,'R',r,cx,cy,'S',s,cx,cy].join(',');
        console.log(s);
        return s;
    };
    this.animateView = function() {
        if(!animate)
            return;
        // 50/50 change view
        //var change = Math.floor(Math.random()*2);
        var change = true;
        if(change) {
            // find the first row with a block in its
            var highestRowWithPiece = ac.game.getPlayRowCount();
            var board = ac.game.getBoard();
            rowLoop:
            for(var row = 0; row < board.length; row++) {
                for(var col = 0; col < board[0].length; col++) {
                    if(board[row][col] == 1) {
                        highestRowWithPiece = row;
                        break rowLoop;
                    }
                }
            }
            // possible rotation grows the higher your block stack is
            var maxTheta = 5 + parseInt(25 * ((ac.game.getPlayRowCount() - highestRowWithPiece)/ac.game.getPlayRowCount()));
            var m = origMatrix.clone();
            var newAngle = Math.floor(Math.random()*((maxTheta*2)+1))-maxTheta;
            var dtAngle = newAngle - tilt;
            tilt = newAngle;
            var time = ((Math.floor(Math.abs(dtAngle)/5)+1) * 10000); // 5 deg per 10 second anim
            var nextTime = ac.timer.getTickCount() + time;
            // we may eventually animate x/scale
            var newX = 0;
            var newY = 0;
            var newScale = 1;
            m.translate(newX, newY);
            m.scale(newScale, newScale, paper.width/2, paper.height/2);
            m.rotate(dtAngle, paper.width/2, paper.height/2);
            next = {'m': m, x: newX, y: newY, s: newScale, r: newAngle, tick: nextTime };
            next.anim = group.animate({transform:m.toTransformString()}, time, 'elastic', self.animateView);
        } else {
            var m = group.matrix.clone();
            next.m = m;
            var time = 5000;// 5 seconds of no change
            next.tick = ac.timer.getTickCount() + time;
            next.anim = group.animate({transform:m.toTransformString()}, time, 'elastic', self.animateView);
        }
    };

    this.onGameOver = function() {
        var dim = ac.renderer.getDimensions();
        var r = paper.rect(dim.offsetX, dim.offsetY, dim.width, 10);
        r.attr({fill: '#000'});
        self.addElementToGroup(r);
        r.animate({height: dim.height}, 2000);
    };

    this.onReset = function() {
        animate = true;
        // wait 10 seconds, then begin animating
        setTimeout(self.animateView, 10000);
    };

    PubSub.subscribe('game.lockedpiece', self.onLockedPiece);
    PubSub.subscribe('game.clearedrows', self.onClearedRows);
    PubSub.subscribe('game.shiftedrows', self.onShiftedRows);
    PubSub.subscribe('game.gameover', self.onGameOver);
    PubSub.subscribe('game.reset', self.onReset);
};
