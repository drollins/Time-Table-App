var currentDay = 'none'; //  default for tapping the image
var favsChange;

//
// refreshTimetableChart(day)
// Swap out timeline image for refreshing placeholder
// Then update the image from the fav array
//
// TODO: check to see if there are actually any changes to the fav array
// TODO: do this automatically upon returning to #Home if there are changes to favs
//
function refreshTimetableChart(day)
{    
    // make favs array for each stage for today
    // array contains acts in fav list for only that stage
    var favsToday = [];
    favsToday[0] = []; // valley stage
    favsToday[1] = []; // field stage
    
    for (i in favs) {
        if (favs[i].day==day) {
            if (favs[i].stage=="valley") {
                favsToday[0].push(favs[i]); }
            else if (favs[i].stage=="field") {
                favsToday[1].push(favs[i]); }
        }
    }
        
    // if both arrays for today are actually empty then continue no further
    var maxFavs = Math.max(favsToday[0].length, favsToday[1].length);

    if ( (day != currentDay) || (favs != favsChange) )
    {
        // sneaky js copy; so we can compare whether the favourites have been changed
        //todo
    
        if ( maxFavs == 0 )        
        {
            $('#chartWrap').fadeOut('fast', afterFadeOutWrapNone);
                    
            function afterFadeOutWrapNone()
            {
                $('#chartLoading').hide();
                $('#chartMsg').hide();            
                $('#chartLoading').html('');
                $('#chartMsg').html("No favourites selected for "+day.substr(0,1).toUpperCase()+day.substr(1,2)+"<br/><small>Browse the festival schedule above<br/>and add some bands to your timetable!</small>");
                            
                $('#chartNone').fadeIn('fast');
                $('#chartLoading').fadeIn('fast');
                $('#chartMsg').fadeIn('fast');
            }
        }
        else
        {
            $('#chartNone').fadeOut('fast', afterFadeOutNone);
            
            function afterFadeOutNone()
            {            
                $('#chartMsg').html('');
                $('#chartWrap').fadeOut('fast', afterFadeOutWrap);
            }
            
            function afterFadeOutWrap()
            {
                $('#chartWrap').css('visibility', 'hidden');
                
                $('#chartWrap').show();
                
                plotTimetable(day);
                
                $('#chartTitle').text('My Timetable for '+day.substr(0,1).toUpperCase()+day.substr(1,2));
                $('#chartWrap').hide().css('visibility', 'visible').fadeIn('slow');
            }
        }
    }
    
    currentDay = day;
}

//
// timeDiff(time1, time2)
// Returns time difference (time2 - time1) in minutes
// (assumes that time2 is after time1, and that times are within 24 hours of each other
//  as a result, timeDiff will wrap around midnight)
// time1 and time2 --> 4 character strings, representing time in 24hr notation
//  
function timeDiff(time1, time2)
{
    var hr1 = time1.substr(0,2);
    var min1 = time1.substr(2,2);
    var hr2 = time2.substr(0,2);
    var min2 = time2.substr(2,2);
    
    var retval = 0;        
    var mins = min2-min1;
    
    // compute number of minutes between first time and second time
    if (mins >= 60) {
        retval = (hr2 - hr1 - 1)*60 + (mins-40); }
    else {
        retval = (hr2 - hr1)*60 + mins; }
    
    // this wraps timeDiff around midnight
    if (retval < 0) {
        retval = retval + 60*24; }
    
    return retval;
}
    

//
// makeTimelineChart(day)
// Generate data points for timeline chart for specific "day"
//
function makeTimelineChart(day, timeStart)
{
    var datum = convertAxisToTime(timeStart);    

    // make favs array for each stage for today
    // array contains acts in fav list for only that stage
    var favsToday = [];
    favsToday[0] = []; // valley stage
    favsToday[1] = []; // field stage
    
    for (i in favs) {
        if (favs[i].day==day) {
            if (favs[i].stage=="valley") {
                favsToday[0].push(favs[i]); }
            else if (favs[i].stage=="field") {
                favsToday[1].push(favs[i]); }
        }
    }
    
    // sort the favs arrays by earliest starting to last
    favsToday[0] = favsToday[0].sort(sortTimes);
    favsToday[1] = favsToday[1].sort(sortTimes);

    // start construction of api parameter components
    var retvalData = [];
    var retvalLabel = [];
    var retvalColour = [];
    
    // retvalData[stage][blank{0} / act{1}][value]
    var vBlank = 0;
    var vAct = 1;
    retvalData[0] = [];
    retvalData[1] = [];
    retvalData[0][vBlank] = [];
    retvalData[0][vAct] = [];
    retvalData[1][vBlank] = [];
    retvalData[1][vAct] = [];    
    
    retvalLabel[0] = [];
    retvalLabel[1] = [];
    retvalLabel[0][vBlank] = [];
    retvalLabel[0][vAct] = [];
    retvalLabel[1][vBlank] = [];
    retvalLabel[1][vAct] = [];
    
    // if the cod ehas made it to this point, then there is definitely a fav for today... but we need to check to see if either there are no favsToday for a particular stage
        
    // if there is at least one act for each stage...    
    //   first data point is difference between start time of first act and 0900  
    //   second data point is length of the first ac  
    // otherwise, leave dataset as null
    if (favsToday[0].length > 0)
    {
        retvalData[0][vBlank].push( [0, -timeDiff(datum,favsToday[0][0].start)] );
        retvalData[0][vAct].push( [0, -timeDiff(favsToday[0][0].start,favsToday[0][0].finish)] );
        retvalLabel[0][vBlank].push( "-" );
        retvalLabel[0][vAct].push( (favsToday[0][0].band) );
    }
    if (favsToday[1].length > 0)
    {
        retvalData[1][vBlank].push( [1, -timeDiff(datum,favsToday[1][0].start)] );
        retvalData[1][vAct].push( [1, -timeDiff(favsToday[1][0].start,favsToday[1][0].finish)] ); 
        retvalLabel[1][vBlank].push( "-" );
        retvalLabel[1][vAct].push( (favsToday[1][0].band) );       
    }
    
    
    //
    // Create the graph bits: data, label and colour values for each of the api parameters
    // We did the first element above, so here start from the second element (i.e. index of 1 ). If it doesn't exist then ...
    // Note: this could be condensed into a for loop and made more generic, but is keep exploded for now for ease of design and debugging
    //
    var sID;    
    sID = 0; //stageIndex
    
    // create data points for V -- stage[0]
    for (i=1; i<favsToday[0].length; i++)
    {
        // break time
        // always the diff between 0900 and start of next act
        retvalData[sID][vBlank].push( [sID, -timeDiff(datum,favsToday[sID][i].start)] );
        retvalLabel[sID][vBlank].push( "-" );
        
        // act time
        retvalData[sID][vAct].push( [sID, -timeDiff(favsToday[sID][i].start,favsToday[sID][i].finish)] );
        retvalLabel[sID][vAct].push( (favsToday[sID][i].band) );            
    }
    
     
    sID = 1; //stageIndex
    
    // create data points for F -- stage[1]
    for (i=1; i<favsToday[1].length; i++)
    {
        // break time
        // always the diff between 0900 and start of next act
        retvalData[sID][vBlank].push( [sID, -timeDiff(datum,favsToday[sID][i].start)] );
        retvalLabel[sID][vBlank].push( "-" );
        
        // act time
        retvalData[sID][vAct].push( [sID, -timeDiff(favsToday[sID][i].start,favsToday[sID][i].finish)] );
        retvalLabel[sID][vAct].push( (favsToday[sID][i].band) );
    }

    // return data, label and colour parameter strings as an array
    return [retvalData, retvalLabel];
}


function toggleDayButtons()
{
    var cssClass = document.getElementById('chartDayButtons').className;
    
    if (cssClass == "chartDayButtonsShow") {
        document.getElementById('chartDayButtons').className = "chartDayButtonsHide" }
    else {
        document.getElementById('chartDayButtons').className = "chartDayButtonsShow" }
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

function convertAxisToTime(axis)
{
    var min;
    var hr;
    
    min = (axis % 60) + "";
    while (min.length < 2) {
        min = "0"+min; }
        
    hr = ~~(axis / 60);
    if (hr>=24)
        hr=hr-24;
    
    hr = hr + "";            
    while (hr.length < 2) {
        hr = "0"+hr; }       
    
    return hr+min;    
}

function axisTimeTickLabel(a)
{
    var min;
    var hr;
    
    min = (a % 60) + "";
    while (min.length < 2) {
        min = "0"+min; }
        
    hr = ~~(a / 60);
    if (hr>=24)
        hr=hr-24;
    
    hr = hr + "";            
    while (hr.length < 2) {
        hr = "0"+hr; }        
    
    return hr+min + "-"+fullDayTime(hr+min)+"-"+a;
}

function plotTimetable(day)
{
    var timeStart = 9*60; // minutes after midnight to start from
    
    var mTC = makeTimelineChart(day, timeStart);
    var chartData = mTC[0];
    var chartLabel = mTC[1];
    
    var chartColours = [];    
    chartColours[0] = "rgba(255, 255, 255, 0.8)";
    chartColours[1] = "rgb(196, 64, 32)";
    chartColours[2] = "rgb(23, 100, 1)";
    
    s0b = {label: "a", data: chartData[0][0], color: chartColours[0], xaxis: 2, hoverable: false};
    s0a = {label: "b", data: chartData[0][1], color: chartColours[1], xaxis: 1, hoverable: true};
    s1b = {label: "c", data: chartData[1][0], color: chartColours[0], xaxis: 2, hoverable: false};
    s1a = {label: "d", data: chartData[1][1], color: chartColours[2], xaxis: 1, hoverable: true};
    
    labArray = [ chartLabel[0][0], chartLabel[0][1], chartLabel[1][0], chartLabel[1][1] ]
    
    function axisTimeFormat(val,axis)
    {    
        var res = [];    
        return [ convertAxisToTime(timeStart-val.toFixed(axis.tickDecimals)) ];        
    }    
            
    var plot =
        $.plot($("#placeholder"), [ s0b, s0a, s1b, s1a ], {
            series: {
                stack: 0,
                bars: { show: true, align: "center", lineWidth: 0, barWidth: 0.75, fill: 1 },
                shadowSize: 3
            },
            xaxis: {
                min: -0.5,
                max: 1.5,
                ticks: [[0, "valley"], [1, "field"]]
            },
            x2axis: {
                min: -0.5,
                max: 1.5,
                ticks: [[0, "valley"], [1, "field"]]
            },
            yaxis: {
                min: -1140, // = -(minutes after timeStart to end)
                max: 0,
                tickSize: 60,
                tickFormatter: axisTimeFormat
            },
            grid: {
                aboveData: true,
                clickable: true,
                hoverable: true,
                autoHighlight: false
            },
            valueLabels: {
                show: true,
                srcArray: labArray
            },
            legend: {
                show: false
            }
            //,colors: [ colBlank, colOne, colBlank, colTwo ],
        });        
}
