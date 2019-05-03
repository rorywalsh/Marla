 /*
 * Copyright (C) 2019 Rory Walsh
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, 
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software 
 * is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or 
 * substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *  PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 */

/**
 * @classdesc 
 * Creates an instance of Csound and compiles a file called lettuce.csd by default. Custom .csd files can also be loaded. 
 * 
 * @example
 * var lettuce = new Lettuce("Babylonjs");
 * 
 * @param {string} gameEngine Set the game engine being used, i.e., 'Babylonjs' or 'Phaser3'
 * @param {string} filename the .csd file to compile.
 * @constructor 
 */


function Lettuce (gameEngine, filename = 'lettuce.csd') {

    this.csoundStarted = false;
    this.csoundStarted = true;
    this.sources = [];
    this.ftgenStatements = [];
    this.audioDirectory = "";
    this.mp3files = [];
    this.gameEngine = gameEngine;
    this.listener = {name:"listener", x:0, y:0};

    //=========================================================================================================================================================

    /**
    * Sets the default directory for audio assets.
    * @param {string} dir the audio assets directory, relative to this file.
    */
    this.setAudioDirectory = function(dir){
        this.audioDirectory = dir;
    }

    /**
    * Adds list of file from server to local file system. All files used by the audio engine
    * during a game must be loaded in advance of their use. 
    * @example
    * lettuce.addFiles(new Array('1.wav', '2.wav', '3.wav')); 
    * @param {array} files Array contained all files to be loaded.
    */        
    this.addFiles = function(files){
        for( var i = 0; i < files.length; i++ ){
            csound.CopyUrlToLocal(this.audioDirectory+'/'+files[i], files[i], function(){
                            console.log("Adding file: "+files[i]);
            });
        }

        console.log(files);
    }  

        //=========================================================================================================================================================
    /**
    * Starts the audio engine.
    *
    * @param {object} options Sets various options to controls how the source plays and behaves. 
    * @param {number} options.ksmps Sets the number of samples in control cycle. Decreasing this will reduce latency, but may result in dropouts and glitchy audio. Higher values should result in smoother playback, but can lead to higher latency.  
    * @param {number} options.logging Set to true to enable verbose logging of Csound during performance. Defaults to false.  
    */
    this.start = function({ksmps=64, logging=false}){
        csound.Csound.setOption("--ksmps="+Number(ksmps).toString())

        if(logging == false)
            csound.Csound.setOption("-m0d");

        csound.PlayCsd(filename);
        csound.CompileOrc(csd);
        this.csoundStarted = true;     

    }

     //=========================================================================================================================================================
    /**
    * Plays a sound file with optional parameters for delay, amplitude and speed. 
    * 
    * @param {string} filename Name of audio file to be played. Note this file should already be added to the local server using the add files method. For now files need to be in uncompressed format, or mp3s. Support for other compressed formats will be added soon. 
    * @param {object} options Sets various options to controls how the sounds plays and behaves. 
    * @param {number} options.speed Sets playback speed. Defaults to 1
    * @param {number} options.amp Defaults to 1.
    * @param {number} options.delay Sets the amount of time that should pass before the sound plays. Defaults to 0.
    */
    this.playSound = function(filename, {delay=0, speed=1, amp=1}={}){
        csound.ReadScore('i"PLAY" 0 ' + Number(delay).toString() + ' "'+filename+'" '+speed.toString() +' '+amp.toString());   
    }

    /**
    * Plays a sound file with optional parameters for delay, amplitude and speed. 
    * 
    * @param {array} files An array of audio files to be played back. Make sure all files have been added to the local server using the addFiles() method. 
    * @param {object} options Sets various options to controls how the sounds plays and behaves. 
    * @param {number} options.speed Sets playback speed.
    * @param {number} options.amp Defaults to 1.
    * @param {number} options.delay Sets the amount of time that should pass before the sound plays. Defaults to 0.
    * @param {number} options.index Set this to a number equal or greater to 0 to trigger specific files from the files array. The default value of -1 instructs Lettuce to pick a file at random.  
    */
    this.playMultiSound = function(files, {delay=0, speed=1, amp=1, index=-1}={}){
        
        csound.ReadScore('i"PLAY_MULTI" 0 ' + Number(delay).toString() + ' "'+filename+'" '+speed.toString() +' '+amp.toString() + '"'+files.join('|')+'" '+Number(index).toString());   
    }
    //=========================================================================================================================================================
    /**
    * Adds a scene listener. 
    * 
    * @param {object} listener Listener object 
    */
    this.addListener = function(listener){
        this.listener = listener;
    }

    //=========================================================================================================================================================
    /**  
    * Adds a sound source to the scene. 
    * 
    * @param {object} source Source object, or string with name of source. Source objects are dynamic, and will have their amplitude altered according to their proximity to the scene's listener. Sources passed as strings are static. You will need to alter their amplitude manually using @setSourceAmplitude  
    * @param {string} clip Name of an audio file, or files(see options) to be played. Can also be the named of a Csound instrument. If this is an audio file name, make sure that it already added to the local server using the add files method. MP3s are not supported, but .ogg, .flac, wav and aif are. Named instrument can also be sound sources with the one restriction that they shouldn't accept any p-fields. They should also avoid making reference to p2 or p3. 
    * @param {object} options Sets various options to controls how the source plays and behaves. 
    * @param {float} options.amp the amplitude factor. This value will be multiplied by the source output to apply amplitude scaling. 
    * @param {float} options.scaling Sets a scaling factor. Values greater than 1 will cause greater amplitude attenuation. Values less than 1 will cause decreased attenuation. This usually needs some tweaking to get right, and will depend to a large extent on the game engine. 
    * @param {float} options.speed Sets a playback speed. 1 is the default and will cause no change in playback speed from original recording.  
    * @param {boolean} options.oneShot Setting to this true will cause the sound source to finish after a single play. Only works with sound files. 
    * @param {float} options.randomRange A non-zero value here will cause the source to play at random intervals. The value passed here will determine the random range of delay before the next playback.
    * @param {float} options.minInterval Sets the minimum amount of time to wait in seconds before a sound is repeated. This value is summed to the random value produced above to give the time interval between plays.  
    * @param {number} options.order Determines how the files will be played back. Set to `random` for random play back. The default is `forward` which will cause the files to play one after another.
    * @param {number} options.fadeIn Determines the length of amplitude fade in for source. Defaults to 0. Note this applies to the entire duration of the source, and not to the clip being played.
    * @param {number} options.fadeOut Determines the length of amplitude fade out for source. Defaults to 0. Note this applies to the entire duration of the source, and not to the clip being played.
    * @param {number} options.transition Determines how the next sample will appear once `Lettuce.setNextFile()` is called. Defaults to "immediate", which will cause the next sample to start playing immediately. If this is set to "wait", the current sample will be allowed to finish before the next sample starts.     


    * @example
    * //BabylonJs
    * var source = new BABYLON.Mesh.CreateBox("Source", 2, scene);
    * lettuce.addSource(source, 'pianoMood.wav', {amp:1});
    * 
    * //Phaser3
    * this.player = this.physics.add.image(400, 450, 'assets', 'player')
    * lettuce.addSource(this.player, 'pianoMood.wav', {amp:1});
    *
    * //to create a static sound source just pass a string as the object name, lettuce.update() will have no affect on sources created in this way
    * lettuce.addSource(source, 'pianoMood.wav', {amp:1});
    */
    this.addSource = function(source, clip, { amp = 1, scaling = 1, oneShot  = false, playOnAwake = true, 
                                            order="forward", fileIndex = 0, randomRange = 0, minInterval = 0, 
                                            fadeIn = 0, fadeOut = 0, speed = 1, transition = 'immediate'} = {})
    {
        
        var singleFileClip = true;
        var sourceClip = "dummy.wav";

        if (typeof source === 'string' || source instanceof String)
        {
            source = {name:source, x:0, y:0, static:true}
        }

        if (Array.isArray(clip))
        {
            sourceClip =  clip.join('_').toString()
        }
        else
            sourceClip = clip.toString();

        csound.ReadScore('i"CREATE_SOUNDSOURCE" '+
                            (randomRange ==0 ? '0' : (delay = Math.random()*randomRange)).toString() + //p2
                            ' [7*24*3600] "'+                           //p3
                            sourceClip+'" '+                       //p4
                            '"'+source.name.toString()+'" '+            //p5
                            Number(scaling).toString()+ ' ' +           //p6
                            (oneShot===true ? '1' : '0') + ' ' +        //p7
                            fadeIn.toString() + ' ' +                   //p8
                            fadeOut.toString() + ' ' +                  //p9
                            (playOnAwake === true ? '1' : '0') + ' ' +  //p10 
                            Number(randomRange).toString() + ' ' +      //p11
                            Number(minInterval).toString() +            //p12
                            ' "'+order.toString()+'" '+                 //p13
                            fileIndex.toString()+' '                   //p14
                            +(transition==="branching" ? '1' : '2').toString() //p15      
                            );                    

        csound.SetChannel(source.name+'amp', amp);
        csound.SetChannel(source.name+'play', 1);
        csound.SetChannel(source.name+'speed', speed);
        csound.SetChannel(source.name+'remove', 0);
        csound.SetChannel(source.name+'cutoff', 22050);

        source.transition = transition;
        source.clip = sourceClip;

        if(scaling != 0)
            this.sources.push(source);
        else
            this.setSoundSourceAmplitude(source, this.listener, 0);


    }

    /**
    * Set sound source amplitude. 
    * 
    * @param {object} source Listener object 
    * @param {number} value A number between 0 and 1 
    * @param {number} fadeTime Total length of time for amplitude change to occur 
    */
    this.setSourceAmplitude = function(source, value, fadeTime=0){
        if(this.csoundStarted === true)
        {
            csound.SetChannel(source.name+'fadeTime', fadeTime);
            csound.SetChannel(source.name+'amp', value);
        }
    }

    /**
    * Sets the playback speed of a sound source. 
    * 
    * @param {object} source Source object.
    * @param {speed} speed Sets playback speed.
    * @param {number} fadeTime Total length of time for change in speed to occur 
    */
    this.setSourceSpeed = function(source, speed, fadeTime=0)
    {
        if(this.csoundStarted == true){
            csound.SetChannel(source.name+'fadeTime', fadeTime);
            csound.SetChannel(source.name+'speed', speed);
        }
    }

    /**
    * Add reverb to a sound source. 
    * 
    * @param {object} source Source object 
    * @param {number} feedback Set the amount of reverb between 0 and 1. 1 
    * @param {number} cutoff Sets the cutoff frequency of the low-pass filters in the reverb feedback loop  
    * @param {number} fadeTime Total length of time for change to occur 
    * 
    */
    this.setSourceReverb = function(source, feedback, cutoff, fadeTime=0){
        if(this.csoundStarted == true){
            csound.SetChannel(source.name+'fadeTime', fadeTime);
            csound.SetChannel(source.name+'revFeedback', feedback);
            csound.SetChannel(source.name+'revCutoff', cutoff);
        }        
    }

    
    /**
    * Add reverb to a sound source. 
    * 
    * @param {object} source Source object 
    * @param {number} position Set the position of the source. -1: full to the left, 0: centred, and 1: full to the right
    * @param {number} fadeTime Total length of time for change to occur 
    * 
    */
    this.setSourcePan = function(source, position, fadeTime=0){
        if(this.csoundStarted == true){
            csound.SetChannel(source.name+'fadeTime', fadeTime);
            csound.SetChannel(source.name+'panPosition', position);
        }        
    }

    /**
    * Add reverb to a sound source. 
    * 
    * @param {object} source Source object 
    * @param {number} delay length of delay time in seconds 
    */
    this.setSourceDelay = function(source, delay, fadeTime=0){
        
    }

    /**
    * Set the low pass cut-off frequency of an audio source.   
    * 
    * @param {object} source Source object.
    * @param {float} cutoff Cut-off frequency. 
    */ 
    this.setSourceCutOff = function(source, cutoff, fadeTime = 0)
    {
        if(this.csoundStarted == true){
            csound.SetChannel(source.name+'fadeTime', fadeTime);
            csound.SetChannel(source.name+'cutoff', cutoff);
        }
    }

    /**
    * Sets next source file to play, with optional parameter to determine when it starts. 
    * 
    * @param {object} source Source object
    * @param {speed} clip Name of audio file to play
    * @param {object} options Sets various options to controls how the sounds plays and behaves. 
    * @param {number} options.fadeIn Determines the length of amplitude fade in for source. Defaults to 0. Note this applies to the entire duration of the source, and not to the clip being played.
    * @param {number} options.fadeOut Determines the length of amplitude fade out for source. Defaults to 0. Note this applies to the entire duration of the source, and not to the clip being played.
    * @param {number} options.transition Determines how the next sample will appear. Defaults to "immediate", which will cause the next sample to start playing immediately. If this is set to "wait", the current sample will be allowed to finish before the next sample starts.     
    */
    this.setSourceFile = function(source, filename, {fadeOut = 0, fadeIn = 0, transition = "immediate"})
    {
        if(this.csoundStarted == true){
            console.log(source.clip)
            console.log(filename)
            if(filename != source.clip){
                source.clip = filename;
                csound.SetControlChannel(source.name+"fadeIn", fadeIn);
                csound.SetControlChannel(source.name+"fadeOut", fadeOut);
                csound.SetStringChannel(source.name+'nextFile', filename);
                console.log(source.transition);
                if(transition === "immediate")
                    csound.SetChannel(source.name+'remove', 1);
            }
        }
    }

    /**
    * Set the amplitude of an audio source based on its proximity to a listener. This method gets called by the `Lettuce.update()` method.  
    * 
    * @private
    * @param {object} source Source object.
    * @param {object} listener Listener object.
    * @param {float} scale Sets a scaling factor. Values greater than 1 will cause greater amplitude attenuation. Values less than 1 will cause decreased attenuation. 
    */    
    this.setSoundSourceAmplitude = function(source, listener, scale = 1){
        if(this.csoundStarted == true){
            if (this.gameEngine === 'Babylonjs'){
                const distance = BABYLON.Vector3.Distance(listener.position, source.position)
                csound.SetChannel(source.name+'distance', distance*scale);
            }
            else{
                const distance = Phaser.Math.Distance.Between(listener.x, listener.y, source.x, source.y);
                csound.SetChannel(source.name+'distance', distance*scale);   
            }
        }
    }

    /**
    * Plays a source that was initialised with playOnAwake set to false. 
    * 
    * @param {object} source Source object.
    */
    this.playSource = function(source)
    {
       if(this.csoundStarted == true){
           csound.SetControlChannel(source.name+"play", 1);
       }
    }
    /**
    * Pauses a source. 
    * 
    * @param {object} source Source object.
    */
    this.pauseSource = function(source)
    {
        if(this.csoundStarted == true){
            csound.SetControlChannel(source.name+"play", 0);
        }
    }

    /**
    * Set the value of a named channel.   
    * 
    * @param {string} channel Name of channel to send value to.
    * @param {float} value Value sent to `channel`. 
    */ 
    this.setControlChannel = function(channel, value)
    {
        if(this.csoundStarted == true){
            csound.SetChannel(channel, value);
        }
    }

    /**
    * Remove audio source from scene. 
    * 
    * @param {object} source Listener object 
    */
    this.removeSource= function(source){
        csound.SetChannel(source.name+'remove', 1);
    }
    //==================================================================================================
    /**
    * update() should be called in the game's update loop. It will calculate the correct amplitude of each source in the scene relative to the scenes main listener.   
    */
    this.update = function(){
        for ( var i = 0 ; i < this.sources.length ; i++){
            if(this.sources[i].static != true)
                this.setSoundSourceAmplitude(this.sources[i], this.listener, this.scale);
        }
    }

    /**
    * Trigger an audio event via the Csound score line 
    * 
    * @example
    * lettuce.sendEvent('i"SHOOT" 0 1 60'); 
    * @param {string} scoreEvent Event strings consisting of instrument name or number, followed by start time in seconds, a duration in seconds. All other parameters are optional and will depend on the custom sounds being triggered. 
    */
    this.sendEvent = function(scoreEvent)
    {
        csound.ReadScore(scoreEvent);
    }


    /**
    * Compiles a Csound instrument in the form of a string. 
    * 
    * @example
    * const paddleSound =`
    * instr PADDLE
    *     aEnv expon .5, p3, .001
    *     a1 oscili aEnv, cpsmidinn(p4)
    *     outs a1, a1
    * endin`;
    * lettuce.addCustomSound(paddleSound);
    * @param {string} instr String containing instrument definition
    */  
    this.addCustomSound = function(instr)
    {
        csound.CompileOrc(instr);
    }
}



 
