

<img src="https://raw.githubusercontent.com/rorywalsh/Marla/master/imgs/marla.svg" style="width:20%" />

Márla (pronounced *Mawerla*) is an audio middleware for Javascript applications. Although it is written for the BabylonJS and Phaser3 game engines, it should work just as well as a standalone audio interface for any JS applications. The fact that Marla wraps the Csound audio programming language makes it an ideal solution for sound synthesis and procedural audio on the web. Marla is licensed under the The MIT License.     


[Running the examples](#running_examples)

[Usage](#usage)

[Playing one-shot sounds](#oneshot_sounds)

[Sources and listeners](#sources_listeners)

[Types of sources](#source_types)

[Writing procedural sounds](#procedural_events)

[Controlling sounds in real time](#realtime_sounds)

[Adding support for other JS game engine](#other_js_engines)



<a name="running_examples"></a>
### Running the examples

The easiest way to get going with this framework is to play around with the example projects provided. Clone the repository and from the project root directory start a local web server. Then open any of the examples provided in either the BabylonJS o Phaser3 folders. If Visual Studio Code is your main editor the 'Live Server' extension makes it simple to run folders as local servers. The following .gif outlines the steps required to start running one of the examples. 


<img src="imgs/liveServer.gif" style="width:70%" />

<br>
<br>
<br>
<br>

<a name="usage"></a>
### Usage

When it comes to using this framework with existing projects, the first thing to do is add the lettucejs folder to your project root directory. You will then need to add the `marla.js`, `marlaInstrs.js` and `csound.js` scripts to your document body. The `marla.csd` file should be placed one folder up from the `lettucejs` directory. 


```javascript
<script src="../csound/csound.js"> </script>
<script src="../marla.js"> </script>
<script src="../marlaInstrs.js"> </script>
```

Once the scripts have been included a new Marla object will beed to be created. This can be done in the `didModuleLoad()` function that gets called when the sound engine has finished loading all relevant sound modules. In the code below, the marla object is created and the default audio assets directory is set. In this instance Marla is told the "Phaser3" game engine is to be used. You can also specify "BabylonJS". Setting the game engine provides Marla with the information it needs to carry out correct amplitude scaling based on positional vectors. Following the creation of the Marla object a call is made to [`Marla.addFiles()`](/docs/index.html#addfiles). This function adds all the sound files needed for your game to the local file system. You must add all sound files you intend to use in this manner. After the files have been added, a call to [`Marla.start()`](/docs/index.html#start) will start the audio. 

```javascript
var marla;
function moduleDidLoad() {          
    marla = new Marla("Phaser3");
    marla.setAudioDirectory("../audio");
    marla.addFiles(new Array('bestSoundEver.mp3'));
    marla.start();
}
```
<br>
<br>
<br>
<br>

<a name="oneshot_sounds"></a>
### Playing one-shot sounds

To play a one-shot sound just call [`Marla.playSound(filename)`](/docs/index.html#playsound). Ensure that the file you wish to play has already been loaded using the [`Marla.addFiles()`](/docs/index.html#addfiles) function. The playSound function also takes some optional parameters which are described in the reference manual. In the code below the sound is triggered with an amplitude reduction of .5, a playback speed of half full rate, and a short time delay of .1 seconds.  

```javascript
if (this.keys.A.isDown)
{   
    marla.playSound('bestSoundEver.wav', {amp:.5, delay:.1, speed:.5});    
}
```

Multi-sample one-shot sounds can be created using the [`Marla.playMultiSound()`](/docs/index.html#playmultisound) function. This function takes an array of audio files rather than a single one. Marla will randomly choose one file from the list to play each time the function is called. As is the case with all sound playing functions, you must make certain that you have added the files using the [`Marla.addFIles()`](/docs/index.html#addfiles) function. 

```javascript
if (this.keys.A.isDown)
{   
    marla.playMultiSound(new Array('1.ogg', '2.ogg', '3.ogg', '4.ogg', '5.ogg'), {amp:.5, delay:.1, speed:.5});    
}
```

<br>
<br>
<br>
<br>

<a name="sources_listeners"></a>
### Sources and listeners

If you wish to avail of automatic amplitude scaling based on proximity of objects to each other, you will need to use sources and a listener. There is only one listener per scene, and it is usually the camera object. In the code below, a BabylonJS camera object is set to be the listener.  

```javascript
var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(10, 2, -80), scene);
marla.addListener(camera);
```

>***Note:*** *if you plan to manage amplitude attenuation yourself you don't need add a listener. It's sole purpose is to provide positional information for sources.* 

Any number of sources can be added to a scene. Once created, they can be controlled using a range of special source functions, such as [`Marla.setSourceAmplitude()`](/docs/index.html#setsourceamplitude) or [`Marla.setSourceCutoff()`](/docs/index.html#setsourcecutoff). Sources can be either dynamic, meaning their amplitude will be constantly updated based on their position relative to the scene's listener, or static, meaning their amplitude levels will need to be managed manually. To add a dynamic source to a scene, call [`Marla.addSource()`](/docs/index.html#addsource). In the code below, the 'bestSoundEver.ogg' file is attached to the radio game object. Sources can be set up to play just once if the `oneShot` parameter is set to true. 

```javascript
var radio = new BABYLON.MeshBuilder.CreateBox('Radio', {height: 5, width: 5, depth: 0.5}, scene);
radio.position = new BABYLON.Vector3(-2, 1, -20);
marla.addSource(radio, 'bestSoundEver.ogg');
```

[`Marla.update()`](/docs/index.html#update) needs to be called in the game's main loop in order for to carry out automatic amplitude scaling based on the distance between sources and a listener. If [`Marla.update()`](/docs/index.html#update) is not called all sound will stay at the same amplitude until [`Marla.setSourceAmplitude()`](/docs/index.html#setsourceamplitude) is called.


To add a static sound source simply pass a "name" string to the first parameter of the [`Marla.addSource()`](/docs/index.html#addsource) function. The same "name" string should be used when controlling any aspect of the source. The code below shows an example a static sound source which will play at a constant level for the duration of the game. Static sound sources are useful for background music and sounds that don't need to have their amplitudes constantly readjusted. 

```javascript
marla.addSource("menu", "menu.wav");
```

>Sound sources can be also be given named Csound instruments to process. See [below](#named_instrument) for further details.

<br>
<br>
<br>
<br>

<a name="source_types"></a>
### Controlling sources

Source sources can be set up in a multitude of different ways. Optional parameters can determine if they start playing when the game does, or if they should play as a one-shot sample, in which case the the [`Marla.playSource()`](/docs/index.html#playsource) function can be used to trigger it at any point during the game. 

Other parameters allow for distance scaling, amplitude scaling, and playback speed. A `randomInterval` parameter can be used to trigger random playback of samples. The `minInterval` parameter sets the minimum time between random plays.

>The minInterval parameter only works when the randomInterval is set to a value greater than 0

<br>
If an array of sound files is passed to the `clip` parameter, Marla will automatically sequence the files. They will play one after another by default, but can also be set to play randomly.

A source may have a new file set dynamically at any point during the game. The parameters for fade in and out will determine how much of an overlap takes place when a new file is triggered. The `transition` parameter will set how the file starts playing. This is set to `immediate` by default. This means as soon as [`Marla.setSourceFile()`](/docs/index.html#setsourcefile) is called, the new file will start playing. If transition is set to `wait`, the current sample will finish playing back before the new one starts, depending of course on the fade times. 

<a name="procedural_events"></a>
### Writing procedural events

Although this framework provides various functions for playing back and controlling audio events, its real strenght lies in the fact that you can easily expose the power of Csound. This makes it very simple to create sound events on the fly. The simplest way to do this is to code some Csound instruments in the marla.csd file that automatically gets compiled when the game starts. Once the instrument is compiled it cane be triggered at run time using the 
`Marla.sendEvent(string)` function.  

Procedural sound can also be added on the fly using the `Marla.addCustomSound()` function. For example, the following code creates a simple custom sound. The Csound code generates a simple sine wave with an exponential decay. 

```javascript
const paddleSound =`
    instr PADDLE
        iFreq = p4
        kNum active "PADDLE"
        aEnv expon .5, p3, .001
        a1 oscili aEnv, cpsmidinn(iFreq)
        outs a1/kNum, a1/kNum
    endin`;
marla.addCustomSound(paddleSound);
```

When triggering this event, one must be careful to pass a frequency value as its 4th parameter. In this way the pitch of the sound can be dynamically altered each time its played. In the code below the custom sound is triggered each time a player presses the 'A' key. 

```javascript
if (this.keys.A.isDown)
{   
    marla.sendEvent('i"PADDLE" 0 1 '+(50+player.x).toString());    
}
```

<a name="realtime_sounds"></a>
### Controlling sounds in real time

Although the above code will play a different pitch each time it is triggered, the information sent to the instrument is 'init' time only. This means it can't be updated once the instrument starts. If you wish to control parameters of a custom sound in real time you can do so using named channels. These requires the use of the `chnget` opcode in your custom Csound instrument. The following code example creates a custom sound whose frequency is set by the player's x position. 

```javascript
const paddleSound =`
    instr PLAYER
        kFreq chnget "frequency"
        a1 oscili aEnv, kFreq
        outs a1, a1
    endin`;
marla.addCustomSound(paddleSound);
```

The channel can be updated in the game loop by calling `Marla.setChannel(channel, value)`.

```javascript
//main rendering/game loop
gameEngine.update(){
    marla.setChannel('frequency', player.x);
}
```

<br>
<br>
<br>
<br>

<a name="other_js_engines"></a>
### Adding support for other JS game engines

This system is extremely lightweight, and is provided merely as a first step towards creating bespoke sound engines for JS based game.  

Apart from `Marla.addListener()` and the various `Marla::addSource()`, all of the functions in this framework are engine agnostic. These methods however work with objects that contains a name and position vector. If you want to add support for another game engine that doesn't support game objects, you will need to create a new class that contains a `name` and some kind of positional vector. You can then modify the `Marla.setSourceAmplitude(source, listener, scale)` function to set the correct distance between objects. Alternatively you can just use a "name" string with any of the `addSource()` functions and control amplitude manually. 

<br>
<br>
<br>
<br>

<a name="named_instrument"></a>
### Using named instruments as sound clips

If for example your marla.csd file contains a Csound instrument called `CHURCH_BELLS`, and would like Marla to automatically scale it's amplitude, you can pass the instrument name to [`Marla.addSource()`](/docs/index.html#addsource) in place of a sound file. In the following code we do just that.


```javascript
var radio = new BABYLON.MeshBuilder.CreateBox('Radio', {height: 5, width: 5, depth: 0.5}, scene);
radio.position = new BABYLON.Vector3(-2, 1, -20);
marla.addSource(radio, "CHURCH_BELLS");
```

>***Note:*** *You cannot pass p-fields to any Csound instruments added as sources in the manner described above. If you want to have any real-time control over parameters use named channels.* 
