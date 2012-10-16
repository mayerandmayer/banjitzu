// Setup Parse
Parse.initialize("0vkAZmA6fG72LcEdrdhSFSGwak929wuNg7pYUnS3", "ajpyz4W4mSH1xqUqMuz8fZfuEwgtER9Aj7jSC8k1");

var Sequence = Parse.Object.extend("Sequence");

function ParseGlobal($scope) {
    
    $scope.currentUser = Parse.User.current();
    
    $scope.updateUser = function() {
        $scope.currentUser = Parse.User.current();
    }
    
    $scope.logout = function() {
        Parse.User.logOut();
        $scope.updateUser()
    }
    
}

function onError(error) {
    alert ("Error: " + error.code + " " + error.message);
}

function Authentication($scope) {
    
    $scope.register = function() {
        
        var user = new Parse.User();
        user.set("username", $scope.register.username);
        user.set("password", $scope.register.password);
        user.set("email",    $scope.register.email);
        
        user.signUp(null, {
            success: function(user) {
                $scope.$apply(function() {
                    $scope.updateUser();
                });
            },
            error: function(user,error) {
                onError(error);
            }
        });
        
    }
    
    $scope.login = function() {
        
        Parse.User.logIn($scope.login.username, $scope.login.password, {
            success: function(user) {
                $scope.$apply(function() {
                    $scope.updateUser();
                });
            },
            error: function(user, error) {
                onError(error);
            }
        });
        
    }
}

// Constants
var numPitches = 13;
//var numPitches = 1;
var numTimeSlices = 32;
var numChannels = 2;
var bpm = 120;
var sampleRate = 44100; // Hz
var samplesPerSlice = Math.floor(sampleRate * 60 * (1/bpm) * (1/4))

function Editor($scope) {
    
    /* Shared data for the Sequence Editor */
    
    // The blank sequence
    var blankData = [];
    for (var i = 0; i < numTimeSlices; i += 1) {
        var timeslice = [];
        for (var j = 0; j < numPitches; j += 1) {
            timeslice[j] = false;
        }
        blankData[i] = timeslice;
    }
    
    $scope.currentSequence = {}
        
    $scope.openSequence = function(name, data) {
        
        var timeSlices = _.map(data, function(slice) {
            var noteCells = _.map(slice, function(playPitch) {            
                return {
                    playPitch: playPitch
                };
            });
            return { 
                noteCells: noteCells,
                needsUpdate: false
            };
        });
        
        $scope.currentSequence = {
            name: name,
            timeSlices: timeSlices,
            waveData: _.map(_.range(numChannels*numTimeSlices*samplesPerSlice),
                            function(x){return 128;})
        }
        
    }
    
    $scope.extractData = function() {
        return _.map($scope.currentSequence.timeSlices, function(timeSlice) {
            return _.map(timeSlice.noteCells, function(noteCell) {
                return noteCell.playPitch;
            });
        });
    }
    
    $scope.openSequence("Untitled", blankData);
    
    $scope.rebuildWaveData = function() {
        
        //console.log("Rebuilding sequence");
        
        for (var i = 0; i < numTimeSlices; i += 1) {
            
            var timeSlice = $scope.currentSequence.timeSlices[i];
            
            if (timeSlice.needsUpdate) {
                
                //console.log("Adding slice");
                
                var offset = numChannels * samplesPerSlice * i;
                
                for (var j = 0; j < numChannels * samplesPerSlice; j += 1) {
                    
                    $scope.currentSequence.waveData[offset+j] = 
                        timeSlice.waveData[j];
                    
                }
                
                timeSlice.needsUpdate = false;
                
            }
            
        }
        
    }
    
    var play = function() {
        
        //console.log($scope.currentSequence.waveData.length);
        
        console.log('making waves');
        
        var audio = new Audio();
        var wave = new RIFFWAVE();
        wave.header.sampleRate = sampleRate;
        wave.header.numChannels = numChannels;
        wave.Make($scope.currentSequence.waveData);
        
        console.log('Hitting Play');
        
        audio.src = wave.dataURI;
        audio.play();
        
    }
    
    $scope.task = undefined;
    
    $scope.start = function() {
        if($scope.task) $scope.stop();
        $scope.task = setInterval(play, 4000)
    }
    
    $scope.stop = function() {
        $scope.task = clearInterval($scope.task)
    }
    
    $scope.saveAsNew = function() {
        
        var sequence = new Sequence();
        sequence.set("data", $scope.extractData());
        sequence.set("name", $scope.newSequence.name);
        sequence.set("owner", $scope.currentUser);
        
        var sequenceACL = new Parse.ACL();
        sequenceACL.setPublicReadAccess(true);
        sequenceACL.setWriteAccess($scope.currentUser, true);
        
        sequence.setACL(sequenceACL);
        
        sequence.save(null, {
            success: function(sequence) {
                alert("Good");
            },
            error: function(sequence, error) {
                onError(error);
            }
        });
        
    }
    
    /* Shared data for the Library */

    
    $scope.viewingUser = $scope.currentUser;
    $scope.sequences = [];
    
    $scope.loadUserSequences = function(user) {
        
        var query = new Parse.Query(Sequence);
        query.equalTo("owner", user);
        query.find({
            success: function(userSequences) {
                $scope.$apply(function() {
                    $scope.sequences = userSequences;
                });
            },
            error: function(userSequences, error) {
                onError(error);
            }
        });
        
    }
    
    $scope.loadUserSequences($scope.viewingUser);
    
    $scope.drawWave = function() {
        //alert("Drawing...");
        
        var c = document.getElementById("waveForm");
        var w = c.width;
        var h = c.height;
        var ctx = c.getContext("2d");
        ctx.fillStyle="#000000";
        
        var total = numChannels * numTimeSlices * samplesPerSlice;
        
        //alert("Drawing " + total);
        
        for (var i = 0; i < total; i += 1) {
            x = i / total * w;
            y = $scope.currentSequence.waveData[i] / 256 * h;
            ctx.fillRect(x,y,1,1);
        }
        
    }
    
}

function LibrarySequence($scope) {
    
    $scope.load = function() {
        
        $scope.openSequence($scope.sequence.attributes.name, 
                            $scope.sequence.attributes.data);
        
    }
    
}

function TimeSlice($scope) {
    
    // $scope.timeSlice
    // $scope.timeSlice.noteCells
    
    function attackCoeff(x) {
        return 1 - Math.pow(((2 * x) - 1), 6);
    }
    
    $scope.timeSlice.waveData = [];
    
    $scope.rebuildSliceWaveData = function() {
        
        //console.log("Rebuilding slice");
        
        var cumulativeWaveData = _.map(_.range(samplesPerSlice*numChannels),
                                       function(x){return 0;});
        
        var pitchesPlayed = 0;
        
        for (var pitch = 0; pitch < numPitches; pitch += 1) {
            
            var pitchMod = 20 * Math.pow(2,(pitch / 12));
            
            var noteCell = $scope.timeSlice.noteCells[pitch];
            
            if (noteCell.playPitch) {
                
                //console.log("Adding pitch");
                
                for (var i = 0; i < samplesPerSlice; i += 1) {
                    
                    var sample = 127 
                        * Math.sin(i/pitchMod) 
                        * attackCoeff(i/samplesPerSlice);
                    
                    //console.log(sample);
                    
                    cumulativeWaveData[2*i] += sample;
                    //cumulativeWaveData[2*i+1] += sample;
                    
                }
                
                //console.log(cumulativeWaveData);
                
                pitchesPlayed += 1;
                
            }
            
        }
        
        if (pitchesPlayed > 0) {
            
            //console.log("Played " + pitchesPlayed);
            
            // Normalize by dividing by n, and taking the nth root,
            // then add 128 to push the wave between 0 and 255
            $scope.timeSlice.waveData = _.map(cumulativeWaveData, function(cumulativeSample) {
                
                var sample = 128 + cumulativeSample/pitchesPlayed;
                //var sample = 128 + Math.pow(cumulativeSample/pitchesPlayed, 1/pitchesPlayed);
                //console.log(cumulativeSample, sample);
                return sample;
            });
            
            //console.log($scope.timeSlice.waveData);
            
        } else {
            
            for (var i = 0; i < samplesPerSlice * numChannels; i += 1) {
                $scope.timeSlice.waveData[i] = 128;
            }
            
        }
        
        $scope.timeSlice.needsUpdate = true;
        $scope.rebuildWaveData();
        
    }
    
    $scope.rebuildSliceWaveData();
    
}

// Controller for an individual note cell
function NoteCell($scope) {
    
    // $scope.noteCell
    // $scope.noteCell.playPitch
    
    $scope.setClass = function() {
        $scope.playClass = $scope.noteCell.playPitch ? 'play' : 'noPlay';
    }
    
    $scope.toggle = function() {
        $scope.noteCell.playPitch = !$scope.noteCell.playPitch;
        $scope.setClass();
        $scope.rebuildSliceWaveData()
    }
    
    $scope.setClass();
    
}
