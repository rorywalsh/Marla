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

// do not alter the contents of this file unless you absolutely know what you're doing! 

const csd = `
//UDO curtesy of Joachim Heintz..
opcode StrToArr, S[]i, SS

 S_in, S_sep xin 

 ;count the number of substrings
 iLenSep strlen S_sep
 iPos = 0
 iPosShift = 0
 iCnt = 0

 while iPos != -1 do
 
  iCnt += 1
  S_sub strsub S_in, iPosShift
  iPos strindex S_sub, S_sep
  iPosShift += iPos+iLenSep
  
 od
 
 ;create a string array and put the substrings in it
 S_Arr[] init iCnt
 iPos = 0
 iPosShift = 0
 iArrIndx = -1
 while iPos != -1 do
 
  iArrIndx += 1
  S_sub strsub S_in, iPosShift
  iPos strindex S_sub, S_sep
  iEnd = (iPos == -1 ? -1 : iPosShift+iPos)
  S_ToArr strsub S_in, iPosShift, iEnd
  iPosShift += iPos+iLenSep
  S_Arr[iArrIndx] = S_ToArr  
 
 od
 
 xout S_Arr, iCnt

endop


0dbfs = 1

//======================================================================================================================== 
instr PLAY
    SFilename strcpy p4
    iLength = filelen(SFilename)
    iChannels = filenchnls(SFilename)
    p3 = iLength
    
    if iChannels == 2 then
        a1, a2 diskin2 SFilename, p5, 0, 0
        outs a1*p6, a2*p6
    else
        a1 diskin2 SFilename, p5, 0, 0
        outs a1*p6, a1*p6
    endif
endin

//========================================================================================================================
instr PLAY_MULTI    
    seed 0
    SFileString strcpy p7
    SFiles[], iNumFiles StrToArr SFileString, "|"    
    
    iRand random 0, iNumFiles
    if p8 == -1 then
        SFilename = SFiles[iRand]
    else
        SFilename = SFiles[p8]
    endif
    
    iLength = filelen(SFilename)
    iChannels = filenchnls(SFilename)
    p3 = iLength

    if iChannels == 2 then
        a1, a2 diskin2 SFilename, p5, 0, 0
        outs a1*p6, a2*p6
    else
        a1 diskin2 SFilename, p5, 0, 0
        outs a1*p6, a1*p6
    endif
endin

//========================================================================================================================
instr CREATE_SOUNDSOURCE
    SFilename strcpy p4
    SClips strcpy SFilename
    SChannel strcpy p5
    iScaling = p6
    iOneShot = p7
    iFadeIn = p8
    iFadeOut = p9
    iPlayOnAwake = p10
    iRandomInterval = p11
    iMinInterval = p12

    SDirection strcpy p13
    iFileIndex = p14
    iTransition = p15
 
    SFadeTime strcat SChannel, "fadeTime"
    kFadeTime chnget SFadeTime
    kFadeTime *= .1


    SPlay strcat SChannel, "play" 
    kPlay chnget SPlay

    SCutOff strcat SChannel, "cutoff"
    kCutOff chnget SCutOff
    kCutOff portk kCutOff, kFadeTime
    ; printk2 kCutOff

    SAmp strcat SChannel, "amp"
    kAmp chnget SAmp
    kAmp portk kAmp, kFadeTime


    SRemove strcat SChannel, "remove"
    kRemove chnget SRemove

    SSpeed strcat SChannel, "speed"
    kSpeed chnget SSpeed
    kSpeed portk kSpeed, kFadeTime


    SPanPos strcat SChannel, "panPosition"
    kPan chnget SPanPos
    kPan portk kPan, kFadeTime

    SDistanceChannel strcat SChannel, "distance"
    kDistance chnget SDistanceChannel
    kDistance = kDistance*iScaling
    kDistance tonek kDistance, 10
    
    if iPlayOnAwake == 1 && kPlay == 1 then

        aEnv linsegr 0, iFadeIn+0.001, 1, iFadeOut+0.001, 0
        aScale init 1
        kDistance init 1;
        kCutOff init 22050;

        iLength init 0 
        SNamedInstrument init ""

        if strindex(strget(p4), ".") != -1 then
            // puts "p4 is a filename; loading sound file as sound source", 1
            iIsNamedInstrument = 0

        elseif strindex(strget(p4), ".") == -1 then
            iIsNamedInstrument = 1
            SNamedInstrument strcpy p4
            // puts "p4 is a string; loading named instrument as sound source", 1
        endif



    if iIsNamedInstrument == 0 then
          //if array has been passed
        if strindex(SClips, "_") != -1 then
            SFiles[], iNumFiles StrToArr SClips, "_"    
            if strcmp(SDirection, "forward") == 0 then
                iFileIndex = (iFileIndex==iNumFiles ? 0 : iFileIndex) 
                SFilename = SFiles[iFileIndex]
                p3 = filelen(SFiles[iFileIndex])
                SEvent  sprintf {{i "CREATE_SOUNDSOURCE" %f %f "%s" "%s" %f %f %f %f %f %f %f "%s" %f %f}}, p3, iLength, SClips, SChannel, p6, p7, p8, p9, p10, p11, p12, SDirection, iFileIndex+1, iTransition
                scoreline_i SEvent
            elseif strcmp(SDirection, "random") == 0 then
                seed 0
                iRand random 0, iNumFiles
                SFilename = SFiles[iRand]
                p3 = filelen(SFilename)
                SEvent  sprintf {{i "CREATE_SOUNDSOURCE" %f %f "%s" "%s" %f %f %f %f %f %f %f "%s" %f %f}}, p3, iLength, SClips, SChannel, p6, p7, p8, p9, p10, p11, p12, SDirection, iFileIndex, iTransition
                scoreline_i SEvent
            endif
        endif

        iLength = filelen(SFilename)
        kLength init iLength
        iChannels = filenchnls(SFilename)

        kTime init 0
        SNewFile strcat SChannel, "nextFile"
        SFile chngetks SNewFile
        kSignalEnd init 0
        Sevent init ""

        SFadeIn strcat SChannel, "fadeIn"
        kFadeIn chnget SFadeIn
        SFadeOut strcat SChannel, "fadeOut"
        kFadeOut chnget SFadeOut
        ; kSignalEnd = 0

        kTime = (kTime>=kLength*sr ? 0 : kTime+ksmps)

        if changed2:k(SFile) == 1 then
        printks "%s", 0, SFile
        printk 1, 1
            kSignalEnd = 1
        endif

        if kTime > (kLength*sr)-ksmps  && kSignalEnd == 1 then
            printk 1000, 1
            SEvent  sprintfk {{i "CREATE_SOUNDSOURCE" 0 360000 "%s" "%s" %f %f %f %f %f %f %f "%s" %f %f}}, SFile, SChannel, p6, p7, p8, p9, p10, p11, p12, SDirection, iFileIndex, iTransition
            scoreline SEvent, 1
            kSignalEnd = 0
            turnoff
        endif


       

        ;set up random playback, only available with sound files..
        SEvent  sprintf {{i "CREATE_SOUNDSOURCE" %f %f "%s" "%s" %f %f %f %f %f %f %f "%s" %f %f}}, iLength+iMinInterval+random(0, iRandomInterval), iLength, SFilename, SChannel, p6, p7, p8, p9, p10, p11, p12, SDirection, p14, iTransition

        //if randomised playback is rquested
        if iRandomInterval>0 && iLength>0 then
            p3 = iLength 
            scoreline_i SEvent
        elseif iOneShot == 1 then //oneshot won't work with random playback option
            p3 = iLength
        endif

    endif

        if kAmp > 0 then
            ; only permit playback if there is a 
            ; chance the sound will be heard
            if abs(kDistance) < 60 then
                    aScale = ampdb(-kDistance)
            endif 
            
            if iIsNamedInstrument == 1 then
                a1, a2 subinstr SNamedInstrument
                a1 tone a1, kCutOff
                a2 tone a2, kCutOff
                aLeft = (a1*aScale*kAmp)
                aRight = (a2*aScale*kAmp)
                outs aLeft*aEnv, aRight*aEnv 
            else
                if iChannels == 2 then
                        a1, a2 diskin2 SFilename, kSpeed, 0, 1
                        a1 tone a1, kCutOff
                        a2 tone a2, kCutOff
                        aLeft = (a1*aScale*kAmp)
                        aRight = (a2*aScale*kAmp)
                        outs (1-kPan)*(aLeft*aEnv), (aRight*aEnv*kPan)
                else
                        a1 diskin2 SFilename, kSpeed, 0, 1
                        a1 tone a1, kCutOff
                        outs (1-kPan)*(a1*aScale*kAmp*aEnv), a1*aScale*kAmp*aEnv*kPan
                endif
            endif
        endif
    endif

        if (kRemove == 1) then  
            if iTransition == 2 then
                SEvent  sprintfk {{i "CREATE_SOUNDSOURCE" 0 360000 "%s" "%s" %f %f %f %f %f %f %f "%s" %f %f}}, SFile, SChannel, p6, p7, p8, p9, p10, p11, p12, SDirection, iFileIndex, iTransition
                scoreline SEvent, 1
            endif
            turnoff
            chnset k(0), SRemove
        endif

endin

`