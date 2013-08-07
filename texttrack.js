/*
    Copyright (c) 2021 www.theworkshop.co.uk - written by paulrobinson@theworkshop.co.uk

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
 *  Basic object to display captions (vtt) in a specified HTML element
 *  dependent on jQuery (this dependency could easily be removed)
 *  
 *  @usage 
 *  //initiate the captions
 *  textTrack.init(HTML element to display captions, [Array of vtt captions file urls]);
 *  
 *  //on ready event
 *  textTrack.ready(function(){
            //once all the vtt files are loaded and parsed
            //do something else
        });
 *
 *  //display the captions
 *  textTrack.setCaption('url to caption file', timeMillisec);  
 *  
 *  //clear caption display
 *  textTrack.clearCaption();  
 *
 **/
(function() {

    var textTrack = {
  
        //ref to the element to display the captions in
        captionElement : undefined,
        
        //array to store all the caption objects 
        captionObjects : [],
        
        lastCaptionEndTime : 0,

        /**
         * @param : captionElement - the element to display the captions in
         * @param : captionSources - Array of urls to the caption files to parse
         **/
        init : function (captionElement, captionSources){
            
            var count = 0;
            
            var i, max = captionSources.length;
            for (i = 0; i < max; i++) {
                loadTrack(captionSources[i]);
            }
            
            
            /**
            * load the texttrack supplied
            */
            function loadTrack(source) {
            
                //console.log('loadTrack',source);
                
                var captions = [];
                            						
                // load the text file through an AJAX call
                // upon success, parse the returned text
                $.ajax({
                    method: 'get', 
                    url: source, 
                    success: function(data){
                        captions = parseText(data);
                        count++;
                        
                        //object containing all data for this element
                        var object = {
                            source : source,
                            element : textTrack.captionElement,
                            captions : captions
                        }

                        //store captionObject
                        textTrack.captionObjects.push(object);
                        
                        if(count === captionSources.length){
                            //textTrack has now initialised - fire event
                            textTrack.captionElement = captionElement;
                            $(textTrack).trigger("textTrack_ready");
                        }
                    }
                });	
					

                
	
                /**
                 * parse the string into separate time stamps and return an array
                 * @param text : String - vtt file contents
                 * */
                function parseText(text){
								
                    var caps = [];
                    text = text.replace('WEBVTT',''); // remove the WEBVTT header
                    text = $.trim(text);//trim any whitespace at start end end
                    text = text.replace(/(\r\n|\r|\n)/g, '\n');//clear whitespace
                    //console.log(text);
                    //return;
                    text = text.split('\n\n');//split at linebreaks - will break if incorrectly formatted
            
                    var i, max = text.length;
                    
                    for (i = 0; i < max; i++) {
                    
                        var a = text[i].split('\n');
                        var start = a[1].split("-->")[0];
                        var end = a[1].split("-->")[1];

                        //create object
                        var c = {
                            "id" : a[0],
                            "start" : fullClockFormatToSecs(start),
                            "end" : fullClockFormatToSecs(end),
                            "text" : a[2]
                        }
                        caps.push(c);
                    }
								
                    return caps;
                }
						
      
                /*
                * convert full clock format to seconds
                * @param timeCode : String [format is "hh:mm:ss.milli"]
                * 
                */
                function fullClockFormatToSecs(timeCode)
                {
                    if(timeCode == undefined) throw new Error("There is a problem with the formatting of your vtt file" + source);
								
                    var a = timeCode.split(":");
                    //
                    var hours = a[0];
                    var mins = a[1];
                    var secs = a[2];
                    //
                    var seconds = (hours * 3600) + (mins * 60) + secs;
								
                    return Number(seconds);
                }
                
            }

        },
        
        
				
        /**
         * set the caption according to supplied time
        * @param source - the url of the captions file
        * @param timeMilli - the timecode to return the caption for
        * 
        */
        setCaption : function (source, timeMilli){
            
            if(textTrack.captionElement === undefined) {
                throw new Error("textTrack is not initiated : call textTrack.init() first or wait for the textTrack.ready event");
            }

            reset();
            
            //console.log('setCaption', source, timeMilli);
            //get the caption
            //get the object according to id
            var captionObjects = textTrack.captionObjects;
            var aLength = captionObjects.length;
            var co = null;
            //
            while(aLength--) {
                co = captionObjects[aLength];
                if(co.source === source){
                    
                    break;
                }
            }
            
            //console.log('source', source, 'co.source', co.source);
            if(co !== undefined) {
                setCaptionText(co, timeMilli/1000);
            } else {
               // console.log('not captions found for source', source);
            }
            
            /**
             * clear the caption display
             */
            function reset() {
                textTrack.lastCaptionEndTime = 0;
                textTrack.captionElement.html("");
            }

            /**
             * set the text of the caption element
             * @param caption : String the text to display
             * @param currentTime : Number (secs)
             */
            function setCaptionText(caption, currentTime) {
                              
                //console.log(this.currentTime , lastCaptionEndTime, e.type);
                //stop here if the current caption end time is below current time
                if(currentTime < textTrack.lastCaptionEndTime) return;

                //loop through caption objects and get the one that should be displaying
                var i, max = caption.captions.length;
                for(i=0; i < max; i++){

                    var c = caption.captions[i];
                    //console.log('start=', c.start, 'end=' , c.end , 'currentTime=', currentTime, c.start <= currentTime && c.end >= currentTime);
                    if (c.start <= currentTime && c.end >= currentTime) {
                        textTrack.lastCaptionEndTime = c.end;
                        //console.log(c.text, textTrack.lastCaptionEndTime, c.end);
                        // show the text in the caption Div
                        textTrack.captionElement.html('<p>'+c.text+'</p>');

                        return;
                    }
                }

                //no caption - clear text
                textTrack.captionElement.html("");
            }
            
        },
        
        /**
         * clears the current caption displayed in the caption HTML element
         **/
        clearCaption : function(){
            textTrack.captionElement.html("");
        },
        
        
        
				
        /**
         * the textTrack has initialised
        */
        ready : function(callback){
            $(textTrack).on("textTrack_ready", callback);
        }
    }
			
    //make object avaialble to window
    window.textTrack = textTrack;
	
}());
