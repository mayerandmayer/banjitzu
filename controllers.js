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

function Editor($scope) {
    
    /* Shared data for the Sequence Editor */

    // Constants
    var numPitches = 13;
    var numTimeSlices = 32;
    var numChannels = 2;
    
    // The blank sequence
    var blankData = [];
    for (var i = 0; i < numPitches; i += 1) {
        var pitch = [];
        for (var j = 0; j < numTimeSlices; j += 1) {
            pitch[j] = false;
        }
        blankData[i] = pitch;
    }
    
    $scope.currentSequence = {}
    
    $scope.openSequence = function(name, data) {
        
        var editData = _.map(data, function(pitch) {
            return _.map(pitch, function(playPitch) {            
                return {
                    playPitch: playPitch,
                };
            });
        });
        
        $scope.currentSequence.name = name;
        $scope.currentSequence.editData = editData;
        
    }
    
    $scope.extractData = function() {
        return _.map($scope.currentSequence.editData, function(pitch) {
            return _.map(pitch, function(notecell) {
                return notecell.playPitch;
            });
        });
    }
    
    $scope.openSequence("Untitled", blankData);
    function attack(x) {
        return 1 - Math.pow((2 * x - 1),6);
    }
    
    var bpm = 120;
    var sampleRate = 44056; // Hz
    
    var samplesPerSlice = sampleRate * 60 /* seconds per minute */ * (1/bpm) * (1/4)
    
    
    var play = function() {
        
        //alert("Playing sequence with " + samplesPerSlice + " samples per slice");
        
        var pitchData = []
        
        for (var pitch = 0; pitch < numPitches; pitch += 1) {
            
            var pitchMod = 50 * Math.pow(2,(pitch / 12))
            
            var data = [];
            var totalSamples = samplesPerSlice * numTimeSlices;
            for (var i = 0; i < totalSamples; i += 1) {
                
                var timeSlice = Math.floor(i / samplesPerSlice);
                var notecell = ($scope.currentSequence.editData[pitch][timeSlice])
                var onOffMultiplier = notecell.playPitch ? 1 : 0;
                //var onOffMultiplier = 1;
                
                var attackMultiplier = attack((i / samplesPerSlice) % 1)
                
                data[2*i    ] = 128 + onOffMultiplier * attackMultiplier * Math.round(127*Math.sin(i/pitchMod));
                data[2*i + 1] = 128 + onOffMultiplier * attackMultiplier * Math.round(127*Math.sin(i/pitchMod));
            }
            
            pitchData[pitch] = data;
            
        }
        
        totalData = [];
        
        for (var i = 0; i < numChannels * totalSamples; i += 1) {
            var sum = 0
            var notesOn = 0
            for (var pitch = 0; pitch < numPitches; pitch += 1) {
                
                var timeSlice = Math.floor(i / (2 * samplesPerSlice));
                var notecell = ($scope.currentSequence.editData[pitch][timeSlice])
                var onOffMultiplier = notecell.playPitch ? 1 : 0;
                
                if (notecell.playPitch) {
                    var sample = pitchData[pitch][i]
                    sum += sample;
                    notesOn += 1;
                }
                
            }
            totalData[i] = (notesOn == 0) ? 128 : sum / notesOn;
        }
        
        var audio = new Audio();
        var wave = new RIFFWAVE();
        wave.header.sampleRate = sampleRate;
        wave.header.numChannels = numChannels;
        wave.Make(totalData);
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
    
    
}

function LibrarySequence($scope) {
    
    $scope.load = function() {
        
        $scope.openSequence($scope.sequence.attributes.name, 
                            $scope.sequence.attributes.data);
        
    }
    
}

// Controller for an individual note cell
function NoteCell($scope) {

    $scope.setClass = function() {
        $scope.playClass = $scope.notecell.playPitch ? 'play' : 'noPlay';
    }
    
    $scope.toggle = function() {
        $scope.notecell.playPitch = !$scope.notecell.playPitch;
        $scope.setClass();
    }
    
    $scope.setClass();
    
}
