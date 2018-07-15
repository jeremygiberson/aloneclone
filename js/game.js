function Game () {
    var self = this;
    var board;
    var tickTime = 1000;
    var lastTick = 0;
    var rows;
    var cols;
    var playRowCount = 20;
    var spawnRowCount = 2;

    var activePiece = null;
    var nextPiece = null;

    var isGameOver = false;
    var gameOverState = null;

    var clearedRows = [];

    var score = 0;

    var level = 0;

    this.getBoard = function() { return board; };
    this.getTickTime = function() { return tickTime; };
    this.getLevel = function() { return level; };
    this.setScore = function(s) { self.addScore(s-score); };

    // reset the game
    this.reset = function() {
        score = 0;
        level = 0;
        rows = playRowCount + spawnRowCount;
        cols = 10;
        board = [];
        for(var y = 0; y < rows; y++) {
            board[y] = [];
            for(var x = 0; x < cols; x++) {
                board[y][x] = 0;
            }
        }
        PubSub.publish('game.reset', self);
    };

    this.prepNextPiece = function() {
        var pieces = ['i', 'j', 'l', 'o', 's', 'z', 't'];
        var i = Math.floor(Math.random()*(pieces.length));
        nextPiece = new Piece(pieces[i], 0, 3);
        PubSub.publish('game.setnextpiece', nextPiece);
    };

    this.getSpawnRowCount = function() { return spawnRowCount; };
    this.getPlayRowCount = function() { return playRowCount; };
    this.getPlayColCount = function() { return cols; };
    this.getNextPiece = function(){ return nextPiece; };
    this.setActivePiece = function(piece) {
        activePiece = piece;
        PubSub.publish('game.setpiece', piece);
    };
    this.getActivePiece = function() { return activePiece; };
    this.canActivePieceLock = function() { return (activePiece && activePiece.isSet); };
    this.canActivePieceMoveDown = function() {
        if(!activePiece)
            return false;
        // check if any components of the piece are blocked in their next position
        for(var y = 0; y < activePiece.grid.length; y++) {
            for(var x = 0; x < activePiece.grid[0].length; x++) {
                if(activePiece.grid[y][x] == 1) {
                    var nextY = activePiece.row + y + 1;
                    var nextX = activePiece.col + x;
                    if(nextY > rows-1 || nextX > cols-1 || nextX < 0 || board[nextY][nextX] == 1)
                        return false;
                }
            }
        }
        return true;
    };
    this.canActivePieceMoveLeft = function() {
        if(!activePiece)
            return false;
        // check if any components of the piece are blocked in their next position
        for(var y = 0; y < activePiece.grid.length; y++) {
            for(var x = 0; x < activePiece.grid[0].length; x++) {
                if(activePiece.grid[y][x] == 1) {
                    var nextY = activePiece.row + y;
                    var nextX = activePiece.col + x - 1;
                    if(nextX < 0 || nextX > cols-1 || nextY > rows-1 || board[nextY][nextX] == 1)
                        return false;
                }
            }
        }
        return true;
    };
    this.canActivePieceMoveRight = function() {
        if(!activePiece)
            return false;

        // check if any components of the piece are blocked in their next position
        for(var y = 0; y < activePiece.grid.length; y++) {
            for(var x = 0; x < activePiece.grid[0].length; x++) {
                if(activePiece.grid[y][x] == 1) {
                    var nextY = activePiece.row + y;
                    var nextX = activePiece.col + x + 1;
                    if(nextX > board[0].length-1 || board[nextY][nextX] == 1)
                        return false;
                }
            }
        }
        return true;
    };
    this.canActivePieceRotate = function() {
        if(!activePiece)
            return false;
        var newShapeData = activePiece.peekRotate();
        // check if any components of the piece are blocked in their next position
        for(var y = 0; y < newShapeData.length; y++) {
            for(var x = 0; x < newShapeData[0].length; x++) {
                if(newShapeData[y][x] == 1) {
                    var nextY = activePiece.row + y;
                    var nextX = activePiece.col + x;
                    if(nextY < 0 || nextY > rows-1 ||nextX > cols-1 || nextX < 0 || board[nextY][nextX] == 1)
                        return false;
                }
            }
        }
        return true;
    };
    this.moveActivePieceDown = function(tickCount) {
        activePiece.moveDown();
        lastTick = tickCount;
    };
    this.moveActivePieceAllTheWayDown = function(tickCount) {
        while(self.canActivePieceMoveDown()) {
            activePiece.moveDown();
        }
        lastTick = tickCount;
    };
    this.moveActivePieceLeft = function(tickCount) {
        activePiece.moveLeft();
        //lastTick = tickCount;
    };
    this.moveActivePieceRight = function(tickCount) {
        activePiece.moveRight();
        //lastTick = tickCount;
    };
    this.rotateActivePiece = function(tickCount) {
        activePiece.rotate();
        //lastTick = tickCount;
    };
    this.prepActivePieceLock = function() {
        activePiece.set()
    };
    this.lockActivePiece = function() {
        // copy piece to final board position
        for(var y = 0; y < activePiece.grid.length; y++) {
            for(var x = 0; x < activePiece.grid[0].length; x++) {
                if(activePiece.grid[y][x] == 1) {
                    var theY = activePiece.row + y;
                    var theX = activePiece.col + x;
                    board[theY][theX] = 1;
                }
            }
        }
        self.addScore(100, 'placed piece');
        PubSub.publish('game.lockedpiece', activePiece);
        // throw away active piece
        this.setActivePiece(null);
    };
    this.onActivePieceLocked = function() {
        // check for lose
        if(this.hasAnyLockedPiecesInSpawn()) {
            isGameOver = true;
            gameOverState = 'lose';
            PubSub.publish('game.gameover', self);
            return;
        }
    };
    this.hasAnyLockedPiecesInSpawn = function() {
        for(var y = 0; y < spawnRowCount; y++) {
            for(var x = 0; x < cols; x++) {
                if(board[y][x] == 1)
                    return true;
            }
        }
        return false;
    };
    this.hasAnyFullRows = function() {
        for(var y = spawnRowCount; y < rows; y++) {
            var full = true;
            for(var x = 0; x < cols; x++) {
                if(board[y][x] == 0)
                    full = false;
            }
            if(full)
                return true;
        }
        return false;
    };
    this.hasAnyClearedRows = function() {
        return (clearedRows.length > 0);
    };
    this.clearFullRows = function() {
        for(var y = spawnRowCount; y < rows; y++) {
            var full = true;
            for(var x = 0; x < cols; x++) {
                if(board[y][x] == 0)
                    full = false;
            }
            if(full) {
                // mark row cleared
                for(var x = 0; x < cols; x++) {
                    board[y][x] = 0;
                }
                clearedRows.push(y);
            }
        }
        var factors = [3, 8, 14, 24, 36, 50]; // we only have 4 high blocks, but maybe in the future
        this.addScore(factors[clearedRows.length-1] * 100, 'cleared row x'+clearedRows.length);
        PubSub.publish('game.clearedrows', clearedRows);
    };
    this.shiftRowsDown = function() {
        for(var i = 0; i < clearedRows.length; i++) {
            var clearY = clearedRows[i];
            // for rows above cleared row, shift rows down
            for(var y = clearY; y >= spawnRowCount; y--) {
                // set cleared row to row above it
                for(var x = 0; x < cols; x++) {
                    board[y][x] = board[y-1][x];
                }
            }
        }

        var cleared = true;
        clearedYLoop:
        for(var y = 0; y < board.length; y++) {
            for(var x = 0; x < board[0].length; x++) {
                if(board[y][x] == 1) {
                    cleared = false;
                    break clearedYLoop;
                }
            }
        }
        if(cleared) {
            self.addScore(1000, 'cleared the board!');
        }


        PubSub.publish('game.shiftedrows', self);
        // reset cleared rows
        clearedRows = [];
    };

    // process one game round
    this.tick = function(tickCount) {
        // only process game logic at tickTime interval
        if(tickCount - lastTick < tickTime)
            return false;
        lastTick = tickCount;

        if(isGameOver)
            return false;
        if(nextPiece == null) {
            this.prepNextPiece();
            PubSub.publish('game.tick', self);
            return true;
        }
        if(activePiece == null) {
            if(this.hasAnyFullRows()) {
                this.clearFullRows();
            } else if(this.hasAnyClearedRows()) {
                this.shiftRowsDown();
            } else {
                this.setActivePiece(this.getNextPiece());
                this.prepNextPiece();
            }
        } else {
            if(this.canActivePieceLock()) {
                // check if the piece can move down (it may have rotated or moved during set)
                if(this.canActivePieceMoveDown()) {
                    this.moveActivePieceDown(tickCount);
                } else {
                    // if piece has been set and cooldown time has elapsed, lock the piece on the board
                    this.lockActivePiece();
                    // handle piece being locked in place (scan for row complete, win/lose, etc
                    this.onActivePieceLocked();
                }
            } else if(this.canActivePieceMoveDown(tickCount)) {
                // if the piece can move down, do so
                this.moveActivePieceDown(tickCount);
            } else {
                // we've reached bottom, prep the piece for locking
                this.prepActivePieceLock();
            }
        }
        PubSub.publish('game.tick', self);
        return true;
    };

    this.addScore = function(add, desc) {
        score += add;
        PubSub.publish('game.scorechanged', {change: add, total: score, description: desc});
        this.adjustLevel();
    };

    var expForFirstLevel = 1000;
    var expForLastLevel = 999999;
    var levels = 9;
    this.adjustLevel = function() {
        if(level == 9)
            return;

        var newLevel = 0;

        var B = Math.log(expForLastLevel/expForFirstLevel) / (levels-1);
        var A = expForFirstLevel / (Math.exp(B)-1);

        for(var i = 9; i >= 0; i--) {
            var oldXp = Math.ceil(A * Math.exp(B * (i-1)));
            var newXp = Math.ceil(A * Math.exp(B * (i)));
            var exp = newXp - oldXp;
            if(score >= exp) {
                newLevel = i;
                break;
            }
        }

        if(newLevel != level)
        {
            level = newLevel;
            tickTime = 1000 - (level * 90);
            PubSub.publish('game.levelchanged', level);
        }
    };

    this.getNextExpGoal = function() {
        if(level == 9)
            return 0;
        var B = Math.log(expForLastLevel/expForFirstLevel) / (levels-1);
        var A = expForFirstLevel / (Math.exp(B)-1);

        var i = level + 1;
        var oldXp = Math.ceil(A * Math.exp(B * (i-1)));
        var newXp = Math.ceil(A * Math.exp(B * (i)));
        return newXp - oldXp;
    };
}

function Piece (shape, row, col) {
    var self = this;
    self.shape = shape;
    self.grid = deepCopy(GameShapes[shape].grid[0]);
    self.color = GameShapes[shape].color;
    self.row = row;
    self.col = col;
    self.isSet = false;
    self.rotation = 0;

    self.rotate = function() {
        var data = deepCopy(self.peekRotate());
        self.grid = data;
        self.rotation++;
        if(self.rotation > GameShapes[self.shape].grid.length)
            self.rotation = 0;
        // broadcast rotation
        PubSub.publish('piece.rotate', self);
    };
    self.moveLeft = function() {
        self.col --;
        PubSub.publish('piece.moveleft', self);
    };
    self.moveRight = function() {
        self.col ++;
        PubSub.publish('piece.moveright', self);
    };
    self.moveDown = function() {
        self.row ++;
        PubSub.publish('piece.movedown', self);
    };
    self.set = function() {
        self.isSet = true;
        PubSub.publish('piece.set', self);
    };
    self.peekRotate = function() {
        var nextRotation = self.rotation+1;
        if(nextRotation > GameShapes[self.shape].grid.length-1)
            nextRotation = 0;
        var d = deepCopy(GameShapes[self.shape].grid[nextRotation]);
        return d;
    };
}

function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}

var GameShapes = {
    i: {
        grid: [[[0,0,0,0],
                [1,1,1,1],
                [0,0,0,0],
                [0,0,0,0]],

               [[0,0,1,0],
                [0,0,1,0],
                [0,0,1,0],
                [0,0,1,0]],

               [[0,0,0,0],
                [0,0,0,0],
                [1,1,1,1],
                [0,0,0,0]],

               [[0,1,0,0],
                [0,1,0,0],
                [0,1,0,0],
                [0,1,0,0]]
        ],
        center: {row: 2, col: 2},
        color: '#C56D83'
    },
    j: {
        grid: [[[0,0,1],
                [1,1,1],
                [0,0,0]],

               [[0,1,0],
                [0,1,0],
                [0,1,1]],

               [[0,0,0],
                [1,1,1],
                [1,0,0]],

               [[1,1,0],
                [0,1,0],
                [0,1,0]]
        ],
        center: {row: 1.5, col: 1.5},
        color: '#7B7EB7'
    },
    l: {
        grid: [[[1,0,0],
                [1,1,1],
                [0,0,0]],

               [[0,1,1],
                [0,1,0],
                [0,1,0]],

               [[0,0,0],
                [1,1,1],
                [0,0,1]],

               [[0,1,0],
                [0,1,0],
                [1,1,0]]
        ],
        center: {row: 1.5, col: 1.5},
        color: '#82B1B1'
    },
    o: {
        grid: [[[1,1],
                [1,1]]
        ],
        center: {row: 1, col: 1},
        color: '#8DA857'
    },
    s: {
        grid: [[[0,1,1],
                [1,1,0],
                [0,0,0]],

               [[0,1,0],
                [0,1,1],
                [0,0,1]],

               [[0,0,0],
                [0,1,1],
                [1,1,0]],

               [[1,0,0],
                [1,1,0],
                [0,1,0]]
        ],
        center: {row: 1.5, col: 1.5},
        color: '#DD9056'
    },
    t: {
        grid: [[[0,1,0],
                [1,1,1],
                [0,0,0]],

               [[0,1,0],
                [0,1,1],
                [0,1,0]],

               [[0,0,0],
                [1,1,1],
                [0,1,0]],

               [[0,1,0],
                [1,1,0],
                [0,1,0]]
        ],
        center: {row: 1.5, col: 1.5},
        color: '#DEB754'
    },
    z: {
        grid: [[[1,1,0],
                [0,1,1],
                [0,0,0]],

               [[0,0,1],
                [0,1,1],
                [0,1,0]],

               [[0,0,0],
                [1,1,0],
                [0,1,1]],

               [[0,1,0],
                [1,1,0],
                [1,0,0]]
        ],
        center: {row: 1.5, col: 1.5},
        color: '#661D34'
    }
};