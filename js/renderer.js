function Renderer (paperObject) {
    var self = this;
    var paper = paperObject;

    var dimensions = { blockSize: 20 };
    dimensions.width = dimensions.blockSize * 10;
    dimensions.height = dimensions.blockSize * 20;
    dimensions.offsetX = (paper.width - dimensions.width)/2;
    dimensions.offsetY = (paper.height - dimensions.height)/2;

    var sets = {
        background: paper.set(),
        playground: paper.set(),
        foreground: paper.set(),
        overlay: paper.set()
    };

    this.rx = function(x) { return x + dimensions.offsetX; };
    this.ry = function(y) { return y + dimensions.offsetY; };
    this.getDimensions = function() {
        return dimensions;
    };
    var activePiece = null;
    this.onSetPiece = function(piece) {
        if(piece == null) {
            activePiece.remove();
            activePiece = null;
            return;
        }
        activePiece = paper.set();
        activePiece._orig = {'col': piece.col, 'row': piece.row};
        activePiece._cur = {'col': piece.col, 'row': piece.row};
        activePiece._anim = null;

        for(var y = 0; y < piece.grid.length; y++) {
            for(var x= 0; x < piece.grid[0].length; x++) {
                if(piece.grid[y][x] != 1)
                    continue;
                var sx = (x) * dimensions.blockSize;
                // y-2 to account for spawn rows positioning
                var sy = (y - 2) * dimensions.blockSize;
                var block = paper.rect(self.rx(sx), self.ry(sy),
                                       dimensions.blockSize, dimensions.blockSize);
                block.attr({
                    fill: piece.color,
                    stroke: piece.color
                });
                activePiece.push(block);
            }
        }

        // add piece to view group
        activePiece.forEach(function(e){
            self.view.addElementToGroup(e);
        }, self);

        var tx = activePiece._cur.col * dimensions.blockSize;
        var ty = (activePiece._cur.row + 1) * dimensions.blockSize;
        activePiece._next = {'y': ty, 'time': ac.timer.getTickCount()};
        activePiece.transform('t' + tx + ',' + ty);
        sets.playground.push(activePiece);
    };

    this.onPieceMoveDown = function(piece) {
        activePiece._cur = {col: piece.col, row: piece.row};
        var tx = activePiece._cur.col * dimensions.blockSize;
        var ty = activePiece._cur.row * dimensions.blockSize;
        activePiece._next.y = ty + dimensions.blockSize;
        activePiece._next.time = ac.timer.getTickCount()+ac.game.getTickTime();
        activePiece.stop();

        activePiece.transform('t'+tx+','+(ty));

        if(!ac.game.canActivePieceMoveDown()) {
            activePiece.stop();
            return;
        }

        activePiece._anim = activePiece.animate({
            transform: 't' + tx + ',' + activePiece._next.y
        }, ac.game.getTickTime());
    };

    this.onPieceMoveLeftOrRight = function(piece) {
        activePiece.stop(activePiece._anim);
        // get current transform y
        var tx = piece.col * dimensions.blockSize;
        var ty = activePiece.items[0].transform().toString().split(',')[1];
        // set update transform for new x
        activePiece.transform('t'+tx+','+ty);

        if(!ac.game.canActivePieceMoveDown())
            return;
        // set dest transform
        var dt = activePiece._next.time - ac.timer.getTickCount();
        if(dt < 0)
            return;
        activePiece._anim = activePiece.animate({transform: 't'+tx+','+ activePiece._next.y}, dt);
    };

    this.onPieceRotate = function(piece) {
        // stop animation
        activePiece.stop();
        // get current transform values
        var tx = piece.col * dimensions.blockSize;
        var ty = activePiece.items[0].transform().toString().split(',')[1];

        var _next = activePiece._next;
        // rebuild g elements
        activePiece.remove();
        activePiece = paper.set();
        activePiece._next = _next;
        for(var y = 0; y < piece.grid.length; y++) {
            for(var x= 0; x < piece.grid[0].length; x++) {
                if(piece.grid[y][x] != 1)
                    continue;
                var sx = (x) * dimensions.blockSize;
                // y-2 to account for spawn rows positioning
                var sy = (y - 2) * dimensions.blockSize;
                var block = paper.rect(self.rx(sx), self.ry(sy),
                    dimensions.blockSize, dimensions.blockSize);
                block.attr({
                    fill: piece.color,
                    stroke: piece.color
                });
                activePiece.push(block);
            }
        }

        // add piece to view group
        activePiece.forEach(function(e){
            self.view.addElementToGroup(e);
        }, self);

        // refresh transform & animation
        activePiece.transform('t'+tx+','+ty);
        if(!ac.game.canActivePieceMoveDown())
            return;
        // set dest transform
        var dt = activePiece._next.time - ac.timer.getTickCount();
        if(dt < 0)
            return;
        activePiece._anim = activePiece.animate({transform: 't'+tx+','+ activePiece._next.y}, dt);
    };

    this.onPieceSet = function(piece) {
        activePiece.animate({
            fill: '#000',
            stroke: '#000'
        }, ac.game.getTickTime());
    };

    this.onPieceLock = function(piece) {
        // iterate over blocks in piece and add them to playground statically
        for(var y = 0; y < piece.grid.length; y++) {
            for(var x = 0; x < piece.grid[0].length; x++) {
                if(piece.grid[y][x] == 1) {
                    var sx = self.rx((piece.col+x) * dimensions.blockSize);
                    var sy = self.ry((piece.row+y-ac.game.getSpawnRowCount()) * dimensions.blockSize);
                    var block = paper.rect(sx, sy, dimensions.blockSize, dimensions.blockSize);
                    block.attr({
                        fill: '#000',
                        stroke: '#000'
                    });
                    sets.playground.push(block);
                    self.view.addElementToGroup(block);
                }
            }
        }
    };

    var clearedRows = null;
    this.onClearedRows = function(rows) {
        clearedRows = paper.set();
        for(var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var y = self.ry((row - ac.game.getSpawnRowCount()) * dimensions.blockSize);
            var x = self.rx(0);
            var block = paper.rect(x, y, ac.game.getPlayColCount() * dimensions.blockSize, dimensions.blockSize);
            block.attr({
                fill: '#fff',
                stroke: '#fff'
            });
            clearedRows.push(block);
            self.view.addElementToGroup(block);
        }
    };

    this.onShiftedRows = function() {
        // trigger particles on cleared rows
        // remove line clear indicators
        clearedRows.remove();
        // re-render playing field
        sets.playground.remove();
        sets.playground = paper.set();
        var data = ac.game.getBoard();
        for(var row = 0; row < data.length; row++) {
            for(var col = 0; col < data[0].length; col++) {
                if(data[row][col] == 0)
                    continue;
                var x = self.rx(col * dimensions.blockSize);
                var y = self.ry((row - ac.game.getSpawnRowCount()) * dimensions.blockSize);
                var block = paper.rect(x, y, dimensions.blockSize, dimensions.blockSize);
                block.attr({
                    fill: '#000',
                    stroke: '#000'
                });
                sets.playground.push(block);
                self.view.addElementToGroup(block);
            }
        }
    };

    // render stage
    this.render = function() {
        self.background = new Background(paper);
        sets.background.push(self.background.getPaperElement());
        self.view = new View(paper, dimensions.offsetX, dimensions.offsetY, dimensions.width, dimensions.height);
    };

    // subscribe to events
    PubSub.subscribe('game.setpiece', self.onSetPiece);
    PubSub.subscribe('piece.movedown', self.onPieceMoveDown);
    PubSub.subscribe('piece.moveleft', self.onPieceMoveLeftOrRight);
    PubSub.subscribe('piece.moveright', self.onPieceMoveLeftOrRight);
    PubSub.subscribe('piece.rotate', self.onPieceRotate);
    PubSub.subscribe('piece.set', self.onPieceSet);
    PubSub.subscribe('game.lockedpiece', self.onPieceLock);
    PubSub.subscribe('game.clearedrows', self.onClearedRows);
    PubSub.subscribe('game.shiftedrows', self.onShiftedRows);
}
