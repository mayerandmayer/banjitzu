// Controller for the whole sequence editor      
function SequenceEditor($scope) {
    
    function attack(x) {
        return 1 - Math.pow((2 * x - 1),6);
    }
    
    var numPitches = 13;
    var numTimeSlices = 32;
    var numChannels = 2;
    
    var bpm = 120;
    var sampleRate = 44056; // Hz
    
    var samplesPerSlice = sampleRate * 60 /* seconds per minute */ * (1/bpm) * (1/4)
    
    $scope.sequence = [];
    for (var i = 0; i < numPitches; i += 1) {
        var pitch = [];
        for (var j = 0; j < numTimeSlices; j += 1) {
            var notecell = { playPitch : false, style : { 'background-color' : 'cadetblue' } };
            pitch[j] = notecell;
        }
        $scope.sequence[i] = pitch;
    }
    
    var play = function() {
        
        //alert("Playing sequence with " + samplesPerSlice + " samples per slice");
        
        var pitchData = []
        
        for (var pitch = 0; pitch < numPitches; pitch += 1) {
            
            var pitchMod = 50 * Math.pow(2,(pitch / 12))
            
            var data = [];
            var totalSamples = samplesPerSlice * numTimeSlices;
            for (var i = 0; i < totalSamples; i += 1) {
                
                var timeSlice = Math.floor(i / samplesPerSlice);
                var notecell = ($scope.sequence[pitch][timeSlice])
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
                var notecell = ($scope.sequence[pitch][timeSlice])
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
    
}

// Controller for an individual note cell
function NoteCell($scope) {
    // Some utility stuff
    function doToggle(notecell) {
        notecell.playPitch = !notecell.playPitch;
        if (notecell.playPitch) {
            notecell.style = { 'background-color' : 'coral' };
        } else {
            notecell.style = { 'background-color' : 'cadetblue' };
        }
    }
    
    $scope.toggle = function(){doToggle($scope.notecell)}
    
}
