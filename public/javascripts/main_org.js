/*

Multi-armed bandit task 2020
Author: Wataru Toyokawa (wataru.toyokawa@uni-konstanz.de)
26 Feb. 2020

*/

'use strict';

const htmlServer = 'http://192.168.33.10:'; // vagrant server
//const htmlServer = 'http://63-250-60-135.cloud-xip.io'; ipaddress 63.250.60.135
const portnum = 8080;
const portnumQuestionnaire = 8000;
const exceptions = ['INHOUSETEST', 'testEmPra', 'testEmPra2'];

//const instructionText = require('./instructionText');
const waitingRoomText = 
	[ 'Waiting Room'
	, 'Please do not reload this page or open a new browser window.'
	, 'Also please not to hide this browser window by other apps.'
	, 'If you do so, the task will be terminated automatically.'
	, 'The study starts in ' + '???' + ' sec.'
	];
const waitingForOthers = 
	[ 'Wait for others'
	, 'Please do not reload this page or open a new browser window.'
	, 'Also please not to hide this browser window by other apps.'
	, 'If you do so, the task will be terminated automatically.'
	, 'Your waiting bonus is ' + '???' + ' cents.'
	];
const instructionText = 
	[ 'Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task. <br><br>After answering these questions, you may spend some time in a waiting room until a sufficient number of participants has arrived to start the task. <br><br>You will be paid <span class="note">13.2 cents per minute</span> ($8 per hour) for any time spent in the waiting room. When a group of participants is ready, the main task will start.'
	, 'Throughout the main task, you are to make a series of choices between 2&nbsp; slot machines (labeled by the letters&nbsp;A to&nbsp;E).<br><br>Overall, there will be <span class="note">150&nbsp;trials</span>. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>. <br><br>Each choice will earn you a reward, which are <span class="note">added up in each trial</span> and <span class="note">accumulated over the 150&nbsp;trials</span>.'
	, 'This is instruction 3.'
	, 'This is instruction 4.'
	, 'This is instruction 5.'
	, 'This is instruction 6.'
	];
const tutorialText = 
	[ 'This is tutorial 1. <br><br>This is tutorial. <br><br>This is tutorial.'
	, 'This is tutorial 2. <br><br>This is tutorial. <br><br>This is tutorial.'
	, 'This is tutorial 3.'
	, 'This is tutorial 4.'
	, 'This is tutorial 5.'
	, 'This is tutorial 6.'
	];

// experimental variables (negatively skewed)
//["risky", "risky", "risky", "sure", "risky", "risky", "risky", "sure", "sure", "risky", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "risky", "risky", "risky", "risky", "risky", "risky", "risky", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure", "sure"]
let pRiskyRare = 0.3
, pSure = 1
, payoff_sureL = 1.5
, payoff_sureH = 1.5
, payoff_riskyCommon = 0.5
, payoff_riskyRare = 4.2
, smallNoise = 0.1
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
,   sessionName
,   roomName
,   subjectNumber
,	indivOrGroup
,	exp_condition
,   connectionCounter
,   currentTrial = 1
,   currentStage
,   choiceOrder
,   currentChoiceFlag = 0
,   waitingBonus = 0
,   confirmationID = 'browser-reloaded'
,   maxGroupSize
,	maxWaitingTime
,   choiceOpportunities
,   horizon = 150
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
;

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
        //console.log('this window got invisible.');
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
    , surePositionX = 200
    , riskyPositionX = 600
    , surePosition = 0
    , riskyPosition = 1
    , noteColor = '#ff5a00' // red-ish
    , nomalTextColor = '#000000' // black
    , player
	, stars_sure
	, stars_risky
	, bombs
	, platforms
	, cursors
	, score = 0
	, gameOver = false
	, choiceFlag
	, waitingBox
	, waitingBar
	, waitingCountdown
	, bonusBar
	, bonusBox
	, countdownText
	, bonusText
	, restTime
	, trialText
	, scoreText
	, payoffText
	, objects_feedbackStage
	, feedbackTextPosition
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
			this.load.image('trap', 'assets/wana_hakowana.png');
		    this.load.image('lancer', 'assets/war_trident.png');
		    this.load.image('button', 'assets/button.001.png');
			this.load.image('bonusBarFrame', 'assets/bar.png');
			this.load.image('bonusBar', 'assets/scaleOrange.png');
			this.load.image('startImg', 'assets/start.png');
			this.load.image('machine1_normal', 'assets/machine_normal_1.png');
			this.load.image('machine2_normal', 'assets/machine_normal_2.png');
			this.load.image('machine1_active', 'assets/machine_active_1.png');
			this.load.image('machine2_active', 'assets/machine_active_2.png');
			// progress bar functions
			this.load.on('progress', function (value) {
			    //console.log(value);
			    progressBar.clear();
			    progressBar.fillStyle(0xffffff, 1);
			    progressBar.fillRect(250, 280, 300 * value, 30);
			    percentText.setText(parseInt(value * 100) + '%');
			});
			this.load.on('fileprogress', function (file) {
			    console.log(file.src);
			});
			this.load.on('complete', function () {
			    //console.log('complete');
			    isPreloadDone = true;
			    progressBar.destroy();
				progressBox.destroy();
				loadingText.destroy();
				percentText.destroy();
				// execute if preload completed later than on.connection('this is your parameter')
				if(isEnvironmentReady) this.scene.start('SceneWaitingRoom');
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
		    let title = this.add.text(configWidth/2, 18, waitingRoomText[0], { fontSize: '36px', fill: '#000', fontstyle: 'bold' });
		    let note1 = this.add.text(configWidth/2, 70, waitingRoomText[1], textStyle);
		    let note2 = this.add.text(configWidth/2, 70+30*2, waitingRoomText[2], textStyle);
		    let note3 = this.add.text(configWidth/2, 70+30*4, waitingRoomText[3], noteStyle);
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
			bonusText = this.add.text(configWidth/2, 450, 'Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cent.' , textStyle);
			bonusText.setOrigin(0.5, 0.5);
		}

		update(){
			waitingBar.clear();
			waitingBar.fillStyle(0x00a5ff, 1);
		    waitingBar.fillRect(250, 280, 300 * waitingCountdown.getProgress(), 30);
			countdownText.setText('The study starts in ' + (Math.floor(0.9+(restTime/1000)*(1-waitingCountdown.getProgress()))).toString().substr(0, 3) + ' sec.');
			//console.log( 0.9+(restTime/1000)*(1-waitingCountdown.getProgress()) );
			//console.log(waitingCountdown.getProgress());
			waitingBonus += 1.32/(6*game.loop.actualFps)
			bonusBar.clear();
			bonusBar.fillStyle(0xff5a00, 1);
			if(waitingBonus*2<300) {
		    	bonusBar.fillRect(250, 390, waitingBonus*2, 30); //1.32 cents per 6 seconds = 8 Euro per hour
			}else{
				bonusBar.fillRect(250, 390, 300, 30);
			}
			bonusText.setText('Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cent.');
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
			bonusText = this.add.text(configWidth/2, 450, 'Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cent.' , textStyle);
			bonusText.setOrigin(0.5, 0.5);
		}

		update(){
			//waitingBar.clear();
			//waitingBar.fillStyle(0x00a5ff, 1);
		    //waitingBar.fillRect(250, 280, 300 * waitingCountdown.getProgress(), 30);
			//countdownText.setText('The study starts in ' + (Math.floor(0.9+(restTime/1000)*(1-waitingCountdown.getProgress()))).toString().substr(0, 3) + ' sec.');
			//console.log( 0.9+(restTime/1000)*(1-waitingCountdown.getProgress()) );
			//console.log(waitingCountdown.getProgress());
			waitingBonus += 1.32/(6*game.loop.actualFps)
			bonusBar.clear();
			bonusBar.fillStyle(0xff5a00, 1);
			if(waitingBonus*2<300) {
		    	bonusBar.fillRect(250, 390, waitingBonus*2, 30); //1.32 cents per 6 seconds = 8 Euro per hour
			}else{
				bonusBar.fillRect(250, 390, 300, 30);
			}
			bonusText.setText('Your waiting bonus: '+waitingBonus.toString().substr(0, 2)+' US cent.');
		}
	};

	// SceneInstruction
	class SceneInstruction extends Phaser.Scene {

		constructor (){
		    super({ key: 'SceneInstruction' });
		}

		preload(){
		}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#00FFFF'); //#FFFFFF == 'white'

		    // Instruction texts
		    let instructionPosition = 0;
		    // create a new 'div' for the instruction texts
		    const instructionTextStyle = 'background-color: rgba(0,255,0,0.2); width: 700px; height: 400px; font: 25px Arial;';
		    let instructionDiv = document.createElement('div');
		    instructionDiv.style = instructionTextStyle;
		    instructionDiv.innerHTML = instructionText[instructionPosition];
		    instructionDiv.id = 'instructionDiv';
		    // Add the div 
		    let instructionElement = this.add.dom(configWidth/2, 220, instructionDiv);

		    // next button
		    let nextButtonContainer = this.add.container(550, 520);
			let nextButtonImage = this.add.sprite(0, 0, 'button').setDisplaySize(200,150).setInteractive({ cursor: 'pointer' });
			let nextButtonText = this.add.text(0, 0, 'Next', { fontSize: '32px', fill: '#000' });
			nextButtonText.setOrigin(0.5, 0.5);
			nextButtonContainer.add(nextButtonImage);
			nextButtonContainer.add(nextButtonText);
		    nextButtonImage.on('pointerdown', function (pointer) {
		    	if(instructionPosition < instructionText.length - 1){
		    		instructionPosition += 1;
		    		instructionDiv.innerHTML = instructionText[instructionPosition];
		    	} else {
		    		game.scene.start('SceneTutorial');
		    		nextButtonContainer.destroy();
		    		backButtonContainer.destroy();
		    	}
		    });
		    // back button 
		    let backButtonContainer = this.add.container(250, 520);
			let backButtonImage = this.add.sprite(0, 0, 'button').setDisplaySize(200,150).setInteractive({ cursor: 'pointer' });
			let backButtonText = this.add.text(0, 0, 'back', { fontSize: '32px', fill: '#000' });
			backButtonText.setOrigin(0.5, 0.5);
			backButtonContainer.add(backButtonImage);
			backButtonContainer.add(backButtonText);
		    backButtonImage.on('pointerdown', function (pointer) {
		    	if(instructionPosition>0){
		    		instructionPosition -= 1;
		    		instructionDiv.innerHTML = instructionText[instructionPosition];
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

		update(){}
	};

	// SceneTutorial
	class SceneTutorial extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneTutorial' });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#00FFFF'); //#FFFFFF == 'white'

		    // tutorial texts
		    let tutorialPosition = 0;
		    const tutorialTextStyle = 'background-color: rgba(0,255,0,0.2); width: 700px; height: 150px; font: 25px Arial;';
		    let instructionDiv = document.getElementById('instructionDiv');
		    instructionDiv.style = tutorialTextStyle;
		    instructionDiv.innerHTML = tutorialText[tutorialPosition];
		    
		    // slot machines and choice button
		    let tutorialFlag = 0;
		    let objects = {};
			objects.box1 = this.add.sprite(200, 300, 'machine1_normal');
			objects.box1_active = this.add.sprite(200, 300, 'machine1_active');
			objects.box2 = this.add.sprite(600, 300, 'machine2_normal');
			objects.box2_active = this.add.sprite(600, 300, 'machine2_active');
			objects.box1.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box2.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box1_active.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box2_active.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box1_active.visible = false;
			objects.box2_active.visible = false;
			// 
			let buttonContainer = this.add.container(400, 500);
			let buttonImage = this.add.sprite(0, 0, 'button').setDisplaySize(200,150).setInteractive({ cursor: 'pointer' });
			let buttonText = this.add.text(0, 0, 'testing', { fontSize: '32px', fill: '#000' });
			buttonText.setOrigin(0.5, 0.5);
			buttonContainer.add(buttonImage);
			buttonContainer.add(buttonText);
			buttonContainer.visible = false; // it's hidden in default

			// click event
			objects.box1.on('pointerdown', function (pointer) {
				objects.box1.visible = false;
				objects.box1_active.visible = true;
				if(tutorialFlag == 2) {
					objects.box2_active.visible = false;
					objects.box2.visible = true;
				}
		    	tutorialFlag = 1;
		    	// confirmation button
		    	buttonText.setText('Click to \nchoose \nmachine 1');
		    	buttonContainer.visible = true;

		    }, this);
		    objects.box2.on('pointerdown', function (pointer) {
		    	objects.box2.visible = false;
				objects.box2_active.visible = true;
				if(tutorialFlag == 1) {
					objects.box1_active.visible = false;
					objects.box1.visible = true;
				}
		    	tutorialFlag = 2;
		    	// confirmation button
		    	buttonText.setText('Click to \nchoose \nmachine 2');
		    	buttonContainer.visible = true;
		    }, this);
		    buttonImage.on('pointerdown', function (pointer) {
		    	instructionDiv.style = 'background-color: rgba(0,0,0,0)';
		    	instructionDiv.innerHTML = '';
		    	tutorialFlag = 0;
		    	objects.box1.destroy();
		    	objects.box2.destroy();
		    	buttonContainer.destroy();
		    	game.scene.start('SceneUnderstandingTest');
		    });

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
		    buttonImage.on('pointerover', function (pointer) {
		    	buttonImage.setTint(0xa9a9a9);
		    }, this);
		    buttonImage.on('pointerout', function (pointer) {
		    	buttonImage.clearTint();
		    }, this);
		}

		update(){}
	};

	// SceneUnderstandingTest
	class SceneUnderstandingTest extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneUnderstandingTest' });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#00FFFF'); //#FFFFFF == 'white'

			// 
			let buttonContainer = this.add.container(400, 500);
			let buttonImage = this.add.sprite(0, 0, 'button').setDisplaySize(200,150).setInteractive({ cursor: 'pointer' });
			let buttonText = this.add.text(0, 0, 'pass test', { fontSize: '32px', fill: '#000' });
			buttonText.setOrigin(0.5, 0.5);
			buttonContainer.add(buttonImage);
			buttonContainer.add(buttonText);
			buttonContainer.visible = true; // it's hidden in default

			// click event
		    buttonImage.on('pointerdown', function (pointer) {
		    	instructionDiv.style = 'background-color: rgba(0,0,0,0)';
		    	instructionDiv.innerHTML = '';
		    	buttonContainer.destroy();
		    	socket.emit('test passed');
		    });

		    // pointer over & out effects
		    buttonImage.on('pointerover', function (pointer) {
		    	buttonImage.setTint(0xa9a9a9);
		    }, this);
		    buttonImage.on('pointerout', function (pointer) {
		    	buttonImage.clearTint();
		    }, this);
		}

		update(){}
	};

	// SceneStartCountdown
	class SceneStartCountdown extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneStartCountdown' });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#00FFFF'); //#FFFFFF == 'white'

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
		    super({ key: 'SceneMain' });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#00FFFF');
			console.log('SceneMain started. currentTrial: ' + currentTrial);
			// options
			// slot machines and choice button
		    let objects = {};
			objects.box1 = this.add.sprite(200, 300, 'machine1_normal');
			objects.box1_active = this.add.sprite(200, 300, 'machine1_active');
			objects.box2 = this.add.sprite(600, 300, 'machine2_normal');
			objects.box2_active = this.add.sprite(600, 300, 'machine2_active');
			objects.box1.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box2.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box1_active.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box2_active.setDisplaySize(optionWidth, optionHeight).setInteractive({ cursor: 'pointer' });
			objects.box1_active.visible = false;
			objects.box2_active.visible = false;

			// confirmation text
			let confirmationContainer = this.add.container(175, 320);
			let confirmationImage = this.add.sprite(0, 0, 'button').setDisplaySize(160,100).setAlpha(0.7);
			let confirmationText = this.add.text(0, 0, `Click again\nto confirm \nyour choice`, { fontSize: '20px', fill: '#000' }).setOrigin(0.5, 0.5);
			confirmationContainer.add(confirmationImage);
			confirmationContainer.add(confirmationText);
			confirmationContainer.visible = false; // it's hidden in default

			// pointerdown
			let isChoiceMade = false;
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
		    	if(!isChoiceMade) madeChoice(currentChoiceFlag);
		    	isChoiceMade = true;
				objects.box1.visible = false;
	    		objects.box2.visible = false;
	    		objects.box1_active.visible = false;
	    		//buttonContainer.visible = false;
		    	if (currentTrial > horizon) {
		    		game.scene.start('SceneSampleGame');
		    		objects.box1.destroy();
	    			objects.box2.destroy();
	    			//buttonContainer.destroy();
		    	} else {
		    		game.scene.start('ScenePayoffFeedback');
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
				if(!isChoiceMade) madeChoice(currentChoiceFlag);
		    	isChoiceMade = true;
				objects.box1.visible = false;
	    		objects.box2.visible = false;
	    		objects.box2_active.visible = false;
		    	if (currentTrial > horizon) {
		    		game.scene.start('SceneSampleGame');
		    		objects.box1.destroy();
	    			objects.box2.destroy();
		    	} else {
		    		game.scene.start('ScenePayoffFeedback');
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
		    trialText = this.add.text(16, 16, 'Current trial: 1 / '+horizon, { fontSize: '32px', fill: '#000' });
		    scoreText = this.add.text(16, 70, 'Total score: 0', { fontSize: '32px', fill: '#000' });
		    payoffText = this.add.text(feedbackTextPosition, 220, `You got \n${payoff} points`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5, 0.5);
		    if(currentTrial === 1) {
		    	payoffText.visible = false;
		    } else {
		    	payoffText.visible = true;
		    }

		    // social information
		    let socialFreqNumbers = {};
		    socialFreqNumbers.sure = this.add.text(surePositionX, 400, `${mySocialInfoList['sure']} people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		    socialFreqNumbers.risky = this.add.text(riskyPositionX, 400, `${mySocialInfoList['risky']} people chose`, { fontSize: '25px', fill: noteColor }).setOrigin(0.5,0.5);
		    if(currentTrial==1) {
		    	socialFreqNumbers.sure.visible = false;
		    	socialFreqNumbers.risky.visible = false;
		    }
		    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
		    let numberOfPreviousChoice_sure = mySocialInfoList['sure']
		    ,	numberOfPreviousChoice_risky = mySocialInfoList['risky'];
		    if (numberOfPreviousChoice_sure>0) {
			    stars_sure = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
			        // which is just what we need for our game:
			        repeat: numberOfPreviousChoice_sure-1, 
			        setXY: { x: surePositionX, y: 440, stepY: 30 }
			    });
			}
			if (numberOfPreviousChoice_risky>0) {
			    stars_risky = this.add.group({
			        key: 'star',
			        // Because it creates 1 child automatically, repeating 1 times means we'll get 2 in total, 
			        // which is just what we need for our game:
			        repeat: numberOfPreviousChoice_risky-1, 
			        setXY: { x: riskyPositionX, y: 440, stepY: 30 }
			    });
			}
		}
		update(){
			trialText.setText('Current trial: ' + currentTrial + ' / ' + horizon);
			scoreText.setText('Total score: ' + score);
		}
	};

	// ScenePayoffFeedback
	class ScenePayoffFeedback extends Phaser.Scene {

		constructor (){
		    super({ key: 'ScenePayoffFeedback' });
		}

		preload(){
			}

		create(){
			// background colour
			this.cameras.main.setBackgroundColor('#ffffff');//.setAlpha(0.5);
			//  Texts
			objects_feedbackStage = {};
			objects_feedbackStage.box1 = this.add.sprite(200, 300, 'machine1_active').setDisplaySize(optionWidth, optionHeight);
			objects_feedbackStage.box2 = this.add.sprite(600, 300, 'machine2_active').setDisplaySize(optionWidth, optionHeight);
			objects_feedbackStage.box1.visible = false;
			objects_feedbackStage.box2.visible = false;
			if(currentChoiceFlag == 1) {
				objects_feedbackStage.box1.visible = true;
				feedbackTextPosition = surePositionX;
				currentChoiceFlag = 0;
			}else{
				objects_feedbackStage.box2.visible = true;
				feedbackTextPosition = riskyPositionX;
				currentChoiceFlag = 0;
			}
		    payoffText = this.add.text(feedbackTextPosition, 220, `You got ${payoff} points!`, { fontSize: '30px', fill: noteColor, fontstyle: 'bold' }).setOrigin(0.5, 0.5);

		    setTimeout(function(){
		    	//payoffText.destroy();
		    	//game.scene.sleep('ScenePayoffFeedback');
		    	//game.scene.start('SceneMain');
		    	console.log('emitting result stage ended!');
		    	socket.emit('result stage ended');
		    }, 3000);
		}
		update(){}
	};

    //Scene SampleGame
	class SceneSampleGame extends Phaser.Scene {

		constructor (){
		    	super({ key: 'SceneSampleGame' });
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
    	, SceneUnderstandingTest
    	, SceneStartCountdown
    	, SceneMain
    	, ScenePayoffFeedback
    	, SceneSampleGame 
    	]
	};

	let game = new Phaser.Game(config);
	game.scene.add('SceneWaitingRoom0');
	game.scene.add('SceneWaitingRoom');
	game.scene.add('SceneInstruction');
	game.scene.add('SceneTutorial');
	game.scene.add('SceneUnderstandingTest');
	game.scene.add('SceneStartCountdown');
	game.scene.add('SceneMain');
	game.scene.add('ScenePayoffFeedback');
	game.scene.add('SceneSampleGame');

	// functions

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

    // madeChoice
    function madeChoice (flag) {  
        let thisChoice;
		if (flag == 1) {
			thisChoice = 'sure';
			payoffText.x = 200;
		} else {
			thisChoice = 'risky'
			payoffText.x = 600;
		}
		// calculating the payoff from this choice
		payoff = randomChoiceFromTwo(thisChoice, payoffList[thisChoice], probabilityList[thisChoice], mySocialInfo, myPublicInfo);
		score += payoff;
		scoreText.setText('Total score: ' + score);
		payoffText.setText(payoff);
		payoffText.visible = true;
		trialText.setText('Current trial: ' + currentTrial + ' / ' + horizon);
    };

    // random choice with probability
    function randomChoiceFromTwo(choice, arr, p_rare, socialInfo, publicInfo) {
    	let roulette = Math.random()
    	let noise = BoxMuller(0, smallNoise)
    	if (p_rare < roulette) { // common event
    		payoff = Math.floor((arr[0] + noise)*100);
    		myEarnings.push(payoff);
            myChoices.push(choice);   		
    	} else { // rare event
    		payoff = Math.floor((arr[1] + noise)*100);
    		myEarnings.push(payoff);
            myChoices.push(choice);
    	}
		socket.emit('choice made', {choice: choice, payoff: payoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: (totalEarning+payoff), subjectNumber:subjectNumber});
        console.log('choice was made: choice = ' + choice + ' and payoff = ' + payoff + '.');
    	return payoff;
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
	    console.log('waitingBarCompleted is fired');
	}

	socket.on('pong', function (ms) {
        //console.log(`socket :: averageLatency :: ${averageLatency} ms`);
        averageLatency.push(ms);
        averageLatency.splice(0,1);
    });

    socket.on('this is your parameters', function (data) {
        confirmationID = data.id;
        myRoom = data.room;
        maxChoiceStageTime = data.maxChoiceStageTime;
        maxTimeTestScene = data.maxTimeTestScene;
        indivOrGroup = data.indivOrGroup;
        exp_condition = exp_condition;
        subjectNumber = data.subjectNumber;
        //pointCentConverisonRate = data.pointCentRate;

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
        $("#exp_condition").val(exp_condition);
        $("#confirmationID").val(confirmationID);
    });

    socket.on('this is the remaining waiting time', function(data){
        isEnvironmentReady = true;
        maxWaitingTime = data.max;
        maxGroupSize = data.maxGroupSize;
        horizon = data.horizon;
        restTime = data.restTime;
        console.log('this is the remaining waiting time: '+restTime+' msec.');
        if(isPreloadDone & !isWaitingRoomStarted) game.scene.start('SceneWaitingRoom');
        //SceneWaitingRoom
        //core.replaceScene(core.waitingRoomScene(data.restTime));
    });

    socket.on('wait for others finishing test', function () {
    	game.scene.sleep('SceneInstruction');
    	game.scene.sleep('SceneTutorial');
    	game.scene.sleep('SceneUnderstandingTest');
        game.scene.start('SceneWaitingRoom2');
    });

    // The task starts
    socket.on('this room gets started', function(data) {
        console.log('Group size reached ' + data.n + ' conditoin: ' + data.exp_condition + ' and indivOrGroup is ' + data.indivOrGroup);
        exp_condition = data.exp_condition;
        indivOrGroup = data.indivOrGroup;
        $("#indivOrGroup").val(indivOrGroup);
        //console.log('your indivOrGroup is ' + $("#indivOrGroup").val());
        if(indivOrGroup == 0) {
            choiceOpportunities = 3; //3
        } else {
            choiceOpportunities = 1;
        }
        waitingRoomFinishedFlag = 1;
        game.scene.start('SceneInstruction');
        //core.replaceScene(core.instructionScene(exp_condition, indivOrGroup));
    });

    socket.on('you guys are individual condition', function () {
        socket.emit('ok individual condition sounds good');
    });

    socket.on('all passed the test', function(data) {
        console.log('testPassed reached ' + data.testPassed + ' conditoin: ' + data.exp_condition);
        game.scene.start('SceneStartCountdown');
    });

    socket.on('these are done subjects', function(data) {
        doneSubject = data.doneSubject;
        console.log('doneSubject is ' + doneSubject);
    });

    socket.on('Proceed to next round', function(data) {
        mySocialInfo = data.socialInfo[data.round-2];
        myPublicInfo = data.publicInfo[data.round-2];
        choiceOrder = data.choiceOrder[data.round-2];
        mySocialInfoList['sure'] = data.socialFreq[data.round-1][surePosition];
        mySocialInfoList['risky'] = data.socialFreq[data.round-1][riskyPosition];
        currentTrial++;
        totalEarning += payoff;
        $("#totalEarningInCent").val(Math.round(totalEarning));
        $("#currentTrial").val(currentTrial);
        payoffText.destroy();
        objects_feedbackStage.box1.destroy();
        objects_feedbackStage.box2.destroy();
    	game.scene.sleep('ScenePayoffFeedback');
    	game.scene.start('SceneMain');
    	console.log('restarting the main scene!: mySocialInfo = '+data.socialFreq[data.round-1]);
    });

} // window.onload -- end
