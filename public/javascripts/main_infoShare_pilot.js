/* ====================================================================
Multi-argent two-armed bandit task with active information sharing
Author: Wataru Toyokawa (wataru.toyokawa@uni-konstanz.de)
21 January 2021

The task proceeds as follows:
1. Choice phase at trial 1 with no social info
2. Reward feedback (participants can only know their own earning)
3. Choice between "share (with cost)" and "non-share (without cost)"
4. Choice phase at t > 1, the payoff info they chose to share is shown
5. Repeat 2 to 5 until t reaches horizon

Author: Wataru Toyokawa
Collaborating with Dr Helge Giese
Requirements:
   * Node.js
   * node_modules: express, socket.io, fast-csv, php-express
   * mongoDB and mongoose
=================================================================== */
'use strict';

// const htmlServer = 'http://192.168.33.10:'; // vagrant server
const htmlServer = 'http://63-250-60-135.cloud-xip.io:'; //ipaddress 63.250.60.135
//const portnum = 8080; //8181
const portnumQuestionnaire = 8000;
const exceptions = ['INHOUSETEST3', 'wataruDebug', 'wataruDebug'];

let numOptions
,	info_share_cost = 0
,	info_share_cost_total = 0
;


// Gaussian distribution (E[risky] = 1.61)
/*let mean_sure = 1.5
,	sd_sure = 0.05
,	mean_risky = 1.60
,	sd_risky = 1
;*/
let mean_sure
,	sd_sure = 0.1
,	mean_risky
,	sd_risky = 1
;

// Binary distribution (E[risky] = 1.61)
//let riskDistributionId = rand(3, 0); // PILOT TEST
let pRiskyRare
,	pSure
,	pPoor
,	payoff_sureL
,	payoff_sureH
,	payoff_sureL1
,	payoff_sureH1
,	payoff_sureL2
,	payoff_sureH2
,	payoff_sureL3
,	payoff_sureH3
,	payoff_riskyCommon
,	payoff_riskyRare
,	smallNoise = sd_sure
,	probabilityList = {}
,	payoffList = {}
,	optionsKeyList = []
;

const backgroundcolour_feedback = '#ffd6c9'; //#d9d9d9 = grey #ffffff = white



// function
let isNotNegative = function (element) {
	return element >= 0;
}

/**===============================================
For EmPra experiment, the latency check is not so important because there is no need for
'real time' synchronisation between clients. Therefore, latency being less than 1.5 sec
would be sufficient. However, in the future experiment where participants' real-time sync
is important, this value may need to be much smaller.

University eduroam performs about 200 ~ 250 ms latency on average.
==================================================*/
const maxLatencyForGroupCondition = 1500; //1500;
const feedbackTime = 1.5;

let isEnvironmentReady = false
,	isPreloadDone = false
,	isWaitingRoomStarted = false
,	isWaiting = false
,	wasAnyoneDisconnected = false
,   myChoices = []
,   myEarnings = []
,   payoff = 0
,	didShare = 0
,	payoffTransformed
,   totalEarning = 0
,	cent_per_point = 1/100 // 1 cent per 100 points
,	browserHiddenPermittedTime = 10 * 1000
,   sessionName
,   roomName
,   subjectNumber
,	indivOrGroup
,	exp_condition
,	riskDistributionId
,	isLeftRisky
,	optionOrder
,	taskOrder
,	gameRound = 0 // 0,1,2,3
,   connectionCounter
,	incorrectCount = 0
,	maxChoiceStageTime
,	maxConfirmationWhenMissed = 7 * 1000
,   currentTrial = 1
,   currentStage
,	n_in_waitingRoom2 = 0// the current number of subjects who finished Intro
,	currentGroupSize = 0 // the current number of subject in the room
,   choiceOrder
,   currentChoiceFlag = 0
,   waitingBonus = 0
,   confirmationID = 'browser-reloaded'
,   maxGroupSize
,	maxWaitingTime
,	answers = [-1,-1,-1,-1,-1]
,   horizon = 0
,   myRoom
,   startTime
,	doneSubject
,   pointCentConversionRate = 0
,   completed = 0
,   waitingRoomFinishedFlag = 0
,	understandingCheckStarted = 0
,   averageLatency = [0,0]
,   submittedLatency = -1
,	mySocialInfoList = {option1:0, option2:0, option3:0, option4:0}
,	mySocialInfo
,	myPublicInfo
,	myLastChoice
,	myLastChoiceFlag
,	share_or_not = []
// ,	payoff_info = []
// ,	shared_position = []
;

const myData = [];

const alphabetList = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const iconColourList = ['blue','red','yellow'];
const instructionTextBackgroundColor = "rgba(255,255,255, 0.5)";


/**===============================================
	Phaser Game Script
==================================================*/

window.onload = function() {
	// basic experimental values goes to POST values (in game.ejs)
	$("#amazonID").val(amazonID);
    $("#completed").val(completed);
    $("#currentTrial").val(currentTrial);
    $("#gameRound").val(gameRound);

    // connecting to the experimental server
    const socket = io.connect(htmlServer+portnum, { query: 'amazonID='+amazonID });

    //======== monitoring reload activity ==========
    if (window.performance & amazonID != 'INHOUSETEST') {
        if (performance.navigation.type === 1) {
            // Redirecting to the questionnaire
            socket.io.opts.query = 'sessionName=already_finished';
            socket.disconnect();
            window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round((totalPayoff_perIndiv*cent_per_point))+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+0+'&latency='+submittedLatency;
        }
    }
    //======== end: monitoring reload activity =====

    //======== monitoring Tab activity ==========
    let hiddenTimer
    ,   hidden_elapsedTime = 0
    ;
        // Judging the window state at the moment of this window read
    if(window.document.visibilityState == 'hidden'){
        hiddenTimer = setInterval(function(){
            hidden_elapsedTime += 500;
            if (hidden_elapsedTime > browserHiddenPermittedTime) {
                socket.io.opts.query = 'sessionName=already_finished';
                socket.disconnect();
            }
        }, 500);
    }
        // When visibility status is changed, judge the status again
    window.document.addEventListener("visibilitychange", function(e){
        ////console.log('this window got invisible.');
        if (window.document.visibilityState == 'hidden') {
            hidden_elapsedTime += 1;
            hiddenTimer = setInterval(function(){
                hidden_elapsedTime += 500;
                if (hidden_elapsedTime > browserHiddenPermittedTime & amazonID != 'INHOUSETEST') {
                    socket.io.opts.query = 'sessionName=already_finished';
                    socket.disconnect();
                }
            }, 500);
        } else {
            clearTimeout(hiddenTimer);
            if (hidden_elapsedTime > browserHiddenPermittedTime & amazonID != 'INHOUSETEST') {
                setTimeout(function(){
                    // Force client to move to the questionnaire
                    socket.io.opts.query = 'sessionName=already_finished';
                    socket.disconnect();
                    completed = 'browserHidden';
                    window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round((totalPayoff_perIndiv*cent_per_point))+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency;
                }, 200); // wait until waitingBonus is fully calculated
            }
            hidden_elapsedTime = 0;
        }
    });
    //======== end: monitoring tab activity =====

    // experimental variables
    let configWidth = 800
    , configHeight = 600
    , optionWidth = 150
    , optionHeight = 150
    // ---- 2-armed bandit
    , option1_positionX = 225
    , space_between_boxes = 350 //190 //space_between_boxes
    // ------------------

    // --- 4-armed bandit
    // , option1_positionX = 122.5
    // , space_between_boxes = 185 //190 //space_between_boxes
    // ------------------


    // , option2_positionX = 250
    // , option3_positionX = 450
    // , option4_positionX = 650
    , missPositionX = configWidth/2
    //, leftSlotPositionX
    //, rightSlotPositionX
    //, missPositionX
    , surePosition = 0
    , riskyPosition = 1
    , noteColor = '#ff5a00' // red-ish
    , nomalTextColor = '#000000' // black
    , player
    , stars_option1 = []
    , stars_option2 = []
    , stars_option3 = []
    , stars_option4 = []
	, stars_sure = []
	, stars_risky = []
	, bombs
	, platforms
	, cursors
	, score = 0

	, groupTotalScore = 0
	, totalPayoff_perIndiv = 0
	// , totalPayoff_perIndiv_all = []
	, totalPayoff_perIndiv_perGame = new Array(4).fill(0) // = [0,0,0,0]

	, gameOver = false
	, choiceFlag
	, waitingBox
	, waitingBar
	, waitingCountdown
	, countDownChoiceStage = new Object()
	, bonusBar
	, bonusBox
	, countdownText
	, bonusText
	, restTime

	, trialText
	, scoreText
	, timeText
	, payoffText
	, groupTotalScoreText
	, costPaidText
	, costPaidText_2

	, waitOthersText
	, objects_feedbackStage
	, feedbackTextPosition
	//, currentInstructionPicture = []
	, instructionPosition = 0
	, trialText_tutorial
	, groupSizeText_tutorial
	, timeText_tutorial
	, tutorialPosition // tracking the tutorial text's number
	, tutorialTrial = 1 // tracking the tutorial's trial (1, 2, or 3)
	, score_tutorial = 0
	, choice_tutorial = 0
	, isInstructionRevisit = false
	, emitting_time = 0
	;

	// the info sharing cost for the first trial
	info_share_cost = rand(100, 0); // rnorm()

	// SceneWaitingRoom0
	class SceneWaitingRoom0 extends Phaser.Scene {

		// make it public so that other scene can access to it (?)
    	//public sprite: Phaser.GameObjects.Sprite;

		constructor (){
		    super({ key: 'SceneWaitingRoom0', active: true });
		}

		preload(){
			// progress bar
			let progressBox = this.add.graphics();
			let progressBar = this.add.graphics();
			progressBox.fillStyle(0x222222, 0.8);
			progressBox.fillRect(240, 270, 320, 50);
			// loading text
			let width = this.cameras.main.width;
			let height = this.cameras.main.height;
			let loadingText = this.make.text({
			    x: width / 2,
			    y: height / 2 - 50,
			    text: 'Loading...',
			    style: {
			        font: '20px',
			        fill: nomalTextColor
			    }
			});
			loadingText.setOrigin(0.5, 0.5);
			// percent text
			let percentText = this.make.text({
			    x: width / 2,
			    y: height / 2 - 5,
			    text: '0%',
			    style: {
			        font: '18px monospace',
			        fill: '#ffffff'
			    }
			});
			percentText.setOrigin(0.5, 0.5);
			// loading stuff
			this.load.image('star', 'assets/star.png');
			//this.load.image('trap', 'assets/wana_hakowana.png');
		    //this.load.image('lancer', 'assets/war_trident.png');
		    this.load.image('button', 'assets/button.001.png');
		    this.load.image('button_active', 'assets/button.active.png');
			this.load.image('bonusBarFrame', 'assets/bar.png');
			this.load.image('bonusBar', 'assets/scaleOrange.png');
			this.load.image('perfectImg', 'assets/PERFECT.png');
			this.load.image('startImg', 'assets/start.png');
			this.load.image('energycontainer', 'assets/energycontainer.png');
			this.load.image('energybar', 'assets/energybar.png');
			// this.load.image('machine1_normal', 'assets/machine_normal_1.png');
			// this.load.image('machine2_normal', 'assets/machine_normal_2.png');
			// this.load.image('machine3_normal', 'assets/machine_normal_3.png');
			// this.load.image('machine4_normal', 'assets/machine_normal_4.png');
			// this.load.image('machine1_active', 'assets/machine_active_1.png');
			// this.load.image('machine2_active', 'assets/machine_active_2.png');
			// this.load.image('machine3_active', 'assets/machine_active_3.png');
			// this.load.image('machine4_active', 'assets/machine_active_4.png');
			this.load.image('machine1_normal', 'assets/slot1_normal.png');
			this.load.image('machine2_normal', 'assets/slot2_normal.png');
			this.load.image('machine3_normal', 'assets/slot3_normal.png');
			this.load.image('machine4_normal', 'assets/slot4_normal.png');
			this.load.image('machine5_normal', 'assets/slot5_normal.png');
			this.load.image('machine6_normal', 'assets/slot6_normal.png');
			this.load.image('machine7_normal', 'assets/slot7_normal.png');
			this.load.image('machine8_normal', 'assets/slot8_normal.png');
			this.load.image('machine1_active', 'assets/slot1_active.png');
			this.load.image('machine2_active', 'assets/slot2_active.png');
			this.load.image('machine3_active', 'assets/slot3_active.png');
			this.load.image('machine4_active', 'assets/slot4_active.png');
			this.load.image('machine5_active', 'assets/slot5_active.png');
			this.load.image('machine6_active', 'assets/slot6_active.png');
			this.load.image('machine7_active', 'assets/slot7_active.png');
			this.load.image('machine8_active', 'assets/slot8_active.png');
			this.load.image('instructionPictures_indiv_1', 'assets/instructionPictures_indiv.001.png');
			this.load.image('instructionPictures_indiv_2', 'assets/instructionPictures_indiv.002.png');
			this.load.image('instructionPictures_indiv_3', 'assets/instructionPictures_indiv.003.png');
			this.load.image('instructionPictures_indiv_4', 'assets/instructionPictures_indiv.004.png');
			this.load.image('instructionPictures_indiv_5', 'assets/instructionPictures_indiv.005.png');
			this.load.image('instructionPictures_indiv_6', 'assets/instructionPictures_indiv.006.png');

			this.load.image('instructionPictures_group_1', 'assets/instructionPictures_group.001.png');
			this.load.image('instructionPictures_group_2', 'assets/instructionPictures_group.002.png');
			this.load.image('instructionPictures_group_3', 'assets/instructionPictures_group.003.png');
			this.load.image('instructionPictures_group_4', 'assets/instructionPictures_group.004.png');
			this.load.image('instructionPictures_group_5', 'assets/instructionPictures_group.005.png');
			this.load.image('instructionPictures_group_6', 'assets/instructionPictures_group.006.png');
			this.load.image('instructionPictures_group_7', 'assets/instructionPictures_group.007.png');
			this.load.image('instructionPictures_group_8', 'assets/instructionPictures_group.008.png');
			this.load.image('instructionPictures_group_9', 'assets/instructionPictures_group.009.png');
			this.load.image('instructionPictures_group_10', 'assets/instructionPictures_group.010.png');
			this.load.image('instructionPictures_group_11', 'assets/instructionPictures_group.011.png');
			this.load.image('instructionPictures_group_12', 'assets/instructionPictures_group.012.png');
			this.load.image('instructionPictures_group_13', 'assets/instructionPictures_group.013.png');
			this.load.image('net_contribution', 'assets/net_contribution.png');
			this.load.image('pointing_finger', 'assets/pointing_finger.png');

			// this.load.image('instructionPictures_4ab_1', 'assets/instructionPictures_4ab.001.png');
			// this.load.image('instructionPictures_4ab_2', 'assets/instructionPictures_4ab.002.png');
			// this.load.image('instructionPictures_4ab_3', 'assets/instructionPictures_4ab.003.png');
			// this.load.image('instructionPictures_4ab_4', 'assets/instructionPictures_4ab.004.png');
			// this.load.image('instructionPictures_4ab_5', 'assets/instructionPictures_4ab.005.png');
			// this.load.image('instructionPictures_4ab_6', 'assets/instructionPictures_4ab.006.png');
			// this.load.image('instructionPictures_4ab_7', 'assets/instructionPictures_4ab.007.png');
			// this.load.image('instructionPictures_4ab_8', 'assets/instructionPictures_4ab.008.png');
			// this.load.image('instructionPictures_4ab_9', 'assets/instructionPictures_4ab.009.png');
			this.load.image('blackbox', 'assets/blackbox.png');
			// progress bar functions
			this.load.on('progress', function (value) {
			    ////console.log(value);
			    progressBar.clear();
			    progressBar.fillStyle(0xffffff, 1);
			    progressBar.fillRect(250, 280, 300 * value, 30);
			    percentText.setText(parseInt(value * 100) + '%');
			});
			this.load.on('fileprogress', function (file) {
			    //console.log(file.src);
			});
			this.load.on('complete', function () {
			    console.log('preloading is completed!: core is ready');
			    isPreloadDone = true;
			    progressBar.destroy();
				progressBox.destroy();
				loadingText.destroy();
				percentText.destroy();
				sending_core_is_ready(isPreloadDone)
				// if(!isWaitingRoomStarted) {
				// 	socket.emit('loading completed');
				// }
				// execute if preload completed later than on.connection('this is your parameter')
				//if(isEnvironmentReady) game.scene.start('SceneWaitingRoom');
				//======== letting the server know latency with this client ==========
			    // after calculating the first average latency
			    // the client should be put into the individual condition
			    // sending_core_is_ready(isPreloadDone);
			    //socket.emit('core is ready', {latency: 0, maxLatencyForGroupCondition: maxLatencyForGroupCondition});

			    // setTimeout(function(){
			    //     submittedLatency = sum(averageLatency)/averageLatency.length;
			    //     socket.emit('core is ready', {latency: submittedLatency, maxLatencyForGroupCondition: maxLatencyForGroupCondition});
			    //     $("#latency").val(submittedLatency);
			    // }, averageLatency.length*1000+500);

			    //======== end: letting the server know latency with this client ==========
			});
		}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'
			// text styles
			const textStyle =
				{ fontSize: '24px', fill: nomalTextColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true } };
			const noteStyle =
				{ fontSize: '24px', fill: noteColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true }, fontstyle: 'bold' };
			//  Texts
		    let title = this.add.text(configWidth/2, 18, waitingRoomText0[0], { fontSize: '36px', fill: '#000', fontstyle: 'bold' });
		    let note1 = this.add.text(configWidth/2, 70, waitingRoomText0[1], textStyle);
		    let note2 = this.add.text(configWidth/2, 70+30*2, waitingRoomText0[2], textStyle);
		    let note3 = this.add.text(configWidth/2, 70+30*4, waitingRoomText0[3], noteStyle);
		    title.setOrigin(0.5, 0.5);
		    note1.setOrigin(0.5, 0.5);
		    note2.setOrigin(0.5, 0.5);
		    note3.setOrigin(0.5, 0.5);
		}

		update(){
			emitting_time += 1/(3*game.loop.actualFps) // incrementing every 3 seconds
			if (!isWaitingRoomStarted & emitting_time % 3 == 0) {
				sending_core_is_ready(isPreloadDone)
			}
		}
	};

	// SceneWaitingRoom
	class SceneWaitingRoom extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneWaitingRoom', active: false });
		}

		preload(){
		}

		create(){
			isWaitingRoomStarted = true;
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'
			// text styles
			const textStyle =
				{ fontSize: '24px', fill: nomalTextColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true } };
			const noteStyle =
				{ fontSize: '24px', fill: noteColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true }, fontstyle: 'bold' };
			//  Texts
		    let title = this.add.text(configWidth/2, 18, waitingRoomText[0], { fontSize: '36px', fill: '#000', fontstyle: 'bold' });
		    let note1 = this.add.text(configWidth/2, 70, waitingRoomText[1], textStyle);
		    let note2 = this.add.text(configWidth/2, 70+30*2, waitingRoomText[2], textStyle);
		    let note3 = this.add.text(configWidth/2, 70+30*4, waitingRoomText[3], noteStyle);
		    title.setOrigin(0.5, 0.5);
		    note1.setOrigin(0.5, 0.5);
		    note2.setOrigin(0.5, 0.5);
		    note3.setOrigin(0.5, 0.5);

            // waitingBonusBar
            this.restTime = restTime;
            waitingCountdown = this.time.delayedCall(restTime, waitingBarCompleted, [], this);
			waitingBox = this.add.graphics();
			waitingBar = this.add.graphics();
			waitingBox.fillStyle(0x000000, 0.7); // color, alpha
			waitingBox.fillRect(240, 270, 320, 50);
			bonusBox = this.add.graphics();
			bonusBar = this.add.graphics();
			bonusBox.fillStyle(0x000000, 0.7); // color, alpha
			bonusBox.fillRect(240, 380, 320, 50);
			// countdown texts
			countdownText = this.add.text(configWidth/2, 340, 'The study starts in ?? sec.' , textStyle);
			countdownText.setOrigin(0.5, 0.5);
			bonusText = this.add.text(configWidth/2, 450, 'Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cents.' , textStyle);
			bonusText.setOrigin(0.5, 0.5);

		}

		update(){
			waitingBar.clear();
			waitingBar.fillStyle(0x00a5ff, 1);
		    waitingBar.fillRect(250, 280, 300 * waitingCountdown.getProgress(), 30);
			countdownText.setText('The study starts in ' + ( Math.floor(0.9+(this.restTime/1000)*(1-waitingCountdown.getProgress())) ).toString().substr(0, 3) + ' sec.');
			////console.log( 0.9+(restTime/1000)*(1-waitingCountdown.getProgress()) );
			////console.log(waitingCountdown.getProgress());
			waitingBonus += 1.4/(6*game.loop.actualFps)
			bonusBar.clear();
			bonusBar.fillStyle(0xff5a00, 1);
			if(waitingBonus*2<300) {
		    	bonusBar.fillRect(250, 390, waitingBonus*2, 30); //1.4 cents per 6 seconds = 8.4 USD per hour
			}else{
				bonusBar.fillRect(250, 390, 300, 30);
			}
			bonusText.setText('Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cents.');
		}
	};

	// SceneWaitingRoom2
	class SceneWaitingRoom2 extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneWaitingRoom2', active: false });
		}

		preload(){
		}

		init (data) {
			n_in_waitingRoom2 = data.n_test_passed;
		}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'
			// text styles
			const textStyle =
				{ fontSize: '24px', fill: nomalTextColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true } };
			const noteStyle =
				{ fontSize: '24px', fill: noteColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true }, fontstyle: 'bold' };
			//  Texts
		    let title = this.add.text(configWidth/2, 18, waitingForOthers[0], { fontSize: '36px', fill: '#000', fontstyle: 'bold' });
		    let note1 = this.add.text(configWidth/2, 70, waitingForOthers[1], textStyle);
		    let note2 = this.add.text(configWidth/2, 70+30*2, waitingForOthers[2], textStyle);
		    let note3 = this.add.text(configWidth/2, 70+30*4, waitingForOthers[3], noteStyle);
		    title.setOrigin(0.5, 0.5);
		    note1.setOrigin(0.5, 0.5);
		    note2.setOrigin(0.5, 0.5);
		    note3.setOrigin(0.5, 0.5);

            // waitingBonusBar
            //restTime = 10;
            waitingCountdown = this.time.delayedCall(restTime, waitingBarCompleted, [], this);
			//waitingBox = this.add.graphics();
			//waitingBar = this.add.graphics();
			//waitingBox.fillStyle(0x000000, 0.7); // color, alpha
			//waitingBox.fillRect(240, 270, 320, 50);
			bonusBox = this.add.graphics();
			bonusBar = this.add.graphics();
			bonusBox.fillStyle(0x000000, 0.7); // color, alpha
			bonusBox.fillRect(240, 380, 320, 50);
			// countdown texts
			//countdownText = this.add.text(configWidth/2, 340, 'The study starts in ?? sec.' , textStyle);
			//countdownText.setOrigin(0.5, 0.5);
			bonusText = this.add.text(configWidth/2, 450, 'Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cents.' , textStyle);
			bonusText.setOrigin(0.5, 0.5);

			// showing the current group size
			this.groupSizeText = this.add.text(configWidth/2, 350, 'Number of people ready: '+ n_in_waitingRoom2.toString()+' / 3' , textStyle);
			this.groupSizeText.setOrigin(0.5, 0.5);
		}

		update(){
			waitingBonus += 1.4/(6*game.loop.actualFps)
			bonusBar.clear();
			bonusBar.fillStyle(0xff5a00, 1);
			if(waitingBonus*2<300) {
		    	bonusBar.fillRect(250, 390, waitingBonus*2, 30); //1.4 cents per 6 seconds = 8.4 USD per hour
			}else{
				bonusBar.fillRect(250, 390, 300, 30);
			}
			bonusText.setText('Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cents.');
			this.groupSizeText.setText('Number of people ready: '+ n_in_waitingRoom2.toString()+' / 3');
		}
	};

	// SceneInstruction
	class SceneInstruction extends Phaser.Scene {

		constructor () {
		    super({ key: 'SceneInstruction', active: false });
		}

		preload () {
		}

		init (data) {
			//this.n = data.n;
			this.indivOrGroup = data.indivOrGroup;
			this.exp_condition = data.exp_condition;
			//console.log('indivOrGroup = ' + this.indivOrGroup);
		}

		create () {
			//console.log('instructionPosition = '+ instructionPosition);
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'


		    // Instruction length
		    let instructionLength;
		    let instructionText
		    if (this.indivOrGroup == 0) { // 0 = individual; 1 = group
		    	instructionLength = instructionText_indiv.length;
		    	instructionText = instructionText_indiv;
		    } else {
		    	instructionLength = instructionText_group.length;
		    	instructionText = instructionText_group;
		    }
		    // create a new 'div' for the instruction texts
		    const instructionTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 400px; font: 25px Arial;';
		    let instructionDiv = document.createElement('div');
		    instructionDiv.style = instructionTextStyle;
		    if (!isInstructionRevisit) {
		    	instructionDiv.innerHTML = instructionText[instructionPosition];
		    } else {
		    	instructionDiv.innerHTML = revisitingInstructionText[0];
		    }
		    instructionDiv.id = 'instructionDiv';
		    // Add the div
		    let instructionElement = this.add.dom(configWidth/2, 220, instructionDiv);

		    // instruction Picture
		    let currentInstructionPicture = [];
		    if (this.indivOrGroup == 0) {
		    	for (let i=0; i<7; i++) {
			    	currentInstructionPicture[i] = this.add.image(configWidth/2, configHeight/2, 'instructionPictures_indiv_'+i ).setDisplaySize((1024/3)*1.3, (768/3)*1.3);
			    	currentInstructionPicture[i].visible = false;
			    }
		    } else {
		    	for (let i=0; i<14; i++) {
			    	currentInstructionPicture[i] = this.add.image(configWidth/2, configHeight/2 - 20, 'instructionPictures_group_'+i ).setDisplaySize((1024/3)*1.3, (768/3)*1.3);
			    	currentInstructionPicture[i].visible = false;
			    }
		    }


		    // next button
		    this.nextButtonContainer = this.add.container(550, 520);
			let nextButtonImage = this.add.sprite(0, 0, 'button').setDisplaySize(200,150).setInteractive({ cursor: 'pointer' });
			let nextButtonText = this.add.text(0, 0, 'Next', { fontSize: '32px', fill: '#000' });
			nextButtonText.setOrigin(0.5, 0.5);
			this.nextButtonContainer.add(nextButtonImage);
			this.nextButtonContainer.add(nextButtonText);
		    nextButtonImage.on('pointerdown', function (pointer) {
		    	if(instructionPosition < instructionLength - 1){
		    		instructionPosition += 1;
		    		instructionDiv.innerHTML = instructionText[instructionPosition];
		    		backButtonImage.visible = true;
		    		backButtonText.visible = true;
		    		if (instructionPosition == instructionLength - 1 & isInstructionRevisit) {
		    			instructionDiv.innerHTML = revisitingInstructionText[1];
		    		}
		    		if (instructionPosition < instructionLength - 1) {
		    			currentInstructionPicture[instructionPosition - 1].visible = false;
		    			currentInstructionPicture[instructionPosition].visible = true;
					} else {
						currentInstructionPicture[instructionPosition - 1].visible = false;
						if(typeof currentInstructionPicture[instructionPosition] != 'undefined') {
		    				currentInstructionPicture[instructionPosition].visible = false;
						}
					}
		    	} else {
		    		if (!isInstructionRevisit) {
		    			game.scene.start('SceneTutorial', { indivOrGroup: indivOrGroup, exp_condition: exp_condition, tutorialPosition:0 });
		    			nextButtonImage.visible = false;
		    			backButtonImage.visible = false;
		    			//nextButtonContainer.destroy();
		    			//backButtonContainer.destroy();
		    		} else {
		    			answers = [-1,-1,-1,-1,-1];
		    			game.scene.start('SceneUnderstandingTest');
		    			nextButtonImage.visible = false;
		    			backButtonImage.visible = false;
		    		}
		    	}
		    });
		    // back button
		    this.backButtonContainer = this.add.container(250, 520);
			let backButtonImage = this.add.sprite(0, 0, 'button').setDisplaySize(200,150).setInteractive({ cursor: 'pointer' });
			let backButtonText = this.add.text(0, 0, 'back', { fontSize: '32px', fill: '#000' });
			backButtonText.setOrigin(0.5, 0.5);
			this.backButtonContainer.add(backButtonImage);
			this.backButtonContainer.add(backButtonText);
			backButtonImage.visible = false;
			backButtonText.visible = false;
		    backButtonImage.on('pointerdown', function (pointer) {
		    	if(instructionPosition>0){
		    		instructionPosition -= 1;
		    		instructionDiv.innerHTML = instructionText[instructionPosition];
		    		if (instructionPosition > 0) {
		    			if(typeof currentInstructionPicture[instructionPosition + 1] != 'undefined') {
		    				currentInstructionPicture[instructionPosition + 1].visible = false;
		    			}
		    			currentInstructionPicture[instructionPosition].visible = true;
					} else {
						backButtonImage.visible = false;
						backButtonText.visible = false;
						currentInstructionPicture[instructionPosition + 1].visible = false;
		    			currentInstructionPicture[instructionPosition].visible = false;
					}
		    	}
		    });
		    // pointerover
			backButtonImage.on('pointerover', function (pointer) {
		    	backButtonImage.setTint(0x4c4c4c); //B8860B ff0000
		    }, this);
		    nextButtonImage.on('pointerover', function (pointer) {
		    	nextButtonImage.setTint(0x4c4c4c); //008B8B
		    }, this);
		    // pointerout
			backButtonImage.on('pointerout', function (pointer) {
		    	backButtonImage.clearTint();
		    }, this);
		    nextButtonImage.on('pointerout', function (pointer) {
		    	nextButtonImage.clearTint();
		    }, this);
		}

		update(){
		}
	};

	// SceneTutorial
	class SceneTutorial extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneTutorial', active: false });
		}

		preload(){}

		init (data) {
			this.indivOrGroup = data.indivOrGroup;
			this.exp_condition = data.exp_condition;
			this.tutorialPosition = data.tutorialPosition;
		}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'

		    // tutorial texts
		    tutorialPosition = this.tutorialPosition;
		    // indivOrGroup
		    let tutorialText;
		    if (this.indivOrGroup == 0) {
		    	tutorialText = tutorialText_indiv;
		    } else {
		    	tutorialText = tutorialText_group;
		    }

		    const tutorialTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 150px; font: 25px Arial; position: relative;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = tutorialText[tutorialPosition];

		    // slot machines and goToTest button
		    let tutorialFlag = 0;
		    //let objects = {};
		    let slotY_tutorial = 480
		    ,	socialInfoY = slotY_tutorial - 90
		    ,	payoffTextY = slotY_tutorial + 100
		    ,	trialText_tutorialY = 16+165
		    ,	groupSizeText_tutorialY = 56+165
		    ,	energyBar_tutorialY = 96+165
		    ;


		    // slot machines
		    this.options = {}
		    for (let i=1; i<numOptions+1; i++) {
		    	this.options['box'+i] = this.add.sprite(option1_positionX+space_between_boxes*(i-1), slotY_tutorial, 'machine'+i+'_normal');
		    	this.options['box_active'+i] = this.add.sprite(option1_positionX+space_between_boxes*(i-1), slotY_tutorial, 'machine'+i+'_active');
		    	this.options['box'+i].setDisplaySize(optionWidth, optionHeight);
		    	this.options['box_active'+i].setDisplaySize(optionWidth, optionHeight);
		    	this.options['box_active'+i].visible = false;
		    	if (tutorialTrial < 3) {
					this.options['box'+i].setInteractive({ cursor: 'pointer' });
					this.options['box_active'+i].setInteractive({ cursor: 'pointer' });
				}
		    }

			// text
			trialText_tutorial = this.add.text(16, trialText_tutorialY, 'Tutorial trial: ' + tutorialTrial + ' / 4', { fontSize: '25px', fill: '#000' });
		    groupSizeText_tutorial = this.add.text(16, groupSizeText_tutorialY, 'Number of players: 3', { fontSize: '25px', fill: '#000' });
		    timeText_tutorial = this.add.text(16, energyBar_tutorialY, 'Remaining time: ', { fontSize: '25px', fill: '#000' });
		    payoffText = this.add.text(missPositionX, payoffTextY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5, 0.5);
		    // if (tutorialTrial == 1) {
		    // 	payoffText.visible = false;
		    // } else if (tutorialTrial == 2) {
		    // 	if (choice_tutorial == 1) payoffText.x = option1_positionX;
		    // 	if (choice_tutorial == 2) payoffText.x = option1_positionX + space_between_boxes * 1;
		    // 	if (choice_tutorial == 3) payoffText.x = option1_positionX + space_between_boxes * 2;
		    // 	if (choice_tutorial == 4) payoffText.x = option1_positionX + space_between_boxes * 3;
		    // 	payoffText.setText('You got 30')
		    // } else if (tutorialTrial == 3) {
		    // 	if (choice_tutorial == 1) payoffText.x = option1_positionX;
		    // 	if (choice_tutorial == 2) payoffText.x = option1_positionX + space_between_boxes * 1;
		    // 	if (choice_tutorial == 3) payoffText.x = option1_positionX + space_between_boxes * 2;
		    // 	if (choice_tutorial == 4) payoffText.x = option1_positionX + space_between_boxes * 3;
		    // 	payoffText.setText('You got 50')
		    // }
		    payoffText.visible = false;

			// confirmation text
			let confirmationContainer = this.add.container(175, slotY_tutorial+20);
			let confirmationImage = this.add.sprite(0, 0, 'button').setDisplaySize(160,100).setAlpha(0.7);
			let confirmationText = this.add.text(0, 0, `Click again\nto confirm \nyour choice`, { fontSize: '20px', fill: '#000' }).setOrigin(0.5, 0.5);
			confirmationContainer.add(confirmationImage);
			confirmationContainer.add(confirmationText);
			confirmationContainer.visible = false; // it's hidden in default

			// =============== A looking-good timer =================================
			// the energy container. A simple sprite
			let energyContainer = this.add.sprite(350, energyBar_tutorialY+15, 'energycontainer');
			// the energy bar. Another simple sprite
        	let energyBar = this.add.sprite(energyContainer.x + 46, energyContainer.y, 'energybar');
        	// a copy of the energy bar to be used as a mask. Another simple sprite but...
        	let energyMask = this.add.sprite(energyBar.x, energyBar.y, 'energybar');
        	// ...it's not visible...
        	energyMask.visible = false;
        	// resize them
        	let energyContainer_originalWidth = energyContainer.displayWidth
        	,	energyContainer_newWidth = 200
        	,	container_bar_ratio = energyBar.displayWidth / energyContainer.displayWidth
        	;
			energyContainer.displayWidth = energyContainer_newWidth;
			energyContainer.scaleY = energyContainer.scaleX;
			energyBar.displayWidth = energyContainer_newWidth * container_bar_ratio;
        	energyBar.scaleY = energyBar.scaleX;
        	energyBar.x = energyContainer.x + (46 * energyContainer_newWidth/energyContainer_originalWidth);
        	energyMask.displayWidth = energyBar.displayWidth;
        	energyMask.scaleY = energyMask.scaleX;
        	energyMask.x = energyBar.x;
        	// and we assign it as energyBar's mask.
        	energyBar.mask = new Phaser.Display.Masks.BitmapMask(this, energyMask);
        	// =============== A looking-good timer =================================

			// click event if tutorialTrial < 3
			if (tutorialTrial == 3) {
				this.timeLeft = maxChoiceStageTime / 1000;
				// a boring timer.
		        let gameTimer = this.time.addEvent({
		            delay: 1000,
		            callback: function(){
		                this.timeLeft --;

		                // dividing energy bar width by the number of seconds gives us the amount
		                // of pixels we need to move the energy bar each second
		                let stepWidth = energyMask.displayWidth / (maxChoiceStageTime/1000);

		                // moving the mask
		                energyMask.x -= stepWidth;
		                if(this.timeLeft < 0){
		                    // this.scene.start("PlayGame")
		                    tutorialPosition++;
							instructionDiv.innerHTML = tutorialText[tutorialPosition];
							game.scene.start('SceneTutorialFeedback', { indivOrGroup: indivOrGroup, choice: -1, tutorialPosition: tutorialPosition });
							gameTimer.destroy();
		                }
		            },
		            callbackScope: this,
		            loop: true
		        });
			} else if (tutorialTrial < 3) {

				for (let i = 1; i < numOptions+1; i++) {
					this.options['box'+i].on('pointerdown', function (pointer) {
						confirmationContainer.x = option1_positionX + space_between_boxes*(i-1);
						confirmationContainer.visible = true;
						this.options['box'+i].visible = false;
						this.options['box_active'+i].visible = true;
				    	tutorialFlag = i;
				    	for (let j = 1; j < numOptions+1; j++) {
							if(tutorialFlag > 0 & tutorialFlag != j) {
								this.options['box_active'+j].visible = false;
								this.options['box'+j].visible = true;
							}
						}
				    }, this);
				    this.options['box_active'+i].on('pointerdown', function (pointer) {
				    	for (let m = 1; m < numOptions+1; m++) this.options['box'+m].visible = false;
			    		this.options['box_active'+i].visible = false;

			    		confirmationContainer.visible = false;
			    		energyContainer.visible = false;
			    		energyBar.visible = false;
			    		energyMask.vsible = false;
			    		if (tutorialPosition == 0) {
			    			score_tutorial += 30
			    		} else {
			    			score_tutorial += 50
			    		}
			    		tutorialPosition++;
				    	instructionDiv.innerHTML = tutorialText[tutorialPosition];
				    	tutorialFlag = 0;
				    	if (tutorialPosition < tutorialText.length) {
				    		choice_tutorial = i;
				    		//game.scene.stop('SceneTutorial');
				    		game.scene.start('SceneTutorialFeedback', { indivOrGroup: indivOrGroup, choice: i, tutorialPosition: tutorialPosition });
				    		game.scene.stop('SceneTutorial');
				    	} else {
				    		game.scene.start('SceneUnderstandingTest', { indivOrGroup: indivOrGroup });
				    	}
				    }, this);
				}

			} else { // the final trial (i.e. the transition to the understanding quiz)
				for (let m = 1; m < numOptions+1; m++) this.options['box'+m].visible = false;
		    	trialText_tutorial.visible = false;
		    	groupSizeText_tutorial.visible = false;
		    	timeText_tutorial.visible = false;
		    	energyContainer.visible = false;
		    	energyBar.visible = false;
				let buttonContainerTutorial = this.add.container(400, 500);
				let buttonImageTutorial = this.add.sprite(0, 0, 'button').setDisplaySize(300,150).setInteractive({ cursor: 'pointer' });
				let buttonTextTutorial = this.add.text(0, 0, 'Go to the quiz', { fontSize: '28px', fill: '#000' });
				buttonTextTutorial.setOrigin(0.5, 0.5);
				buttonContainerTutorial.add(buttonImageTutorial);
				buttonContainerTutorial.add(buttonTextTutorial);
				//buttonContainerTutorial.visible = true; // it's hidden in default

				// click event
			    buttonImageTutorial.on('pointerdown', function (pointer) {
			    	buttonImageTutorial.visible = false;
			    	game.scene.start('SceneUnderstandingTest', { indivOrGroup: indivOrGroup });
			    });

			    // pointer over & out effects
			    buttonImageTutorial.on('pointerover', function (pointer) {
			    	buttonImageTutorial.setTint(0xa9a9a9);
			    }, this);
			    buttonImageTutorial.on('pointerout', function (pointer) {
			    	buttonImageTutorial.clearTint();
			    }, this);
			}

			if (typeof this.options != 'undefined') {
			    // pointer over & out effects
			    for (let i = 1; i < numOptions+1; i++) {
			    	this.options['box'+i].on('pointerover', function (pointer) {
				    	this.options['box'+i].setTint(0xb8860b); //B8860B ff0000
				    }, this);
				    this.options['box'+i].on('pointerout', function (pointer) {
				    	this.options['box'+i].clearTint();
				    }, this);
			    }
			}

			// social information
		    let socialFreqNumbers = {}
		    ,	numberOfPreviousChoice = [0,0,0,0]
		    ;
		    if (indivOrGroup == 1 & tutorialTrial == 1) {
		    	for (let i = 1; i < numOptions+1; i++) {
		    		socialFreqNumbers['option'+i] = this.add.text(option1_positionX + space_between_boxes*(i-1), socialInfoY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		    		socialFreqNumbers['option'+i].visible = false;
		    		numberOfPreviousChoice[i-1] = 0;
		    	}

			} else if (indivOrGroup == 1 & tutorialTrial == 2) {
			    socialFreqNumbers.option1 = this.add.text(option1_positionX+space_between_boxes*0, socialInfoY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.option2 = this.add.text(option1_positionX+space_between_boxes*1, socialInfoY, `200`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    // function.call(what_is_this, ...) method can specify what you mean by "this" in the function
			    showStars_4ab.call(this, numberOfPreviousChoice[0], numberOfPreviousChoice[1], numberOfPreviousChoice[2], numberOfPreviousChoice[3], socialInfoY);
			} else if (indivOrGroup == 1 & tutorialTrial == 3) {
			    socialFreqNumbers.option1 = this.add.text(option1_positionX+space_between_boxes*0, socialInfoY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.option2 = this.add.text(option1_positionX+space_between_boxes*1, socialInfoY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);

			} else if (tutorialTrial != 4) {
				// for (let i = 1; i < numOptions+1; i++) {
		  //   		socialFreqNumbers['option'+i] = this.add.text(option1_positionX + space_between_boxes*(i-1), socialInfoY, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		  //   		if (choice_tutorial == i) {
		  //   			socialFreqNumbers['option'+i].visible = true;
		  //   			numberOfPreviousChoice[i-1] = 1;
		  //   		} else {
		  //   			socialFreqNumbers['option'+i].visible = false;
		  //   			numberOfPreviousChoice[i-1] = 0;
		  //   		}
		  //   	}

			} else {
				// for (let i = 1; i < numOptions+1; i++) {
		  //   		socialFreqNumbers['option'+i] = this.add.text(option1_positionX + space_between_boxes*(i-1), socialInfoY, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		  //   		socialFreqNumbers['option'+i].visible = false;
		  //   		numberOfPreviousChoice[i-1] = 0;
		  //   	}

			}

			// the shadowed boxes to hide slots
		    let shadow1 = this.add.image(400, slotY_tutorial - 30, 'blackbox' ).setDisplaySize(780, 310)
		    ,	shadow2 = this.add.image(400, groupSizeText_tutorialY - 10, 'blackbox' ).setDisplaySize(780, 90)
		    ;
		    if (tutorialTrial == 3) {
		    	shadow1.visible = true;
				shadow2.visible = true;
			} else {
				shadow1.visible = false;
				shadow2.visible = false;
			}

		}

		update(){}
	};

	// SceneTutorialFeedback
	class SceneTutorialFeedback extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneTutorialFeedback', active: false });
		}

		preload(){
			}

		init (data) {
			this.indivOrGroup = data.indivOrGroup;
			this.choice = data.choice;
			this.tutorialPosition = data.tutorialPosition;
			////console.log('SceneTutorialFeedback started: choice = ' + this.choice +' and position = ' + this.tutorialPosition);
		}

		create(){
			// destroy previous texts
			// trialText_tutorial.destroy();
			// groupSizeText_tutorial.destroy();
			// timeText_tutorial.destroy();
			// background colour
			this.cameras.main.setBackgroundColor(backgroundcolour_feedback);// #d9d9d9 #ffffff

			// tutorial texts
		    let tutorialPosition = this.tutorialPosition;
		    let slotY_tutorial = 480//430
		    //,	socialInfoY = slotY_tutorial - 90
		    ,	payoffTextY = slotY_tutorial - 90
		    //,	trialText_tutorialY = 16+165
		    //,	groupSizeText_tutorialY = 65+165
		    ;
		    // indivOrGroup
		    let tutorialText;
		    if (this.indivOrGroup == 0) {
		    	tutorialText = tutorialText_indiv;
		    } else {
		    	tutorialText = tutorialText_group;
		    }
		    const tutorialTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 150px; font: 25px Arial; position: relative;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = tutorialText[tutorialPosition];

			//  Texts
			objects_feedbackStage = {};
			for (let i = 1; i < numOptions+1; i++) {
				objects_feedbackStage['box'+i] = this.add.sprite(option1_positionX+space_between_boxes*(i-1), slotY_tutorial, 'machine'+i+'_active').setDisplaySize(optionWidth, optionHeight);
				objects_feedbackStage['box'+i].visible = false;
			}

			// ========================
			// Share button
			// YES button
			let button_style = { fontSize: '24px', fill: '#000' , align: "center" };
			let buttonContainer_yes = this.add.container(200, 310); //position
			let buttonImage_yes = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_yes = this.add.text(0, 0, 'YES\n(cost: ' + 20 + ' points)', button_style);
			if(tutorialTrial > 1) {
				buttonText_yes.setText('YES\n(cost: 100 points)');
			}
			buttonText_yes.setOrigin(0.5, 0.5);
			buttonContainer_yes.add(buttonImage_yes);
			buttonContainer_yes.add(buttonText_yes);
			buttonContainer_yes.visible = false;

			// NO button
			let buttonContainer_no = this.add.container(600, 310); //position
			let buttonImage_no = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_no = this.add.text(0, 0, 'NO\n(No cost)', button_style);
			buttonText_no.setOrigin(0.5, 0.5);
			buttonContainer_no.add(buttonImage_no);
			buttonContainer_no.add(buttonText_no);
			buttonContainer_no.visible = false;

			// Conformation and Next page button
			let buttonContainerTutorial = this.add.container(400, 500);
			let buttonImageTutorial = this.add.sprite(0, 0, 'button').setDisplaySize(300,150).setInteractive({ cursor: 'pointer' });
			let buttonTextTutorial = this.add.text(0, 0, 'Yes, I am!', { fontSize: '28px', fill: '#000' });
			buttonTextTutorial.setOrigin(0.5, 0.5);
			buttonContainerTutorial.add(buttonImageTutorial);
			buttonContainerTutorial.add(buttonTextTutorial);
			buttonContainerTutorial.visible = false;

			// Pointing finger
			let pointing_finger = this.physics.add.image(200, 360, 'pointing_finger').setDisplaySize(60, 60);
			pointing_finger.body.allowGravity = false;
			pointing_finger.body.immovable = true;
			pointing_finger.body.moves = false;
			pointing_finger.visible = false;
			this.tweens.add({
				targets: pointing_finger,
				// x: 200,
				y: 340,
				duration: 300,
				ease: 'Sine.easeInOut',
				repeat: -1,
				yoyo: true
			});

			// pointer over & out effects
		    buttonImage_yes.on('pointerover', function (pointer) {
		    	buttonImage_yes.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_yes.on('pointerout', function (pointer) {
		    	buttonImage_yes.clearTint();
		    }, this);

		    buttonImage_yes.on('pointerdown', function (pointer) {
		    	// going back to the tutorial
		    	let updatedTutorialPosition = tutorialPosition + 1;
		    	tutorialTrial++;
		    	game.scene.stop('SceneTutorialFeedback');
		    	if (tutorialTrial == 2) {
		    		game.scene.start('SceneTutorialShaingCostExplained', { tutorialPosition: updatedTutorialPosition });
		    	} else {
		    		game.scene.start('SceneTutorial', { indivOrGroup: indivOrGroup, exp_condition: exp_condition,tutorialPosition: updatedTutorialPosition });
		    	}
		    }, this);

		    // In the first tutorial-trial, participants have to choose "yes" button
		    // so the following tint function should be inactive on that trial
		    if (tutorialTrial != 1) {
			    buttonImage_no.on('pointerover', function (pointer) {
			    	buttonImage_no.setTint(0xa9a9a9);
			    }, this);
			    buttonImage_no.on('pointerout', function (pointer) {
			    	buttonImage_no.clearTint();
			    }, this);
			    buttonImage_no.on('pointerdown', function (pointer) {
			    	// going back to the tutorial
			    	let updatedTutorialPosition = tutorialPosition + 1;
			    	tutorialTrial++;
			    	game.scene.stop('SceneTutorialFeedback');
			    	game.scene.start('SceneTutorial', { indivOrGroup: indivOrGroup, exp_condition: exp_condition,tutorialPosition: updatedTutorialPosition });
			    }, this);
			}

			// click event
			buttonImageTutorial.on('pointerdown', function (pointer) {
				buttonImageTutorial.visible = false;
				//game.scene.start('SceneUnderstandingTest', { indivOrGroup: indivOrGroup });
				game.scene.start('SceneBeforeUnderstandingTest', { indivOrGroup: indivOrGroup });
				game.scene.stop('SceneTutorialFeedback');
			});

			// pointer over & out effects
			buttonImageTutorial.on('pointerover', function (pointer) {
				buttonImageTutorial.setTint(0xa9a9a9);
			}, this);
			buttonImageTutorial.on('pointerout', function (pointer) {
				buttonImageTutorial.clearTint();
			}, this);

		    // ========================

			if (this.choice == -1) {
				feedbackTextPosition = missPositionX;

			} else if (this.choice == 1) {
				objects_feedbackStage.box1.visible = true;
				feedbackTextPosition = option1_positionX + space_between_boxes*0;

			} else if (this.choice == 2) {
				objects_feedbackStage.box2.visible = true;
				feedbackTextPosition = option1_positionX + space_between_boxes*1;

			} else if (this.choice == 3) {
				objects_feedbackStage.box3.visible = true;
				feedbackTextPosition = option1_positionX + space_between_boxes*2;

			} else if (this.choice == 4) {
				objects_feedbackStage.box4.visible = true;
				feedbackTextPosition = option1_positionX + space_between_boxes*3;
			}

			//let tutorialPayoff;
			switch (tutorialTrial) {
                case 1:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, `100 points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
                case 2:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, `150 points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
                case 3:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, `Missed!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
                default:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, ``, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
            }

		    setTimeout(function(){
		    	if (tutorialTrial < 3) {
		    		waitOthersText = this.add.text(16, 170, 'Do you want to share this information\nwith other members?', { fontSize: '30px', fill: '#000', align: "center"});
					buttonContainer_yes.visible = true;
					buttonContainer_no.visible = true;
					if (tutorialTrial == 1) pointing_finger.visible = true;
				} else {
					waitOthersText = this.add.text(16, 170, 'You\'ve missed this round!\nAre you still there?', { fontSize: '30px', fill: '#000', align: "center"});
					buttonContainerTutorial.visible = true;
				}
		    }.bind(this), 1000);
		}

		update(){}
	};

	// SceneBeforeUnderstandingTest
	class SceneBeforeUnderstandingTest extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneBeforeUnderstandingTest', active: false });
		}

		preload(){
			}

		init (data) {
			this.indivOrGroup = data.indivOrGroup;
		}

		create(){
			this.cameras.main.setBackgroundColor(backgroundcolour_feedback);// #d9d9d9 #ffffff

			// tutorial texts
		    let slotY_tutorial = 480//430
		    //,	socialInfoY = slotY_tutorial - 90
		    ,	payoffTextY = slotY_tutorial - 90
		    //,	trialText_tutorialY = 16+165
		    //,	groupSizeText_tutorialY = 65+165
		    ;
		    // indivOrGroup
		    let tutorialText;
		    if (this.indivOrGroup == 0) {
		    	tutorialText = tutorialText_indiv;
		    } else {
		    	tutorialText = tutorialText_group;
		    }
		    const tutorialTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 150px; font: 25px Arial; position: relative;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = '<br>The tutorial is done. <br><br>Next, you will proceed to a short quiz about the task!';

			// ========================
			// OK button
			let button_style = { fontSize: '24px', fill: '#000' , align: "center" };
			let buttonContainer_ok = this.add.container(configWidth/2, 500); //position
			let buttonImage_ok = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_ok = this.add.text(0, 0, 'Proceed to the quiz!', button_style);
			buttonText_ok.setOrigin(0.5, 0.5);
			buttonContainer_ok.add(buttonImage_ok);
			buttonContainer_ok.add(buttonText_ok);
			buttonContainer_ok.visible = true;

			// pointer over & out effects
		    buttonImage_ok.on('pointerover', function (pointer) {
		    	buttonImage_ok.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_ok.on('pointerout', function (pointer) {
		    	buttonImage_ok.clearTint();
		    }, this);

		    buttonImage_ok.on('pointerdown', function (pointer) {
		    	// proceeding to the quiz
		    	game.scene.stop('SceneBeforeUnderstandingTest');
		    	game.scene.start('SceneUnderstandingTest', { indivOrGroup: indivOrGroup });
		    }, this);

		    // ========================
		}

		update(){}
	};

	// SceneTutorialShaingCostExplained
	class SceneTutorialShaingCostExplained extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneTutorialShaingCostExplained', active: false });
		}

		preload(){
			}

		init (data) {
			this.tutorialPosition = data.tutorialPosition;
		}

		create(){
			this.cameras.main.setBackgroundColor(backgroundcolour_feedback);// #d9d9d9 #ffffff

			// tutorial texts
		    let tutorialPosition = this.tutorialPosition;
		    let slotY_tutorial = 480//430
		    //,	socialInfoY = slotY_tutorial - 90
		    ,	payoffTextY = slotY_tutorial - 90
		    //,	trialText_tutorialY = 16+165
		    //,	groupSizeText_tutorialY = 65+165
		    ;
		    // indivOrGroup
		    let tutorialText;
		    if (this.indivOrGroup == 0) {
		    	tutorialText = tutorialText_indiv;
		    } else {
		    	tutorialText = tutorialText_group;
		    }
		    const tutorialTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 150px; font: 25px Arial; position: relative;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = tutorialText[tutorialPosition];

		    // ==== Insert a picture showing 100 - 20 = 80 =====
		    let net_contribution_picture = this.add.image(configWidth/2, configHeight/2, 'net_contribution' ).setDisplaySize((752/2)*1.3, (189/2)*1.3);

			// ========================
			// OK button
			let button_style = { fontSize: '24px', fill: '#000' , align: "center" };
			let buttonContainer_ok = this.add.container(configWidth/2, 500); //position
			let buttonImage_ok = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_ok = this.add.text(0, 0, 'Okay!\n(Go to next page)', button_style);
			buttonText_ok.setOrigin(0.5, 0.5);
			buttonContainer_ok.add(buttonImage_ok);
			buttonContainer_ok.add(buttonText_ok);
			buttonContainer_ok.visible = true;

			// pointer over & out effects
		    buttonImage_ok.on('pointerover', function (pointer) {
		    	buttonImage_ok.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_ok.on('pointerout', function (pointer) {
		    	buttonImage_ok.clearTint();
		    }, this);

		    buttonImage_ok.on('pointerdown', function (pointer) {
		    	// going back to the tutorial
		    	let updatedTutorialPosition = tutorialPosition + 1;
		    	game.scene.stop('SceneTutorialShaingCostExplained');
		    	game.scene.start('SceneTutorial', { indivOrGroup: indivOrGroup, exp_condition: exp_condition,tutorialPosition: updatedTutorialPosition });
		    }, this);

		    // ========================
		}

		update(){}
	};

	// SceneUnderstandingTest
	class SceneUnderstandingTest extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneUnderstandingTest', active: false });
		}

		preload(){
			}

		create(){
			understandingCheckStarted = 1;
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'

			const quiz_correct_answers_group = [3,0,0,0,1]
			,	quiz_correct_answers_indiv = [3,0,0,-1,-1]
			;

			// indivOrGroup
		    let understandingCheckText;
		    if (indivOrGroup == 0) {
		    	understandingCheckText = understandingCheckText_indiv;
		    } else {
		    	understandingCheckText = understandingCheckText_group;
		    }
		    const understandingCheckTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 60px; font: 25px Arial; position: relative;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = understandingCheckTextStyle;
		    instructionDiv.innerHTML = understandingCheckText[0];

			//
			let buttonContainerTest = this.add.container(450, 560); //position
			let buttonImageTest = this.add.sprite(0, 0, 'button').setDisplaySize(300, 50).setInteractive({ cursor: 'pointer' });
			let buttonTextTest = this.add.text(0, 0, 'Check your answers', { fontSize: '24px', fill: '#000' });
			buttonTextTest.setOrigin(0.5, 0.5);
			buttonContainerTest.add(buttonImageTest);
			buttonContainerTest.add(buttonTextTest);
			buttonContainerTest.visible = false;

			// text
			// create a new 'div' for the instruction texts
		    const questionTextStyle = 'background-color: rgba(255,255,255,0); width: 700px; height: 30px; font: 20px Arial; position: relative;';
		    let questionDiv = []
		    ,	questionElement = []
		    ;
		    for (let i=1; i<understandingCheckText.length; i++) {
				questionDiv[i] = document.createElement('div');
				questionDiv[i].style = questionTextStyle;
		    	questionDiv[i].innerHTML = understandingCheckText[i];
		    	questionDiv.id = 'questionDiv'+i;
		    	if (i < 5) {
		    		questionElement[i] = this.add.dom(configWidth/2, 80*i, questionDiv[i]);
		    	} else {
		    		questionElement[i] = this.add.dom(configWidth/2, 80*4+105*(i-4), questionDiv[i]);
		    	}

			}

			/**********************************************
			//
			// Options for the understanding checks
			//
			**********************************************/
			// Question 0
			const optionButtonsA0 = []
			,	optionButtonsA0Image = []
			,	optionButtonsA0Text = []
			,	optionButtonsA0Image_active = []
			,	question0_options = [3,5,10,20,30]
			;
			for (let i=0; i<5; i++) {
				optionButtonsA0[i] = this.add.container(80 + 60*i, 180+80*0); //position
				// optionButtonsA0Text[i] = this.add.text(0, 0, 40+20*i, { fontSize: '23px', fill: '#000' });
				optionButtonsA0Text[i] = this.add.text(0, 0, question0_options[i], { fontSize: '23px', fill: '#000' });
				optionButtonsA0Image[i] = this.add.sprite(0, 0, 'button').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
				optionButtonsA0Image_active[i] = this.add.sprite(0, 0, 'button_active').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
				optionButtonsA0Text[i].setOrigin(0.5, 0.5);
				optionButtonsA0[i].add(optionButtonsA0Image_active[i]);
				optionButtonsA0[i].add(optionButtonsA0Image[i]);
				optionButtonsA0[i].add(optionButtonsA0Text[i]);
				optionButtonsA0[i].visible = true; // it's hidden in default
				optionButtonsA0Image[i].on('pointerdown', function (pointer) {
					if (answers[0] >= 0 & answers[0] != i) {
						// remove and add other active button images
						optionButtonsA0[answers[0]].remove(optionButtonsA0Image_active[answers[0]]);
						optionButtonsA0[answers[0]].remove(optionButtonsA0Text[answers[0]]);
						optionButtonsA0[answers[0]].add(optionButtonsA0Image[answers[0]]);
						optionButtonsA0[answers[0]].add(optionButtonsA0Text[answers[0]]);
						// remove and add a new active image
						answers[0] = i;
						optionButtonsA0[i].remove(optionButtonsA0Image[i]);
						optionButtonsA0[i].remove(optionButtonsA0Text[i]);
						optionButtonsA0[i].add(optionButtonsA0Image_active[i]);
						optionButtonsA0[i].add(optionButtonsA0Text[i]);
					} else {
						answers[0] = i;
						optionButtonsA0[i].remove(optionButtonsA0Image[i]);
						optionButtonsA0[i].remove(optionButtonsA0Text[i]);
						optionButtonsA0[i].add(optionButtonsA0Image_active[i]);
						optionButtonsA0[i].add(optionButtonsA0Text[i]);
					}
					if ( (indivOrGroup == 0 & answers.filter(isNotNegative).length == 3) | (indivOrGroup == 1 & answers.filter(isNotNegative).length == 5)) {
						buttonContainerTest.visible = true;
					}
					//console.log('answers = ' + answers);
			    });
			    optionButtonsA0Image[i].on('pointerover', function (pointer) {
			    	optionButtonsA0Image[i].setTint(0xa9a9a9);
			    }, this);
			    optionButtonsA0Image[i].on('pointerout', function (pointer) {
			    	optionButtonsA0Image[i].clearTint();
			    }, this);
			    optionButtonsA0Image_active[i].on('pointerover', function (pointer) {
			    	optionButtonsA0Image_active[i].setTint(0xa9a9a9);
			    }, this);
			    optionButtonsA0Image_active[i].on('pointerout', function (pointer) {
			    	optionButtonsA0Image_active[i].clearTint();
			    }, this);
			}

			// Question A1
			const optionButtonsA1 = []
			,	optionButtonsA1Image = []
			,	optionButtonsA1Text = []
			,	optionButtonsA1Image_active = []
			;
			optionButtonsA1Text[0] = this.add.text(0, 0, 'YES', { fontSize: '23px', fill: '#000' });
			optionButtonsA1Text[1] = this.add.text(0, 0, 'NO', { fontSize: '23px', fill: '#000' });
			for (let i=0; i<2; i++) {
				optionButtonsA1[i] = this.add.container(180 + 100*i, 180+80*1); //position
				optionButtonsA1Image[i] = this.add.sprite(0, 0, 'button').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
				optionButtonsA1Image_active[i] = this.add.sprite(0, 0, 'button_active').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
				optionButtonsA1Text[i].setOrigin(0.5, 0.5);
				optionButtonsA1[i].add(optionButtonsA1Image_active[i]);
				optionButtonsA1[i].add(optionButtonsA1Image[i]);
				optionButtonsA1[i].add(optionButtonsA1Text[i]);
				optionButtonsA1[i].visible = true; // it's hidden in default
				optionButtonsA1Image[i].on('pointerdown', function (pointer) {
					if (answers[1] >= 0 & answers[1] != i) {
						// remove and add other active button images
						optionButtonsA1[answers[1]].remove(optionButtonsA1Image_active[answers[1]]);
						optionButtonsA1[answers[1]].remove(optionButtonsA1Text[answers[1]]);
						optionButtonsA1[answers[1]].add(optionButtonsA1Image[answers[1]]);
						optionButtonsA1[answers[1]].add(optionButtonsA1Text[answers[1]]);
						// remove and add a new active image
						answers[1] = i;
						optionButtonsA1[i].remove(optionButtonsA1Image[i]);
						optionButtonsA1[i].remove(optionButtonsA1Text[i]);
						optionButtonsA1[i].add(optionButtonsA1Image_active[i]);
						optionButtonsA1[i].add(optionButtonsA1Text[i]);
					} else {
						answers[1] = i;
						optionButtonsA1[i].remove(optionButtonsA1Image[i]);
						optionButtonsA1[i].remove(optionButtonsA1Text[i]);
						optionButtonsA1[i].add(optionButtonsA1Image_active[i]);
						optionButtonsA1[i].add(optionButtonsA1Text[i]);
					}
					if ( (indivOrGroup == 0 & answers.filter(isNotNegative).length == 3) | (indivOrGroup == 1 & answers.filter(isNotNegative).length == 5)) {
						buttonContainerTest.visible = true;
					}
					//console.log('answers = ' + answers);
			    });
			    optionButtonsA1Image[i].on('pointerover', function (pointer) {
			    	optionButtonsA1Image[i].setTint(0xa9a9a9);
			    }, this);
			    optionButtonsA1Image[i].on('pointerout', function (pointer) {
			    	optionButtonsA1Image[i].clearTint();
			    }, this);
			    optionButtonsA1Image_active[i].on('pointerover', function (pointer) {
			    	optionButtonsA1Image_active[i].setTint(0xa9a9a9);
			    }, this);
			    optionButtonsA1Image_active[i].on('pointerout', function (pointer) {
			    	optionButtonsA1Image_active[i].clearTint();
			    }, this);
			}

			// Question A2
			const optionButtonsA2 = []
			,	optionButtonsA2Image = []
			,	optionButtonsA2Text = []
			,	optionButtonsA2Image_active = []
			;
			optionButtonsA2Text[0] = this.add.text(0, 0, 'YES', { fontSize: '23px', fill: '#000' });
			optionButtonsA2Text[1] = this.add.text(0, 0, 'NO', { fontSize: '23px', fill: '#000' });
			for (let i=0; i<2; i++) {
				optionButtonsA2[i] = this.add.container(180 + 100*i, 180+80*2); //position
				optionButtonsA2Image[i] = this.add.sprite(0, 0, 'button').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
				optionButtonsA2Image_active[i] = this.add.sprite(0, 0, 'button_active').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
				optionButtonsA2Text[i].setOrigin(0.5, 0.5);
				optionButtonsA2[i].add(optionButtonsA2Image_active[i]);
				optionButtonsA2[i].add(optionButtonsA2Image[i]);
				optionButtonsA2[i].add(optionButtonsA2Text[i]);
				optionButtonsA2[i].visible = true; // it's hidden in default
				optionButtonsA2Image[i].on('pointerdown', function (pointer) {
					if (answers[2] >= 0 & answers[2] != i) {
						// remove and add other active button images
						optionButtonsA2[answers[2]].remove(optionButtonsA2Image_active[answers[2]]);
						optionButtonsA2[answers[2]].remove(optionButtonsA2Text[answers[2]]);
						optionButtonsA2[answers[2]].add(optionButtonsA2Image[answers[2]]);
						optionButtonsA2[answers[2]].add(optionButtonsA2Text[answers[2]]);
						// remove and add a new active image
						answers[2] = i;
						optionButtonsA2[i].remove(optionButtonsA2Image[i]);
						optionButtonsA2[i].remove(optionButtonsA2Text[i]);
						optionButtonsA2[i].add(optionButtonsA2Image_active[i]);
						optionButtonsA2[i].add(optionButtonsA2Text[i]);
					} else {
						answers[2] = i;
						optionButtonsA2[i].remove(optionButtonsA2Image[i]);
						optionButtonsA2[i].remove(optionButtonsA2Text[i]);
						optionButtonsA2[i].add(optionButtonsA2Image_active[i]);
						optionButtonsA2[i].add(optionButtonsA2Text[i]);
					}
					if ( (indivOrGroup == 0 & answers.filter(isNotNegative).length == 3) | (indivOrGroup == 1 & answers.filter(isNotNegative).length == 5)) {
						buttonContainerTest.visible = true;
					}
					//console.log('answers = ' + answers);
			    });
			    optionButtonsA2Image[i].on('pointerover', function (pointer) {
			    	optionButtonsA2Image[i].setTint(0xa9a9a9);
			    }, this);
			    optionButtonsA2Image[i].on('pointerout', function (pointer) {
			    	optionButtonsA2Image[i].clearTint();
			    }, this);
			    optionButtonsA2Image_active[i].on('pointerover', function (pointer) {
			    	optionButtonsA2Image_active[i].setTint(0xa9a9a9);
			    }, this);
			    optionButtonsA2Image_active[i].on('pointerout', function (pointer) {
			    	optionButtonsA2Image_active[i].clearTint();
			    }, this);
			}
			if (indivOrGroup == 1) {
				// Question A3
				const optionButtonsA3 = []
				,	optionButtonsA3Image = []
				,	optionButtonsA3Text = []
				,	optionButtonsA3Image_active = []
				;
				optionButtonsA3Text[0] = this.add.text(0, 0, 'YES', { fontSize: '23px', fill: '#000' });
				optionButtonsA3Text[1] = this.add.text(0, 0, 'NO', { fontSize: '23px', fill: '#000' });
				for (let i=0; i<2; i++) {
					optionButtonsA3[i] = this.add.container(180 + 100*i, 100+80*3 + 110); //position
					optionButtonsA3Image[i] = this.add.sprite(0, 0, 'button').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
					optionButtonsA3Image_active[i] = this.add.sprite(0, 0, 'button_active').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
					optionButtonsA3Text[i].setOrigin(0.5, 0.5);
					optionButtonsA3[i].add(optionButtonsA3Image_active[i]);
					optionButtonsA3[i].add(optionButtonsA3Image[i]);
					optionButtonsA3[i].add(optionButtonsA3Text[i]);
					optionButtonsA3[i].visible = true; // it's hidden in default
					optionButtonsA3Image[i].on('pointerdown', function (pointer) {
						if (answers[3] >= 0 & answers[3] != i) {
							// remove and add other active button images
							optionButtonsA3[answers[3]].remove(optionButtonsA3Image_active[answers[3]]);
							optionButtonsA3[answers[3]].remove(optionButtonsA3Text[answers[3]]);
							optionButtonsA3[answers[3]].add(optionButtonsA3Image[answers[3]]);
							optionButtonsA3[answers[3]].add(optionButtonsA3Text[answers[3]]);
							// remove and add a new active image
							answers[3] = i;
							optionButtonsA3[i].remove(optionButtonsA3Image[i]);
							optionButtonsA3[i].remove(optionButtonsA3Text[i]);
							optionButtonsA3[i].add(optionButtonsA3Image_active[i]);
							optionButtonsA3[i].add(optionButtonsA3Text[i]);
						} else {
							answers[3] = i;
							optionButtonsA3[i].remove(optionButtonsA3Image[i]);
							optionButtonsA3[i].remove(optionButtonsA3Text[i]);
							optionButtonsA3[i].add(optionButtonsA3Image_active[i]);
							optionButtonsA3[i].add(optionButtonsA3Text[i]);
						}
						if ( (indivOrGroup == 0 & answers.filter(isNotNegative).length == 3) | (indivOrGroup == 1 & answers.filter(isNotNegative).length == 5)) {
							buttonContainerTest.visible = true;
						}
						//console.log('answers = ' + answers);
				    });
				    optionButtonsA3Image[i].on('pointerover', function (pointer) {
				    	optionButtonsA3Image[i].setTint(0xa9a9a9);
				    }, this);
				    optionButtonsA3Image[i].on('pointerout', function (pointer) {
				    	optionButtonsA3Image[i].clearTint();
				    }, this);
				    optionButtonsA3Image_active[i].on('pointerover', function (pointer) {
				    	optionButtonsA3Image_active[i].setTint(0xa9a9a9);
				    }, this);
				    optionButtonsA3Image_active[i].on('pointerout', function (pointer) {
				    	optionButtonsA3Image_active[i].clearTint();
				    }, this);
				}
				// Question A4
				const optionButtonsA4 = []
				,	optionButtonsA4Image = []
				,	optionButtonsA4Text = []
				,	optionButtonsA4Image_active = []
				;
				optionButtonsA4Text[0] = this.add.text(0, 0, 'YES', { fontSize: '23px', fill: '#000' });
				optionButtonsA4Text[1] = this.add.text(0, 0, 'NO', { fontSize: '23px', fill: '#000' });
				for (let i=0; i<2; i++) {
					optionButtonsA4[i] = this.add.container(180 + 100*i, 100+80*3 + 190); //position
					optionButtonsA4Image[i] = this.add.sprite(0, 0, 'button').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
					optionButtonsA4Image_active[i] = this.add.sprite(0, 0, 'button_active').setDisplaySize(50, 30).setInteractive({ cursor: 'pointer' });
					optionButtonsA4Text[i].setOrigin(0.5, 0.5);
					optionButtonsA4[i].add(optionButtonsA4Image_active[i]);
					optionButtonsA4[i].add(optionButtonsA4Image[i]);
					optionButtonsA4[i].add(optionButtonsA4Text[i]);
					optionButtonsA4[i].visible = true; // it's hidden in default
					optionButtonsA4Image[i].on('pointerdown', function (pointer) {
						if (answers[4] >= 0 & answers[4] != i) {
							// remove and add other active button images
							optionButtonsA4[answers[4]].remove(optionButtonsA4Image_active[answers[4]]);
							optionButtonsA4[answers[4]].remove(optionButtonsA4Text[answers[4]]);
							optionButtonsA4[answers[4]].add(optionButtonsA4Image[answers[4]]);
							optionButtonsA4[answers[4]].add(optionButtonsA4Text[answers[4]]);
							// remove and add a new active image
							answers[4] = i;
							optionButtonsA4[i].remove(optionButtonsA4Image[i]);
							optionButtonsA4[i].remove(optionButtonsA4Text[i]);
							optionButtonsA4[i].add(optionButtonsA4Image_active[i]);
							optionButtonsA4[i].add(optionButtonsA4Text[i]);
						} else {
							answers[4] = i;
							optionButtonsA4[i].remove(optionButtonsA4Image[i]);
							optionButtonsA4[i].remove(optionButtonsA4Text[i]);
							optionButtonsA4[i].add(optionButtonsA4Image_active[i]);
							optionButtonsA4[i].add(optionButtonsA4Text[i]);
						}
						if ( (indivOrGroup == 0 & answers.filter(isNotNegative).length == 3) | (indivOrGroup == 1 & answers.filter(isNotNegative).length == 5)) {
							buttonContainerTest.visible = true;
						}
						//console.log('answers = ' + answers);
				    });
				    optionButtonsA4Image[i].on('pointerover', function (pointer) {
				    	optionButtonsA4Image[i].setTint(0xa9a9a9);
				    }, this);
				    optionButtonsA4Image[i].on('pointerout', function (pointer) {
				    	optionButtonsA4Image[i].clearTint();
				    }, this);
				    optionButtonsA4Image_active[i].on('pointerover', function (pointer) {
				    	optionButtonsA4Image_active[i].setTint(0xa9a9a9);
				    }, this);
				    optionButtonsA4Image_active[i].on('pointerout', function (pointer) {
				    	optionButtonsA4Image_active[i].clearTint();
				    }, this);
				}
			}
			/**********************************************
			//
			// END -- Options for the understanding checks
			//
			**********************************************/

			// click event
		    buttonImageTest.on('pointerdown', function (pointer) {
		    	instructionDiv.style = 'background-color: rgba(0,0,0,0)';
		    	instructionDiv.innerHTML = '';
		    	for (let i=1; i<understandingCheckText.length; i++) {
					questionDiv[i].innerHTML = '';
				}
				for (let i=0; i<5; i++) {
					optionButtonsA0[i].destroy();
				}
				for (let i=0; i<2; i++) {
					optionButtonsA1[i].destroy();
				}
				for (let i=0; i<2; i++) {
					optionButtonsA2[i].destroy();
				}
		    	buttonContainerTest.destroy();
		    	if (indivOrGroup == 0) {
		    		if (JSON.stringify(answers) == JSON.stringify(quiz_correct_answers_indiv)) {
		    			//socket.emit('test passed');
		    			//buttonImageTest.visible = false;
		    			buttonImageTest.disableInteractive();
		    			this.scene.launch('ScenePerfect');
		    		} else {
		    			incorrectCount++;
		    			// console.log('incorrectCount = '+incorrectCount);
		    			isInstructionRevisit = true;
		    			instructionPosition = 0;
		    			if (incorrectCount<4) {
			    			// When you want to go back to previous scene,
			    			// you have to 'stop' scenes which are above the target scene
			    			// Otherwise, objects defined in those above scenes would hid the target scene
			    			game.scene.stop('SceneUnderstandingTest');
			    			game.scene.stop('SceneTutorialFeedback');
			    			game.scene.stop('SceneTutorial');
			    			game.scene.start('SceneInstruction', {indivOrGroup:indivOrGroup, exp_condition:exp_condition});
			    		} else {
			    			// completed = 'droppedTestScene';
			    			window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round((totalPayoff_perIndiv*cent_per_point))+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+'droppedTestScene'+'&latency='+submittedLatency;
			    		}
		    		}
		    	} else { // group condition
		    		if (JSON.stringify(answers) == JSON.stringify(quiz_correct_answers_group)) {
		    			//socket.emit('test passed');
		    			buttonImageTest.disableInteractive();
		    			this.scene.launch('ScenePerfect');
		    		} else {
		    			incorrectCount++;
		    			isInstructionRevisit = true;
		    			instructionPosition = 0;
		    			if (incorrectCount<4) {
			    			game.scene.stop('SceneUnderstandingTest');
			    			game.scene.stop('SceneTutorialFeedback');
			    			game.scene.stop('SceneTutorial');
			    			game.scene.start('SceneInstruction', {indivOrGroup:indivOrGroup, exp_condition:exp_condition});
			    		} else {
			    			// completed = 'droppedTestScene';
			    			window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round((totalPayoff_perIndiv*cent_per_point))+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+'droppedTestScene'+'&latency='+submittedLatency;
			    		}
		    		}
		    	}
		    	//socket.emit('test passed');
		    }, this);

		    // pointer over & out effects
		    buttonImageTest.on('pointerover', function (pointer) {
		    	buttonImageTest.setTint(0xa9a9a9);
		    }, this);
		    buttonImageTest.on('pointerout', function (pointer) {
		    	buttonImageTest.clearTint();
		    }, this);
		}

		update(){}
	};

	// ScenePerfect
	class ScenePerfect extends Phaser.Scene {

		constructor (){
		    	super({ key: 'ScenePerfect', active: false });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'

			// start image
			let perfectImg = this.add.image(configWidth/2, configHeight/2+100, 'perfectImg').setAlpha(0);
			let tween;

			//  Texts
		    //let title = this.add.text(configWidth/2, configHeight/2, '5', { fontSize: '36px', fill: '#000', fontstyle: 'bold' });

		    tween = this.tweens.add({
		        targets: perfectImg,
		        alpha: { value: 0.9, duration: 1500, ease: 'Power1' },
		        scale: { value: 1.5, duration: 1500, ease: 'Power1' },
		        //delay: 5000,
		        yoyo: true,
		        loop: 0 //-1
		    });
            setTimeout(function(){
                socket.emit('test passed');
            },1500);
		}

		update(){}
	};

	// SceneStartCountdown
	class SceneStartCountdown extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneStartCountdown', active: false });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'

			// start image
			let startImg = this.add.image(configWidth/2, configHeight/2, 'startImg').setAlpha(0);
			let tween;

			//  Texts
		    let title = this.add.text(configWidth/2, configHeight/2, '5', { fontSize: '36px', fill: '#000', fontstyle: 'bold' });

		    // tween = this.tweens.add({
		    //     targets: startImg,
		    //     alpha: { value: 0.9, duration: 1500, ease: 'Power1' },
		    //     scale: { value: 3, duration: 1500, ease: 'Power1' },
		    //     delay: 5000,
		    //     yoyo: true,
		    //     loop: 0 //-1
		    // });

		    setTimeout(function(){
                title.setText('4');
            },1000);
            setTimeout(function(){
                title.setText('3');
            },2000);
            setTimeout(function(){
                title.setText('2');
            },3000);
            setTimeout(function(){
                title.setText('1');
            },4000);
            setTimeout(function(that){
            	//let startImg = this.add.sprite(configWidth/2, configHeight/2, 'startImg').setAlpha(0);
            	title.destroy();

            	tween = that.tweens.add({
			        targets: startImg,
			        alpha: { value: 0.9, duration: 1500, ease: 'Power1' },
			        scale: { value: 3, duration: 1500, ease: 'Power1' },
			        delay: 0,
			        yoyo: true,
			        loop: 0 //-1
			    });

            	//this.add.tween(startImg).to( { alpha: 1 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);
            }, 5000, this);
            setTimeout(function(){
            	// tween.stop(); // To remove 'START' image tween
            	tween.remove();
            	startImg.visible = false;
                game.scene.start('SceneMain', {gameRound:gameRound, round:currentTrial});
                game.scene.stop('SceneStartCountdown');
                game.scene.stop('ScenePerfect');
                game.scene.stop('SceneWaitingRoom');
            },6500);
		}

		update(){}
	};

	// SceneMain -- main scene; experimental task
	class SceneMain extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneMain', active: false });

		    this.count = 0;
		}

		preload(){
			}

		init (data) {
			this.gameRound = data.gameRound;
			this.round = data.round;
		}

		create(){

			// console.log('restarting the main scene!: mySocialInfo = '+data.socialFreq[data.round-1]);

			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF');
			//console.log('SceneMain started. currentTrial: ' + currentTrial);
			// options
			// slot machines and choice button
		    let options = {};
		    let isChoiceMade = false;
		    let slotY_main = 400;

		    let trialText_Y = 16
		    ,	groupTotalScoreText_Y = 16 + 50 * 1
		    ,	costPaidText_Y = 16 + 50 * 2
		    ,	scoreText_Y = 16 + 50 * 3
		    ,	energyBar_Y = 16 + 50 * 2 // 16 + 50 * 4
		    ;

		    // let trialText_Y = 16
		    // ,	scoreText_Y = 66
		    // ,	energyBar_Y = 116
		    // ;

			// Creating options
		    for (let i=1; i<numOptions+1; i++) {
		    	options['box'+i] = this.add.sprite(option1_positionX+space_between_boxes*(i-1), slotY_main, 'machine'+(i + numOptions*gameRound)+'_normal');
		    	options['box_active'+i] = this.add.sprite(option1_positionX+space_between_boxes*(i-1), slotY_main, 'machine'+(i + numOptions*gameRound)+'_active');
		    	options['box'+i].setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
		    	options['box_active'+i].setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
		    	options['box_active'+i].visible = false;
		    }

			// confirmation text
			let confirmationContainer = this.add.container(175, slotY_main+20);
			let confirmationImage = this.add.sprite(0, 0, 'button').setDisplaySize(160,100).setAlpha(0.7);
			let confirmationText = this.add.text(0, 0, `Click again\nto confirm \nyour choice`, { fontSize: '20px', fill: '#000' }).setOrigin(0.5, 0.5);
			confirmationContainer.add(confirmationImage);
			confirmationContainer.add(confirmationText);
			confirmationContainer.visible = false; // it's hidden in default

			// =============== A looking-good timer =================================
			// the energy container. A simple sprite
			let energyContainer = this.add.sprite(400, energyBar_Y+18, 'energycontainer');
			// the energy bar. Another simple sprite
        	let energyBar = this.add.sprite(energyContainer.x + 46, energyContainer.y, 'energybar');
        	// a copy of the energy bar to be used as a mask. Another simple sprite but...
        	let energyMask = this.add.sprite(energyBar.x, energyBar.y, 'energybar');
        	// ...it's not visible...
        	energyMask.visible = false;
        	// resize them
        	let energyContainer_originalWidth = energyContainer.displayWidth
        	,	energyContainer_newWidth = 200
        	,	container_bar_ratio = energyBar.displayWidth / energyContainer.displayWidth
        	;
			energyContainer.displayWidth = energyContainer_newWidth;
			energyContainer.scaleY = energyContainer.scaleX;
			energyBar.displayWidth = energyContainer_newWidth * container_bar_ratio;
        	energyBar.scaleY = energyBar.scaleX;
        	energyBar.x = energyContainer.x + (46 * energyContainer_newWidth/energyContainer_originalWidth);
        	energyMask.displayWidth = energyBar.displayWidth;
        	energyMask.scaleY = energyMask.scaleX;
        	energyMask.x = energyBar.x;
        	// and we assign it as energyBar's mask.
        	energyBar.mask = new Phaser.Display.Masks.BitmapMask(this, energyMask);
        	// =============== A looking-good timer =================================

        	// =============== Count down =================================
        	this.timeLeft = maxChoiceStageTime / 1000;
			// a boring timer.
	        let gameTimer = this.time.addEvent({
	            delay: 1000,
	            callback: function(){
	                this.timeLeft --;

	                // dividing energy bar width by the number of seconds gives us the amount
	                // of pixels we need to move the energy bar each second
	                let stepWidth = energyMask.displayWidth / (maxChoiceStageTime/1000);

	                // moving the mask
	                energyMask.x -= stepWidth;
	                if (this.timeLeft < 1) {
	                	// By setting "isChoiceMade" a bit earlier than
	                	// the time is actually up, the two conflicting inputs,
	                	// a "miss" and an "actual choice" won't be executed at the same time
	                	isChoiceMade = true;
	                }
	                if(this.timeLeft < 0){
	                    currentChoiceFlag = -1
	                    for (let i=1; i<numOptions+1; i++) {
	                    	options['box'+i].visible = false;
	                    	options['box_active'+i].visible = false;
	                    }
		    //             options.box1.visible = false;
						// options.box1_active.visible = false;
		    //             options.box2.visible = false;
						// options.box2_active.visible = false;
						madeChoice(currentChoiceFlag, 'miss', optionOrder);
						game.scene.start('ScenePayoffFeedback', {didMiss: true, flag: currentChoiceFlag});
						isWaiting = true;
						gameTimer.destroy();
	                }
	            },
	            callbackScope: this,
	            loop: true
	        });
	        // =============== Count down =================================

	        for (let i=1; i<numOptions+1; i++) {
	        	// pointerdown - normal option
	        	options['box'+i].on('pointerdown', function (pointer) {
					options['box'+i].visible = false;
					options['box_active'+i].visible = true;
					confirmationContainer.x = option1_positionX + space_between_boxes*(i-1);
					confirmationContainer.visible = true;
					currentChoiceFlag = i;
					for (let j=1; j<numOptions+1; j++) {
						if(currentChoiceFlag > 0 & currentChoiceFlag != j) {
							options['box_active'+j].visible = false;
							options['box'+j].visible = true;
						}
					}
			    }, this);
	        	// pointerdown - activated option
	        	options['box_active'+i].on('pointerdown', function (pointer) {
			    	//clearTimeout(countDownChoiceStage);
			    	if(!isChoiceMade) {
			    		madeChoice(currentChoiceFlag, exp_condition, optionOrder);
			    		gameTimer.destroy();
			    		game.scene.start('ScenePayoffFeedback', {didMiss: false, flag: currentChoiceFlag});
			    		isWaiting = true;
			    		isChoiceMade = true;
			    		for (let j=1; j<numOptions+1; j++) {
			    			options['box'+j].visible = false;
			    		}
			    		options['box_active'+i].visible = false;
			    		confirmationContainer.visible= false;
			    	}
			    }, this);
			    // pointerover
				options['box'+i].on('pointerover', function (pointer) {
			    	options['box'+i].setTint(0xb8860b); //B8860B ff0000
			    }, this);
			    // pointerout
				options['box'+i].on('pointerout', function (pointer) {
			    	options['box'+i].clearTint();
			    }, this);
	        }

		    // ------------ Texts appear above the slots
		    trialText = this.add.text(16, trialText_Y
		    	, 'Current trial: ' + currentTrial + ' / ' + horizon
		    	// , ''
		    	, { fontSize: '30px', fill: nomalTextColor });

		    groupTotalScoreText = this.add.text(16, groupTotalScoreText_Y
		    	, ''
		    	// , 'Team\'s total score: ' + groupTotalScore + ' (your share: ' + totalPayoff_perIndiv + ')'
		    	, { fontSize: '30px', fill: nomalTextColor });

		    costPaidText = this.add.text(16, costPaidText_Y
		    	, ''
		    	// , 'Sharing fee you paid: '
		    	, { fontSize: '30px', fill: nomalTextColor });
		    costPaidText_2 = this.add.text(16 + 400, costPaidText_Y
		    	, ''
		    	// , '-' + info_share_cost_total
		    	, { fontSize: '30px', fill: noteColor });

		    this.groupSizeText = this.add.text(16, scoreText_Y
		    	// , 'Total score: ' + score
		    	, 'Number of players: ' + currentGroupSize.toString()
		    	// , 'Your net score: ' + (totalPayoff_perIndiv - info_share_cost_total)
		    	, { fontSize: '30px', fill: nomalTextColor });
		    timeText = this.add.text(16, energyBar_Y
		    	, 'Remaining time: '
		    	, { fontSize: '30px', fill: nomalTextColor });

		    payoffText = this.add.text(feedbackTextPosition, slotY_main+100
		    	, ``
		    	, { fontSize: '25px', fill: nomalTextColor, align: 'center' }).setOrigin(0.5, 0.5);

		    // payoffText.setText(`You produced\n${payoff}`);

		    // // The following 'You earned $??' might be misleading as this is a group-optimization task
		    // if (didShare != 1) {
			   //  payoffText.setText(`You earned \n${payoff}`);
		    // } else {
		    // 	payoffText.setText(`You earned \n${payoff} - ${info_share_cost}`);
		    // }
		    // // ==============================================================================

		    // if(currentTrial === 1) {
		    // 	payoffText.visible = false;
		    // } else {
		    // 	payoffText.visible = false; //true;
		    // }
		    // payoffText.visible = false;
		    // --------------------------------------------

		    // social information
		    let socialFreqNumbers = {};
		    if (indivOrGroup == 1) {
		    	for (let i = 1; i < numOptions+1; i++) {
		    		socialFreqNumbers['option'+i] = this.add.text(option1_positionX + space_between_boxes*(i-1), slotY_main-80, `${mySocialInfoList['option'+i]} people`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		    	}
		    } else { // individual condition
		    	for (let i = 1; i < numOptions+1; i++) {
		    		socialFreqNumbers['option'+i] = this.add.text(option1_positionX + space_between_boxes*(i-1), slotY_main-80, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		    		if (mySocialInfoList['option'+i] > 0) {
		    			// console.log('mySocialInfoList option '+ i +' is visible');
		    			socialFreqNumbers['option'+i].visible = true;
		    		} else {
		    			// console.log('mySocialInfoList option '+ i +' is NOT visible');
		    			socialFreqNumbers['option'+i].visible = false;
		    		}
		    	}
		    }
		    // No social info visible
		    // (change inside of the if() when you want to show "?? people" info)
		    if(currentTrial > 0) { //-> if(currentTrial==1) {
		    	for (let i = 1; i < numOptions+1; i++) {
		    		socialFreqNumbers['option'+i].visible = false;
		    	}
		    }
		    //  Stars that are evenly spaced 70 pixels apart along the x axis
		    let numberOfPreviousChoice = [];
		    let shared_payoff = [];
		    let shared_option_position = [];
		    for (let i = 0; i < maxGroupSize; i++) {
		    	if (typeof subjectNumber != 'undefined' & share_or_not[i] != null) {
		    		if (i+1 != subjectNumber & share_or_not[i].share == 1) { // <- only info shared by others will be shown
		    			shared_payoff.push(share_or_not[i].payoff);
		    			// shared_option_position.push( optionOrder.indexOf(optionsKeyList.indexOf(mySocialInfo[i])) )
		    			shared_option_position.push(share_or_not[i].position);
		    		}
		    	}
		    }
		    for (let i = 1; i < numOptions+1; i++) {
		    	numberOfPreviousChoice[i-1] = mySocialInfoList['option'+i]
		    }

		    // --- Social frequency information (used in Toyokawa & Gaissmaier 2020)
		    // Turn this on when you want to show the frequency-information
		    // and turn off the 'publicInfo.call' in this case
		    //
		    // showStars_4ab.call(this, numberOfPreviousChoice[0], numberOfPreviousChoice[1], numberOfPreviousChoice[2], numberOfPreviousChoice[3], slotY_main-90);
		    //
		    // --------------------------------------------------------------------
		    if(this.round > 1) {
		    	showPublicInfo.call(this, shared_payoff, shared_option_position, slotY_main-90);
		    } else {
		    	console.log('No public info should be shown!')
		    }

			// createWindow('SceneMessagePopUp'); //this.createWindow(SceneMessagePopUp); // pop up window saying 'another member has been dropped out'

		}

		update(){
			this.groupSizeText.setText('Number of players: ' + currentGroupSize.toString());
		}

	};

	// ScenePayoffFeedback
	class ScenePayoffFeedback extends Phaser.Scene {

		constructor (){
		    super({ key: 'ScenePayoffFeedback', active: false });
		}

		preload(){
			}

		init (data) {
			this.didMiss = data.didMiss;
			this.flag = data.flag;
		}

		create(){

			let energyBar_Y = 16 + 50 * 2 // 16 + 50 * 4
			,	confirmationTimer
		    ;
		    // =============== A looking-good timer =================================
			// the energy container. A simple sprite
			let energyContainer = this.add.sprite(400, energyBar_Y+18, 'energycontainer');
			// the energy bar. Another simple sprite
			let energyBar = this.add.sprite(energyContainer.x + 46, energyContainer.y, 'energybar');
			// a copy of the energy bar to be used as a mask. Another simple sprite but...
			let energyMask = this.add.sprite(energyBar.x, energyBar.y, 'energybar');
			// ...it's not visible...
			energyMask.visible = false;
			// resize them
			let energyContainer_originalWidth = energyContainer.displayWidth
			,	energyContainer_newWidth = 200
			,	container_bar_ratio = energyBar.displayWidth / energyContainer.displayWidth
			;
			energyContainer.displayWidth = energyContainer_newWidth;
			energyContainer.scaleY = energyContainer.scaleX;
			energyBar.displayWidth = energyContainer_newWidth * container_bar_ratio;
			energyBar.scaleY = energyBar.scaleX;
			energyBar.x = energyContainer.x + (46 * energyContainer_newWidth/energyContainer_originalWidth);
			energyMask.displayWidth = energyBar.displayWidth;
			energyMask.scaleY = energyMask.scaleX;
			energyMask.x = energyBar.x;
			// and we assign it as energyBar's mask.
			energyBar.mask = new Phaser.Display.Masks.BitmapMask(this, energyMask);
			energyContainer.visible = false;
    		energyBar.visible = false;
    		energyMask.visible = false;
			// =============== A looking-good timer =================================

			// background colour
			this.cameras.main.setBackgroundColor(backgroundcolour_feedback);//#d9d9d9 = grey #ffffff = white
			//  Texts
			let slotY_main = 400;
			objects_feedbackStage = {};
			for (let i=1; i<numOptions+1; i++) {
				objects_feedbackStage['box'+i] = this.add.sprite(option1_positionX+space_between_boxes*(i-1), slotY_main, 'machine'+(i+numOptions*gameRound)+'_active').setDisplaySize(optionWidth, optionHeight);
				if (i != this.flag) {
					objects_feedbackStage['box'+i].visible = false;
					// console.log('option '+ i +' is invisible because thisflag = '+this.flag);
				} else {
					objects_feedbackStage['box'+i].visible = true;
					// console.log('option '+ i +' is visible because thisflag = '+this.flag);
				}
			}

			// YES button
			let button_style = { fontSize: '24px', fill: '#000' , align: "center" };
			let buttonContainer_yes = this.add.container(200, 200); //position
			let buttonImage_yes = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_yes = this.add.text(0, 0, 'YES\n(cost: ' + info_share_cost + ' points)', button_style);
			buttonText_yes.setOrigin(0.5, 0.5);
			buttonContainer_yes.add(buttonImage_yes);
			buttonContainer_yes.add(buttonText_yes);
			buttonContainer_yes.visible = false;

			// NO button
			let buttonContainer_no = this.add.container(600, 200); //position
			let buttonImage_no = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_no = this.add.text(0, 0, 'NO\n(No cost)', button_style);
			buttonText_no.setOrigin(0.5, 0.5);
			buttonContainer_no.add(buttonImage_no);
			buttonContainer_no.add(buttonText_no);
			buttonContainer_no.visible = false;

			// Yes I am still there! button
			let buttonContainer_confirm = this.add.container(400, 200); //position
			let buttonImage_confirm = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_confirm = this.add.text(0, 0, 'Yes, I am!', button_style);
			buttonText_confirm.setOrigin(0.5, 0.5);
			buttonContainer_confirm.add(buttonImage_confirm);
			buttonContainer_confirm.add(buttonText_confirm);
			buttonContainer_confirm.visible = false;

			// pointer over & out effects
		    buttonImage_yes.on('pointerover', function (pointer) {
		    	buttonImage_yes.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_yes.on('pointerout', function (pointer) {
		    	buttonImage_yes.clearTint();
		    }, this);
		    buttonImage_no.on('pointerover', function (pointer) {
		    	buttonImage_no.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_no.on('pointerout', function (pointer) {
		    	buttonImage_no.clearTint();
		    }, this);
		     buttonImage_confirm.on('pointerover', function (pointer) {
		    	buttonImage_confirm.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_confirm.on('pointerout', function (pointer) {
		    	buttonImage_confirm.clearTint();
		    }, this);

		    buttonImage_yes.on('pointerdown', function (pointer) {
		    	currentChoiceFlag = 0;
		    	didShare = 1;
		    	score -= info_share_cost; // <- The cost of sharing information
		    	info_share_cost_total += info_share_cost;
		    	waitOthersText.setText('Please wait for others...');
		    	socket.emit('result stage ended'
		    			, {share: didShare
		    			, payoff: payoff
		    			, num_choice: this.flag
		    			, info_share_cost: info_share_cost
		    			// , totalEarning: (payoff - didShare * info_share_cost)
		    			// , what_produced: payoff
		    			, sharing_cost: 1 * info_share_cost
		    			, thisTrial: currentTrial
		    		});
		    	buttonContainer_yes.visible = false;
		    	buttonContainer_no.visible = false;
		    }, this);

		    buttonImage_no.on('pointerdown', function (pointer) {
		    	currentChoiceFlag = 0;
		    	didShare = 0;
		    	waitOthersText.setText('Please wait for others...');
		    	socket.emit('result stage ended'
		    			, {share: didShare
		    			, payoff: payoff
		    			, num_choice: this.flag
		    			, info_share_cost: info_share_cost
		    			// , totalEarning: (payoff - didShare * info_share_cost)
		    			// , what_produced: payoff
		    			, sharing_cost: 0 * info_share_cost
		    			, thisTrial: currentTrial
		    		});
		    	buttonContainer_yes.visible = false;
		    	buttonContainer_no.visible = false;
		    }, this);

		    buttonImage_confirm.on('pointerdown', function (pointer) {
		    	currentChoiceFlag = 0;
		    	didShare = 0;
		    	waitOthersText.setText('Please wait for others...');
		    	socket.emit('result stage ended'
		    			, {share: didShare
		    			, payoff: payoff
		    			, num_choice: this.flag
		    			, info_share_cost: info_share_cost
		    			// , totalEarning: (payoff - didShare * info_share_cost)
		    			// , what_produced: payoff
		    			, sharing_cost: 0 * info_share_cost
		    			, thisTrial: currentTrial
		    		});
		    	buttonContainer_confirm.visible = false;
		    	confirmationTimer.destroy();

		    }, this);


			if(this.flag == -1) {
				feedbackTextPosition = missPositionX;
				//this.flag = 0;
				// console.log('feedbackTextPosition set is done: feedbackTextPosition == '+ feedbackTextPosition);
			} else {
				// console.log('scenefeedbackstage: this.flag == '+ this.flag);
				// for(let i=1; i<numOptions+1; i++) {
				// 	if(i == this.flag){
				// 		objects_feedbackStage['box'+this.flag].visible = true;
				// 	}else{
				// 		objects_feedbackStage['box'+this.flag].visible = false;
				// 	}
				// }
				// objects_feedbackStage['box'+this.flag].visible = true;
				feedbackTextPosition = option1_positionX + space_between_boxes * (this.flag - 1);
				//this.flag = 0;
				// console.log('feedbackTextPosition set is done: feedbackTextPosition == '+ feedbackTextPosition);
			}

			if (this.didMiss) {
				payoffText = this.add.text(feedbackTextPosition, slotY_main-80, `Missed!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
			} else {
		    	payoffText = this.add.text(feedbackTextPosition, slotY_main-80, `${payoff} points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
		    	payoffText.setFontSize(10 + 1.5*Math.sqrt(1/2 * payoff)); //originally: 1*Math.sqrt(2/3 * payoff)
			}

			if (indivOrGroup == 1) {
				if(!this.didMiss & currentTrial < horizon) {
					// When this is a group condition, sharing choice will appear
					setTimeout(function(){
						waitOthersText = this.add.text(16, 60, 'Do you want to share this information\nwith other members?', { fontSize: '30px', fill: '#000', align: "center"});
						buttonContainer_yes.visible = true;
						buttonContainer_no.visible = true;
					}.bind(this),  1 * 1000);
				} else if (currentTrial >= horizon) {
					waitOthersText = this.add.text(16, 60, 'Please wait for others...', { fontSize: '30px', fill: '#000', align: "center"});
					setTimeout(function(){
				    	currentChoiceFlag = 0;
				    	socket.emit('result stage ended'
			    			, {share: 0
			    			, payoff: payoff
			    			, num_choice: this.flag
			    			, info_share_cost: info_share_cost
			    			// , totalEarning: (payoff - didShare * info_share_cost)
			    			// , what_produced: payoff
		    				, sharing_cost: 0 * info_share_cost
			    			, thisTrial: currentTrial
			    		});
				    }.bind(this), feedbackTime * 1000); //2.5 * 1000 ms was the original
				} else {
					// if missed
					setTimeout(function(){

						waitOthersText = this.add.text(16, 60, 'You\'ve missed this round!\nAre you still there?', { fontSize: '30px', fill: '#000', align: "center"});
						buttonContainer_confirm.visible = true;

						//
						energyContainer.visible = true;
			    		energyBar.visible = true;
			    		energyMask.visible = true;

						// =============== Count down =================================
						this.timeLeft = maxConfirmationWhenMissed / 1000;
						// a boring timer.
						confirmationTimer = this.time.addEvent({
						    delay: 1000,
						    callback: function(){
						        this.timeLeft --;

						        // dividing energy bar width by the number of seconds gives us the amount
						        // of pixels we need to move the energy bar each second
						        let stepWidth = energyMask.displayWidth / (maxConfirmationWhenMissed/1000);

						        // moving the mask
						        energyMask.x -= stepWidth;

						        if(this.timeLeft < 0){
						            // You could give a change to the shortly disconnected client to go back to the session
									// However, for now I just redirect them to the questionnaire
									socket.io.opts.query = 'sessionName=already_finished';
									socket.disconnect();
									window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round((totalPayoff_perIndiv*cent_per_point))+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed=no_response'+'&latency='+submittedLatency;
									confirmationTimer.destroy();
									buttonContainer_confirm.visible = false;
									waitOthersText.setText('Time was up! \nTransitioning to the questionnaire...');
									energyContainer.visible = false;
						    		energyBar.visible = false;
						    		energyMask.visible = false;
						        }
						    },
						    callbackScope: this,
						    loop: true
						});
						// =============== Count down =================================

					}.bind(this),  1 * 400);

				}
			} else {
				waitOthersText = this.add.text(16, 60, '', { fontSize: '30px', fill: '#000', align: "center"});
				setTimeout(function(){
			    	//payoffText.destroy();
			    	//game.scene.stop('ScenePayoffFeedback');
			    	// isWaiting = false
			    	//game.scene.start('SceneMain', {gameRound:gameRound, round:currentTrial});
			    	//console.log('emitting result stage ended!');
			    	currentChoiceFlag = 0;
			    	socket.emit('result stage ended'
		    			, {share: 0
		    			, payoff: payoff
		    			, num_choice: this.flag
		    			, info_share_cost: info_share_cost
		    			// , totalEarning: (payoff - 0 * info_share_cost)
		    			// , what_produced: payoff
		    			, sharing_cost: 0 * info_share_cost
		    			, thisTrial: currentTrial
		    		});
			    }.bind(this), feedbackTime * 1000); //2.5 * 1000 ms was the original
			}


		}
		update(){}
	};

	// SceneGoToQuestionnaire
	class SceneGoToQuestionnaire extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneGoToQuestionnaire', active: false });
		}

		preload(){
		}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'
			// text styles
			const textStyle =
				{ fontSize: '30px', fill: nomalTextColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true } };
			const noteStyle =
				{ fontSize: '36px', fill: noteColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true }, fontstyle: 'bold' };
			//  Texts
			// let totalEarning_USD = Math.round((totalPayoff_perIndiv*cent_per_point))/100
			let totalEarning_USD = Math.round((totalPayoff_perIndiv*cent_per_point))/100
			let waitingBunis_USD = Math.round(waitingBonus)/100
		    let title = this.add.text(configWidth/2, 18, goToQuestionnaireText[0], { fontSize: '36px', fill: '#000', fontstyle: 'bold' });
		    let note1 = this.add.text(configWidth/2, 90, goToQuestionnaireText[1]+totalEarning_USD, noteStyle);
		    let note2 = this.add.text(configWidth/2, 90+50*2, goToQuestionnaireText[2]+waitingBunis_USD, noteStyle);
		    //let note3 = this.add.text(configWidth/2, 90+50*4, goToQuestionnaireText[3], noteStyle);
		    title.setOrigin(0.5, 0.5);
		    note1.setOrigin(0.5, 0.5);
		    note2.setOrigin(0.5, 0.5);
		    //note3.setOrigin(0.5, 0.5);

		    // POST
		    let questionnaireStarts = document.getElementById('questionnaireStarts');

			questionnaireStarts.innerHTML = "<div class='btn2'><div id='connectBtn'>START SHORT SURVEY</div></div>";

			let connectBtn = document.getElementById('connectBtn');
			connectBtn.addEventListener('click', goToQuestionnaire, false); // execute function goToQuestionnaire()
		}

		update(){}
	};

	// SceneGoToQuestionnaire
	class SceneGoToNewGameRound extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneGoToNewGameRound', active: false });
		}

		preload(){
		}

		create(){
			payoffText.visible = false;
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'
			// text styles
			const textStyle =
				{ fontSize: '30px', fill: nomalTextColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true } };
			const noteStyle =
				{ fontSize: '36px', fill: noteColor, wordWrap: { width: configWidth-80, useAdvancedWrap: true }, fontstyle: 'bold' };
			//  Texts
			// let totalEarning_USD = Math.round((totalPayoff_perIndiv*cent_per_point))/100
			let totalEarning_USD = Math.round((totalPayoff_perIndiv*cent_per_point))/100
			let waitingBunis_USD = Math.round(waitingBonus)/100
		    let title = this.add.text(configWidth/2, 18, goToNewGameRoundText[0], { fontSize: '36px', fill: '#000', fontstyle: 'bold' });
		    let note1 = this.add.text(configWidth/2, 90, goToNewGameRoundText[1] + gameRound, noteStyle);
		    let note2 = this.add.text(configWidth/2, 90+50*2, goToNewGameRoundText[2], noteStyle);
		    //let note3 = this.add.text(configWidth/2, 90+50*4, goToNewGameRoundText[3], noteStyle);
		    title.setOrigin(0.5, 0.5);
		    note1.setOrigin(0.5, 0.5);
		    note2.setOrigin(0.5, 0.5);
		    //note3.setOrigin(0.5, 0.5);

		    // Next game round button
			let button_style = { fontSize: '24px', fill: '#000' , align: "center" };
			let buttonContainer_nextGameRound = this.add.container(configWidth/2, 400); //position
			let buttonImage_nextGameRound = this.add.sprite(0, 0, 'button').setDisplaySize(300, 100).setInteractive({ cursor: 'pointer' });
			let buttonText_nextGameRound = this.add.text(0, 0, 'Go to Round ' + (gameRound+1), button_style);
			buttonText_nextGameRound.setOrigin(0.5, 0.5);
			buttonContainer_nextGameRound.add(buttonImage_nextGameRound);
			buttonContainer_nextGameRound.add(buttonText_nextGameRound);
			buttonContainer_nextGameRound.visible = true;

			// pointer over & out effects
		    buttonImage_nextGameRound.on('pointerover', function (pointer) {
		    	buttonImage_nextGameRound.setTint(0xa9a9a9);
		    }, this);
		    buttonImage_nextGameRound.on('pointerout', function (pointer) {
		    	buttonImage_nextGameRound.clearTint();
		    }, this);

		    buttonImage_nextGameRound.on('pointerdown', function (pointer) {
		    	game.scene.stop('SceneMain');
		    	game.scene.stop('ScenePerfect');
		    	game.scene.stop('SceneStartCountdown');
		    	// currentTrial = 1;
		    	socket.emit('new gameRound ready');
		    }, this);

		}

		update(){}
	};

	// SceneMessagePopUp
	class SceneMessagePopUp extends Phaser.Scene {

		// constructor (handle, parent){
		//     super({ key: handle, active: false });

		//     this.parent = parent;
		// }
		constructor () {
			super({ key: 'SceneMessagePopUp', active: false });
		}

		init (data) {
			this.msg = data.msg;
		}

		create(){
			// background
			this.cameras.main.setViewport(0, 0, SceneMessagePopUp.WIDTH, SceneMessagePopUp.HEIGHT); //#FFFFFF == 'white'
			this.cameras.main.setBackgroundColor('#000');
			// text styles
			this.textStyle =
				{ fontSize: '20px', fill: '#FFFF33' };
			//  Texts
			this.groupSizeText = this.add.text(configWidth/2, 10
				, this.msg
				, this.textStyle).setOrigin(0.5, 0);
		}

	};

	SceneMessagePopUp.WIDTH = configWidth;
	SceneMessagePopUp.HEIGHT = 50;

	let config = {
	    type: Phaser.AUTO, // Phaser.CANVAS, Phaser.WEBGL, or Phaser.AUTO
	    width: configWidth,
	    height: configHeight,
	    physics: {
	        default: 'arcade',
	        arcade: {
	            gravity: { y: 300 },
	            debug: false
	        }
	    },
	    parent: 'phaser-game-main',
	    scale: {
	        _mode: Phaser.Scale.FIT,
	        parent: 'phaser-game-main',
	        autoCenter: Phaser.Scale.CENTER_BOTH,
	        width: configWidth,
	        height: configHeight
	    },
	    dom: {
        	createContainer: true
    	},
	    scene:
	    [ SceneWaitingRoom0
	    , SceneWaitingRoom
	    , SceneWaitingRoom2
	    , SceneInstruction
    	, SceneTutorial
    	, SceneTutorialFeedback
    	, SceneTutorialShaingCostExplained
    	, SceneBeforeUnderstandingTest
    	, SceneUnderstandingTest
    	, ScenePerfect
    	, SceneStartCountdown
    	, SceneMain
    	, ScenePayoffFeedback
    	, SceneGoToNewGameRound
    	, SceneGoToQuestionnaire
    	, SceneMessagePopUp
    	]
	};

	let game = new Phaser.Game(config);
	game.scene.add('SceneWaitingRoom0');
	game.scene.add('SceneWaitingRoom');
	game.scene.add('SceneWaitingRoom2');
	game.scene.add('SceneInstruction');
	game.scene.add('SceneTutorial');
	game.scene.add('SceneTutorialFeedback');
	game.scene.add('SceneBeforeUnderstandingTest');
	game.scene.add('SceneUnderstandingTest');
	game.scene.add('ScenePerfect');
	game.scene.add('SceneStartCountdown');
	game.scene.add('SceneMain');
	game.scene.add('ScenePayoffFeedback');
	game.scene.add('SceneGoToQuestionnaire');
	game.scene.add('SceneGoToNewGameRound');
	game.scene.add('SceneMessagePopUp');


	// functions

	function createWindow (scene_name, data) {

		game.scene.start(scene_name, data);
		game.scene.bringToTop(scene_name);

		setTimeout(function(){
			game.scene.stop(scene_name);
		},3000);

	}

    function showStars_4ab (num_option1, num_option2, num_option3, num_option4, socialInfoY) {

    	let mod_num_option1 = num_option1 % 5
    	,	mod_num_option2 = num_option2 % 5
    	,	mod_num_option3 = num_option3 % 5
    	,	mod_num_option4 = num_option4 % 5
    	,	quotient_num_option1 = Math.floor(num_option1 / 5)
    	,	quotient_num_option2 = Math.floor(num_option2 / 5)
    	,	quotient_num_option3 = Math.floor(num_option3 / 5)
    	,	quotient_num_option4 = Math.floor(num_option4 / 5)
    	,	option1_positionX_new = (option1_positionX + space_between_boxes*0)-15 + 10*quotient_num_option1
    	,	option2_positionX_new = (option1_positionX + space_between_boxes*1)-15 + 10*quotient_num_option2
    	,	option3_positionX_new = (option1_positionX + space_between_boxes*2)-15 + 10*quotient_num_option3
    	,	option4_positionX_new = (option1_positionX + space_between_boxes*3)-15 + 10*quotient_num_option4
    	;

    	// option1
    	// First, draw 5 stars
    	if (quotient_num_option1 > 0) {
    		for (let q=0; q<quotient_num_option1; q++) {
	    		stars_option1[q] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
			        // which is just what we need for our game:
			        repeat: 5-1,
			        setXY: { x: option1_positionX_new - 20*q, y: socialInfoY-25, stepY: -15 }
			    });
	    	}
    	}
    	// Then, draw the remaining stars
    	if (mod_num_option1 > 0) {
    		stars_sure[quotient_num_option1] = this.add.group({
		        key: 'star',
		        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
		        // which is just what we need for our game:
		        repeat: mod_num_option1-1,
		        setXY: { x: option1_positionX_new - 20*quotient_num_option1, y: socialInfoY-25, stepY: -15 }
		    });
    	}

    	// option2
    	// First, draw 5 stars
    	if (quotient_num_option2 > 0) {
    		for (let q=0; q<quotient_num_option2; q++) {
	    		stars_option2[q] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
			        // which is just what we need for our game:
			        repeat: 5-1,
			        setXY: { x: option2_positionX_new - 20*q, y: socialInfoY-25, stepY: -15 }
			    });
	    	}
    	}
    	// Then, draw the remaining stars
    	if (mod_num_option2 > 0) {
    		stars_sure[quotient_num_option2] = this.add.group({
		        key: 'star',
		        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
		        // which is just what we need for our game:
		        repeat: mod_num_option2-1,
		        setXY: { x: option2_positionX_new - 20*quotient_num_option2, y: socialInfoY-25, stepY: -15 }
		    });
    	}

    	// option3
    	// First, draw 5 stars
    	if (quotient_num_option3 > 0) {
    		for (let q=0; q<quotient_num_option3; q++) {
	    		stars_option3[q] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
			        // which is just what we need for our game:
			        repeat: 5-1,
			        setXY: { x: option3_positionX_new - 20*q, y: socialInfoY-25, stepY: -15 }
			    });
	    	}
    	}
    	// Then, draw the remaining stars
    	if (mod_num_option3 > 0) {
    		stars_sure[quotient_num_option3] = this.add.group({
		        key: 'star',
		        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
		        // which is just what we need for our game:
		        repeat: mod_num_option3-1,
		        setXY: { x: option3_positionX_new - 20*quotient_num_option3, y: socialInfoY-25, stepY: -15 }
		    });
    	}

    	// option4
    	// First, draw 5 stars
    	if (quotient_num_option4 > 0) {
    		for (let q=0; q<quotient_num_option4; q++) {
	    		stars_option4[q] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
			        // which is just what we need for our game:
			        repeat: 5-1,
			        setXY: { x: option4_positionX_new - 20*q, y: socialInfoY-25, stepY: -15 }
			    });
	    	}
    	}
    	// Then, draw the remaining stars
    	if (mod_num_option4 > 0) {
    		stars_sure[quotient_num_option4] = this.add.group({
		        key: 'star',
		        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total,
		        // which is just what we need for our game:
		        repeat: mod_num_option4-1,
		        setXY: { x: option4_positionX_new - 20*quotient_num_option4, y: socialInfoY-25, stepY: -15 }
		    });
    	}
    }

    function showPublicInfo (shared_payoff, shared_option_position, socialInfoY) {
    	// console.log('shared_payoff = ' + shared_payoff);
    	// console.log('shared_option_position = ' + shared_option_position);

    	let public_info_text = []
    	,	public_info_text_position = []
    	,	public_info_count = repeatelem(0, numOptions)
    	;

		for (let i=0; i < numOptions; i++) {
    		public_info_text_position[i] = (option1_positionX + space_between_boxes * i)-15;
    	}

    	for (let i=0; i < shared_payoff.length; i++) {
    		// Adding payoff texts
		    public_info_text[i] = this.add.text(
		    	public_info_text_position[shared_option_position[i]-1]
		    	, socialInfoY - 25 * public_info_count[shared_option_position[i]-1]
		    	, shared_payoff[i]
		    	, { fontSize: '30px', fill: noteColor }
		    	).setOrigin(0.5, 0.5);
		    // Updating how many times the same X position has been counted already
		    public_info_count[shared_option_position[i]-1]++;
    	}

    }

    // madeChoice
    function madeChoice (flag, distribution, optionOrder) {
    	// A new cost is set
    	info_share_cost = rand(100, 0);

        let thisChoice;
        if (flag == -1) {
        	thisChoice = 0;//'miss';
			payoffText.x = 400;
		} else {
			// "flag" just indicates a position of the chosen option in the subject's monitor,
        	// e.g., flag == 1 when she chose the left option.
        	// Therefore, I need to translate this position into the actual option
        	// thisChoice is an indicator of the actual option chosen
        	thisChoice = optionOrder[flag -1];
			payoffText.x = option1_positionX + space_between_boxes*(flag-1);
		}

		// calculating the payoff from this choice
		if (distribution == 'miss') {
			payoff = 0;
			didShare = 0;
			if (indivOrGroup > -1) { // if don't want to send indiv data, indivOrGroup == 1
				socket.emit('choice made', {chosenOptionFlag:-1, choice: 'miss', payoff: 0, socialInfo:mySocialInfo, publicInfo:myPublicInfo, totalEarning: totalEarning, subjectNumber:subjectNumber, riskDistributionId:riskDistributionId, thisTrial:currentTrial});
			} else {
				saveChoiceDataLocally({choice: thisChoice, payoff: 0, socialInfo:mySocialInfo, publicInfo:myPublicInfo, totalEarning: totalEarning, subjectNumber:subjectNumber, riskDistributionId:riskDistributionId});
			}
        	//console.log('choice was made: choice = ' + thisChoice + ' and payoff = ' + 0 + '.');
		} else if (distribution == 'binary') {
			console.log('thisChoice = ' + thisChoice +' and optionsKeyList[thisChoice-1] = ' + optionsKeyList[thisChoice-1]);
			payoff = randomChoiceFromBinary(flag, thisChoice-1, optionsKeyList[thisChoice-1], payoffList[optionsKeyList[thisChoice-1]], probabilityList[optionsKeyList[thisChoice-1]], mySocialInfo, myPublicInfo);
			// payoff = randomChoiceFromTwo(thisChoice, payoffList[thisChoice], probabilityList[thisChoice], mySocialInfo, myPublicInfo);
		} else {
			payoff = randomChoiceFromGaussian(thisChoice, mySocialInfo, myPublicInfo);
		}
		score += payoff;
		// scoreText.setText('Total score: ' + score);
		payoffText.setText(payoff);
		payoffText.visible = true;
		trialText.setText('Current trial: ' + currentTrial + ' / ' + horizon);
    }

    function randomChoiceFromBinary(chosenOptionFlag, num_choice, choice, payoffList, p_rare, socialInfo, publicInfo) {
		let roulette = Math.random()
    	let noise = BoxMuller(0, smallNoise)
    	let thisPayoff
    	if (p_rare < roulette) { // common event
    		thisPayoff = Math.floor((payoffList[0] + noise)*100);
    		if (thisPayoff<0) thisPayoff = 0;
    		myEarnings.push(thisPayoff);
            myChoices.push(choice);
    	} else { // rare event
    		thisPayoff = Math.floor((payoffList[1] + noise)*100);
    		if (thisPayoff<0) thisPayoff = 0;
    		myEarnings.push(thisPayoff);
            myChoices.push(choice);
    	}
    	myLastChoiceFlag = chosenOptionFlag;
    	if (indivOrGroup > -1) { // if don't want to send indiv data, indivOrGroup == 1
			socket.emit('choice made', {chosenOptionFlag:chosenOptionFlag, num_choice: num_choice, choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber, riskDistributionId:riskDistributionId, thisTrial:currentTrial});
    	} else {
    		saveChoiceDataLocally({chosenOptionFlag:chosenOptionFlag, choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber, riskDistributionId:riskDistributionId});
    	}
        //console.log('choice was made: choice = ' + choice + ' and payoff = ' + thisPayoff + '.');
    	return thisPayoff;
	}


	function randomChoiceFromFour_decreasing(this_trial, chosenOptionFlag, num_choice, choice, payoffList, p_rare, socialInfo, publicInfo) {
		let roulette = Math.random()
    	let noise = BoxMuller(0, smallNoise)
    	let thisPayoff
    	let thisPayoff_base
    	// == this block manages the decrease of the mean payoff of the sure options
    	if (choice == 'sure1') {
    		thisPayoff_base = payoffList[0] - (1/60) * (this_trial - 10);
    		if (thisPayoff_base > 2) {thisPayoff_base = 2};
    		// console.log('sure 1: ' + thisPayoff_base);
    	} else if (choice == 'sure2' | choice == 'sure3') {
    		thisPayoff_base = payoffList[0] - (1/60) * this_trial;
    		if (thisPayoff_base < 0.25) {thisPayoff_base = 0.25};
    	} else {
    		thisPayoff_base = payoffList[1]
    	}
    	// == end of the decreasing payoff
    	if (p_rare < roulette) { // common event
    		thisPayoff = Math.floor((payoffList[0] + noise)*100);
    		myEarnings.push(thisPayoff);
            myChoices.push(choice);
    	} else { // rare event
    		thisPayoff = Math.floor((thisPayoff_base + noise)*100);
    		myEarnings.push(thisPayoff);
            myChoices.push(choice);
    	}
    	myLastChoiceFlag = chosenOptionFlag;
    	if (indivOrGroup > -1) { // if don't want to send indiv data, indivOrGroup == 1
			socket.emit('choice made 4ab', {chosenOptionFlag:chosenOptionFlag, num_choice: num_choice, choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber, riskDistributionId:riskDistributionId, thisTrial:currentTrial});
    	} else {
    		saveChoiceDataLocally({chosenOptionFlag:chosenOptionFlag, choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber, riskDistributionId:riskDistributionId});
    	}
        //console.log('choice was made: choice = ' + choice + ' and payoff = ' + thisPayoff + '.');
    	return thisPayoff;
	}



	// random choice with probability -- Gaussian distribution
    function randomChoiceFromGaussian(choice, socialInfo, publicInfo) {
    	let thisPayoff
    	if (choice == 'sure') {
    		thisPayoff = BoxMuller(mean_sure, sd_sure)
    		thisPayoff = Math.floor(thisPayoff*100)
    	} else {
			thisPayoff = BoxMuller(mean_risky, sd_risky)
			thisPayoff = Math.floor(thisPayoff*100)
    	}

    	if (thisPayoff < 0 ) thisPayoff = 0
    	if (thisPayoff > 2*mean_risky*100 ) thisPayoff = 2*mean_risky*100
    	if (indivOrGroup > -1) { // if don't want to send indiv data, indivOrGroup == 1
    		socket.emit('choice made', {choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber, riskDistributionId:riskDistributionId, thisTrial:currentTrial});
    	} else {
    		saveChoiceDataLocally({choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber, riskDistributionId:riskDistributionId});
    	}
        //console.log('choice was made: choice = ' + choice + ' and payoff = ' + thisPayoff + '.');
    	return thisPayoff;
	}

	function saveChoiceDataLocally (data) {
		let now = new Date()
    	//,	timeElapsed = now - data.firstTrialStartingTime
    	;
    	myLastChoice = data.choice;
    	//myLastChoiceFlag = data.chosenOptionFlag;
		myData.push(
			{	date: now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1) +'-' + now.getUTCDate()
			,	time: now.getUTCHours()+':'+now.getUTCMinutes()+':'+now.getUTCSeconds()
			,	exp_condition: exp_condition
			,	isLeftRisky: isLeftRisky
			,	indivOrGroup: indivOrGroup
			,	room: myRoom
			,	confirmationID: confirmationID
			,	amazonID: amazonID
			,	round: currentTrial
			,	chosenOptionFlag: data.chosenOptionFlag
			,	choice: data.choice
			,	payoff: data.payoff
			,	totalEarning: data.totalEarning
			,	behaviouralType: 'choice'
			,	latency: sum(averageLatency)/averageLatency.length
			,	maxGroupSize: maxGroupSize
			,	riskDistributionId: data.riskDistributionId
			}
		);

		if (currentTrial >= horizon) {
			socket.emit('Data from Indiv', myData);
		}
	}

	function sending_core_is_ready (isPreloadDone) {
		if (isPreloadDone) {
			socket.emit('core is ready', {latency: 0, maxLatencyForGroupCondition: maxLatencyForGroupCondition});
			console.log('emitting "core is ready" to the server');
		}
	}

	// random choice with equal probability
    function choose(arr) {
		var index = Math.floor(Math.random() * arr.length);
		return arr[index];
	}

	function waitingBarCompleted ()
	{
	    //console.log('waitingBarCompleted is fired');
	}

	function goToQuestionnaire () {
		////console.log('goToQuestionnaire()');
		$("#form").submit();
	}

	function settingConfirmationID (id) {
		$("#confirmationID").val(id);
	}

	function settingRiskDistribution (id) {
		switch (id) {
			// 1, 2, 3, 5
			case 1: // Optimal-risky, positively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 0.5;
				payoff_riskyRare = 6.00; // E[R] = 1.6
				// Gaussian
				mean_sure = 1.5;
				mean_risky = 1.6;
				break;
			case 2: // Suboptimal-risky positively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 0.5;
				payoff_riskyRare = 5.00; // E[R] = 1.4
				// Gaussian
				mean_sure = 1.5;
				mean_risky = 1.4;
				break;
		    case 3: // Optimal-risky, negatively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 2.00; // E[R] = 1.6
				payoff_riskyRare = 0;
				break;
			case 4: // Suboptimal-risky, negatively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 1.75; // E[R] = 1.4
				payoff_riskyRare = 0;
				break;

			// ==== Pilot condition =
		    default:
		        pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 0.5;
				payoff_riskyRare = 6.00;
				break;
		}
		optionsKeyList = ['sure','risky'];
		probabilityList = {
			sure:pSure
			, risky:pRiskyRare
		};
		payoffList = {
				sure:[payoff_sureL, payoff_sureH]
				, risky:[payoff_riskyCommon, payoff_riskyRare]
			};
	}

	function settingRiskDistribution_old (id) {
		switch (id) {
			// 0, 1, 2, 3
			case 0: // Optimal-risky, positively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 0.5;
				payoff_riskyRare = 6.00; // E[R] = 1.6
				// Gaussian
				mean_sure = 1.5;
				mean_risky = 1.6;
				break;
			case 1: // Suboptimal-risky positively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 0.5;
				payoff_riskyRare = 5.00; // E[R] = 1.4
				// Gaussian
				mean_sure = 1.5;
				mean_risky = 1.4;
				break;
		    case 2: // Optimal-risky, negatively-skewed
				pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 1.00;
				payoff_riskyRare = 4.00;
				break;
			case 3: // Suboptimal-risky, negatively-skewed
				pRiskyRare = 0.1;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 1.25;
				payoff_riskyRare = 4.75;
				break;

			// ==== Pilot condition =
		    default:
		        pRiskyRare = 0.2;
				pSure = 1;
				payoff_sureL = 1.5;
				payoff_sureH = 1.5;
				payoff_riskyCommon = 0.5;
				payoff_riskyRare = 6.00;
				break;
		}
		optionsKeyList = ['sure','risky'];
		probabilityList = {
			sure:pSure
			, risky:pRiskyRare
		};
		payoffList = {
				sure:[payoff_sureL, payoff_sureH]
				, risky:[payoff_riskyCommon, payoff_riskyRare]
			};
	}

	function settingRiskDistribution_4ab (id) {
		// console.log('settingRiskDistribution_4ab');
		switch (id) {
			// === experiment on 07 November 2020 ===
			case 13: // (riskPrem=20/15; p=0.4; minPayoff = 50)
				pRiskyRare = 0.3;
		        pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 2;
				payoff_sureH1 = 2;
				payoff_sureL2 = 1.5;
				payoff_sureH2 = 1.5;
				payoff_sureL3 = 1.25;
				payoff_sureH3 = 1.25;

				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 5.5;
				break;
			// === experiment on 22 October 2020 ===
			case 11: // (riskPrem=20/15; p=0.4; minPayoff = 50)
				pRiskyRare = 0.4;
				pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 1.5;
				payoff_sureH1 = 1.5;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;
				payoff_sureL3 = 1.00;
				payoff_sureH3 = 1.00;

				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 4.25;
				break;
			case 12: // (riskPrem=20/15; p=0.4)
				pRiskyRare = 0.4;
				pPoor = 0.4;
				pSure = 1;
				payoff_sureL1 = 1.50;
				payoff_sureH1 = 1.50;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;

				payoff_sureL3 = 0.50;
				payoff_sureH3 = 2.375;
				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 4.25;
				break;
			// ==== 3-safe 1-risky bandit ====
			case 0: // (riskPrem=20/15; p=0.4; minPayoff = 50)
				pRiskyRare = 0.4;
				pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 1.5;
				payoff_sureH1 = 1.5;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;
				payoff_sureL3 = 1.00;
				payoff_sureH3 = 1.00;

				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 4.25;
				break;
			case 1: // (riskPrem=20/15; p=0.3; minPayoff = 50)
		        pRiskyRare = 0.3;
		        pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 1.5;
				payoff_sureH1 = 1.5;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;
				payoff_sureL3 = 1.00;
				payoff_sureH3 = 1.00;

				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 5.5;
				break;
			// ==== 2-safe 2-risky bandit (riskPrem=20/15; p=0.3) ====
			case 2: // (riskPrem=20/15; p=0.4)
				pRiskyRare = 0.4;
				pPoor = 0.4;
				pSure = 1;
				payoff_sureL1 = 1.50;
				payoff_sureH1 = 1.50;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;

				payoff_sureL3 = 0.50;
				payoff_sureH3 = 2.375;
				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 4.25;
				break;
			case 3: // (riskPrem=20/15; p=0.3)
				pRiskyRare = 0.3;
				pPoor = 0.3;
				pSure = 1;
				payoff_sureL1 = 1.50;
				payoff_sureH1 = 1.50;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;

				payoff_sureL3 = 0.50;
				payoff_sureH3 = 3;
				payoff_riskyCommon = 0.50;
				payoff_riskyRare = 5.5;
				break;
			// ==== 3-safe 1-risky bandit ====
			case 4: // (riskPrem=20/15; p=0.4; minPayoff = 75)
				pRiskyRare = 0.4;
		        pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 1.5;
				payoff_sureH1 = 1.5;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;
				payoff_sureL3 = 1.00;
				payoff_sureH3 = 1.00;

				payoff_riskyCommon = 0.75;
				payoff_riskyRare = 3.875;
				break;
			case 5: // (riskPrem=20/15; p=0.3; minPayoff = 75)
				pRiskyRare = 0.3;
		        pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 1.5;
				payoff_sureH1 = 1.5;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;
				payoff_sureL3 = 1.00;
				payoff_sureH3 = 1.00;

				payoff_riskyCommon = 0.75;
				payoff_riskyRare = 4.917;
				break;
			// ==== 3-safe 1-risky bandit (riskPrem=20/15; p=0.3) ====
		    default: // case 3
		        pRiskyRare = 0.3;
		        pPoor = 1;
				pSure = 1;
				payoff_sureL1 = 1.5;
				payoff_sureH1 = 1.5;
				payoff_sureL2 = 1.25;
				payoff_sureH2 = 1.25;
				payoff_sureL3 = 1.00;
				payoff_sureH3 = 1.00;

				payoff_riskyCommon = 0.75;
				payoff_riskyRare = 4.917;
				break;
		}
		optionsKeyList = ['sure1','sure2','sure3','risky']
		// probabilityList = {sure:pSure, risky:pRiskyRare};
		probabilityList = {
			sure1:pSure,
			sure2:pSure,
			sure3:pPoor, //
			risky:pRiskyRare
		};
		payoffList = {
				sure1:[payoff_sureL1, payoff_sureH1],
				sure2:[payoff_sureL2, payoff_sureH2],
				sure3:[payoff_sureL3, payoff_sureH3],
				risky:[payoff_riskyCommon, payoff_riskyRare]};
	}

	// I think this ping-pong monitoring is out-of-date; review needed. Discarded in the future
	socket.on('pong', function (ms) {
        ////console.log(`socket :: averageLatency :: ${averageLatency} ms`);
        averageLatency.push(ms);
        averageLatency.splice(0,1);
    });

    socket.on('this_is_your_parameters', function (data) {
    	//console.log('received "this_is_your_parameters" from the server');
        confirmationID = data.id;
        myRoom = data.room;
        maxChoiceStageTime = data.maxChoiceStageTime;
        indivOrGroup = data.indivOrGroup;
        exp_condition = data.exp_condition; //binary_4ab
        // riskDistributionId = data.riskDistributionId;
        subjectNumber = data.subjectNumber;
        isLeftRisky = data.isLeftRisky;
        numOptions = data.numOptions;
        // info_share_cost = data.info_share_cost;
        optionOrder = data.optionOrder;
        taskOrder = data.taskOrder;
        instructionText_indiv[1] = instructionText_indiv[1] + numOptions + ' slot machines.';
        instructionText_group[1] = instructionText_group[1] + numOptions + ' slot machines.';
        console.log('this is your optionOrder: ' + optionOrder);
        //setSlotPosition(data.isLeftRisky);
        if (data.numOptions == 2) {
        	// settingRiskDistribution(data.riskDistributionId);
        	settingRiskDistribution(taskOrder[data.gameRound]);
        } else {
        	settingRiskDistribution_4ab(data.riskDistributionId);
        }

        // avoiding safari's reload function
        if(!window.sessionStorage.getItem('uniqueConfirmationID')) {
            window.sessionStorage.setItem('uniqueConfirmationID', confirmationID);
        } else if (exceptions.indexOf(amazonID) == -1) {
            // there is already an unique confirmation id existing in the local storage
            socket.io.opts.query = 'sessionName=already_finished';
            socket.disconnect();
            window.location.href = htmlServer + portnumQuestionnaire + '/multipleAccess';
        }
        socket.io.opts.query = 'sessionName='+data.id+'&roomName='+data.room+'&amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarning='+totalEarning+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency;
        //console.log('client session name is ' + socket.io.opts.query);
        //console.log('and client subjectNumber is ' + subjectNumber);
        //console.log('and maxChoiceStageTime = ' + maxChoiceStageTime);
        //console.log('and confirmationID is = ' + confirmationID);
        $("#exp_condition").val(exp_condition);
        //$("#confirmationID").val(data.id);
        settingConfirmationID(confirmationID);
    });

    socket.on('this is the remaining waiting time', function(data){
        isEnvironmentReady = true;
        maxWaitingTime = data.max;
        maxGroupSize = data.maxGroupSize;
        horizon = data.horizon;
        restTime = data.restTime;
        // console.log('socket.on: "this is the remaining waiting time" : '+restTime+' msec.');
        if (isPreloadDone & !isWaitingRoomStarted) {
        	// game.scene.start('ScenePerfect'); // debug

        	game.scene.start('SceneWaitingRoom'); // main

        } else {
        	//socket.emit('not ready yet');
        }
        //SceneWaitingRoom
        //core.replaceScene(core.waitingRoomScene(data.restTime));
    });

    socket.on('wait for others finishing test', function (data) {
    	game.scene.stop('SceneWaitingRoom0');
    	game.scene.stop('SceneWaitingRoom');
    	game.scene.stop('SceneInstruction');
    	game.scene.stop('SceneTutorial');
    	game.scene.stop('SceneTutorialFeedback');
    	game.scene.stop('SceneUnderstandingTest');
    	game.scene.stop('ScenePerfect');
    	game.scene.stop('SceneGoToNewGameRound');
        game.scene.start('SceneWaitingRoom2', data);
    });

    socket.on('n_test_passed updated', function (data) {
    	n_in_waitingRoom2 = data.n_test_passed;
    });

    socket.on('wait for others get ready to move on', function () {
    	game.scene.stop('SceneWaitingRoom0');
    	game.scene.stop('SceneWaitingRoom');
    	game.scene.stop('SceneInstruction');
    	game.scene.stop('SceneTutorial');
    	game.scene.stop('SceneTutorialFeedback');
    	game.scene.stop('SceneUnderstandingTest');
    	game.scene.stop('ScenePerfect');
    	game.scene.stop('SceneGoToNewGameRound');
        game.scene.start('SceneWaitingRoom2');
    });

    // The task starts
    socket.on('this room gets started', function(data) {
        //console.log('Group size reached ' + data.n + ' conditoin: ' + data.exp_condition + ' and indivOrGroup is ' + data.indivOrGroup);
        exp_condition = data.exp_condition;
        isLeftRisky = data.isLeftRisky;
        indivOrGroup = data.indivOrGroup;
        maxChoiceStageTime = data.maxChoiceStageTime;
        $("#indivOrGroup").val(indivOrGroup);
        $("#bonus_for_waiting").val(Math.round(waitingBonus));
        ////console.log('your indivOrGroup is ' + $("#indivOrGroup").val());
        /*if(indivOrGroup == 0) {
            choiceOpportunities = 3; //3
        } else {
            choiceOpportunities = 1;
        }*/
        waitingRoomFinishedFlag = 1;
        game.scene.stop('SceneWaitingRoom0');
        game.scene.stop('SceneWaitingRoom');

        // game.scene.start('ScenePerfect', data); // debug

       	game.scene.start('SceneInstruction', data);

    });

    socket.on('you guys are individual condition', function () {
    	//console.log('receive: "you guys are individual condition"');
        socket.emit('ok individual condition sounds good');
    });

    socket.on('all passed the test', function(data) {
    	currentGroupSize = data.n;
        //console.log('testPassed reached ' + data.testPassed + ' conditoin: ' + data.exp_condition);
        game.scene.stop('SceneWaitingRoom0');
        game.scene.stop('SceneWaitingRoom');
    	game.scene.stop('SceneInstruction');
    	game.scene.stop('SceneTutorial');
    	game.scene.stop('SceneTutorialFeedback');
    	game.scene.stop('SceneUnderstandingTest');
    	game.scene.stop('ScenePerfect');
    	game.scene.stop('SceneGoToNewGameRound');
        game.scene.stop('SceneWaitingRoom2');
        game.scene.start('SceneStartCountdown');
    });

    socket.on('all are ready to move on', function(data) {
        currentTrial = 1; // resetting the trial number
        gameRound = data.gameRound; // updating the game round
        console.log('All are ready to move on to gameRound '+(gameRound+1))
        game.scene.stop('SceneWaitingRoom0');
        game.scene.stop('SceneWaitingRoom');
    	game.scene.stop('SceneInstruction');
    	game.scene.stop('SceneTutorial');
    	game.scene.stop('SceneTutorialFeedback');
    	game.scene.stop('SceneUnderstandingTest');
    	game.scene.stop('ScenePerfect');
    	game.scene.stop('SceneGoToNewGameRound');
        game.scene.stop('SceneWaitingRoom2');
        game.scene.start('SceneStartCountdown');
    });

    socket.on('client disconnected', function(data) {
        console.log('client disconnected ' + data.disconnectedClient + ' left the room');
        currentGroupSize = data.n;
        createWindow('SceneMessagePopUp', {msg: 'Notification: One member has been disconnected'});
        if (isWaiting) {
        	socket.emit('can I proceed');
        	console.log('"can I proceed" sent');
        }
    });

    socket.on('these are done subjects', function(data) {
        doneSubject = data.doneSubject;
        //console.log('doneSubject is ' + doneSubject);
    });

    socket.on('Proceed to next round', function(data) {
        mySocialInfo = data.socialInfo[data.pointer-2]; //[data.round-2];
        myPublicInfo = data.publicInfo[data.pointer-2];
        choiceOrder = data.choiceOrder[data.pointer-2];
        share_or_not = data.share_or_not[data.pointer-2];
        groupTotalScore = sum( data.groupTotalPayoff );
        totalPayoff_perIndiv = sum( data.totalPayoff_perIndiv );
        totalPayoff_perIndiv_perGame[gameRound] = data.totalPayoff_perIndiv_perGame[gameRound];
        // payoff_info = data.share_or_not[data.round-2]['payoff'];
        // shared_position = data.share_or_not[data.round-2]['position'];
        // console.log('mySocialInfo: ' + mySocialInfo);
        // console.log('myPublicInfo: ' + myPublicInfo);
        // console.log('choiceOrder: ' + choiceOrder);
        console.log('totalPayoff_perIndiv_perGame: ' + totalPayoff_perIndiv_perGame[gameRound] + ' with group total = ' + groupTotalScore);
        for (let i = 0; i < maxGroupSize; i++) {
        	if(share_or_not[i] != null) {
        		console.log('subjectNumber' + i + ': share:' + share_or_not[i].share + ', payoff:' +share_or_not[i].payoff+', position:'+share_or_not[i].position);
        	}
        }
        // console.log('share_or_not: ' + share_or_not);
        if (indivOrGroup == 1) {
        	for (let i = 1; i < numOptions+1; i++) {
        		mySocialInfoList['option'+i] = data.socialFreq[data.round-1][optionOrder[i-1] - 1];
        	}
        	console.log('data.socialFreq[data.round-1] = ' + data.socialFreq[data.round-1]);
        } else {
        	for (let i = 1; i < numOptions+1; i++) {
        		if (myLastChoiceFlag == i) { // myLastChoice
        			mySocialInfoList['option'+i] = 1;
        		} else {
        			mySocialInfoList['option'+i] = 0;
        		}
        	}
        }


        currentTrial++;
        totalEarning += payoff - (info_share_cost * didShare);

        //$("#totalEarningInCent").val(Math.round((totalPayoff_perIndiv*cent_per_point)));
        //$("#totalEarningInUSD").val(Math.round((totalPayoff_perIndiv*cent_per_point))/100);
        $("#totalEarningInCent").val(Math.round((totalPayoff_perIndiv*cent_per_point)));
        $("#totalEarningInUSD").val(Math.round((totalPayoff_perIndiv*cent_per_point))/100);
        $("#currentTrial").val(currentTrial);
        $("#gameRound").val(gameRound);
        $("#exp_condition").val(exp_condition);
        //$("#confirmationID").val(confirmationID);
        $("#bonus_for_waiting").val(Math.round(waitingBonus));
        // payoffText.destroy();
        // waitOthersText.destroy();
        for (let i =1; i<numOptions+1; i++) {
        	objects_feedbackStage['box'+i].destroy();
        }
    	game.scene.stop('ScenePayoffFeedback');
    	isWaiting = false
    	game.scene.start('SceneMain', {gameRound:gameRound, round:currentTrial});
    	//console.log('restarting the main scene!: mySocialInfo = '+data.socialFreq[data.round-1]);
    });

    socket.on('End this session', function(data) {
        //mySocialInfo = data.socialInfo[data.round-2];
        //myPublicInfo = data.publicInfo[data.round-2];
        //choiceOrder = data.choiceOrder[data.round-2];
        //mySocialInfoList['sure'] = data.socialFreq[data.round-1][surePosition];
        //mySocialInfoList['risky'] = data.socialFreq[data.round-1][riskyPosition];
        currentTrial++;
        totalEarning += payoff;
        // $("#totalEarningInCent").val(Math.round((totalPayoff_perIndiv*cent_per_point)));
        // $("#totalEarningInUSD").val(Math.round((totalPayoff_perIndiv*cent_per_point))/100);
        $("#totalEarningInCent").val(Math.round((totalPayoff_perIndiv*cent_per_point)));
        $("#totalEarningInUSD").val(Math.round((totalPayoff_perIndiv*cent_per_point))/100);
        $("#currentTrial").val(currentTrial);
        $("#gameRound").val(gameRound);
        $("#completed").val(1);
        $("#exp_condition").val(exp_condition);
        //$("#confirmationID").val(confirmationID);
        // payoffText.destroy();
        // waitOthersText.destroy();
        for (let i =1; i<numOptions+1; i++) {
        	objects_feedbackStage['box'+i].destroy();
        }
    	game.scene.stop('ScenePayoffFeedback');
    	isWaiting = false
    	game.scene.start('SceneGoToQuestionnaire');
    });

    socket.on('New gameRound starts', function(data) {
    	console.log('New gameRound ' + (data.gameRound+1) + ' with gameType = ' + taskOrder[data.gameRound] + ' starts!');
    	// Destroying the objects in the feedback scene
    	// payoffText.destroy();
     //    waitOthersText.destroy();
        for (let i =1; i<numOptions+1; i++) {
        	objects_feedbackStage['box'+i].destroy();
        }
    	// reset the previous data
    	// currentTrial = 1;
    	mySocialInfo = [];
        myPublicInfo = [];
        choiceOrder = [];
        share_or_not = [];
    	totalPayoff_perIndiv_perGame[gameRound] = data.totalPayoff_perIndiv_perGame[gameRound];
    	totalPayoff_perIndiv = 0;
    	groupTotalScore = 0;
    	gameRound = data.gameRound;
    	optionOrder = data.optionOrder; // new option order
    	if (numOptions == 2) {
        	settingRiskDistribution(taskOrder[data.gameRound]);
        } else {
        	console.log('data.numOptions != 2 why????');
        }
    	// starting the new game round
    	game.scene.stop('ScenePayoffFeedback');
    	isWaiting = false
    	game.scene.start('SceneGoToNewGameRound');
    });

    socket.on('S_to_C_welcomeback', function(data) {
    	// if (waitingRoomFinishedFlag == 1) {
    	if (understandingCheckStarted == 1) {
	    	// You could give a change to the shortly disconnected client to go back to the session
	    	// However, for now I just redirect them to the questionnaire
	        socket.io.opts.query = 'sessionName=already_finished';
	        socket.disconnect();
	        window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round((totalPayoff_perIndiv*cent_per_point))+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+0+'&latency='+submittedLatency;
	        console.log('Received: "S_to_C_welcomeback": client = '+data.sessionName +'; room = '+data.roomName);
	    } else if (waitingRoomFinishedFlag != 1) {
	    	console.log('Received: "S_to_C_welcomeback" but the waiting room is not finished yet: client = '+data.sessionName +'; room = '+data.roomName);
	    	if (typeof restTime != 'undefined') {
	    		socket.emit('this is the previous restTime', {restTime: restTime});
	    	}
	    } else {
	    	console.log('Received: "S_to_C_welcomeback" but the understanding test is not started yet: client = '+data.sessionName +'; room = '+data.roomName);
	    }
    });

} // window.onload -- end
