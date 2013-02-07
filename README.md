TextTrack
=========
Basic object to display captions (vtt) in a specified HTML element 
See http://www.delphiki.com/webvtt/ for a description of Web VTT files

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
