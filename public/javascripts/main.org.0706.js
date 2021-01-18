/*

Multi-armed bandit task 2020
Author: Wataru Toyokawa (wataru.toyokawa@uni-konstanz.de)
15 Jun. 2020

changes made on 15 June
1. Individual condition is now storing the data locally until the task is completed
2. saveChoiceDataLocally() is made (needs to edit!)

*/

'use strict';

//const htmlServer = 'http://192.168.33.10:'; // vagrant server
const htmlServer = 'http://63-250-60-135.cloud-xip.io:'; //ipaddress 63.250.60.135
const portnum = 8080;
const portnumQuestionnaire = 8000;
const exceptions = ['INHOUSETEST', 'wataruDebug', 'wataruDebug'];

//const instructionText = require('./instructionText');
const waitingRoomText0 = 
	[ 'Welcome!'
	, 'The task will start automatically in a few seconds.'
	, 'If nothing happens and you seem getting stuck in this page for more than 15 seconds, please reload this page.'
	, 'Make sure you have a stable internet connection.'
	, ''
	//, 'The study starts in ' + '???' + ' sec.'
	];
const waitingRoomText = 
	[ 'Waiting Room'
	, 'Please do not reload this page or open a new browser window.'
	, 'Also please do not hide this browser window by other tab or apps.'
	, 'If you do so, the task will be terminated automatically.'
	, ''
	//, 'The study starts in ' + '???' + ' sec.'
	];
const waitingForOthers = 
	[ 'Wait for others'
	, 'Please do not reload this page or open a new browser window.'
	, 'Also please do not hide this browser window by other tab or apps.'
	, 'If you do so, the task will be terminated automatically.'
	, 'Your waiting bonus is ' + '???' + ' cents.'
	];
const instructionText_indiv = 
	[ 'Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task.'

	, '<br><br>Throughout the main task, you are to make a series of choices between 2&nbsp;slot machines.'

	, '<br><br>Overall, there will be <span class="note">70&nbsp;trials</span>. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>.'

	, '<br><br>Each choice will earn you a reward. Your total payout will be based on <span class="note">the sum of all points</span> you earn over the 70&nbsp;trials.'

	, '<br><br>The total reward you get will be converted into real money. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;US cents.</span>'

	, '<br>The reward for each slot seems random, but <span class="note">some of the slots will generate a higher payoff on average than the other</span>. The average payoff of each slot is constant over the long run (i.e., does not vary throughout the game).'

	, '<br><br><br><br>On the next page, you will play a tutorial to get familiar with the task!'
	];
const tutorialText_indiv = 
	[ '<br>This is the tutorial task. <br><br>Start by choosing whichever slot machine you like!'

	, '<br><br>You got 30 points! Well done.'

	, '<br>This is the second trial. The <span class="note">same slot machines</span> will appear again. <br><br>Please make another choice!'

	, '<br><br>Hooray! You got 50 points!'

	, 'You have <span class="note">up to 15 seconds</span> in making a choice. <br><br>Note: You cannot click any options here for the tutorial purpose. Let\'s see what happens if time is up.' 

	, '<br><br>Time was up and you missed the trial! So you got nothing.'

	, '<br>The tutorial is done. <br><br>Next, you will proceed to a short comprehension quiz!'
	];
const understandingCheckText_indiv = 
	[ '<h3>Please answer the following questions.</h3>'

	, 'How many trials will you play in total?' // 70

	, 'Is it possible to choose the same option repeatedly?' //YES

	, 'Does your bonus of this task increase by getting more reward points from the task?' //YES
	];

const instructionText_group = 
	[ 'Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task. <br><br>After answering these questions, you may spend some more time in a waiting room until sufficient number of participants have arrived to start the task. <br><br>You will be paid <span class="note">13.2 cents per minute</span> (that is, $8 per hour) for any time spent in the waiting room. When your group is ready, the main task will start.'

	, '<br><br>Throughout the main task, you are to make a series of choices between 2&nbsp;slot machines.'

	, '<br><br>Overall, there will be <span class="note">70&nbsp;trials</span>. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>.'

	, '<br><br>Each choice will earn you a reward. Your total payout will be based on <span class="note">the sum of all points</span> you earn over the 70&nbsp;trials.'

	, '<br><br>The total reward you get will be converted into real money. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;US cents.</span>'

	, '<br>The reward for each slot seems random, but <span class="note">some of the slots will generate a higher payoff on average than the other</span>. The average payoff of each slot is constant over the long run (i.e., does not vary throughout the game).'

	, '<br><br>Other people will participate in this online experiment at the same time with you.'

	, '<br>You will see the <span class="note">number of people (including yourself)</span> choosing each slot. <br><br>The example below shows that 4 people chose the left and other 6 chose the right in the preceding trial.'

	, '<br>Note: this <span class="note">"number of people" does not affect the amount of your reward</span>. The reward points are provided <span class="note">independently</span> from other people\'s choices.'

	, '<br>Nevertheless, other people\'s choice may be worth checking because you all will be playing the same task. It may give you a hint for finding the better one between the two slots.'

	, '<br><br><br><br>On the next page, you will play a tutorial to get familiar with the task!'
	];
const tutorialText_group = 
	[ '<br>This is the tutorial task. <br><br>Start by choosing whichever slot machine you like!'

	, '<br><br>You got 30 points! Well done.'

	, '<br>This is the second trial. The <span class="note">same slot machines</span> will appear again. <br><br>Please make another choice!'

	, '<br><br>Hooray! You got 50 points!'

	, 'You have <span class="note">up to 15 seconds</span> in making a choice. <br><br>Note: You cannot click any options here for the tutorial purpose. Let\'s see what happens if time is up.' 

	, '<br><br>Time was up and you missed the trial! So you got nothing.'

	, '<br>The tutorial is done. <br><br>Next, you will proceed to a short comprehension quiz!'
	];
const understandingCheckText_group = 
	[ '<h3>Please answer the following questions.</h3>'

	, 'How many trials will you and the other players play in total?' // 70

	, 'Is it possible to choose the same option repeatedly?' //YES

	, 'Does your bonus of this task increase by getting more reward points from the task?' //YES

	, 'Do other workers play the same task as yours?' //YES

	, 'Does your reward points change by how many players are choosing your option?' //NO
	];

const revisitingInstructionText = 
	[ '<br><br><span class="note">Woops! One or more answers were incorrect.</span> Please read the instruction again!'

	, '<br><br>That\'s it! Take the comprehension quiz again in the next page.'
	]

const goToQuestionnaireText = 
	[ 'Well done!'
	, 'Your total game reward: $'
	, 'Waiting bonus: $'
	, 'Flat fee for completion of the task: $'
	];
// experimental variables (negatively skewed)
//["risky", "risky", "risky", "sure", "risky", "risky", "risky", "sure", "sure", "risky", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure"]

// Gaussian distribution (E[risky] = 1.61)
let mean_sure = 1.5
,	sd_sure = 0.05
,	mean_risky = 1.61
,	sd_risky = 1
;

// Binary distribution (E[risky] = 1.61)
let pRiskyRare = 0.2
, pSure = 1
, payoff_sureL = 1.5
, payoff_sureH = 1.5
, payoff_riskyCommon = 0.5
, payoff_riskyRare = 6.05
, smallNoise = 0.05
;

/* // positively skewed
let pRiskyRare = 0.3
, pSure = 1
, payoff_sureL = 2
, payoff_sureH = 2
, payoff_riskyCommon = -1.35
, payoff_riskyRare = 19.82
, smallNoise = 0.2
;
*/
 // negatively skewed
 // ["risky", "risky", "sure", "sure", "risky", "risky", "risky", "risky", "sure", "sure", "risky", "sure", "sure", "risky", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "sure", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "sure", "risky", "sure", "sure", "risky", "risky", "risky", "sure", "risky", "risky", "risky", "sure", "sure", "sure", "risky", "risky", "sure", "risky", "risky", "risky", "sure", "risky", "risky", "risky", "risky", "risky"]
/*let pRiskyRare = 0.3
, pSure = 1
, payoff_sureL = 2
, payoff_sureH = 2
, payoff_riskyCommon = 6.65
, payoff_riskyRare = -5.517
, smallNoise = 0.2
;
*/

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
const maxLatencyForGroupCondition = 1500 //1500;

let isEnvironmentReady = false
,	isPreloadDone = false
,	isWaitingRoomStarted = false
,   myChoices = []
,   myEarnings = []
,   payoff
,	payoffTransformed
,   totalEarning = 0
,	cent_per_point = 1/50
,   sessionName
,   roomName
,   subjectNumber
,	indivOrGroup
,	exp_condition
,	isLeftRisky
,   connectionCounter
,	maxChoiceStageTime
,   currentTrial = 1
,   currentStage
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
,   averageLatency = [0,0,0]
,   submittedLatency = -1
,	probabilityList = {sure:pSure, risky:pRiskyRare}
,	payoffList = {
		sure:[payoff_sureL, payoff_sureH], 
		risky:[payoff_riskyCommon, payoff_riskyRare]}
,	mySocialInfoList = {sure:0, risky:0}
,	mySocialInfo
,	myPublicInfo
,	myLastChoice
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

    // connecting to the experimental server
    const socket = io.connect(htmlServer+portnum, { query: 'amazonID='+amazonID });

    //======== monitoring reload activity ==========
    if (window.performance & amazonID != 'INHOUSETEST') {
        if (performance.navigation.type === 1) {
            // Redirecting to the questionnaire
            socket.io.opts.query = 'sessionName=already_finished';
            socket.disconnect();
            window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(totalEarning)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+0+'&latency='+submittedLatency;
        }
    }
    //======== end: monitoring reload activity =====

    //======== letting the server know latency with this client ==========
    // after calculating the first average latency
    // the client should be put into the individual condition
    setTimeout(function(){
        submittedLatency = sum(averageLatency)/averageLatency.length
        socket.emit('core is ready', {latency: submittedLatency, maxLatencyForGroupCondition: maxLatencyForGroupCondition});
        $("#latency").val(submittedLatency);
    }, averageLatency.length*1000+500);
    //======== end: letting the server know latency with this client ==========

    //======== monitoring Tab activity ==========
    let hiddenTimer
    ,   hidden_elapsedTime = 0
    ;
        // Judging the window state at the moment of this window read
    if(window.document.visibilityState == 'hidden'){
        hiddenTimer = setInterval(function(){
            hidden_elapsedTime += 500;
            if (hidden_elapsedTime>1000) {
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
                if (hidden_elapsedTime>1000 & amazonID != 'INHOUSETEST') {
                    socket.io.opts.query = 'sessionName=already_finished';
                    socket.disconnect();
                }
            }, 500);
        } else {
            clearTimeout(hiddenTimer);
            if (hidden_elapsedTime>1000 & amazonID != 'INHOUSETEST') {
                setTimeout(function(){
                    // Force client to move to the questionnaire
                    socket.io.opts.query = 'sessionName=already_finished';
                    socket.disconnect();
                    completed = 'browserHidden';
                    window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(totalEarning)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency;
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
    , leftSlotPositionX = 200
    , rightSlotPositionX = 600
    , missPositionX = (leftSlotPositionX+rightSlotPositionX)/2
    //, leftSlotPositionX
    //, rightSlotPositionX
    //, missPositionX
    , surePosition = 0
    , riskyPosition = 1
    , noteColor = '#ff5a00' // red-ish
    , nomalTextColor = '#000000' // black
    , player
	, stars_sure = []
	, stars_risky = []
	, bombs
	, platforms
	, cursors
	, score = 0
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
	, waitOthersText
	, objects_feedbackStage
	, feedbackTextPosition
	//, currentInstructionPicture = []
	, instructionPosition = 0
	, trialText_tutorial
	, scoreText_tutorial
	, timeText_tutorial
	, tutorialPosition // tracking the tutorial text's number
	, tutorialTrial = 1 // tracking the tutorial's trial (1, 2, or 3)
	, score_tutorial = 0
	, choice_tutorial = 0
	, isInstructionRevisit = false
	;

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
			this.load.image('machine1_normal', 'assets/machine_normal_1.png');
			this.load.image('machine2_normal', 'assets/machine_normal_2.png');
			this.load.image('machine1_active', 'assets/machine_active_1.png');
			this.load.image('machine2_active', 'assets/machine_active_2.png');
			this.load.image('instructionPictures_1', 'assets/instructionPictures.001.png');
			this.load.image('instructionPictures_2', 'assets/instructionPictures.002.png');
			this.load.image('instructionPictures_3', 'assets/instructionPictures.003.png');
			this.load.image('instructionPictures_4', 'assets/instructionPictures.004.png');
			this.load.image('instructionPictures_5', 'assets/instructionPictures.005.png');
			this.load.image('instructionPictures_6', 'assets/instructionPictures.006.png');
			this.load.image('instructionPictures_7', 'assets/instructionPictures.007.png');
			this.load.image('instructionPictures_8', 'assets/instructionPictures.008.png');
			this.load.image('instructionPictures_9', 'assets/instructionPictures.009.png');
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
			    ////console.log('complete');
			    isPreloadDone = true;
			    progressBar.destroy();
				progressBox.destroy();
				loadingText.destroy();
				percentText.destroy();
				// execute if preload completed later than on.connection('this is your parameter')
				//if(isEnvironmentReady) game.scene.start('SceneWaitingRoom');
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
            //restTime = 10;
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
			countdownText.setText('The study starts in ' + (Math.floor(0.9+(restTime/1000)*(1-waitingCountdown.getProgress()))).toString().substr(0, 3) + ' sec.');
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
		    for (let i=0; i<10; i++) {
		    	currentInstructionPicture[i] = this.add.image(configWidth/2, configHeight/2, 'instructionPictures_'+i ).setDisplaySize((1024/3)*1.3, (768/3)*1.3);
		    	currentInstructionPicture[i].visible = false;
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
		    			currentInstructionPicture[instructionPosition + 1].visible = false;
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
		    const tutorialTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 150px; font: 25px Arial;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = tutorialText[tutorialPosition];
		    
		    // slot machines and goToTest button
		    let tutorialFlag = 0;
		    let objects = {};
		    let slotY = 430
		    ,	socialInfoY = slotY + 100
		    ,	payoffTextY = slotY - 80
		    ,	trialText_tutorialY = 16+165
		    ,	scoreText_tutorialY = 56+165
		    ,	energyBar_tutorialY = 96+165
		    ;
		    objects.box1 = this.add.sprite(200, slotY, 'machine1_normal');
			objects.box1_active = this.add.sprite(200, slotY, 'machine1_active');
			objects.box2 = this.add.sprite(600, slotY, 'machine2_normal');
			objects.box2_active = this.add.sprite(600, slotY, 'machine2_active');
			objects.box1.setDisplaySize(optionWidth, optionHeight);
			objects.box2.setDisplaySize(optionWidth, optionHeight);
			objects.box1_active.setDisplaySize(optionWidth, optionHeight);
			objects.box2_active.setDisplaySize(optionWidth, optionHeight);
			if (tutorialTrial < 3) {
				objects.box1.setInteractive({ cursor: 'pointer' });
				objects.box2.setInteractive({ cursor: 'pointer' });
				objects.box1_active.setInteractive({ cursor: 'pointer' });
				objects.box2_active.setInteractive({ cursor: 'pointer' });
			}
			objects.box1_active.visible = false;
			objects.box2_active.visible = false;

			// text
			trialText_tutorial = this.add.text(16, trialText_tutorialY, 'Tutorial trial: ' + tutorialTrial + ' / 4', { fontSize: '25px', fill: '#000' });
		    scoreText_tutorial = this.add.text(16, scoreText_tutorialY, 'Total score (tutorial): ' + score_tutorial, { fontSize: '25px', fill: '#000' });
		    timeText_tutorial = this.add.text(16, energyBar_tutorialY, 'Remaining time: ', { fontSize: '25px', fill: '#000' });
		    payoffText = this.add.text(missPositionX, payoffTextY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5, 0.5);
		    if (tutorialTrial == 1) {
		    	payoffText.visible = false;
		    } else if (tutorialTrial == 2) {
		    	if (choice_tutorial == 1) payoffText.x = leftSlotPositionX;
		    	if (choice_tutorial == 2) payoffText.x = rightSlotPositionX;
		    	payoffText.setText('You got \n30 points')
		    } else if (tutorialTrial == 3) {
		    	if (choice_tutorial == 1) payoffText.x = leftSlotPositionX;
		    	if (choice_tutorial == 2) payoffText.x = rightSlotPositionX;
		    	payoffText.setText('You got \n50 points')
		    }

			// confirmation text
			let confirmationContainer = this.add.container(175, slotY+20);
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
				// max time in the choice stage
				/*setTimeout(function(){
					tutorialPosition++;
					instructionDiv.innerHTML = tutorialText[tutorialPosition];
					game.scene.start('SceneTutorialFeedback', { indivOrGroup: indivOrGroup, choice: -1, tutorialPosition: tutorialPosition });
	            }, maxChoiceStageTime);*/
			} else if (tutorialTrial < 3) {
				objects.box1.on('pointerdown', function (pointer) {
					objects.box1.visible = false;
					objects.box1_active.visible = true;
					confirmationContainer.x = 200;
					confirmationContainer.visible = true;
					if(tutorialFlag == 2) {
						objects.box2_active.visible = false;
						objects.box2.visible = true;
					}
			    	tutorialFlag = 1;
			    }, this);
			    objects.box1_active.on('pointerdown', function (pointer) {
					objects.box1.visible = false;
		    		objects.box2.visible = false;
		    		objects.box1_active.visible = false;
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
			    		choice_tutorial = 1;
			    		//game.scene.sleep('SceneTutorial');
			    		game.scene.start('SceneTutorialFeedback', { indivOrGroup: indivOrGroup, choice: 1, tutorialPosition: tutorialPosition });
			    	} else {
			    		game.scene.start('SceneUnderstandingTest', { indivOrGroup: indivOrGroup });
			    	}
			    }, this);

			    objects.box2.on('pointerdown', function (pointer) {
			    	objects.box2.visible = false;
					objects.box2_active.visible = true;
					confirmationContainer.x = 600;
					confirmationContainer.visible = true;
					if(tutorialFlag == 1) {
						objects.box1_active.visible = false;
						objects.box1.visible = true;
					}
			    	tutorialFlag = 2;
			    }, this);
			    objects.box2_active.on('pointerdown', function (pointer) {
			    	objects.box1.visible = false;
		    		objects.box2.visible = false;
		    		objects.box2_active.visible = false;
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
			    		choice_tutorial = 2;
			    		//game.scene.sleep('SceneTutorial');
			    		game.scene.start('SceneTutorialFeedback', { indivOrGroup: indivOrGroup, choice: 2, tutorialPosition: tutorialPosition });	
			    	} else {
			    		game.scene.start('SceneUnderstandingTest', { indivOrGroup: indivOrGroup });
			    	}
			    }, this);
			} else { // the final trial (i.e. the transition to the understanding quiz)
				objects.box1.visible = false;
		    	objects.box2.visible = false;
		    	trialText_tutorial.visible = false;
		    	scoreText_tutorial.visible = false;
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

			if (typeof objects != 'undefined') {
			    // pointer over & out effects
				objects.box1.on('pointerover', function (pointer) {
			    	objects.box1.setTint(0xb8860b); //B8860B ff0000
			    }, this);
			    objects.box2.on('pointerover', function (pointer) {
			    	objects.box2.setTint(0x008b8b); //008B8B
			    }, this);
				objects.box1.on('pointerout', function (pointer) {
			    	objects.box1.clearTint();
			    }, this);
			    objects.box2.on('pointerout', function (pointer) {
			    	objects.box2.clearTint();
			    }, this);
			}

			// social information
		    let socialFreqNumbers = {}
		    ,	numberOfPreviousChoice_sure = 0
		    ,	numberOfPreviousChoice_risky = 0
		    ;
		    if (indivOrGroup == 1 & tutorialTrial == 1) {
			    socialFreqNumbers.left = this.add.text(leftSlotPositionX, socialInfoY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.right = this.add.text(rightSlotPositionX, socialInfoY, ``, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    numberOfPreviousChoice_sure = 0;
			    numberOfPreviousChoice_risky = 0;
			    socialFreqNumbers.left.visible = false;
			    socialFreqNumbers.right.visible = false;
			} else if (indivOrGroup == 1 & tutorialTrial == 2) {
			    socialFreqNumbers.left = this.add.text(leftSlotPositionX, socialInfoY, `2 people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.right = this.add.text(rightSlotPositionX, socialInfoY, `3 people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    numberOfPreviousChoice_sure = 2;
			    numberOfPreviousChoice_risky = 3;
			    // function.call(what_is_this, ...) method can specify what you mean by "this" in the function
			    showStars.call(this, numberOfPreviousChoice_sure, numberOfPreviousChoice_risky, socialInfoY, false);
			} else if (indivOrGroup == 1 & tutorialTrial == 3) {
			    socialFreqNumbers.left = this.add.text(leftSlotPositionX, socialInfoY, `3 people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.right = this.add.text(rightSlotPositionX, socialInfoY, `2 people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    numberOfPreviousChoice_sure = 3; // 3
			    numberOfPreviousChoice_risky = 2; // 2
			    // function.call(what_is_this, ...) method can specify what you mean by "this" in the function
			    showStars.call(this, numberOfPreviousChoice_sure, numberOfPreviousChoice_risky, socialInfoY, false);
			} else if (tutorialTrial != 4) {
				socialFreqNumbers.left = this.add.text(leftSlotPositionX, socialInfoY, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.right = this.add.text(rightSlotPositionX, socialInfoY, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.left.visible = false;
			    socialFreqNumbers.right.visible = false;
			    if (choice_tutorial == 1) {
			    	socialFreqNumbers.left.visible = true;
			    	numberOfPreviousChoice_sure = 1;
			    	socialFreqNumbers.right.visible = false;
			    	numberOfPreviousChoice_risky = 0;
			    	// function.call(what_is_this, ...) method can specify what you mean by "this" in the function
			    	showStars.call(this, numberOfPreviousChoice_sure, numberOfPreviousChoice_risky, socialInfoY, false);
			    }
			    if (choice_tutorial == 2) {
			    	socialFreqNumbers.left.visible = false;
			    	numberOfPreviousChoice_sure = 0;
			    	socialFreqNumbers.right.visible = true;
			    	numberOfPreviousChoice_risky = 1;
			    	// function.call(what_is_this, ...) method can specify what you mean by "this" in the function
			    	showStars.call(this, numberOfPreviousChoice_sure, numberOfPreviousChoice_risky, socialInfoY, false);
			    }
			} else {
				socialFreqNumbers.left = this.add.text(leftSlotPositionX, socialInfoY, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.right = this.add.text(rightSlotPositionX, socialInfoY, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
			    socialFreqNumbers.left.visible = false;
			    socialFreqNumbers.right.visible = false;
		    	numberOfPreviousChoice_sure = 0;
		    	numberOfPreviousChoice_risky = 0;
			}
		    /*if (tutorialTrial==1 | tutorialTrial==4) {
		    	socialFreqNumbers.sure.visible = false;
		    	socialFreqNumbers.risky.visible = false;
		    	numberOfPreviousChoice_sure = 0;
		    	numberOfPreviousChoice_risky = 0;
		    }*/
		    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis


		    

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
			trialText_tutorial.destroy();
			scoreText_tutorial.destroy();
			timeText_tutorial.destroy();
			// background colour
			this.cameras.main.setBackgroundColor('#ffd6c9');// #d9d9d9 #ffffff

			// tutorial texts
		    let tutorialPosition = this.tutorialPosition;
		    let slotY = 430
		    ,	socialInfoY = slotY + 100
		    ,	payoffTextY = slotY - 80
		    //,	trialText_tutorialY = 16+165
		    //,	scoreText_tutorialY = 65+165
		    ;
		    // indivOrGroup
		    let tutorialText;
		    if (this.indivOrGroup == 0) {
		    	tutorialText = tutorialText_indiv;
		    } else {
		    	tutorialText = tutorialText_group;
		    }
		    const tutorialTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 150px; font: 25px Arial;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = tutorialText[tutorialPosition];

			//  Texts
			objects_feedbackStage = {};
			objects_feedbackStage.box1 = this.add.sprite(200, slotY, 'machine1_active').setDisplaySize(optionWidth, optionHeight);
			objects_feedbackStage.box2 = this.add.sprite(600, slotY, 'machine2_active').setDisplaySize(optionWidth, optionHeight);
			objects_feedbackStage.box1.visible = false;
			objects_feedbackStage.box2.visible = false;
			if (this.choice == -1) {
				feedbackTextPosition = missPositionX;

			} else if (this.choice == 1) {
				objects_feedbackStage.box1.visible = true;
				feedbackTextPosition = leftSlotPositionX;

			} else {
				objects_feedbackStage.box2.visible = true;
				feedbackTextPosition = rightSlotPositionX;
			}
			//let tutorialPayoff;
			switch (tutorialTrial) {
                case 1:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, `30 points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
                case 2:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, `50 points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
                case 3:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, `Missed!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
                default:
                    payoffText = this.add.text(feedbackTextPosition, payoffTextY, ``, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
                    break;
            }

		    setTimeout(function(){
		    	// hiding every objects
		    	objects_feedbackStage.box1.visible = false;
		    	objects_feedbackStage.box2.visible = false;
		    	payoffText.visible = false;
		    	// going back to the tutorial
		    	let updatedTutorialPosition = tutorialPosition + 1;
		    	tutorialTrial++;
		    	game.scene.sleep('SceneTutorialFeedback');
		    	game.scene.start('SceneTutorial', { indivOrGroup: indivOrGroup, exp_condition: exp_condition,tutorialPosition: updatedTutorialPosition });
		    }, 4000);
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
			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF'); //#FFFFFF == 'white'

			// indivOrGroup
		    let understandingCheckText;
		    if (indivOrGroup == 0) {
		    	understandingCheckText = understandingCheckText_indiv;
		    } else {
		    	understandingCheckText = understandingCheckText_group;
		    }
		    const understandingCheckTextStyle = 'background-color: rgba(51,51,51,0.1); width: 700px; height: 60px; font: 25px Arial;';
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
		    const questionTextStyle = 'background-color: rgba(255,255,255,0); width: 700px; height: 30px; font: 20px Arial;';
		    let questionDiv = []
		    ,	questionElement = []
		    ;
		    for (let i=1; i<understandingCheckText.length; i++) {
				questionDiv[i] = document.createElement('div');
				questionDiv[i].style = questionTextStyle;
		    	questionDiv[i].innerHTML = understandingCheckText[i];
		    	questionDiv.id = 'questionDiv'+i;
		    	questionElement[i] = this.add.dom(configWidth/2, 80*i, questionDiv[i]);
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
			;
			for (let i=0; i<5; i++) {
				optionButtonsA0[i] = this.add.container(80 + 60*i, 180+80*0); //position
				optionButtonsA0Text[i] = this.add.text(0, 0, 10+20*i, { fontSize: '23px', fill: '#000' });
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
					optionButtonsA3[i] = this.add.container(180 + 100*i, 180+80*3); //position
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
					optionButtonsA4[i] = this.add.container(180 + 100*i, 180+80*4); //position
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
		    		if (JSON.stringify(answers) == JSON.stringify([3,0,0,-1,-1])) {
		    			//socket.emit('test passed');
		    			//buttonImageTest.visible = false;
		    			buttonImageTest.disableInteractive(); 
		    			this.scene.launch('ScenePerfect');
		    		} else {
		    			isInstructionRevisit = true;
		    			instructionPosition = 0;
		    			// When you want to go back to previous scene, 
		    			// you have to 'sleep' scenes which are above the target scene
		    			// Otherwise, objects defined in those above scenes would hid the target scene
		    			game.scene.sleep('SceneUnderstandingTest');
		    			game.scene.sleep('SceneTutorialFeedback');
		    			game.scene.sleep('SceneTutorial');
		    			game.scene.start('SceneInstruction', {indivOrGroup:indivOrGroup, exp_condition:exp_condition});
		    		}
		    	} else { // group condition
		    		if (JSON.stringify(answers) == JSON.stringify([3,0,0,0,1])) {
		    			//socket.emit('test passed');
		    			buttonImageTest.disableInteractive(); 
		    			this.scene.launch('ScenePerfect');
		    		} else {
		    			isInstructionRevisit = true;
		    			instructionPosition = 0;
		    			game.scene.sleep('SceneUnderstandingTest');
		    			game.scene.sleep('SceneTutorialFeedback');
		    			game.scene.sleep('SceneTutorial');
		    			game.scene.start('SceneInstruction', {indivOrGroup:indivOrGroup, exp_condition:exp_condition});
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
		        loop: -1
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

		    tween = this.tweens.add({
		        targets: startImg,
		        alpha: { value: 0.9, duration: 1500, ease: 'Power1' },
		        scale: { value: 3, duration: 1500, ease: 'Power1' },
		        delay: 5000,
		        yoyo: true,
		        loop: -1
		    });

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
            setTimeout(function(){
            	//let startImg = this.add.sprite(configWidth/2, configHeight/2, 'startImg').setAlpha(0);
            	title.destroy();

            	//this.add.tween(startImg).to( { alpha: 1 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);
            }, 5000);
            setTimeout(function(){
                game.scene.start('SceneMain');
            },6500);
		}

		update(){}
	};

	// SceneMain
	class SceneMain extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneMain', active: false });
		}

		preload(){
			}

		create(){

			// background colour
			this.cameras.main.setBackgroundColor('#FFFFFF');
			//console.log('SceneMain started. currentTrial: ' + currentTrial);
			// options
			// slot machines and choice button
		    let objects = {};
		    let isChoiceMade = false;
		    let slotY_main = 300;
		    let trialText_Y = 16
		    ,	scoreText_Y = 66
		    ,	energyBar_Y = 116
		    ;
			objects.box1 = this.add.sprite(200, slotY_main, 'machine1_normal');
			objects.box1_active = this.add.sprite(200, slotY_main, 'machine1_active');
			objects.box2 = this.add.sprite(600, slotY_main, 'machine2_normal');
			objects.box2_active = this.add.sprite(600, slotY_main, 'machine2_active');
			objects.box1.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box2.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box1_active.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box2_active.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box1_active.visible = false;
			objects.box2_active.visible = false;

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
		                objects.box1.visible = false;
						objects.box1_active.visible = false;
		                objects.box2.visible = false;
						objects.box2_active.visible = false;
						madeChoice(currentChoiceFlag, 'miss', isLeftRisky);
						game.scene.start('ScenePayoffFeedback', {didMiss: true});
						gameTimer.destroy();
	                }
	            },
	            callbackScope: this,
	            loop: true
	        });
	        // =============== Count down =================================

			// pointerdown
			objects.box1.on('pointerdown', function (pointer) {
				objects.box1.visible = false;
				objects.box1_active.visible = true;
				confirmationContainer.x = 200;
				confirmationContainer.visible = true;
				if(currentChoiceFlag == 2) {
					objects.box2_active.visible = false;
					objects.box2.visible = true;
				}
		    	currentChoiceFlag = 1;
		    }, this);
		    objects.box1_active.on('pointerdown', function (pointer) {
		    	//clearTimeout(countDownChoiceStage);
		    	if(!isChoiceMade) {
		    		madeChoice(currentChoiceFlag, exp_condition, isLeftRisky);
		    		gameTimer.destroy();
		    		game.scene.start('ScenePayoffFeedback', {didMiss: false});
		    		isChoiceMade = true;
		    		objects.box1.visible = false;
		    		objects.box2.visible = false;
		    		objects.box1_active.visible = false;
		    		confirmationContainer.visible= false;
		    	}		
		    }, this);
		    objects.box2.on('pointerdown', function (pointer) {
		    	objects.box2.visible = false;
				objects.box2_active.visible = true;
				confirmationContainer.x = 600;
				confirmationContainer.visible = true;
				if(currentChoiceFlag == 1) {
					objects.box1_active.visible = false;
					objects.box1.visible = true;
				}
		    	currentChoiceFlag = 2;
		    }, this);
		    objects.box2_active.on('pointerdown', function (pointer) {
		    	//clearTimeout(countDownChoiceStage);
				if(!isChoiceMade) {
		    		madeChoice(currentChoiceFlag, exp_condition, isLeftRisky);
		    		gameTimer.destroy();
		    		game.scene.start('ScenePayoffFeedback', {didMiss: false});
		    		isChoiceMade = true;
		    		objects.box1.visible = false;
		    		objects.box2.visible = false;
		    		objects.box2_active.visible = false;
		    		confirmationContainer.visible= false;
		    	}
		    }, this);

		    // pointerover
			objects.box1.on('pointerover', function (pointer) {
		    	objects.box1.setTint(0xb8860b); //B8860B ff0000
		    }, this);
		    objects.box2.on('pointerover', function (pointer) {
		    	objects.box2.setTint(0x008b8b); //008B8B
		    }, this);
		    // pointerout
			objects.box1.on('pointerout', function (pointer) {
		    	objects.box1.clearTint();
		    }, this);
		    objects.box2.on('pointerout', function (pointer) {
		    	objects.box2.clearTint();
		    }, this);

		    //  Texts
		    //trialText = this.add.text(16, trialText_Y, 'Current trial: 1 / '+horizon, { fontSize: '30px', fill: '#000' });
		    trialText = this.add.text(16, trialText_Y, 'Current trial: ' + currentTrial + ' / ' + horizon, { fontSize: '30px', fill: '#000' });
		    //scoreText = this.add.text(16, scoreText_Y, 'Total score: 0', { fontSize: '30px', fill: '#000' });
		    scoreText = this.add.text(16, scoreText_Y, 'Total score: ' + score, { fontSize: '30px', fill: '#000' });
		    timeText = this.add.text(16, energyBar_Y, 'Remaining time: ', { fontSize: '30px', fill: '#000' });
		    payoffText = this.add.text(feedbackTextPosition, slotY_main-80, `You got \n${payoff} points`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5, 0.5);
		    if(currentTrial === 1) {
		    	payoffText.visible = false;
		    } else {
		    	payoffText.visible = true;
		    }

		    // social information
		    let socialFreqNumbers = {};
		    if (!isLeftRisky) {
			    if (indivOrGroup == 1) {
				    socialFreqNumbers.sure = this.add.text(leftSlotPositionX, slotY_main+100, `${mySocialInfoList['sure']} people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				    socialFreqNumbers.risky = this.add.text(rightSlotPositionX, slotY_main+100, `${mySocialInfoList['risky']} people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				} else {
					socialFreqNumbers.sure = this.add.text(leftSlotPositionX, slotY_main+100, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				    socialFreqNumbers.risky = this.add.text(rightSlotPositionX, slotY_main+100, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				    socialFreqNumbers.sure.visible = false;
				    socialFreqNumbers.risky.visible = false;
				    if (mySocialInfoList['sure'] > 0) socialFreqNumbers.sure.visible = true;
				    if (mySocialInfoList['risky'] > 0) socialFreqNumbers.risky.visible = true;
				}
			} else {
				if (indivOrGroup == 1) {
				    socialFreqNumbers.sure = this.add.text(rightSlotPositionX, slotY_main+100, `${mySocialInfoList['sure']} people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				    socialFreqNumbers.risky = this.add.text(leftSlotPositionX, slotY_main+100, `${mySocialInfoList['risky']} people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				} else {
					socialFreqNumbers.sure = this.add.text(rightSlotPositionX, slotY_main+100, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				    socialFreqNumbers.risky = this.add.text(leftSlotPositionX, slotY_main+100, `You chose this`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
				    socialFreqNumbers.sure.visible = false;
				    socialFreqNumbers.risky.visible = false;
				    if (mySocialInfoList['sure'] > 0) socialFreqNumbers.sure.visible = true;
				    if (mySocialInfoList['risky'] > 0) socialFreqNumbers.risky.visible = true;
				}
			}
			if(currentTrial==1) {
		    	socialFreqNumbers.sure.visible = false;
		    	socialFreqNumbers.risky.visible = false;
		    }
		    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
		    let numberOfPreviousChoice_sure = mySocialInfoList['sure']
		    ,	numberOfPreviousChoice_risky = mySocialInfoList['risky']
		    ;
		    showStars.call(this, numberOfPreviousChoice_sure, numberOfPreviousChoice_risky, slotY_main+110, isLeftRisky);
		    
		}
		update(){
			//trialText.setText('Current trial: ' + currentTrial + ' / ' + horizon);
			//scoreText.setText('Total score: ' + score);
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
		}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#ffd6c9');//#d9d9d9 = grey #ffffff = white
			//  Texts
			let slotY_main = 300;
			objects_feedbackStage = {};
			objects_feedbackStage.box1 = this.add.sprite(200, slotY_main, 'machine1_active').setDisplaySize(optionWidth, optionHeight);
			objects_feedbackStage.box2 = this.add.sprite(600, slotY_main, 'machine2_active').setDisplaySize(optionWidth, optionHeight);
			objects_feedbackStage.box1.visible = false;
			objects_feedbackStage.box2.visible = false;

			/*switch (currentChoiceFlag) {
				case -1:
					feedbackTextPosition = missPositionX;
					currentChoiceFlag = 0;
					break;

				case 1:
					objects_feedbackStage.box1.visible = true;
					feedbackTextPosition = leftSlotPositionX;
					currentChoiceFlag = 0;

				case 2:
					objects_feedbackStage.box2.visible = true;
					feedbackTextPosition = rightSlotPositionX;
					currentChoiceFlag = 0;
					break;

				default:
					objects_feedbackStage.box2.visible = true;
					feedbackTextPosition = 700;
					currentChoiceFlag = 0;
					//console.log('currentChoiceFlag is '+currentChoiceFlag);
					break;
			}*/

			if(currentChoiceFlag == -1) {
				feedbackTextPosition = missPositionX;
				currentChoiceFlag = 0;
			} else if(currentChoiceFlag == 1) {
				objects_feedbackStage.box1.visible = true;
				feedbackTextPosition = leftSlotPositionX;
				currentChoiceFlag = 0;
			}else{
				objects_feedbackStage.box2.visible = true;
				feedbackTextPosition = rightSlotPositionX;
				currentChoiceFlag = 0;
			}

			if (this.didMiss) {
				payoffText = this.add.text(feedbackTextPosition, slotY_main-80, `Missed!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
			} else {
		    	payoffText = this.add.text(feedbackTextPosition, slotY_main-80, `${payoff} points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);
			}

			if (indivOrGroup == 1) {
				waitOthersText = this.add.text(16, 60, 'Please wait for others...', { fontSize: '30px', fill: '#000'});
			} else {
				waitOthersText = this.add.text(16, 60, '', { fontSize: '30px', fill: '#000'});
			}

		    setTimeout(function(){
		    	//payoffText.destroy();
		    	//game.scene.sleep('ScenePayoffFeedback');
		    	//game.scene.start('SceneMain');
		    	//console.log('emitting result stage ended!');
		    	socket.emit('result stage ended');
		    }, 2500);
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
			let totalEarning_USD = Math.round((totalEarning*cent_per_point))/100
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

    //Scene SampleGame
	class SceneSampleGame extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneSampleGame', active: false });
		}

		preload(){
			this.load.image('sky', 'assets/sky.png');
		    this.load.image('ground', 'assets/platform.png');
		    this.load.image('star', 'assets/star.png');
		    this.load.image('bomb', 'assets/bomb.png');
		    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
		}

		create(){
			//  A simple background for our game
		    this.add.image(400, 300, 'sky');
		    this.add.image(400, 300, 'star');
		    this.add.image(300, 300, 'star');
		    /*
		    Why 400 and 300? It's because in Phaser 3 all Game Objects are positioned based on their center by default. The background image is 800 x 600 pixels in size, so if we were to display it centered at 0 x 0 you'd only see the bottom-right corner of it. If we display it at 400 x 300 you see the whole thing.
		    */

		    //  The platforms group contains the ground and the 2 ledges we can jump on
		    platforms = this.physics.add.staticGroup();

		    //  Here we create the ground.
		    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
		    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

		    //  Now let's create some ledges
		    platforms.create(600, 400, 'ground');
		    platforms.create(50, 250, 'ground');
		    platforms.create(750, 220, 'ground');

		    // The player and its settings
		    player = this.physics.add.sprite(100, 450, 'dude');

		    //  Player physics properties. Give the little guy a slight bounce.
		    player.setBounce(0.2);
		    player.setCollideWorldBounds(true);

		    //  Our player animations, turning, walking left and walking right.
		    this.anims.create({
		        key: 'left',
		        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
		        frameRate: 10,
		        repeat: -1
		    });

		    this.anims.create({
		        key: 'turn',
		        frames: [ { key: 'dude', frame: 4 } ],
		        frameRate: 20
		    });

		    this.anims.create({
		        key: 'right',
		        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
		        frameRate: 10,
		        repeat: -1
		    });

		    //  Input Events
		    cursors = this.input.keyboard.createCursorKeys();

		    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
		    stars = this.physics.add.group({
		        key: 'star',
		        //	Because it creates 1 child automatically, repeating 11 times means we'll get 12 in total, which is just what we need for our game:
		        repeat: 11, 
		        setXY: { x: 12, y: 0, stepX: 70 }
		    });

		    stars.children.iterate(function (child) {

		        //  Give each star a slightly different bounce
		        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

		    });

		    bombs = this.physics.add.group();

		    //  The score
		    scoreText = this.add.text(16, 16, 'Total score: 0', { fontSize: '32px', fill: '#000' });

		    //  Collide the player and the stars with the platforms
		    this.physics.add.collider(player, platforms);
		    this.physics.add.collider(stars, platforms);
		    this.physics.add.collider(bombs, platforms);

		    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
		    this.physics.add.overlap(player, stars, collectStar, null, this);

		    this.physics.add.collider(player, bombs, hitBomb, null, this);
		}

		update(){
			if (gameOver)
		    {
		        return;
		    }

		    if (cursors.left.isDown)
		    {
		        player.setVelocityX(-160);

		        player.anims.play('left', true);
		    }
		    else if (cursors.right.isDown)
		    {
		        player.setVelocityX(160);

		        player.anims.play('right', true);
		    }
		    else
		    {
		        player.setVelocityX(0);

		        player.anims.play('turn');
		    }

		    if (cursors.up.isDown && player.body.touching.down)
		    {
		        player.setVelocityY(-330);
		    }
		}
	};

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
    	, SceneUnderstandingTest
    	, ScenePerfect
    	, SceneStartCountdown
    	, SceneMain
    	, ScenePayoffFeedback
    	, SceneGoToQuestionnaire
    	, SceneSampleGame 
    	]
	};

	let game = new Phaser.Game(config);
	game.scene.add('SceneWaitingRoom0');
	game.scene.add('SceneWaitingRoom');
	game.scene.add('SceneInstruction');
	game.scene.add('SceneTutorial');
	game.scene.add('SceneTutorialFeedback');
	game.scene.add('SceneUnderstandingTest');
	game.scene.add('ScenePerfect');
	game.scene.add('SceneStartCountdown');
	game.scene.add('SceneMain');
	game.scene.add('ScenePayoffFeedback');
	game.scene.add('SceneGoToQuestionnaire');
	game.scene.add('SceneSampleGame');


	// functions

	// controlling pictures and figures in the instruction page
	/*function instructionPicturesFunction (indivOrGroup, instructionPosition) {
		//console.log('indivOrGroup = ' + indivOrGroup + ' and instructionPosition = ' + instructionPosition);
	}*/

	// randomly choosing an integer between min and max 
	function rand(max, min = 0) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * 正規分布乱数関数 参考:http://d.hatena.ne.jp/iroiro123/20111210/1323515616
     * @param number m: mean μ
     * @param number sigma: variance = σ^2
     * @return number ランダムに生成された値
     * Box-Muller Method
     */
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

    // Sum of all elements of the array
    function sum (arr, fn) {  
        if (fn) {
            return sum(arr.map(fn));
        }
        else {
            return arr.reduce(function(prev, current, i, arr) {
                    return prev+current;
            });
        }
    };

    /*function setSlotPosition (isLeftRisky) {
    	if (isLeftRisky) {
    		leftSlotPositionX = 600;
    		rightSlotPositionX = 200;
    		missPositionX = (leftSlotPositionX+rightSlotPositionX)/2;
    	} else {
    		leftSlotPositionX = 200;
    		rightSlotPositionX = 600;
    		missPositionX = (leftSlotPositionX+rightSlotPositionX)/2;
    	}
    	//console.log('isLeftRisky = '+isLeftRisky+' so the rightSlotPositionX = '+rightSlotPositionX);
    }*/

    function showStars (num_sure, num_risky, socialInfoY, isLeftRisky) {
    	////console.log('showStars was executed on' + this);
    	//if (tutorialTrial != 1 | tutorialTrial != 4) {
	    //if (num_sure>0) {
    	let mod_num_sure = num_sure % 5;
    	let quotient_num_sure = Math.floor(num_sure / 5);
    	let leftSlotPositionX_new = leftSlotPositionX-15 + 10*quotient_num_sure
    	let mod_num_risky = num_risky % 5;
    	let quotient_num_risky = Math.floor(num_risky / 5);
    	let rightSlotPositionX_new = rightSlotPositionX-15 + 10*quotient_num_risky

    	if (!isLeftRisky) {
	    	// First, draw 5 stars
	    	if (quotient_num_sure > 0) {
	    		for (let q=0; q<quotient_num_sure; q++) {
		    		stars_sure[q] = this.add.group({
				        key: 'star',
				        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
				        // which is just what we need for our game:
				        repeat: 5-1, 
				        setXY: { x: leftSlotPositionX_new - 20*q, y: socialInfoY+20, stepY: 15 }
				    });
		    	}
	    	}
	    	// Then, draw the remaining stars
	    	if (mod_num_sure > 0) {
	    		stars_sure[quotient_num_sure] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
			        // which is just what we need for our game:
			        repeat: mod_num_sure-1, 
			        setXY: { x: leftSlotPositionX_new - 20*quotient_num_sure, y: socialInfoY+20, stepY: 15 }
			    });
	    	}
			
	    	// First, draw 5 stars
	    	if (quotient_num_risky > 0) {
	    		for (let q=0; q<quotient_num_risky; q++) {
		    		stars_risky[q] = this.add.group({
				        key: 'star',
				        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
				        // which is just what we need for our game:
				        repeat: 5-1, 
				        setXY: { x: rightSlotPositionX_new - 20*q, y: socialInfoY+20, stepY: 15 }
				    });
		    	}
	    	}
	    	// Then, draw the remaining stars
	    	if (mod_num_risky > 0) {
	    		stars_risky[quotient_num_risky] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
			        // which is just what we need for our game:
			        repeat: mod_num_risky-1, 
			        setXY: { x: rightSlotPositionX_new - 20*quotient_num_risky, y: socialInfoY+20, stepY: 15 }
			    });
	    	}
	    } else {
	    	// First, draw 5 stars
	    	if (quotient_num_sure > 0) {
	    		for (let q=0; q<quotient_num_sure; q++) {
		    		stars_sure[q] = this.add.group({
				        key: 'star',
				        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
				        // which is just what we need for our game:
				        repeat: 5-1, 
				        setXY: { x: rightSlotPositionX_new - 20*q, y: socialInfoY+20, stepY: 15 }
				    });
		    	}
	    	}
	    	// Then, draw the remaining stars
	    	if (mod_num_sure > 0) {
	    		stars_sure[quotient_num_sure] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
			        // which is just what we need for our game:
			        repeat: mod_num_sure-1, 
			        setXY: { x: rightSlotPositionX_new - 20*quotient_num_sure, y: socialInfoY+20, stepY: 15 }
			    });
	    	}
			
	    	// First, draw 5 stars
	    	if (quotient_num_risky > 0) {
	    		for (let q=0; q<quotient_num_risky; q++) {
		    		stars_risky[q] = this.add.group({
				        key: 'star',
				        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
				        // which is just what we need for our game:
				        repeat: 5-1, 
				        setXY: { x: leftSlotPositionX_new - 20*q, y: socialInfoY+20, stepY: 15 }
				    });
		    	}
	    	}
	    	// Then, draw the remaining stars
	    	if (mod_num_risky > 0) {
	    		stars_risky[quotient_num_risky] = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
			        // which is just what we need for our game:
			        repeat: mod_num_risky-1, 
			        setXY: { x: leftSlotPositionX_new - 20*quotient_num_risky, y: socialInfoY+20, stepY: 15 }
			    });
	    	}
	    }
    }   

    // madeChoice
    function madeChoice (flag, distribution, isLeftRisky) {  
        let thisChoice;
        switch (flag) {
        	case -1:
        		// Execute if flag == -1
        		thisChoice = 'miss';
				payoffText.x = 400;
				break;

			case 1:
				if (isLeftRisky) {
					thisChoice = 'risky';
				} else {
					thisChoice = 'sure';
				}
				payoffText.x = 200;
				break;

			case 2:
				if (isLeftRisky) {
					thisChoice = 'sure';
				} else {
					thisChoice = 'risky';
				}
				payoffText.x = 600;
				break;

			default:
        		thisChoice = 'miss';
				payoffText.x = 400;
				break;
        }
		// calculating the payoff from this choice
		if (distribution == 'miss') {
			payoff = 0;
			if (indivOrGroup == 1) {
				socket.emit('choice made', {choice: thisChoice, payoff: 0, socialInfo:mySocialInfo, publicInfo:myPublicInfo, totalEarning: totalEarning, subjectNumber:subjectNumber});
			} else {
				saveChoiceDataLocally({choice: thisChoice, payoff: 0, socialInfo:mySocialInfo, publicInfo:myPublicInfo, totalEarning: totalEarning, subjectNumber:subjectNumber});
			}
        	//console.log('choice was made: choice = ' + thisChoice + ' and payoff = ' + 0 + '.');
		} else if (distribution == 'binary') {
			payoff = randomChoiceFromTwo(thisChoice, payoffList[thisChoice], probabilityList[thisChoice], mySocialInfo, myPublicInfo);
		} else {
			payoff = randomChoiceFromGaussian(thisChoice, mySocialInfo, myPublicInfo);
		}
		score += payoff;
		scoreText.setText('Total score: ' + score);
		payoffText.setText(payoff);
		payoffText.visible = true;
		trialText.setText('Current trial: ' + currentTrial + ' / ' + horizon);
    };

    // random choice with probability -- binary distribution
    function randomChoiceFromTwo(choice, payoffList, p_rare, socialInfo, publicInfo) {
    	let roulette = Math.random()
    	let noise = BoxMuller(0, smallNoise)
    	let thisPayoff
    	if (p_rare < roulette) { // common event
    		thisPayoff = Math.floor((payoffList[0] + noise)*100);
    		myEarnings.push(thisPayoff);
            myChoices.push(choice);   		
    	} else { // rare event
    		thisPayoff = Math.floor((payoffList[1] + noise)*100);
    		myEarnings.push(thisPayoff);
            myChoices.push(choice);
    	}
    	if (indivOrGroup == 1) {
			socket.emit('choice made', {choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber});
    	} else {
    		saveChoiceDataLocally({choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber});
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
    	if (indivOrGroup == 1) {
    		socket.emit('choice made', {choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber});
    	} else {
    		saveChoiceDataLocally({choice: choice, payoff: thisPayoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+thisPayoff), subjectNumber:subjectNumber});
    	}
        //console.log('choice was made: choice = ' + choice + ' and payoff = ' + thisPayoff + '.');
    	return thisPayoff;
	}

	function saveChoiceDataLocally (data) {
		let now = new Date()
    	//,	timeElapsed = now - data.firstTrialStartingTime
    	;
    	myLastChoice = data.choice;
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
			,	choice: data.choice
			,	payoff: data.payoff
			,	totalEarning: data.totalEarning
			,	behaviouralType: 'choice'
			,	latency: sum(averageLatency)/averageLatency.length
			,	maxGroupSize: maxGroupSize
			}
		);

		if (currentTrial >= horizon) {
			socket.emit('Data from Indiv', myData);
		}
	}

	// random choice with equal probability
    function choose(arr) {
		var index = Math.floor(Math.random() * arr.length);
		return arr[index];
	}

	function collectStar (player, star)
	{
	    star.disableBody(true, true);

	    //  Add and update the score
	    score += 10;
	    scoreText.setText('Total score: ' + score);

	    if (stars.countActive(true) === 0)
	    {
	        //  A new batch of stars to collect
	        stars.children.iterate(function (child) {

	            child.enableBody(true, child.x, 0, true, true);

	        });

	        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

	        var bomb = bombs.create(x, 16, 'bomb');
	        bomb.setBounce(1);
	        bomb.setCollideWorldBounds(true);
	        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
	        bomb.allowGravity = false;

	    }
	}

	function hitBomb (player, bomb)
	{
	    this.physics.pause();

	    player.setTint(0xff0000);

	    player.anims.play('turn');

	    gameOver = true;
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
        exp_condition = data.exp_condition;
        subjectNumber = data.subjectNumber;
        isLeftRisky = data.isLeftRisky;
        //setSlotPosition(data.isLeftRisky);

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
        //console.log('this is the remaining waiting time: '+restTime+' msec.');
        if (isPreloadDone & !isWaitingRoomStarted) {
        	game.scene.start('SceneWaitingRoom');
        } else {
        	socket.emit('not ready yet');
        }
        //SceneWaitingRoom
        //core.replaceScene(core.waitingRoomScene(data.restTime));
    });

    socket.on('wait for others finishing test', function () {
    	game.scene.sleep('SceneWaitingRoom');
    	game.scene.sleep('SceneInstruction');
    	game.scene.sleep('SceneTutorial');
    	game.scene.sleep('SceneTutorialFeedback');
    	game.scene.sleep('SceneUnderstandingTest');
    	game.scene.sleep('ScenePerfect');
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
        game.scene.sleep('SceneWaitingRoom');
        game.scene.start('SceneInstruction', data);
        //core.replaceScene(core.instructionScene(exp_condition, indivOrGroup));
    });

    socket.on('you guys are individual condition', function () {
    	//console.log('receive: "you guys are individual condition"');
        socket.emit('ok individual condition sounds good');
    });

    socket.on('all passed the test', function(data) {
        //console.log('testPassed reached ' + data.testPassed + ' conditoin: ' + data.exp_condition);
        game.scene.sleep('SceneWaitingRoom');
        game.scene.sleep('SceneWaitingRoom2');
        game.scene.start('SceneStartCountdown');
    });

    socket.on('these are done subjects', function(data) {
        doneSubject = data.doneSubject;
        //console.log('doneSubject is ' + doneSubject);
    });

    socket.on('Proceed to next round', function(data) {
        mySocialInfo = data.socialInfo[data.round-2];
        myPublicInfo = data.publicInfo[data.round-2];
        choiceOrder = data.choiceOrder[data.round-2];
        if (indivOrGroup == 1) {
        	mySocialInfoList['sure'] = data.socialFreq[data.round-1][surePosition];
        	mySocialInfoList['risky'] = data.socialFreq[data.round-1][riskyPosition];
        } else if (myLastChoice == 'sure') {
        	mySocialInfoList['sure'] = 1;
        	mySocialInfoList['risky'] = 0;
        } else if (myLastChoice == 'risky') {
        	mySocialInfoList['sure'] = 0;
        	mySocialInfoList['risky'] = 1;
        } else {
        	mySocialInfoList['sure'] = null;
        	mySocialInfoList['risky'] = null;
        }
        currentTrial++;
        totalEarning += payoff;
        $("#totalEarningInCent").val(Math.round(totalEarning * cent_per_point));
        $("#currentTrial").val(currentTrial);
        $("#exp_condition").val(exp_condition);
        //$("#confirmationID").val(confirmationID);
        $("#bonus_for_waiting").val(Math.round(waitingBonus));
        payoffText.destroy();
        waitOthersText.destroy();
        objects_feedbackStage.box1.destroy();
        objects_feedbackStage.box2.destroy();
    	game.scene.sleep('ScenePayoffFeedback');
    	game.scene.start('SceneMain');
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
        $("#totalEarningInCent").val(Math.round(totalEarning * cent_per_point));
        $("#currentTrial").val(currentTrial);
        $("#completed").val(1);
        $("#exp_condition").val(exp_condition);
        //$("#confirmationID").val(confirmationID);
        payoffText.destroy();
        waitOthersText.destroy();
        objects_feedbackStage.box1.destroy();
        objects_feedbackStage.box2.destroy();
    	game.scene.sleep('ScenePayoffFeedback');
    	game.scene.start('SceneGoToQuestionnaire');
    });

    socket.on('S_to_C_welcomeback', function(data) {
    	// You could give a change to the shortly disconnected client to go back to the session 
    	// However, for now I just redirect them to the questionnaire
        socket.io.opts.query = 'sessionName=already_finished';
        socket.disconnect();
        window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(totalEarning)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+0+'&latency='+submittedLatency;
        ////console.log('Received: "S_to_C_welcomeback": client = '+data.sessionName +'; room = '+data.roomName);
    });

} // window.onload -- end
