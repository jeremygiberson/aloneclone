function ACAudio () {
    var self = this;
    var context = (typeof webkitAudioContext == 'undefined' ? new Audio() : new webkitAudioContext());
    this.sfx = {
        bloop: {file: 'media/bloop.wav', loaded: false, buffer: null},
        brip: {file: 'media/brip.wav', loaded: false, buffer: null},
        crunch: {file: 'media/crunch.wav', loaded: false, buffer: null},
        ploom: {file: 'media/ploom.wav', loaded: false, buffer: null},
        melo: {file: 'media/melo.m4a', loaded: false, buffer: null},
        rush: {file: 'media/rush.m4a', loaded: false, buffer: null}
    };

    this.getAudioContext = function(){ return context; };
    this.isLoaded = function() {
        for(var i in self.sfx) {
            if(!self.sfx[i].loaded)
                return false;
        }
        return true;
    };

    this.load = function() {
        for(var i in self.sfx) {
            (function(sound, name){
                var request = new XMLHttpRequest();
                request.open('GET', sound.file, true);
                request.responseType = 'arraybuffer';
                request.onload = function(){
                    context.decodeAudioData(request.response, function(buffer) {
                        sound.buffer = buffer;
                        sound.loaded = true;
                        PubSub.publish('audio.loaded', name);
                    }, function(er){ console.log('failed to load', er); throw "Failed to load " + i; });
                };
                request.send();
            })(self.sfx[i], i);
        }
    };
    var loops = [];
    this.play = function(name, loop) {
        if(typeof loop === 'undefined')
            loop = false;
        var sound = self.sfx[name];
        if(!sound.loaded)
            return;
        var source = context.createBufferSource();
        source.buffer = sound.buffer;
        source.loop = loop;
        source.connect(context.destination);
        source.noteOn(0);
        if(loop)
            loops.push(source);
    };

    this.onPieceMoveLeftOrRight = function() {
        self.play('bloop');
    };

    this.onPieceRotate = function() {
        self.play('bloop');
    };

    this.onClearedRows = function(){
        self.play('brip');
    };

    this.onShiftedRows = function() {
        self.play('crunch');
        //self.play('bloop');
    };

    this.onBadCommand = function() {
        self.play('ploom');
    };

    this.onAudioLoaded = function(sound) {
        //if(sound == 'melo')
        //    self.play(sound, true);
    };

    this.stopLoops = function() {
        for(var i in loops) {
            loops[i].disconnect();
        }
    };

    // register subscriptions
    PubSub.subscribe('piece.moveleft', self.onPieceMoveLeftOrRight);
    PubSub.subscribe('piece.moveright', self.onPieceMoveLeftOrRight);
    PubSub.subscribe('piece.rotate', self.onPieceRotate);
    PubSub.subscribe('game.clearedrows', self.onClearedRows);
    PubSub.subscribe('game.shiftedrows', self.onShiftedRows);
    PubSub.subscribe('ac.badcommand', self.onBadCommand);
    PubSub.subscribe('audio.loaded', self.onAudioLoaded);
}
