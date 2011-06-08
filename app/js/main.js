$.jQTouch({
  icon: 'css/img/falls_icon.png',
    addGlossToIcon: false,
    startupScreen: 'css/img/falls_loading.png',
    statusBar: 'default',
    preloadImages: [
    'css/img/falls_loading.png'
        /*have to read on on why to preLoad and which ones to include*/
        ]
  
});  


$(document).ready(function()
{
    checkLocalStorage();
    updateLineUps();
    $('#chartWrap').hide();  
});


//Function to check local storage for favs
function checkLocalStorage(){
  
  
  for (x=0; x<=localStorage.length-1; x++){
          
    //grab the value of the current local storage item being examined
    var key = localStorage.key(x);
    var val = localStorage.getItem(key);
    
    var keyVal = {
      key : key,
      val : val
    }
    
    valSplit = val.split(',');

    if(valSplit[0]==festival){
      var id=valSplit[1];
      acts[id].fav=true;
    }
    else{
      keep.push(keyVal);
    }
    
  }
  
}

//Update the line ups
function updateLineUps(){
  
  favs.length=0;
  
  if(festival=="lorne")
    $('#tue ul').empty();
    
  $('#wed ul').empty();
  $('#thu ul').empty();
  $('#fri ul').empty();
  $('#my_timetable ul').empty().hide();
  localStorage.clear();
  
  
  for(var i in acts){
    
    //convert the acts start and finish time from 24 hour time to AM/PM
    var start = convertTime(acts[i].start);
    var finish = convertTime(acts[i].finish);
    
    //if the act is a favourite, create a string to be added in to the HTML element, else leave it blank
    if(acts[i].fav){
      
      favClass="fav";
      favs.push(acts[i]);
      newFav[1]=acts[i].id;
      localStorage.setItem(festival+acts[i].id,newFav);
      
    }
    else
      favClass="non-fav";
    
    //build the HTML string to be inserted in to the time table    
    var content = '<li id="'+acts[i].id+'" class="act '+favClass+'">' + '<h3>'+acts[i].band+'</h3><p class="time">'+start+' - '+finish+'</p></li>';
    
    //Grab the correct timetable element and append the HTML string
    $('#'+acts[i].day+'_'+acts[i].stage+'_acts').append(content);
    
  }
  
  favs.sort(sortTimes);
  
  for(var i in favs){
      
    //convert the start & finish times from 24 hour to AM/PM
    var start = convertTime(favs[i].start);
    var finish = convertTime(favs[i].finish);
    
    //check for timetable clashes, add extra classes to HTML string below as necessary
    var clash = checkForClashes(favs,i);
                
    //build the HTML string to be inserted in to the time table ' +clash+ '
    var content = '<li id="'+favs[i].id+'" class="act removable ' +clash+ '">' + '<h3>'+favs[i].band+'</h3><p class="time">'+start+' - '+finish+' @<span> '+favs[i].stage+' Stage</span></li>';
  
    //Grab the correct timetable element and append the HTML string
    $('#'+favs[i].day+'_favs_acts').append(content).show();
    
  }
  
  $('.act').click(function(e){
    eventHandler($(this));
  });
  
  for(var i in keep){
    var key = keep[i].key;
    var val = keep[i].val;
    console.log(key+','+val);
    localStorage.setItem(key,val);
  }
  
}

function convertTime(time){
  
  var ampm;
  var hr;
  var min;
  var converted;
  
  if(time<0100){
    ampm="am";
    hr = 12;
    min = time.substring(2,4);
  }
  else if(time<1000){
    ampm="am";
    hr = time.substring(1,2);
    min = time.substring(2,4);
  }
  else if(time<1200){
    ampm="am";
    hr = time.substring(0,2);
    min = time.substring(2,4);
  }
  else if(time<1300){
    ampm="pm";
    hr = time.substring(0,2);
    min = time.substring(2,4);
  }
  else{
    ampm="pm";
    hr = time.substring(0,2)-12;
    min = time.substring(2,4);
  }
    
  converted = hr+':'+min+' '+ampm;
  
  return converted;
  
}

function eventHandler(element){
  
  var act_id = element.attr("id");
  
  if(element.hasClass('fav')){
    acts[act_id].fav=false;
  }
  
  if(element.hasClass('non-fav')){
    acts[act_id].fav=true;
  }
  
  if(element.hasClass('removable')){
    acts[act_id].fav=false;
  }
  
  $('.act').unbind('click');
    
  updateLineUps();
}


// fullDayTime
// returns the starting time of an act taking into account acts starting after midnight as being on the same day
function fullDayTime(a)
{
    // cast time value as an integer (incl. removing preceeding zeros)
    var parseA = parseInt(a,10);
    
    // if time is before 6am, then make it a continuation of the previous day...
    if (parseA < 600)
        parseA = parseA + 2400;
    
    return parseA;
}


// custom sorting function
// sorts acts by earliest starting to latest starting,
// taking into account acts starting after midnight
function sortTimes(a,b)
{
    // cast hr and min components to integers
    var parseA = parseInt(a.start,10);
    var parseB = parseInt(b.start,10);
    
    // if time is before 6am, then make it a continuation of the previous day...
    if (parseA < 600) {
        parseA = parseA + 2400; }
    if (parseB < 600) {
        parseB = parseB + 2400; }
        
    return (parseA-parseB);
}


function checkForClashes(favs,i)
{
    var retval = "";
     
    var prevFavToday = -1;
    var nextFavToday = -1;   
    var clashPrev = 0;
    var clashNext = 0;

    // clash before:
    // get the index of the act starting before the ith act on the day
    for (j=0; j<i; j++)
    {	
        if (favs[i].day == favs[j].day)
        {
            prevFavToday = j;
        }
    }

    // clash after:
    // get the index of the act starting after the ith act on the day
    for (j=favs.length-1; j>i; j--)
    {
        if (favs[i].day == favs[j].day)
        {
            nextFavToday = j;
        }
    }

    // if there's a clash with other items on the timetable, flag this item to have the relevant class to HTML string
    if(prevFavToday > -1)
    {
        if ( fullDayTime(favs[i].start) < fullDayTime(favs[prevFavToday].finish))
        {
            clashPrev = 1;
        }
    }
    
    if(nextFavToday > -1)
    {
        if ( fullDayTime(favs[i].finish) > fullDayTime(favs[nextFavToday].start))
        {
            clashNext = 1;
            }
    }
   
    // add relevant class to HTML string
    if (clashPrev == 1) {
        if (clashNext == 1) {
            retval += " fav_clash_both"; }
        else {
            retval += " fav_clash_prev"; }
    } else { // if clashPrev == 0
        if (clashNext == 1) {
            retval += " fav_clash_next"; }
        else {
            retval += ""; }
    }   
  
    return retval;
}