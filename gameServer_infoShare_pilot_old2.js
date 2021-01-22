// ====================================================================
// Multi-argent two-armed bandit task with active information sharing
// 
// The task proceeds as follows:
// 1. Choice phase at trial 1 with no social info 
// 2. Reward feedback (participants can only know their own earning)
// 3. Choice between "share (with cost)" and "non-share (without cost)"
// 4. Choice phase at t > 1, the payoff info they chose to share is shown
// 5. Repeat 2 to 5 until t reaches horizon
// 
// Author: Wataru Toyokawa
// Collaborating with Dr Helge Giese
// Requirements:
//    * Node.js
//    * node_modules: express, socket.io, fast-csv, php-express
//    * mongoDB and mongoose
// =================================================================== 

// Loading modules
const csv = require("fast-csv")
,	fs = require('fs')
,	path = require("path")
,	express = require('express')
,	app = express()
,	server = require('http').Server(app)
,	io = require('socket.io')(server, {
	// below are engine.IO options
	pingInterval: 20000, // how many ms before sending a new ping packet
	pingTimeout: 50000 // how many ms without a pong packet to consider the connection closed
	})
,	routes = require('./routes')
,	bodyParser = require("body-parser")
,	portnum = 8080
;

// multi-threading like thing in Node.js
const {isMainThread, Worker} = require('worker_threads');

const expFunctions = require('./models/expFunctions');
const consoleLogInterceptor = require('./models/console-log-interceptor');

// Experimental variables
const horizon = 20 // 100?
, sessionNo = 0 // 0 = debug;
, maxGroupSize = 4//8 // maximum 12
, minGroupSize = 2//4
, maxWaitingTime = 5 * 1000 //3*60*1000
, maxChoiceStageTime = 15*1000 //20*1000 // ms
, maxTimeTestScene = 4* 60*1000 // 4*60*1000

, info_share_cost = 30

//, sigmaGlobal = 6 //0.9105
//, sigmaIndividual = 6 //0.9105 // this gives 50% overlap between two normal distributions whose mean diff. is 1.1666..
, numOptions = 4 // 2 or 4
, exp_condition_list = ['binary_4ab', 'gaussian']
, prob_binary = 1.0//0.8
, isLeftRisky_list = [true, false]
, options = [1,2,3,4];
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

// experimental server
const currentSubject = 0
// , firstRoomName = myMonth+myDate+myHour+myMin+'_session_'+sessionNo
, firstRoomName = makeid(5) + '_session_' + sessionNo
,	roomStatus = {}
, sessionNameSpace = {}
, idAssignedThisSession = []
;
// experimental status
let total_N_now = 0
, finish_number
, countDownMainStage = {}
, countDownWaiting = {}
, firstTrialStartingTime // this is to compensate time spent in the task
;
countDownMainStage[firstRoomName] = new Object();
countDownWaiting[firstRoomName] = new Object();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routings
const gameRouter = require('./routes/game'); // loading game.ejs from which amazonID is transferred
// Assigning routers to Routing
app.use('/', gameRouter);

// error handling
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('A technical issue happened in the server...😫')
});

roomStatus['finishedRoom'] = {
    exp_condition: 'finishedRoom',
    riskDistributionId: getRandomIntInclusive(max = 12, min = 11), // max = 2, min = 0
    isLeftRisky: isLeftRisky_list[getRandomIntInclusive(max = 1, min = 0)],
    optionOrder: shuffle(options),
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
    doneId: createArray(horizon, 0),
    doneNo: createArray(horizon),
    socialFreq: createArray(horizon, numOptions),
    socialInfo: createArray(horizon, maxGroupSize),
    publicInfo: createArray(horizon, maxGroupSize),
    share_or_not: createArray(horizon, maxGroupSize),
    choiceOrder: createArray(horizon, maxGroupSize),
    saveDataThisRound: [],
    restTime:maxWaitingTime,
};
// The following is the first room
// Therefore, Object.keys(roomStatus).length = 2 right now
// A new room will be open once this room becomes full
roomStatus[firstRoomName] = {
    exp_condition: exp_condition_list[weightedRand2({0:prob_binary, 1:(1-prob_binary)})],
    riskDistributionId: getRandomIntInclusive(max = 12, min = 11), // max = 2, min = 0
    isLeftRisky: isLeftRisky_list[getRandomIntInclusive(max = 1, min = 0)],
    optionOrder: shuffle(options),
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
    doneId: createArray(horizon, 0),
    doneNo: createArray(horizon),
    socialFreq: createArray(horizon, numOptions),
    socialInfo:createArray(horizon, maxGroupSize),
    publicInfo: createArray(horizon, maxGroupSize),
    share_or_not: createArray(horizon, maxGroupSize),
    choiceOrder:createArray(horizon, maxGroupSize),
    saveDataThisRound: [],
    restTime:maxWaitingTime
};

/**
 * Letting the server listen the port
 */
const port = process.env.PORT || portnum;

server.listen(port, function() {
	let now = new Date(),
	  logtxt = '[' + now.getUTCFullYear() + '/' + (now.getUTCMonth() + 1) + '/';
	logtxt += now.getUTCDate() + '/' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + ']';
	logtxt += ' - Four-armed bandit task server listening on port ' + port + '; max_n_per_rooom = '+maxGroupSize;
	console.log(logtxt);
});

/**
 * Socket.IO Connection.
 */
io.on('connection', function (client) {
	// client's unique identifier 
	client.amazonID = client.request._query.amazonID;
	client.started = 0;
	// while (client.started == 0) {
	// 	io.to(client.session).emit('S_to_C_welcomeback', {sessionName: client.session, roomName: client.room});
	// }
	// Assigning "client.session" as an unique identifier of the participant
	// If the client already has the sessionName, 
	// put this client into a experimental room
	if (typeof client.request._query.sessionName == 'undefined') {
		// client.sessionName: this is an unique code for each participant
		client.session = client.id;
		client.join(client.session);
		sessionNameSpace[client.session] = 1;
		let now = new Date()
		,	logtxt = '[' + now.getUTCFullYear() + '/' + (now.getUTCMonth() + 1) + '/'
		;
		logtxt += now.getUTCDate() + '/' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + ']';
		logtxt += '- sessionName was just assigned to '+ client.session;
		console.log(logtxt);
	} else if (client.request._query.sessionName == 'already_finished'){
		// Some web browsers may try to reconnect with this game server when the browser
		// is forced to disconnect. The following script will assure 
		// that such reconnected subject will not go to a normal room, 
		// but to the 'finishedRoom' where nothing will ever never happen.
		client.session = client.request._query.sessionName;
		client.room = 'finishedRoom';
		client.join(client.session);
		client.join(client.room);
		console.log('sessionName was aldeary_finished');
	} else {
		// When client comes back from a short disconnection
		client.session = client.request._query.sessionName;
		client.room = client.request._query.roomName;
		client.join(client.session);
		client.join(client.room);
		io.to(client.session).emit('S_to_C_welcomeback', {sessionName: client.session, roomName: client.room});
		total_N_now++;
		sessionNameSpace[client.session] == 1;
		var now = new Date(),
			logdate = '['+now.getUTCFullYear()+'/'+(now.getUTCMonth()+1)+'/';
		logdate += now.getUTCDate()+'/'+now.getUTCHours()+':'+now.getUTCMinutes()+':'+now.getUTCSeconds()+']';
		console.log(logdate+' - '+ client.session +' ('+client.amazonID+') in room '+client.room+' reconnected to the server');
		if(typeof roomStatus[client.room] == 'undefined'){
			roomStatus[client.room] = {
				exp_condition: exp_condition_list[weightedRand2({0:prob_binary, 1:(1-prob_binary)})],
				riskDistributionId: getRandomIntInclusive(max = 12, min = 11), // max = 2, min = 0
				isLeftRisky: isLeftRisky_list[getRandomIntInclusive(max = 1, min = 0)],
				optionOrder: shuffle(options),
				indivOrGroup: -1,
				n: 0,
				membersID: [],
				subjectNumbers: [],
				disconnectedList: [],
				testPassed: 0,
				starting: 0,
				stage: 'resuming',
				maxChoiceStageTime: maxChoiceStageTime,
				choiceTime: [],
				round: 1,
				doneId: createArray(horizon, 0),
				doneNo: createArray(horizon),
				socialFreq: createArray(horizon, numOptions),
				socialInfo:createArray(horizon, maxGroupSize),
				publicInfo: createArray(horizon, maxGroupSize),
				share_or_not: createArray(horizon, maxGroupSize),
				choiceOrder:createArray(horizon, maxGroupSize),
				saveDataThisRound: [],
				restTime:maxWaitingTime
			};
			roomStatus[client.room]['n']++;
			roomStatus[client.room]['total_n']++;
			roomStatus[client.room]['membersID'].push(client.session);
			// Assigning an ID number within the room
			client.subNumCounter = 1;
			while (typeof client.subjectNumber == 'undefined') {
				if (roomStatus[client.room]['subjectNumbers'].indexOf(client.subNumCounter) == -1) {
					roomStatus[client.room]['subjectNumbers'].push(client.subNumCounter);
				  	client.subjectNumber = client.subNumCounter;
				} else {
				  	client.subNumCounter++;
				}
			}
		} else if (roomStatus[client.room]['starting'] > 0) {
			io.to(client.session).emit('you guys are individual condition');
		} else {
			roomStatus[client.room]['n']++;
			roomStatus[client.room]['total_n']++;
			roomStatus[client.room]['membersID'].push(client.session);
			// Assigning an ID number within the room
			client.subNumCounter = 1;
			while (typeof client.subjectNumber == 'undefined') {
				if (roomStatus[client.room]['subjectNumbers'].indexOf(client.subNumCounter) == -1) {
					roomStatus[client.room]['subjectNumbers'].push(client.subNumCounter);
				  	client.subjectNumber = client.subNumCounter;
				} else {
				  	client.subNumCounter++;
				}
			}
		}
	}

	// When client's game window is ready & latency was calculated
	client.on('core is ready', function(data) {
		if (client.started == 0) {
			client.started = 1
			// Time stamp
			let now_coreReady = new Date();
		    let logtext_coreReady = '['+now_coreReady.getUTCFullYear()+'/'+(now_coreReady.getUTCMonth()+1)+'/';
		    logtext_coreReady += now_coreReady.getUTCDate()+'/'+now_coreReady.getUTCHours()+':'+now_coreReady.getUTCMinutes()+':'+now_coreReady.getUTCSeconds()+']';
		    logtext_coreReady += ' - Client: ' + client.session +'('+client.amazonID+') responds with an average latency = '+ data.latency + ' ms.';
		    client.latency = data.latency; 
		    console.log(logtext_coreReady);
		    if(data.latency < data.maxLatencyForGroupCondition) {
		    	// Let the client join the newest room
			  	client.roomFindingCounter = 1; // default: roomStatus = {'finishedRoom', 'session_100'}
			  	while (typeof client.room == 'undefined') {
				    // if there are still rooms to check
				    if (client.roomFindingCounter <= Object.keys(roomStatus).length - 1) {
						if(roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['starting'] == 0 && roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['n'] < maxGroupSize && roomStatus[Object.keys(roomStatus)[client.roomFindingCounter]]['restTime'] > 999) {
							client.room = Object.keys(roomStatus)[client.roomFindingCounter];
							var now_joined1 = new Date();
							var logdate_joined1 = '['+now_joined1.getUTCFullYear()+'/'+(now_joined1.getUTCMonth()+1)+'/';
							logdate_joined1 += now_joined1.getUTCDate()+'/'+now_joined1.getUTCHours()+':'+now_joined1.getUTCMinutes()+':'+now_joined1.getUTCSeconds()+']';
							console.log(logdate_joined1+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+(1+roomStatus[client.room]['n'])+', total N: '+(1+total_N_now)+')');
						} else {
							client.roomFindingCounter++;
						}
				    } else {
				      // else if there is no more available room left
				      // Make a new room
				      // client.newRoomName = myMonth+myDate+myHour+myMin+'_session_' + (sessionNo + Object.keys(roomStatus).length - 1);
				      client.newRoomName = makeid(5) + '_session_' + (sessionNo + Object.keys(roomStatus).length - 1);
				      roomStatus[client.newRoomName] = 
				      {
				          exp_condition: exp_condition_list[weightedRand2({0:prob_binary, 1:(1-prob_binary)})],
				          riskDistributionId: getRandomIntInclusive(max = 12, min = 11), // max = 2, min = 0
				          isLeftRisky: isLeftRisky_list[getRandomIntInclusive(max = 1, min = 0)],
				          optionOrder: shuffle(options),
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
				          doneId: createArray(horizon, 0),
				          doneNo: createArray(horizon),
				          socialFreq: createArray(horizon, numOptions),
				          socialInfo:createArray(horizon, maxGroupSize),
				          publicInfo: createArray(horizon, maxGroupSize),
				          share_or_not: createArray(horizon, maxGroupSize),
				          choiceOrder:createArray(horizon, maxGroupSize),
				          saveDataThisRound: [],
				          restTime:maxWaitingTime
				      };
				      // Register the client to the new room
				      client.room = client.newRoomName;
				      let now_joined2 = new Date();
				      let logdate_joined2 = '['+now_joined2.getUTCFullYear()+'/'+(now_joined2.getUTCMonth()+1)+'/';
				      logdate_joined2 += now_joined2.getUTCDate()+'/'+now_joined2.getUTCHours()+':'+now_joined2.getUTCMinutes()+':'+now_joined2.getUTCSeconds()+']';
				      console.log(logdate_joined2+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+(1+roomStatus[client.room]['n'])+', total N: '+(1+total_N_now)+')');
				      // Make a clock object in the new room
				      countDownMainStage[client.room] = new Object();
				      countDownWaiting[client.room] = new Object();
				    }
			  	}
			  
				// Let the client join and know the registered room
				client.join(client.room);
				//io.to(client).emit('S_to_C_clientSessionName', {sessionName: client.session, roomName: client.room});

				total_N_now++;
				roomStatus[client.room]['n']++
				roomStatus[client.room]['membersID'].push(client.session);
				// Assigning an ID number within the room
				client.subNumCounter = 1;
				while (typeof client.subjectNumber == 'undefined') {
					if (roomStatus[client.room]['subjectNumbers'].indexOf(client.subNumCounter) == -1) {
						roomStatus[client.room]['subjectNumbers'].push(client.subNumCounter);
					  	client.subjectNumber = client.subNumCounter;
					} else {
					  	client.subNumCounter++;
					}
				}
				// Let the client know the specific task's parameters
				parameterEmitting(client);
		    } else {
		    	// else if latency is too large
		      	// then this subject is go to the individual condition
		      	client.newRoomName = myMonth+myDate+myHour+myMin+'_largeLatency_' + (sessionNo + Object.keys(roomStatus).length - 1);
				roomStatus[client.newRoomName] = 
		      	{
					exp_condition: exp_condition_list[weightedRand2({0:prob_binary, 1:(1-prob_binary)})],
					riskDistributionId: getRandomIntInclusive(max = 12, min = 11), // max = 2, min = 0
					isLeftRisky: isLeftRisky_list[getRandomIntInclusive(max = 1, min = 0)],
					optionOrder: shuffle(options),
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
					doneId: createArray(horizon, 0),
					doneNo: createArray(horizon),
					socialFreq: createArray(horizon, numOptions),
					socialInfo:createArray(horizon, maxGroupSize),
					publicInfo: createArray(horizon, maxGroupSize),
					share_or_not: createArray(horizon, maxGroupSize),
					choiceOrder:createArray(horizon, maxGroupSize),
					saveDataThisRound: [],
					restTime:1000
		      	};
				// Register the client to the new room
				client.room = client.newRoomName;
				var now_joined3 = new Date();
				var logdate_joined3 = '['+now_joined3.getUTCFullYear()+'/'+(now_joined3.getUTCMonth()+1)+'/';
				logdate_joined3 += now_joined3.getUTCDate()+'/'+now_joined3.getUTCHours()+':'+now_joined3.getUTCMinutes()+':'+now_joined3.getUTCSeconds()+']';
				console.log(logdate_joined3+' - '+ client.session +'('+client.amazonID+')'+' joined to '+ client.room +' (n: '+(1+roomStatus[client.room]['n'])+', total N: '+(1+total_N_now)+')');
				// Let the client join the registered room
				client.join(client.room);
				//io.to(client).emit('S_to_C_clientSessionName', {sessionName: client.session, roomName: client.room});
				client.subjectNumber = 1;
				total_N_now++;
				roomStatus[client.room]['n']++
				roomStatus[client.room]['membersID'].push(client.session);
				// Let the client know the specific task's parameters
				parameterEmitting(client);
		    }
		    if(client.room != 'finishedRoom') {
		    	// Let client wait until start flag turns 1
		      	// the clock for the waiting room starts when the first client pops in.
				if (roomStatus[client.room]['n']===1) {
					let now_1stIndiv = new Date(),
					    logdate_1stIndiv = '[' + now_1stIndiv.getUTCFullYear() + '/' + (now_1stIndiv.getUTCMonth() + 1) + '/';
					let doneNum;
					logdate_1stIndiv += now_1stIndiv.getUTCDate() + '/' + now_1stIndiv.getUTCHours() + ':' + now_1stIndiv.getUTCMinutes() + ':' + now_1stIndiv.getUTCSeconds() + ']';
					console.log(logdate_1stIndiv + ' - The first participant came in to the room ' + client.room + '.');
					startWaitingStageClock(client.room);
				}
				// inform rest time to the room
				io.to(client.room).emit('this is the remaining waiting time', {restTime:roomStatus[client.room]['restTime'], max:maxWaitingTime, maxGroupSize:maxGroupSize, horizon:horizon});
			}
		}
	});

	client.on('this is the previous restTime', function (data) {
		roomStatus[client.room]['restTime'] = data.restTime;
		if (roomStatus[client.room]['stage'] == 'resuming') {
			console.log(' - waiting clock was just resumed at ' + client.room + '.');
			startWaitingStageClock(client.room);
			roomStatus[client.room]['stage'] = 'firstWaiting';
		}
		// inform rest time to the room
		io.to(client.room).emit('this is the remaining waiting time', {restTime:roomStatus[client.room]['restTime'], max:maxWaitingTime, maxGroupSize:maxGroupSize, horizon:horizon});
	});

	// client.on('loading completed', function () {
	// 	console.log('loading completed received');
	// 	io.to(client.room).emit('this is the remaining waiting time', {restTime:roomStatus[client.room]['restTime'], max:maxWaitingTime, maxGroupSize:maxGroupSize, horizon:horizon});
	// });

	client.on('ok individual condition sounds good', function () {
		// finally checking weather group is still below the maxnumber
		if(roomStatus[client.room]['n'] < maxGroupSize) {
			// the status of the client's former room is updated
			roomStatus[client.room]['starting'] = 1;
			roomStatus[client.room]['n']--;
			// create a new individual condition's room
			roomStatus[myMonth+myDate+myHour+myMin+'_sessionIndiv_' + (sessionNo + Object.keys(roomStatus).length - 1)] = 
			{
				exp_condition: exp_condition_list[weightedRand2({0:prob_binary, 1:(1-prob_binary)})],
				riskDistributionId: getRandomIntInclusive(max = 12, min = 11), // max = 2, min = 0
				isLeftRisky: isLeftRisky_list[getRandomIntInclusive(max = 1, min = 0)],
				optionOrder: shuffle(options),
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
				doneId: createArray(horizon, 0),
				doneNo: createArray(horizon),
				socialFreq: createArray(horizon, numOptions),
				socialInfo:createArray(horizon, maxGroupSize),
				publicInfo: createArray(horizon, maxGroupSize),
				share_or_not: createArray(horizon, maxGroupSize),
				choiceOrder:createArray(horizon, maxGroupSize),
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
			// if groupSize has reached the enough number
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
		  	firstTrialStartingTime = now675;
		  	roomStatus[client.room]['stage'] = 'mainTask';
		} else {
		  	io.to(client.session).emit('wait for others finishing test');
		}
	});

	client.on('choice made', function (data) {
		let now = new Date()
        ,	logdate = '[' + now.getUTCFullYear() + '/' + (now.getUTCMonth() + 1) + '/'
    	, doneNum
    	, timeElapsed = now - firstTrialStartingTime
    	;
    	logdate += now.getUTCDate() + '/' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + ']';
    	console.log(logdate + ' - Client ' + client.session + ' (subNo = ' + client.subjectNumber + ') chose ' + data.choice + ' and got ' + data.payoff + ' at trial ' + data.thisTrial + '.');
    	// update roomStatus
    	if (typeof roomStatus[client.room] != 'undefined' & typeof client.subjectNumber != 'undefined') {
	    	roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1].push(client.subjectNumber);
			doneNum = roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1].length;
			roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1][doneNum-1] = data.choice;
			roomStatus[client.room]['publicInfo'][roomStatus[client.room]['round']-1][doneNum-1] = data.payoff;
			roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1][doneNum-1] = client.subjectNumber;
			if( roomStatus[client.room]['round'] < horizon ) {
				if (doneNum <= 1) {
					// summarise social information
				  	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][0] = 0;
				  	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][1] = 0;
				}
				if (data.choice === 'sure') {
					roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][0]++;
				} else if (data.choice === 'risky') {
					roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][1]++;
				}
			}
			//client.emit('your instant number is ', client.subjectNumber-1);
			io.to(client.room).emit('these are done subjects', {doneSubject:roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1]});

			// =========  save data to mongodb
			roomStatus[client.room]['saveDataThisRound'].push(
				{	date: now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) +'-' + now.getUTCDate()
				,	time: now.getUTCHours()+':'+now.getUTCMinutes()+':'+now.getUTCSeconds()
				,	exp_condition: roomStatus[client.room]['exp_condition']
				,	isLeftRisky: roomStatus[client.room]['isLeftRisky']
				,	indivOrGroup: roomStatus[client.room]['indivOrGroup']
				,	groupSize: roomStatus[client.room]['n']
				,	room: client.room
				,	confirmationID: client.session
				,	subjectNumber: client.subjectNumber
				,	amazonID: client.amazonID
				,	round: roomStatus[client.room]['round']
				,	choice: data.choice
				,	payoff: data.payoff
				,	totalEarning: data.totalEarning
				,	behaviouralType: 'choice'
				,	timeElapsed: timeElapsed
				,	latency: client.latency
				,	socialFreq: roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']-1]
				,	socialInfo: data.socialInfo
				,	publicInfo: data.publicInfo
				,	maxGroupSize: maxGroupSize
				,	riskDistributionId: data.riskDistributionId
				,	optionOrder: roomStatus[client.room]['optionOrder']
				}
				);
			// =========  save data to mongodb
		}
	});

	client.on('choice made 4ab', function (data) {
		let now = new Date()
        ,	logdate = '[' + now.getUTCFullYear() + '/' + (now.getUTCMonth() + 1) + '/'
    	, doneNum
    	, timeElapsed = now - firstTrialStartingTime
    	;
    	logdate += now.getUTCDate() + '/' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + ']';
    	console.log(logdate + ' - Client ' + client.session + ' (subNo = ' + client.subjectNumber + ') chose ' + data.choice + ' and got ' + data.payoff + ' at trial ' + data.thisTrial + '.');
    	// update roomStatus
    	// if (typeof roomStatus[client.room] != 'undefined') {
    	if (typeof roomStatus[client.room] != 'undefined' & typeof client.subjectNumber != 'undefined') {
	    	roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1].push(client.subjectNumber);
			doneNum = roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1].length;
			roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1][doneNum-1] = data.choice;
			roomStatus[client.room]['publicInfo'][roomStatus[client.room]['round']-1][doneNum-1] = data.payoff;
			roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1][doneNum-1] = client.subjectNumber;
			if( roomStatus[client.room]['round'] < horizon ) {
				if (doneNum <= 1) {
					// summarise social information
				  	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][0] = 0;
				  	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][1] = 0;
				  	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][2] = 0;
				  	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][3] = 0;
				}
				roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][data.chosenOptionFlag-1]++;
				console.log(roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1]);
				console.log(roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1]);
				console.log(roomStatus[client.room]['publicInfo'][roomStatus[client.room]['round']-1]);
				console.log(roomStatus[client.room]['choiceOrder'][roomStatus[client.room]['round']-1]);
				//console.log(roomStatus[client.room]);
				// if (data.choice === 'sure') {
				// 	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][0]++;
				// } else if (data.choice === 'risky') {
				// 	roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']][1]++;
				// }
			}
			//client.emit('your instant number is ', client.subjectNumber-1);
			io.to(client.room).emit('these are done subjects', {doneSubject:roomStatus[client.room]['doneId'][roomStatus[client.room]['round']-1]});

			// =========  save data to mongodb
			roomStatus[client.room]['saveDataThisRound'].push(
				{	date: now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) +'-' + now.getUTCDate()
				,	time: now.getUTCHours()+':'+now.getUTCMinutes()+':'+now.getUTCSeconds()
				,	exp_condition: roomStatus[client.room]['exp_condition']
				,	isLeftRisky: roomStatus[client.room]['isLeftRisky']
				,	indivOrGroup: roomStatus[client.room]['indivOrGroup']
				,	groupSize: roomStatus[client.room]['n']
				,	room: client.room
				,	confirmationID: client.session
				,	subjectNumber: client.subjectNumber
				,	amazonID: client.amazonID
				,	round: roomStatus[client.room]['round']
				,	chosenOptionFlag: data.chosenOptionFlag
				,	choice: data.choice
				,	payoff: data.payoff
				,	totalEarning: data.totalEarning
				,	behaviouralType: 'choice'
				,	timeElapsed: timeElapsed
				,	latency: client.latency
				,	socialFreq: roomStatus[client.room]['socialFreq'][roomStatus[client.room]['round']-1]
				,	socialInfo: data.socialInfo
				,	publicInfo: data.publicInfo
				,	maxGroupSize: maxGroupSize
				,	riskDistributionId: data.riskDistributionId
				,	optionOrder: roomStatus[client.room]['optionOrder']
				}
			);
			// =========  save data to mongodb
		}
	});

	client.on('Data from Indiv', function (data) {
		let now = new Date()
        ,	logdate = '[' + now.getUTCFullYear() + '/' + (now.getUTCMonth() + 1) + '/'
    	, doneNum
    	, timeElapsed = now - firstTrialStartingTime
    	;
    	logdate += now.getUTCDate() + '/' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds() + ']';
    	console.log(logdate + ' - Client ' + client.session + ' (subNo = ' + client.subjectNumber + ') ended the task.');

    	for(let i=0; i<data.length; i++) {
	  		const worker = createWorker('./worker_threads/savingBehaviouralData_indiv.js', data[i], client.session);
	  	}
	});

	client.on('result stage ended', function (data) {
		if(typeof client.subjectNumber != 'undefined') {
			roomStatus[client.room]['share_or_not'][roomStatus[client.room]['round']-1][client.subjectNumber-1] = data.share;
			console.log(roomStatus[client.room]['share_or_not'][roomStatus[client.room]['round']-1]);

			// Depending on the number of subject who has already done this round,
			// the response to the client changes 
			// (i.e., the next round only starts after all the subject at the moment have chosen their option)
			if(typeof roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] != 'undefined') {
				roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1]++;
			}else{
				roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] = 1;
			}

			// ========== logging ============
			let now_endFeedback = new Date()
	        ,	logdate_endFeedback = '[' + now_endFeedback.getUTCFullYear() + '/' + (now_endFeedback.getUTCMonth() + 1) + '/'
	    	;
	    	logdate_endFeedback += now_endFeedback.getUTCDate() + '/' + now_endFeedback.getUTCHours() + ':' + now_endFeedback.getUTCMinutes() + ':' + now_endFeedback.getUTCSeconds() + ']';
	    	logdate_endFeedback += ` - doneNo: ${roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1]}, current round is ${roomStatus[client.room]['round']} at ${client.room}`;
			console.log(logdate_endFeedback);
			// ========== logging ============

			if (roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] >= roomStatus[client.room]['n']) {
				// ========== logging ============
				let now_endResultStage = new Date()
		        ,	logdate_endResultStage = '[' + now_endResultStage.getUTCFullYear() + '/' + (now_endResultStage.getUTCMonth() + 1) + '/'
		    	;
	    		logdate_endResultStage += now_endResultStage.getUTCDate() + '/' + now_endResultStage.getUTCHours() + ':' + now_endResultStage.getUTCMinutes() + ':' + now_endResultStage.getUTCSeconds() + ']';
			  	console.log(logdate_endResultStage + ` - result stage ended at: ${client.room}`);
			  	// ========== logging ============

			  	// =========  save data to mongodb by loop
			  	if(roomStatus[client.room]['indivOrGroup'] > -1) { //if(roomStatus[client.room]['indivOrGroup'] != 0) {
				  	for(let i=0; i<roomStatus[client.room]['saveDataThisRound'].length; i++) {
				  		const worker = createWorker('./worker_threads/savingBehaviouralData.js', 
							roomStatus[client.room]['saveDataThisRound'][i], roomStatus[client.room]['membersID'][i]);
				  	}
				 }
			  	// =========  save data to mongodb by loop END
			  	// =========  save data to mongodb
			  	/*const worker = createWorker('./worker_threads/savingBehaviouralData.org.js', 
					roomStatus[client.room]['saveDataThisRound'], client.room);
			  	*/
			  	// =========  save data to mongodb END
			  	roomStatus[client.room]['saveDataThisRound'] = [];
			  	proceedRound(client.room);
			}
		}
	});

	client.on("disconnect", function () {
		if(typeof client.room != 'undefined') {
			let thisRoomName = client.room;

			// ======= remove this client from the room =====
			client.leave(client.room);
			if (thisRoomName != 'finishedRoom') {
				total_N_now--;
			}

			roomStatus[thisRoomName]['disconnectedList'].push(client.session);
			let idPosition;
			//let subjectNumberPosition;
			if(roomStatus[thisRoomName]['membersID'].indexOf(client.session) > -1) {
				idPosition = roomStatus[thisRoomName]['membersID'].indexOf(client.session);
			}
			roomStatus[thisRoomName]['membersID'].splice(idPosition, 1);
			roomStatus[thisRoomName]['subjectNumbers'].splice(idPosition, 1);
			sessionNameSpace[client.session] = 0;
			if(roomStatus[thisRoomName]['indivOrGroup'] != 0) {
				roomStatus[thisRoomName]['n']--;
				// Note: 
				// if this is an individual session's room, then I want 'n' to remain 1
				// so than no one will never enter this room again. 
				// On the other hand, if this is a group session's room, reducing 'n' may open up 
				// a room for a new-comer if this room is still at the first waiting screen
				if (roomStatus[client.room]['doneNo'][roomStatus[client.room]['round']-1] >= roomStatus[client.room]['n']) {
				  	console.log(`result stage ended at: ${client.room}`);

				  	// =========  save data to mongodb by loop
				  	for(let i=0; i<roomStatus[client.room]['saveDataThisRound'].length; i++) {
				  		const worker = createWorker('./worker_threads/savingBehaviouralData.js', 
							roomStatus[client.room]['saveDataThisRound'][i], roomStatus[client.room]['membersID'][i]);
				  	}
				  	// =========  save data to mongodb by loop END
				  	// =========  save data to mongodb
				  	/*const worker = createWorker('./worker_threads/savingBehaviouralData.org.js', 
						roomStatus[client.room]['saveDataThisRound'], client.room);
				  	*/
				  	// =========  save data to mongodb END
				  	roomStatus[client.room]['saveDataThisRound'] = [];
				  	proceedRound(client.room);
				}
			}
			// ======= remove this client from the room =====

			// This section checks if all clients in the room finishes the comprehension test.
			// If so, the room should move on to the main task.
			if (roomStatus[client.room]['n']>0 && roomStatus[client.room]['stage'] == 'secondWaitingRoom') {
				if (roomStatus[client.room]['testPassed'] >= roomStatus[client.room]['n']) {
					let now612 = new Date(),
					logdate675 = '['+now612.getUTCFullYear()+'/'+(now612.getUTCMonth()+1)+'/';
					logdate675 += now612.getUTCDate()+'/'+now612.getUTCHours()+':'+now612.getUTCMinutes()+':'+now612.getUTCSeconds()+']';
					console.log(logdate675 + ' - ' + client.room + ' is ready to start the game.');
					io.to(client.room).emit('all passed the test', {n:roomStatus[client.room]['n'], testPassed:roomStatus[client.room]['testPassed'], exp_condition:roomStatus[client.room]['exp_condition']});
					firstTrialStartingTime = now612;
					roomStatus[client.room]['stage'] = 'mainTask';
				}
			}

			let doneOrNot;
			// This doneOrNot checks whether the disconnected client has not 
			// yet made a choice in the main stage. If doneOrNot > -1, it means
			// this client has already done the choice.
			if(typeof roomStatus[thisRoomName]['doneId'][roomStatus[thisRoomName]['round']-1] != 'undefined') {
				doneOrNot = roomStatus[thisRoomName]['doneId'][roomStatus[thisRoomName]['round']-1].indexOf(client.subjectNumber);
			} else {
				doneOrNot = -1;
			}
			if(doneOrNot > -1){
				roomStatus[thisRoomName]['doneId'][roomStatus[thisRoomName]['round']-1].splice(doneOrNot, 1);
				roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].splice(doneOrNot, 1);
				roomStatus[client.room]['socialInfo'][roomStatus[client.room]['round']-1].push(-1);
			}
			io.to(thisRoomName).emit('client disconnected', {roomStatus:roomStatus[thisRoomName], disconnectedClient:client.id});


			/* // Payoff should be calculated immediately if the disconnected client was the last one 
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
			*/

			// When this disconnection made the groupSize == 0, 
			// waiting room's clock should be reset.
			// If I don't do this, the next new subject would not have time to wait other people.
			if(roomStatus[thisRoomName]['n'] <= 0){
				stopAndResetClock(thisRoomName);
			}

			var now744 = new Date(),
			logdate744 = '['+now744.getUTCFullYear()+'/'+(now744.getUTCMonth()+1)+'/';
			logdate744 += now744.getUTCDate()+'/'+now744.getUTCHours()+':'+now744.getUTCMinutes()+':'+now744.getUTCSeconds()+']';
			console.log(logdate744+' - client disconnected: '+ client.session+' ('+client.amazonID+')'+' (room N: '+roomStatus[thisRoomName]['n']+', total N: '+total_N_now+') - handshakeID:'+ client.session);
		}
	});
});

// ==========================================
// Functions
// ==========================================
function getRandomIntInclusive(max, min = 0) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //Both the maximum and minimum are inclusive 
}

// shuffling function
function shuffle (array) {
	let array2 = array;
	for (let i = array2.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array2[i], array2[j]] = [array2[j], array2[i]];
	}
	return array2;
}
// const shuffle = ([...array]) => {
//   for (let i = array.length - 1; i >= 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// }

function weightedRand2 (spec) {
  var i, sum=0, r=Math.random();
  for (i in spec) {
    sum += spec[i];
    if (r <= sum) return i;
  }
}
//weightedRand2({0:prob_binary, 1:(1-prob_binary)});

function rand(max, min = 0) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function proceedRound (room) {
	roomStatus[room]['round']++;
	if(roomStatus[room]['round'] <= horizon) {
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
	if(roomStatus[room]['n'] < minGroupSize && roomStatus[room]['indivOrGroup'] != 0) {
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
	if (roomStatus[room]['n'] < minGroupSize) {
		roomStatus[room]['indivOrGroup'] = 0; // individual condition
	} else {
		roomStatus[room]['indivOrGroup'] = 1; // group condition
	}
	io.to(room).emit('this room gets started', {room:room, n:roomStatus[room]['n'], exp_condition:roomStatus[room]['exp_condition'], isLeftRisky:roomStatus[room]['isLeftRisky'], indivOrGroup:roomStatus[room]['indivOrGroup'], maxChoiceStageTime:maxChoiceStageTime });
	var now814 = new Date(),
	  	logdate814 = '['+now814.getUTCFullYear()+'/'+(now814.getUTCMonth()+1)+'/';
	  	logdate814 += now814.getUTCDate()+'/'+now814.getUTCHours()+':'+now814.getUTCMinutes()+':'+now814.getUTCSeconds()+']';
	console.log(logdate814+' - session started in '+room);
}

function parameterEmitting (client) {
	io.to(client.session).emit('this_is_your_parameters', { id: client.session, room: client.room, maxChoiceStageTime: maxChoiceStageTime, maxTimeTestScene: maxTimeTestScene, exp_condition:roomStatus[client.room]['exp_condition'], riskDistributionId:roomStatus[client.room]['riskDistributionId'], isLeftRisky:roomStatus[client.room]['isLeftRisky'], subjectNumber: client.subjectNumber, indivOrGroup: roomStatus[client.room]['indivOrGroup'], numOptions: numOptions, optionOrder: roomStatus[client.room]['optionOrder'] });
	let nowEmitting = new Date(),
	  	logdateEmitting = '['+nowEmitting.getUTCFullYear()+'/'+(nowEmitting.getUTCMonth()+1)+'/';
	  	logdateEmitting += nowEmitting.getUTCDate()+'/'+nowEmitting.getUTCHours()+':'+nowEmitting.getUTCMinutes()+':'+nowEmitting.getUTCSeconds()+']';
	console.log(logdateEmitting+' - parameters were sent to ' + client.session + ' in room ' + client.room);
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

// a function to create an n-dimensional array
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

// worker_thread
function createWorker(path, wd, id) {
	const w = new Worker(path, {workerData: wd});

	w.on('error', (err) => {
		console.error(`Worker ${w.workerData} error`)
		console.error(err);
	});

	w.on('exit', (exitCode) => {
		let exitTime = new Date(),
			exitlogtxt = '[' + exitTime.getUTCFullYear() + '/' + (exitTime.getUTCMonth() + 1) + '/';
			exitlogtxt += exitTime.getUTCDate() + '/' + exitTime.getUTCHours() + ':' + exitTime.getUTCMinutes() + ':' + exitTime.getUTCSeconds() + ']';
			exitlogtxt += ` - exitted! : ${id}`;
		console.log(exitlogtxt);
	});

	w.on('message', (msg) => {
		let messageTime = new Date(),
			messagelogtxt = '[' + messageTime.getUTCFullYear() + '/' + (messageTime.getUTCMonth() + 1) + '/';
			messagelogtxt += messageTime.getUTCDate() + '/' + messageTime.getUTCHours() + ':' + messageTime.getUTCMinutes() + ':' + messageTime.getUTCSeconds() + ']';
			messagelogtxt += ` - [Main] Message got from worker ${msg}`;
		// workerスレッドから送信されたメッセージ
		console.log(messagelogtxt);
	});
	return w;
}

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
