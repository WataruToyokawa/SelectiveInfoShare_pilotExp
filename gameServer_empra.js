/*===============================================================
// Browser-based two-armed bandit task
// Author: Wataru Toyokawa
// Collaborating with Wolfgang
// Requirements:a
//    * Node.js
//    * node_modules: express, socket.io, fast-csv, php-express
// ============================================================== */

// Loading modules
const csv = require("fast-csv")
,	fs = require('fs')
,	path = require("path")
,	express = require('express')
,	app = express()
,	server = require('http').Server(app)
,	io = require('socket.io')(server, {
  // below are engine.IO options
  pingInterval: 1000, // A ping-pong heart beating is emitted every 1 second
  pingTimeout: 6000 // If client's latency is more than 5 sec. then he/she is disconnected
  })
,	routes = require('./routes')
, bodyParser = require("body-parser")
;

// Experimental variables
const exp_condition = 0 // 0 = distributive; 1 = additive
,	sessionNo = 0 // 0 = debug; 100~ TEST
, numTrial = 5 // 100?
, pointCentConversionRate = (0.4)/7//0.25 // we need to adjust it to make sure the real payment falls into a reasonable range
, maxNumPlayer = 3
, maxWaitingTime = 10 * 1000//3*60*1000 
, maxChoiceStageTime = 60*1000 // seconds?
, maxTimeTestScene = 4* 60*1000 // 4*60*1000
//, maxWaitingTime = 20*1000 // debug
//, maxChoiceStageTime = 60*1000 // debug
//, maxTimeTestScene = 60*1000 // debug
, sigmaGlobal = 6 //0.9105
, sigmaIndividual = 6 //0.9105 // this gives 50% overlap between two normal distributions whose mean diff. is 1.1666..
, payoffMeans = {}
, optionQualities = {}
, numOptions = 5
;

// date and time
let myD = new Date()
, myYear = myD.getFullYear()
, myMonth = myD.getMonth() + 1
, myDate = myD.getUTCDate()
, myHour = myD.getUTCHours()
, myMin = myD.getUTCMinutes()
;
if(myMonth<10){myMonth = '0'+myMonth;}
if(myDate<10){myDate = '0'+myDate;}
if(myHour<10){myHour = '0'+myHour;}
if(myMin<10){myMin = '0'+myMin;}

//payoffMeans[1] = [6.6666667, 5.5000000, 4.3333333, 3.1666667, 0.6666667];
//payoffMeans[0] = [10, 6, 4, 3, 2];
payoffMeans[1] = [46.6666667, 38.5000000, 30.3333333, 22.1666667, 4.6666667];
payoffMeans[0] = [70, 42, 28, 21, 14];

optionQualities[1] = [5,4,3,2,1];
optionQualities[0] = [5,4,3,2,1];
// Shuffle the options' place randomly for each run of this server.
// The option-quality's list is shuffled in the same order,
// so that I can track where each option is set
for (let i = numOptions - 1; i > 0; i--) {
  let r = Math.floor(Math.random() * (i + 1));
  let tmp1 = payoffMeans[1][i];
  let tmp2 = optionQualities[1][i];
  let tmp3 = payoffMeans[0][i];
  let tmp4 = optionQualities[0][i];
  payoffMeans[1][i] = payoffMeans[1][r];
  optionQualities[1][i] = optionQualities[1][r];
  payoffMeans[0][i] = payoffMeans[0][r];
  optionQualities[0][i] = optionQualities[0][r];
  payoffMeans[1][r] = tmp1;
  optionQualities[1][r] = tmp2;
  payoffMeans[0][r] = tmp3;
  optionQualities[0][r] = tmp4;
}

// experimental server
const currentSubject = 0
, firstRoomName = myMonth+myDate+myHour+myMin+'_session_'+sessionNo
,	roomStatus = {}
, sessionNameSpace = {}
, idAssignedThisSession = []
,	portnum = 8080
;
// experimental status
let total_N_now = 0
, finish_number
, countDownMainStage = {}
, countDownWaiting = {}
//, saveDataThisRound = []
;
countDownMainStage[firstRoomName] = new Object();
countDownWaiting[firstRoomName] = new Object();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routings
const gameRouter = require('./routes/game');
// Assigning routers to Routing
app.use('/', gameRouter);

// Routes
/*app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/main.html');
});*/

roomStatus['finishedRoom'] = {
    exp_condition: exp_condition,
    indivOrGroup: -1,
    n: 0,
    membersID: [],
    subjectNumbers: [],
    disconnectedList: [],
    testPassed: 0,
    starting: 0,
    stage: 'firstWaiting',
    maxChoiceStageTime: maxChoiceStageTime,
    choiceTime: [],
    round: 1,
    doneNo: [],
    socialInfo:[],
    publicInfo:[],
    choiceOrder:[],
    saveDataThisRound: [],
    restTime:maxWaitingTime
};
// The following is the first room
// Therefore, Object.keys(roomStatus).length = 2 right now
// A new room will be open once this room becomes full
roomStatus[firstRoomName] = {
    exp_condition: exp_condition,
    indivOrGroup: -1,
    n: 0,
    membersID: [],
    subjectNumbers: [],
    disconnectedList: [],
    testPassed: 0,
    starting: 0,
    stage: 'firstWaiting',
    maxChoiceStageTime: maxChoiceStageTime,
    choiceTime: [],
    round: 1,
    doneNo: [],
    socialInfo:[],
    publicInfo:[],
    choiceOrder:[],
    saveDataThisRound: [],
    restTime:maxWaitingTime
};



const port = process.env.PORT || portnum;

server.listen(port, function() {
    let now167 = new Date(),
        logtxt167 = '[' + now167.getUTCFullYear() + '/' + (now167.getUTCMonth() + 1) + '/';
    logtxt167 += now167.getUTCDate() + '/' + now167.getUTCHours() + ':' + now167.getUTCMinutes() + ':' + now167.getUTCSeconds() + ']';
    logtxt167 += ' - EMPRA 2019 GAME SERVER listening on port ' + port + '; condition: ' + exp_condition + '; max_n_per_rooom = '+maxNumPlayer;
    console.log(logtxt167);
});

var csvStream
, dataName = "EmPra2019_condition_"+exp_condition+'_'+myYear+myMonth+myDate+myHour+myMin
;

console.log('This session\'s dataName is ' + dataName);

/**
 * Socket.IO Connection.
 */
io.on('connection', function (client) {
  // client's unique identifier 
  client.amazonID = client.request._query.amazonID;
  // putting this client into a experimental room
  if (typeof client.request._query.sessionName == 'undefined') {
      // client.sessionName: this is an unique code for each participant
      client.session = client.id;
      client.join(client.session);
      sessionNameSpace[client.session] = 1;
      /*// ============ copied ===============================================================
      // Let the client join the newest room
      client.roomFindingCounter = 1; // default: roomStatus = {'finishedRoom', 'session_100'}
      while (typeof client.room == 'undefined') {
        // if there are still rooms to check
        if (client.roomFindingCounter <= Object.keys(roomStatus).length - 1) {
          if(roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['starting'] == 0 && roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['n'] < maxNumPlayer && roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['restTime'] > 0) {
            //console.log(roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]);
            client.room = Object.keys(roomStatus)[client.roomFindingCounter];
          } else {
            client.roomFindingCounter++;
          }
        } else {
          // else if there is no more available room left
          // Make a new room
          roomStatus[myMonth+myDate+myHour+myMin+'_session_' + (sessionNo + Object.keys(roomStatus).length - 1)] = 
          {
              exp_condition: exp_condition,
              indivOrGroup: -1,
              n: 0,
              membersID: [],
              subjectNumbers: [],
              disconnectedList: [],
              testPassed: 0,
              starting: 0,
              stage: 'firstWaiting',
              maxChoiceStageTime: maxChoiceStageTime,
              choiceTime: [],
              round: 1,
              doneNo: [],
              socialInfo:[],
              publicInfo:[],
              choiceOrder:[],
              saveDataThisRound: [],
              restTime:maxWaitingTime
          };
          // Register the client to the new room
          client.room = Object.keys(roomStatus)[Object.keys(roomStatus).length - 1];
          // Make a clock object in the new room
          countDownMainStage[client.room] = new Object();
          countDownWaiting[client.room] = new Object();
        }
      }
      
      // Let the client join the registered room
      client.join(client.room);
      io.to(client).emit('S_to_C_clientSessionName', {sessionName: client.session, roomName: client.room});
      // ping-pong (aka, heart-beating)
      
      total_N_now++;
      roomStatus[client.room]['n']++
      roomStatus[client.room]['membersID'].push(client.session);
      client.subNumCounter = 1;
      while (typeof client.subjectNumber == 'undefined') {
        if (roomStatus[client.room]['subjectNumbers'].indexOf(client.subNumCounter) == -1) {
          roomStatus[client.room]['subjectNumbers'].push(client.subNumCounter);
          client.subjectNumber = client.subNumCounter;
        } else {
          client.subNumCounter++;
        }
      }
      // ==================== copied =========================
      */
  } else if (client.request._query.sessionName == 'already_finished'){
      // Some web browsers may try to reconnect with this game server when the browser
      // is forced to disconnect. The following script will assure 
      // that such reconnected subject will not go to a normal room, 
      // but to the 'finishedRoom' where nothing will ever never happen.
      client.session = client.request._query.sessionName;
      client.room = 'finishedRoom';
      client.join(client.session);
      client.join(client.room);
  } else {
      // When client comes back from a short disconnection
      client.session = client.request._query.sessionName;
      client.room = client.request._query.roomName;
      client.join(client.session);
      client.join(client.room);
      client.emit('S_to_C_welcomeback', {sessionName: client.session, roomName: client.room});
      total_N_now++;
      sessionNameSpace[client.session] == 1;
      var now273 = new Date(),
          logdate273 = '['+now273.getUTCFullYear()+'/'+(now273.getUTCMonth()+1)+'/';
          logdate273 += now273.getUTCDate()+'/'+now273.getUTCHours()+':'+now273.getUTCMinutes()+':'+now273.getUTCSeconds()+']';
      console.log(logdate273+' - '+ client.session +'('+client.amazonID+') in room '+client.room+' reconnected to the server');
      if(typeof roomStatus[client.room]['n'] == 'undefined'){
        roomStatus[client.room] = {
              exp_condition: exp_condition,
              indivOrGroup: -1,
              n: 0,
              membersID: [],
              subjectNumbers: [],
              disconnectedList: [],
              testPassed: 0,
              starting: 0,
              stage: 'firstWaiting',
              maxChoiceStageTime: maxChoiceStageTime,
              choiceTime: [],
              round: 1,
              doneNo: [],
              socialInfo:[],
              publicInfo:[],
              choiceOrder:[]
          };
        roomStatus[client.room]['n']++;
        roomStatus[client.room]['total_n']++;
        roomStatus[client.room]['membersID'].push(client.session);
      } else {
        roomStatus[client.room]['n']++;
        roomStatus[client.room]['total_n']++;
      }
  }

  /*var now = new Date();
  var logdate = '['+now.getUTCFullYear()+'/'+(now.getUTCMonth()+1)+'/';
  logdate += now.getUTCDate()+'/'+now.getUTCHours()+':'+now.getUTCMinutes()+':'+now.getUTCSeconds()+']';
  console.log(logdate+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+roomStatus[client.room]['n']+', total N: '+total_N_now+')');
  */

  

  // Randomly assigning a payoff landscape to the client without duplication
  let flag = true;
  while (flag) {
    client.landscapeId = rand(500, 1);
    if(idAssignedThisSession.indexOf(client.landscapeId)==-1){
      idAssignedThisSession.push(client.landscapeId);
      flag = false;
    }
  }

  // log
  /*var now = new Date(),
      logdate = '[' + now.getUTCFullYear() + '/' + (now.getUTCMonth() + 1) + '/';
  logdate += now.getUTCDate() + '/' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + ']';
  console.log(logdate + ' - New player:' + client.session + ' (amazonID: ' + client.amazonID + ') is connected to room ' + client.room);*/
  


  // When client's game window is ready & latency was calculated
  client.on('core is ready', function(data) {
    var now333 = new Date();
    var logtext333 = '['+now333.getUTCFullYear()+'/'+(now333.getUTCMonth()+1)+'/';
    logtext333 += now333.getUTCDate()+'/'+now333.getUTCHours()+':'+now333.getUTCMinutes()+':'+now333.getUTCSeconds()+']';
    logtext333 += ' - Client: ' + client.session +'('+client.amazonID+') responds with an average latency = '+ data.latency + ' ms.'; 
    console.log(logtext333);
    if(data.latency < data.maxLatencyForGroupCondition) {
      // ===============================================================
      // Let the client join the newest room
      client.roomFindingCounter = 1; // default: roomStatus = {'finishedRoom', 'session_100'}
      while (typeof client.room == 'undefined') {
        // if there are still rooms to check
        if (client.roomFindingCounter <= Object.keys(roomStatus).length - 1) {
          if(roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['starting'] == 0 && roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['n'] < maxNumPlayer && roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['restTime'] > 0) {
            //console.log(roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]);
            client.room = Object.keys(roomStatus)[client.roomFindingCounter];
            var now348 = new Date();
            var logdate348 = '['+now348.getUTCFullYear()+'/'+(now348.getUTCMonth()+1)+'/';
            logdate348 += now348.getUTCDate()+'/'+now348.getUTCHours()+':'+now348.getUTCMinutes()+':'+now348.getUTCSeconds()+']';
            console.log(logdate348+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+roomStatus[client.room]['n']+', total N: '+total_N_now+')');
          } else {
            client.roomFindingCounter++;
          }
        } else {
          // else if there is no more available room left
          // Make a new room
          client.newRoomName = myMonth+myDate+myHour+myMin+'_session_' + (sessionNo + Object.keys(roomStatus).length - 1);
          roomStatus[client.newRoomName] = 
          {
              exp_condition: exp_condition,
              indivOrGroup: -1,
              n: 0,
              membersID: [],
              subjectNumbers: [],
              disconnectedList: [],
              testPassed: 0,
              starting: 0,
              stage: 'firstWaiting',
              maxChoiceStageTime: maxChoiceStageTime,
              choiceTime: [],
              round: 1,
              doneNo: [],
              socialInfo:[],
              publicInfo:[],
              choiceOrder:[],
              saveDataThisRound: [],
              restTime:maxWaitingTime
          };
          // Register the client to the new room
          client.room = client.newRoomName;
          var now382 = new Date();
          var logdate382 = '['+now382.getUTCFullYear()+'/'+(now382.getUTCMonth()+1)+'/';
          logdate382 += now382.getUTCDate()+'/'+now382.getUTCHours()+':'+now382.getUTCMinutes()+':'+now382.getUTCSeconds()+']';
          console.log(logdate382+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+roomStatus[client.room]['n']+', total N: '+total_N_now+')');
          // Make a clock object in the new room
          countDownMainStage[client.room] = new Object();
          countDownWaiting[client.room] = new Object();
        }
      }
      
      // Let the client join the registered room
      client.join(client.room);
      io.to(client).emit('S_to_C_clientSessionName', {sessionName: client.session, roomName: client.room});
      
      total_N_now++;
      roomStatus[client.room]['n']++
      roomStatus[client.room]['membersID'].push(client.session);
      client.subNumCounter = 1;
      while (typeof client.subjectNumber == 'undefined') {
        if (roomStatus[client.room]['subjectNumbers'].indexOf(client.subNumCounter) == -1) {
          roomStatus[client.room]['subjectNumbers'].push(client.subNumCounter);
          client.subjectNumber = client.subNumCounter;
        } else {
          client.subNumCounter++;
        }
      }
      // ==================== copied =========================
    } else {
      // else if latency is too large
      // then this subject is go to the individual condition
      client.newRoomName = myMonth+myDate+myHour+myMin+'_sessionIndiv_' + (sessionNo + Object.keys(roomStatus).length - 1);
      roomStatus[client.newRoomName] = 
      {
          exp_condition: exp_condition,
          indivOrGroup: 0,
          n: 0,
          membersID: [],
          subjectNumbers: [],
          disconnectedList: [],
          testPassed: 0,
          starting: 0,
          stage: 'firstWaiting',
          maxChoiceStageTime: maxChoiceStageTime,
          choiceTime: [],
          round: 1,
          doneNo: [],
          socialInfo:[],
          publicInfo:[],
          choiceOrder:[],
          saveDataThisRound: [],
          restTime:1000
      };
      // Register the client to the new room
      client.room = client.newRoomName;
      var now436 = new Date();
      var logdate436 = '['+now436.getUTCFullYear()+'/'+(now436.getUTCMonth()+1)+'/';
      logdate436 += now436.getUTCDate()+'/'+now436.getUTCHours()+':'+now436.getUTCMinutes()+':'+now436.getUTCSeconds()+']';
      console.log(logdate436+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+roomStatus[client.room]['n']+', total N: '+total_N_now+')');
      // Let the client join the registered room
      client.join(client.room);
      io.to(client).emit('S_to_C_clientSessionName', {sessionName: client.session, roomName: client.room});
      client.subjectNumber = 1;
      total_N_now++;
      roomStatus[client.room]['n']++
      roomStatus[client.room]['membersID'].push(client.session);
    }


    client.emit('this is your parameters', { id: client.session, room: client.room, landscapeId: client.landscapeId, maxChoiceStageTime: maxChoiceStageTime, maxTimeTestScene: maxTimeTestScene, exp_condition:exp_condition, subjectNumber: client.subjectNumber, pointCentRate: pointCentConversionRate, indivOrGroup: roomStatus[client.room]['indivOrGroup']}); // io.emit() if you want to send it to all clients
    if(client.room != 'finishedRoom') {
      // csvStream starts if this client is the first participant in this entire session
      if (total_N_now === 1){
        csvStream = csv.format({headers: true, quoteColumns: true});
        csvStream
              .pipe(fs.createWriteStream(path.resolve("./data", dataName+'_'+client.room+'.csv')))
              .on("end", process.exit);
        csvStream.on('error', function(err){ console.log(err); });
      }
      // Let client wait until start flag turns 1
      // the clock for the waiting room starts when the first client pops in.
      if (roomStatus[client.room]['n']===1) {
        let now463 = new Date(),
            logdate463 = '[' + now463.getUTCFullYear() + '/' + (now463.getUTCMonth() + 1) + '/';
        let doneNum;
        logdate463 += now463.getUTCDate() + '/' + now463.getUTCHours() + ':' + now463.getUTCMinutes() + ':' + now463.getUTCSeconds() + ']';
        console.log(logdate463 + ' - The first participant came in to the room ' + client.room + '.');
        startWaitingStageClock(client.room);
      }
      // inform rest time to the room
      io.to(client.room).emit('this is the remaining waiting time', {restTime:roomStatus[client.room]['restTime'], max:maxWaitingTime, maxNumPlayer:maxNumPlayer, maxRound:numTrial});
    }
  });
  
  client.on('choice made', function (data) {
    let now476 = new Date(),
        logdate476 = '[' + now476.getUTCFullYear() + '/' + (now476.getUTCMonth() + 1) + '/';
    let doneNum;
    let chocieArray = eval('['+data.choice+']');
    logdate476 += now476.getUTCDate() + '/' + now476.getUTCHours() + ':' + now476.getUTCMinutes() + ':' + now476.getUTCSeconds() + ']';
    console.log(logdate476 + ' - Client ' + client.session + '(subNo = ' + client.subjectNumber + ') chose ' + chocieArray + '.');
    if (typeof roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round'] - 1] !== 'undefined') {
      roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1].push(client.subjectNumber);
      doneNum = roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1].length;
      if(chocieArray.length == 1) {
        //console.log('ok, choice array length is '+chocieArray.length);
        roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1][doneNum-1] =chocieArray[0];
      } else {
        roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1] = chocieArray;
      }
      roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1][doneNum-1] = client.subjectNumber;
      client.emit('your instant number is', client.subjectNumber-1);
      // Save the data to csv
      for (let k = 0; k < chocieArray.length; k++) {
        client.save_data = new Object();
        client.save_data.exp_condition = roomStatus[client.room]['exp_condition'];
        client.save_data.indivOrGroup = roomStatus[client.room]['indivOrGroup'];
        client.save_data.groupSize = roomStatus[client.room]['n'];
        client.save_data.room = client.room;
        client.save_data.confirmationID = client.session;
        client.save_data.subjectNumber = client.subjectNumber;
        client.save_data.amazonID = client.amazonID;
        client.save_data.round = roomStatus[client.room]['round'];
        client.save_data.choice = chocieArray[k];
        client.save_data.optionQuality = optionQualities[roomStatus[client.room]['exp_condition']][chocieArray[k]];
        client.save_data.totalEarning = data.totalEarning;
        client.save_data.individualContribution = data.individualContribution;
        const dummyInfo = new Array(maxNumPlayer).fill(-1);
        for(let i=0; i<maxNumPlayer; i++) {
          eval('client.save_data.socialInfo_'+i+'= dummyInfo['+i+'];');
        }
        for(let i=0; i<maxNumPlayer; i++) {
          eval('client.save_data.publicInfo_'+i+'= dummyInfo['+i+'];');
        }
        
        if(client.save_data.round>1){
          for(let i = 0; i < data.socialInfo.length; i++) {
            eval('client.save_data.socialInfo_'+i+'= data.socialInfo['+i+'];');
            eval('client.save_data.publicInfo_'+i+'= data.publicInfo['+i+'];');
          }
        }
        //csvStream.write(client.save_data); 
        roomStatus[client.room]['saveDataThisRound'].push(client.save_data);
        //console.log('saveDataThisRound.length is ' + saveDataThisRound.length);
      }
      // save data - end
      let numChoiceDone = roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].filter(function(value){ return value >= 0});
      if (numChoiceDone.length >= roomStatus[client.room]['n']) {
        calculatePayoff(0, numChoiceDone, numOptions, client.room, roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1], roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1], client.session, client.subjectNumber, client.amazonID);
        roomStatus[client.room]['saveDataThisRound'] = [];
        //io.to(client.room).emit()
      } else {
        var now533 = new Date(),
        logdate533 = '['+now533.getUTCFullYear()+'/'+(now533.getUTCMonth()+1)+'/';
        logdate533 += now533.getUTCDate()+'/'+now533.getUTCHours()+':'+now533.getUTCMinutes()+':'+now533.getUTCSeconds()+']';
        console.log(logdate533 + ' - number of choice done is '+numChoiceDone.length + ' and the group size is '+roomStatus[client.room]['n'] + ' in ' + client.room);
      }
    } else {
      roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1] = new Array(maxNumPlayer).fill(-1);
      
      roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] = [client.subjectNumber];
      if(chocieArray.length == 1) {
        roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1][0] = chocieArray[0];
      } else {
        roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1] = chocieArray;
      }
      roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1] = new Array(maxNumPlayer).fill(-1);
      roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1][0] = client.subjectNumber;
      client.emit('your instant number is', client.subjectNumber-1);
      // Save the data to csv
      for (let k = 0; k < chocieArray.length; k++) {
        client.save_data = new Object();
        client.save_data.exp_condition = roomStatus[client.room]['exp_condition'];
        client.save_data.indivOrGroup = roomStatus[client.room]['indivOrGroup'];
        client.save_data.groupSize = roomStatus[client.room]['n'];
        client.save_data.room = client.room;
        client.save_data.confirmationID = client.session;
        client.save_data.subjectNumber = client.subjectNumber;
        client.save_data.amazonID = client.amazonID;
        client.save_data.round = roomStatus[client.room]['round'];
        client.save_data.choice = chocieArray[k];
        client.save_data.optionQuality = optionQualities[roomStatus[client.room]['exp_condition']][chocieArray[k]];
        client.save_data.totalEarning = data.totalEarning;
        client.save_data.individualContribution = data.individualContribution;
        const dummyInfo = new Array(maxNumPlayer).fill(-1);
        for(let i=0; i<maxNumPlayer; i++) {
          eval('client.save_data.socialInfo_'+i+'= dummyInfo['+i+'];');
        }
        for(let i=0; i<maxNumPlayer; i++) {
          eval('client.save_data.publicInfo_'+i+'= dummyInfo['+i+'];');
        }
        if(client.save_data.round>1){
          for(let i = 0; i < data.socialInfo.length; i++) {
            eval('client.save_data.socialInfo_'+i+'= data.socialInfo['+i+'];');
            eval('client.save_data.publicInfo_'+i+'= data.publicInfo['+i+'];');
          }
        }
        roomStatus[client.room]['saveDataThisRound'].push(client.save_data);
        //console.log('roomStatus[client.room]['saveDataThisRound'].length is ' + roomStatus[client.room]['saveDataThisRound'].length);
      }
      // save data - end
      let numChoiceDone = roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].filter(function(value){ return value >= 0});
      if (numChoiceDone.length >= roomStatus[client.room]['n']) {
        calculatePayoff(0, numChoiceDone, numOptions, client.room, roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1], roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1], client.session, client.subjectNumber, client.amazonID);
        roomStatus[client.room]['saveDataThisRound'] = [];
      } else {
        var now587 = new Date(),
        logdate587 = '['+now587.getUTCFullYear()+'/'+(now587.getUTCMonth()+1)+'/';
        logdate587 += now587.getUTCDate()+'/'+now587.getUTCHours()+':'+now587.getUTCMinutes()+':'+now587.getUTCSeconds()+']';
        console.log(logdate587 + ' - number of choice done is '+numChoiceDone.length + ' and the group size is '+roomStatus[client.room]['n'] + ' in ' + client.room);
      }
    }
  });

  client.on('Result stage ended', function () {
    // Depending on the number of subject who has already done this round,
    // the response to the client changes 
    // (i.e., the next round only starts after all the subject have chosen their option)
    if (typeof roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] !== 'undefined') {
        roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1]++;
        if (roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] < roomStatus[client.room]['n']) {
          ////console.log(roomStatus[client.room]);
          //client.emit('S_to_C_waitOthers', roomStatus[client.room] );
        } else {
          ////console.log(roomStatus[client.room]);
          proceedRound(client.room);
        }
    } else {
          // if 'doneNo' is still undefined, make it
        roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] = 1;
        if (roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] < roomStatus[client.room]['n']) {
          ////console.log(roomStatus[client.room]);
          //client.emit('S_to_C_waitOthers', roomStatus[client.room] );
        } else {
          ////console.log(roomStatus[client.room]);
          proceedRound(client.room);
        }
    }
  });

  client.on('ok individual condition sounds good', function () {
    // finally checking weather group is still below the maxnumber
    if(roomStatus[client.room]['n'] < maxNumPlayer) {
      // the status of the client's former room is updated
      roomStatus[client.room]['starting'] = 1;
      roomStatus[client.room]['n']--;
      // create a new individual condition's room
      roomStatus[myMonth+myDate+myHour+myMin+'_sessionIndiv_' + (sessionNo + Object.keys(roomStatus).length - 1)] = 
      {
          exp_condition: exp_condition,
          indivOrGroup: 0,
          n: 0,
          membersID: [],
          subjectNumbers: [],
          disconnectedList: [],
          testPassed: 0,
          starting: 0,
          stage: 'firstWaiting',
          maxChoiceStageTime: maxChoiceStageTime,
          choiceTime: [],
          round: 1,
          doneNo: [],
          socialInfo:[],
          publicInfo:[],
          choiceOrder:[],
          saveDataThisRound: [],
          restTime:maxWaitingTime
      };
      // client leave the former room
      client.leave(client.room);
      // client joints the new individual room
      client.room = Object.keys(roomStatus)[Object.keys(roomStatus).length - 1];
      client.join(client.room);
      //total_N_now++;
      roomStatus[client.room]['n']++
      roomStatus[client.room]['membersID'].push(client.session);
      client.subjectNumber = roomStatus[client.room]['n'];
      startSession(client.room);
    } else {
      // if groupSize reached the enough number
      startSession(client.room);
    }
  });

  client.on('test passed', function () {
    if (roomStatus[client.room]['testPassed']==0) {
      roomStatus[client.room]['stage'] = 'secondWaitingRoom';
    }
    roomStatus[client.room]['testPassed']++;
    var now670 = new Date(),
        logdate670 = '['+now670.getUTCFullYear()+'/'+(now670.getUTCMonth()+1)+'/';
        logdate670 += now670.getUTCDate()+'/'+now670.getUTCHours()+':'+now670.getUTCMinutes()+':'+now670.getUTCSeconds()+'] ';
    console.log(logdate670 +' - '+ client.session + ' passed the test.');
    if (roomStatus[client.room]['testPassed'] >= roomStatus[client.room]['n']) {
      var now675 = new Date(),
        logdate675 = '['+now675.getUTCFullYear()+'/'+(now675.getUTCMonth()+1)+'/';
        logdate675 += now675.getUTCDate()+'/'+now675.getUTCHours()+':'+now675.getUTCMinutes()+':'+now675.getUTCSeconds()+']';
      console.log(logdate675 + ' - ' + client.room + ' is ready to start the game.');
      io.to(client.room).emit('all passed the test', {n:roomStatus[client.room]['n'], testPassed:roomStatus[client.room]['testPassed'], exp_condition:roomStatus[client.room]['exp_condition']});
    } else {
      client.emit('wait for others finishing test');
    }
  });

  client.on("disconnect", function () {
    if(typeof client.room != 'undefined') {
      let thisRoomName = client.room;
      client.leave(client.room);
      if (thisRoomName != 'finishedRoom') {
        total_N_now--;
      }
      /*if(total_N_now < 1 && typeof pingPong != 'undefined') {
        clearInterval(pingPong);
      }*/
      
      roomStatus[thisRoomName]['disconnectedList'].push(client.session);
      let idPosition;
      //let subjectNumberPosition;
      if(roomStatus[thisRoomName]['membersID'].indexOf(client.session) > -1) {
        idPosition = roomStatus[thisRoomName]['membersID'].indexOf(client.session);
      }
      /*if(roomStatus[thisRoomName]['subjectNumbers'].indexOf(client.subjectNumber) > -1) {
        subjectNumberPosition = roomStatus[thisRoomName]['membersID'].indexOf(client.subjectNumber);
      }*/
      roomStatus[thisRoomName]['membersID'].splice(idPosition, 1);
      roomStatus[thisRoomName]['subjectNumbers'].splice(idPosition, 1);
      sessionNameSpace[client.session] = 0;
      if(roomStatus[thisRoomName]['indivOrGroup'] != 0) {
        roomStatus[thisRoomName]['n']--;
        // Note: 
        // if this is an individual session's room, then I want 'n' to remain 1
        // so than no one will never enter this room again. 
        // On the other hand, it this is a group session's room, reducing 'n' may open up 
        // a room for a new comer (if this room is still on the first waiting screen)
      }

      let doneOrNot;
      if(typeof roomStatus[thisRoomName]['doneNo'][roomStatus[thisRoomName]['round']-1] != 'undefined') {
        doneOrNot = roomStatus[thisRoomName]['doneNo'][roomStatus[thisRoomName]['round']-1].indexOf(client.subjectNumber);
      } else {
        doneOrNot = -1;
      }
      if(doneOrNot > -1){
        roomStatus[thisRoomName]['doneNo'][roomStatus[thisRoomName]['round']-1].splice(doneOrNot, 1);
        roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].splice(doneOrNot, 1);
        roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].push(-1);
      }
      io.to(thisRoomName).emit('client disconnected', {roomStatus:roomStatus[thisRoomName], disconnectedClient:client.id});
      
      if (roomStatus[thisRoomName]['n']>0 && typeof roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1] != 'undefined') {
        let numChoiceDone = roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].filter(function(value){ return value >= 0});
        if (numChoiceDone.length >= roomStatus[thisRoomName]['n']) {
          calculatePayoff(0, numChoiceDone, numOptions, thisRoomName, roomStatus[thisRoomName]['choiceOrder'][roomStatus[thisRoomName]['round']-1], roomStatus[thisRoomName]['socialInfo'][roomStatus[thisRoomName]['round']-1], client.session, client.subjectNumber);
          roomStatus[thisRoomName]['saveDataThisRound'] = [];
        } else {
          //io.to(thisRoomName).emit('client disconnected', {n:roomStatus[thisRoomName]['n']});
          //io.to(thisRoomName).emit('client disconnected', {roomStatus:roomStatus[thisRoomName]});
        }
      }
      
      if(roomStatus[thisRoomName]['n'] <= 0){
        stopAndResetClock(thisRoomName);
      }
      var now744 = new Date(),
        logdate744 = '['+now744.getUTCFullYear()+'/'+(now744.getUTCMonth()+1)+'/';
        logdate744 += now744.getUTCDate()+'/'+now744.getUTCHours()+':'+now744.getUTCMinutes()+':'+now744.getUTCSeconds()+']';
      console.log(logdate744+' - client disconnected: '+ client.session+'('+client.amazonID+')'+' (room N: '+roomStatus[thisRoomName]['n']+', total N: '+total_N_now+') - handshakeID:'+ client.session);
      if (thisRoomName != 'finishedRoom' && total_N_now===0 && typeof csvStream != 'undefined') {
        csvStream.end();
      }
    }
    //console.log(roomStatus[thisRoomName]);
  });

});

function rand(max, min = 0) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function proceedRound (room) {
  roomStatus[room]['round']++;
  if(roomStatus[room]['round'] <= numTrial) {
    ////console.log(roomStatus[room]['round']);
    //console.log(numTrial);
    io.to(room).emit('Proceed to next round', roomStatus[room]);
  } else {
    io.to(room).emit('End this session', roomStatus[room]);
  }
}

function countDown(room) {
  //console.log('rest time of ' + room + ' is ' + roomStatus[room]['restTime']);
  roomStatus[room]['restTime'] -= 500;
  if (roomStatus[room]['restTime'] < 0) {
    //setTimeout(function(){ startSession(room) }, 1500); // this delay allows the 'start' text's effect
    if(roomStatus[room]['n'] < maxNumPlayer && roomStatus[room]['indivOrGroup'] != 0) {
      roomStatus[room]['starting'] = 1;
      io.to(room).emit('you guys are individual condition');
    } else {
      startSession(room);
    }
    //clearTimeout(countDownWaiting[room]);
  } else {
    let room2 = room;
    countDownWaiting[room] = setTimeout(function(){ countDown(room2) }, 500);
  }
}

function startSession (room) {
  if(typeof countDownWaiting[room] != 'undefined') {
    clearTimeout(countDownWaiting[room]);
  }
  roomStatus[room]['starting'] = 1;
  if (roomStatus[room]['n'] < maxNumPlayer) {
    roomStatus[room]['indivOrGroup'] = 0; // individual condition
  } else {
    roomStatus[room]['indivOrGroup'] = 1; // group condition
  }
  io.to(room).emit('this room gets started', {room:room, n:roomStatus[room]['n'], exp_condition:roomStatus[room]['exp_condition'], indivOrGroup:roomStatus[room]['indivOrGroup']});
  var now814 = new Date(),
      logdate814 = '['+now814.getUTCFullYear()+'/'+(now814.getUTCMonth()+1)+'/';
      logdate814 += now814.getUTCDate()+'/'+now814.getUTCHours()+':'+now814.getUTCMinutes()+':'+now814.getUTCSeconds()+']';
  console.log(logdate814+' - session started in '+room);
  //startChoiceStage(room, 1);
  //setTimeout(function(){ startChoiceStage(room, 1) }, 500);
}

function startWaitingStageClock (room) {
    var now823 = new Date(),
        logtxt823 = '['+now823.getUTCFullYear()+'/'+(now823.getUTCMonth()+1)+'/';
        logtxt823 += now823.getUTCDate()+'/'+now823.getUTCHours()+':'+now823.getUTCMinutes()+':'+now823.getUTCSeconds()+']';
        logtxt823 += ' - Waiting room opened at '+ room;
    console.log(logtxt823);
    countDown(room);
}

function stopAndResetClock (room) {
  clearTimeout(countDownWaiting[room]);
  roomStatus[room]['restTime'] = maxWaitingTime;
}

function calculatePayoff (counter, choices, numOptions, room, choiceOrder, socialInfo, session, subjectNumber, amazonID) {
  let payoffs = []
  ,   frequencies = new Array(numOptions).fill(0)
  ,   individualPayoffs = []
  ;
  let chocieArray = eval('['+socialInfo+']');
  let saveDataThisRound;
  // summarising choice frequencies
  for(let i=0; i<numOptions; i++){
    let num = -1;
    let tempAry = []; // a temporary array in which option i enters
    while (true) {
      num = choices.indexOf(i, num + 1);
      if(num == -1) break;
      tempAry.push(num);
    }
    frequencies[i] = tempAry.length;
  }
  // global payoffs (that is before divided by choices)
  individualPayoffs = payoffCalculator(choices, numOptions, frequencies, choiceOrder, exp_condition); // condition should be assigned when the server is launched
  roomStatus[room]['publicInfo'][roomStatus[room]['round']-1] = individualPayoffs;
  roomStatus[room]['choiceOrder'][roomStatus[room]['round']-1] = roomStatus[room]['doneNo'][roomStatus[room]['round']-1];
  while(roomStatus[room]['choiceOrder'][roomStatus[room]['round']-1].length < maxNumPlayer){
    roomStatus[room]['choiceOrder'][roomStatus[room]['round']-1].push(-1);
  }

  // Save the data to csv
  let thisCounter = counter;
  for (let k = 0; k < roomStatus[room]['saveDataThisRound'].length; k++) {
    saveDataThisRound = roomStatus[room]['saveDataThisRound'][k];
    // if no one has disconnected or this guy is not listed in the disconnected list, save the data
    if(roomStatus[room]['disconnectedList'].length === 0 || roomStatus[room]['disconnectedList'].indexOf(saveDataThisRound.confirmationID) === -1) {
      saveDataThisRound.localPayoff = individualPayoffs[thisCounter];
      thisCounter++;
      saveDataThisRound.groupSize = roomStatus[room]['n'];
      if(typeof saveDataThisRound != 'undefined' && room != 'finishedRoom') {
        let savingCsv = new Promise(function(resolve, reject){
          resolve(csvStream.write(saveDataThisRound)); 
        });
        //csvStream.write(saveDataThisRound); 
      }
      if(thisCounter+1 == roomStatus[room]['saveDataThisRound'].length){
        // Going to next round or end the task
        var now877 = new Date()
        ,   logtxt877 = '['+now877.getUTCFullYear()+'/'+(now877.getUTCMonth()+1)+'/'
        ;
        logtxt877 += now877.getUTCDate()+'/'+now877.getUTCHours()+':'+now877.getUTCMinutes()+':'+now877.getUTCSeconds()+']';
        logtxt877 += ' - Room '+ room + ' proceeds to the next round from ' + roomStatus[room]['round'] + '.';
        console.log(logtxt877);
        roomStatus[room]['round']++;
        //saveDataThisRound = [];
        if(roomStatus[room]['round'] <= numTrial) {
          savingCsv.then( io.to(room).emit('Proceed to next round', roomStatus[room]) );
          //io.to(room).emit('Proceed to next round', roomStatus[room]);
        } else {
          savingCsv.then( io.to(room).emit('End this session', roomStatus[room]) );
          //io.to(room).emit('End this session', roomStatus[room]);
        }
        // Going to next round or end the task -- END
      }
    }
  }
  // save data - end

  /*var now877 = new Date()
  ,   logtxt877 = '['+now877.getUTCFullYear()+'/'+(now877.getUTCMonth()+1)+'/'
  ;
  logtxt877 += now877.getUTCDate()+'/'+now877.getUTCHours()+':'+now877.getUTCMinutes()+':'+now877.getUTCSeconds()+']';
  logtxt877 += ' - Room '+ room + ' proceeds to the next round from ' + roomStatus[room]['round'] + '.';
  console.log(logtxt877);
  roomStatus[room]['round']++;
  //saveDataThisRound = [];
  if(roomStatus[room]['round'] <= numTrial) {
    io.to(room).emit('Proceed to next round', roomStatus[room]);
  } else {
    io.to(room).emit('End this session', roomStatus[room]);
  }*/
}

function payoffCalculator (choices, numOptions, frequencies, choiceOrder, condition) {
  let globalPayoffs = [];
  //let individualPayoffs = new Array(choices.length).fill(0);
  let individualPayoffs = new Array(maxNumPlayer).fill(-1);
  // We need to fix the payoff function 
  // For now, this is just an example
  for (let i = 0; i < numOptions; i++) {
    // calculating the global payoff
    //globalPayoffs.push(BoxMuller(payoffMeans[condition][i], sigmaGlobal));
    globalPayoffs.push(payoffMeans[condition][i]); // global payoff is drawn deterministically
  }
  // calculating payoffs for each individual/choice
  if (condition == 0) { // distributive condition 
    for (let i = 0; i < choices.length; i++) {
      if (frequencies[choices[i]] > 1) {
        individualPayoffs[i] = globalPayoffs[choices[i]]/frequencies[choices[i]] + BoxMuller(0,sigmaIndividual);
      } else if (frequencies[choices[i]] == 1) {
        //individualPayoffs[i] = globalPayoffs[choices[i]];
        individualPayoffs[i] = Math.round(globalPayoffs[choices[i]] + BoxMuller(0,sigmaIndividual));
      }
      if (individualPayoffs[i] != 0) individualPayoffs[i] = Math.round(100*individualPayoffs[i])/100;
      if (individualPayoffs[i] < 0) individualPayoffs[i] = 0;
    }
  } else {
    // if condition == 1 i.e., additive condition
    for (let i = 0; i < choices.length; i++) {
      individualPayoffs[i] = Math.round(BoxMuller(payoffMeans[condition][choices[i]], sigmaIndividual));
      if (individualPayoffs[i] != 0) individualPayoffs[i] = Math.round(100*individualPayoffs[i])/100;
      if (individualPayoffs[i] < 0) individualPayoffs[i] = 0;
    }
  }

  return individualPayoffs;
}

// function generating a Gaussien random variable
function BoxMuller(m, sigma) {
    let a = 1 - Math.random();
    let b = 1 - Math.random();
    let c = Math.sqrt(-2 * Math.log(a));
    if(0.5 - Math.random() > 0) {
        return c * Math.sin(Math.PI * 2 * b) * sigma + m;
    }else{
        return c * Math.cos(Math.PI * 2 * b) * sigma + m;
    }
};
