/*

Multi-armed bandit task for EmPra 2019
Written by Wataru Toyokawa (wataru.toyokawa@uni-konstanz.de)
10 July 2019

*/

'use strict';
enchant();
const htmlServer = 'http://192.168.33.10:';
//const htmlServer = 'http://localhost:';
//const htmlServer = 'http://tk2-261-40415.vs.sakura.ne.jp:';
const portnum = 8080;
const portnumQuestionnaire = 8000;
const exceptions = ['INHOUSETEST', 'testEmPra', 'testEmPra2'];

/**===============================================
For EmPra experiment, the latency check is not so important because there is no need for 
'real time' synchronisation between clients. Therefore, latency being less than 1.5 sec 
would be sufficient. However, in the future experiment where participants' real-time sync
is important, this value may need to be much smaller. 

University eduroam performs about 200 ~ 250 ms latency on average.
==================================================*/
const maxLatencyForGroupCondition = 1500 //1500;

let isEnvironmentReady = false
,   myChoices = []
,   myEarnings = []
,   myGroupEarnings = []
,   payoff
,   totalEarning = 0
,   individualContribution = 0
,   perIndivPayoffPrevious = 0
,   sessionName
,   roomName
,   subjectNumber
,   connectionCounter
,   currentRound = 1
,   currentStage
,   mySocialInfo
,   myPublicInfo
,   choiceOrder
,   mySocialInfoWithMyself
,   myPublicInfoWithMyself
,   myCurrentActiveOption = []
,   waitingBonus = 0
,   confirmationID = 'Bad-connection'
,   maxNumPlayer
,   choiceOpportunities
,   maxRound
,   myRoom
,   startTime
//,   latency = [0,0,0,0,0,0,0,0,0,0]
//,   latency_10
//,   latency_10_total
,   pointCentConverisonRate = 0
,   completed = 0
,   waitingRoomFinishedFlag = 0
,   averageLatency = [0,0,0]
,   submittedLatency = -1
;

const alphabetList = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const iconColourList = ['blue','red','yellow'];
const instructionTextBackgroundColor = "rgba(255,255,255, 0.5)";

window.onload = function() {

    $("#amazonID").val(amazonID);
    $("#completed").val(completed);
    $("#currentRound").val(currentRound);

	// parameters
    const coreSize = 480//480
    ,   myIconSize = 16 //32?
    ,   otherIconSize = 16 //32?
    ,   totalRounds = 5 // Total number of trials
    ,   numOptions = 5
    ,   optionButtonSize = 75
    ;
    let maxChoiceStageTime;
    let maxTimeTestScene;
    let maxWaitingTime;
    let exp_condition;
    let indivOrGroup;
    let myInstantNum;

    // socket connection
    //const amazonID = 'TEST';
    //const confirmationID = 'expID';
    const socket = io.connect(htmlServer+portnum, { query: 'amazonID='+amazonID });
    //const socket = io.connect('http://tk2-261-40415.vs.sakura.ne.jp:'+portnum, { query: 'amazonID='+amazonID });
    //socket.heartbeatTimeout = 1500;

    //======== monitoring reload activity ==========
    if (window.performance) {
        if (performance.navigation.type === 1) {
            // Redirecting to the questionnaire
            socket.io.opts.query = 'sessionName=already_finished';
            socket.disconnect();
            window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(pointCentConverisonRate*totalEarning/3)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+0+'&latency='+submittedLatency;
        }
    }
    //======== end: monitoring reload activity =====

    // ======== getting client's environment ==============================
    //const thisBrowser = browser();
    //console.log(browser);
    //socket.emit('environment of the client', {browser: thisBrowser});
    // ======== END: getting client's environment ===========================
    

	// making a new core
	const core = new Core(coreSize, coreSize);
	core.fps = 15;
	core.preload("./images/icon1.png");
    core.preload("./images/yubisashi.gif");
    core.preload("./images/bar.png");
    core.preload("./images/scaleOrange.png");
    core.preload("./images/start.png");
	core.rootScene.backgroundColor = "rgb(256, 256, 256)";

	core.onload = function(){
        // after calculating the first average latency
        // the client should be put into the individual condition
        setTimeout(function(){
            submittedLatency = sum(averageLatency)/averageLatency.length
            socket.emit('core is ready', {latency: submittedLatency, maxLatencyForGroupCondition: maxLatencyForGroupCondition});
            $("#latency").val(submittedLatency);
        }, averageLatency.length*1000+500);

        //======== monitoring Tab activity ==========
        let hiddenTimer
        ,   hidden_elapsedTime = 0
        ;
            //ページが読み込まれたときの状況を判断
        if(window.document.visibilityState == 'hidden'){
            hiddenTimer = setInterval(function(){
                hidden_elapsedTime += 500;
                if (hidden_elapsedTime>1000) {
                    socket.io.opts.query = 'sessionName=already_finished';
                    socket.disconnect();
                }
            }, 500);
        }
            //状況が変わったら再び判断
        window.document.addEventListener("visibilitychange", function(e){
            //console.log('this window got invisible.');
            if (window.document.visibilityState == 'hidden') {
                hidden_elapsedTime += 1;
                hiddenTimer = setInterval(function(){
                    hidden_elapsedTime += 500;
                    if (hidden_elapsedTime>1000) {
                        socket.io.opts.query = 'sessionName=already_finished';
                        socket.disconnect();
                    }
                }, 500);
            } else {
                clearTimeout(hiddenTimer);
                if (hidden_elapsedTime>1000) {
                    /*if (waitingStageTimerResetCounter > 0) {
                        clearTimeout(waitingStageTimer);
                    }*/
                    setTimeout(function(){
                        //強制的にquestionnaireへ移行させる
                        socket.io.opts.query = 'sessionName=already_finished';
                        socket.disconnect();
                        completed = 'browserHidden';
                        window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(pointCentConverisonRate*totalEarning/3)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency;
                    }, 200); //waitingBonus がしっかり計算されるのを待ってから移動させる
                }
                hidden_elapsedTime = 0;
            }
        });
        //======== end: monitoring tab activity =====

        //console.log('rootScene!');
		const startText = new Label();
        startText.font = '24px serif';
        startText.moveTo(400, 100);
        core.rootScene.addChild(startText);

        ///////////////////////////////////////////////////////////////////////
        // Sprite chasing the mouse cursor
        // Evaluating "intercept" using this sprite object (but not the cursor directly) 

        const cursor = new Sprite(0, 0); // put Sprite(10, 10) for debug
        //cursor.backgroundColor = '#f00'; // remove the comment-out for debug
        cursor.moveTo(0, 0);
        

        // Drawing every frame
        core.on('enterframe', function() {
            setPosition(cursor); // see below for the function "setPosition()"
        });

        // マウス座標反映関数
        function setPosition(cursor_v) {
            window.document.onmousemove = function(e) {
                // Both -50 and -130 represent objects in main.html (e.g. <h1></h1> and <body>'s margine)
                //cursor_v.moveTo(getMousePosition(e).x - 50, getMousePosition(e).y - 50 - 80);
                cursor_v.moveTo(getMousePosition(e).x, getMousePosition(e).y);
            };
        }
        // マウス座標取得関数
        function getMousePosition(e) {
            const obj = [];
            if (e) {
                // core.scaleの値が反映されている？ので割ってあげる
                obj.x = e.pageX / core.scale;
                obj.y = e.pageY / core.scale;
            } else {
                obj.x = (event.x + document.body.scrollLeft) / core.scale;
                obj.y = (event.y + document.body.scrollTop) / core.scale;
            }
            return obj;
        }
        
        ////////////////////////////////////////////////////////////////////////

		// Make others icons
		const OthersIcons = Class.create(Sprite, {
			initialize: function (scene, x, y, frame) {
				Sprite.call(this, otherIconSize, otherIconSize);
				this.x = x;
				this.y = y;
                //this.opacity = 0.8;
                this.frame = frame;
				this.image = core.assets['./images/icon1.png'];
                //this.frame = 1;
                /* -- Crazy animation icon --
                this.image = core.assets['./images/garo_kun.gif'];
				this.on('enterframe', function () {
					//this.rotate(rand(10));
                    this.frame = Math.floor((this.age / core.fps) % 5);
				});
                -- End -- */
                //core.rootScene.addChild(this);
                scene.addChild(this);
			}
		});

        // Make selection indicator
        const SelectionIcon = Class.create(Sprite, {
            initialize: function (scene, x, y, frame) {
                Sprite.call(this, 16, 16);
                this.x = x;
                this.y = y;
                this.frame = frame;
                this.opacity = 0.6;
                this.rotation = 180;
                this.destroy = false;
                this.image = core.assets['./images/icon1.png'];
                this.on('enterframe', function () {
                    if (this.destroy == true) {
                        scene.removeChild(this);
                    }
                });
                scene.addChild(this);
            }
        });

        // Make public info
        const OthersEarning = Class.create(Label, {
            initialize: function (scene, text, x, y) {
                Label.call(this);
                this.x = x;
                this.y = y;
                this.text = text;
                this.font = '14px Arial';
                scene.addChild(this);
            }
        });

		
		//Adding my icon to theroot scene
        core.rootScene.addChild(cursor);
        //setTimeout(function(){core.replaceScene(core.waitingRoomScene());}, 500);
        ////////////////////////////////////////////////////////////////
        // rootScene End
        ////////////////////////////////////////////////////////////////


        /////////////////////////////////////////////////////////////////
        // waitingRoomScene 
        //////////////////////////////////////////////////////////////////
        core.waitingRoomScene = function (restTime) {
            currentStage = 'firstWaitingRoom';
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";
            // texts
            const waitingRoomText1 = new Entity()
            ,   waitingRoomText2 = new Entity()
            ,   waitingRoomText3 = new Entity()
            ;
            //let timerToAvoidGettingStuck = new Object();
            waitingRoomText1._element = document.createElement('div');
            waitingRoomText2._element = document.createElement('div');
            waitingRoomText3._element = document.createElement('div');
            // title
            waitingRoomText1._element.innerHTML = '<h1>Waiting Room</h1>';
            waitingRoomText1.x = 20; 
            waitingRoomText1.y = 15;
            waitingRoomText1.width = coreSize - 40;
            // text
            waitingRoomText2.x = 100;
            waitingRoomText2.y = 153;
            waitingRoomText2.width = coreSize - 40;
            // text
            waitingRoomText3.x = 40;
            waitingRoomText3.y = 200;
            waitingRoomText3.width = coreSize - 40;
            waitingRoomText3._element.innerHTML = '<p class="lead"><span class="note">Please do not reload this page or open a new browser window.</span> <br>If you do so, the task will be terminated automatically.</p>';

            const waitingRoomLabel = new Label();
            waitingRoomLabel.x = 100;
            waitingRoomLabel.y = 153;
            waitingRoomLabel.font = '14px Arial';
            var bonusMeter = new Group();
            bonusMeter.x = 100;
            bonusMeter.y = 100;
            bonusMeter.num = 60;
            const bonusLabel = new Label();
            const bonusLabelNum = new Label();
            bonusLabel.text = 'Your waiting bonus: ';
            bonusLabelNum.text = 0 + ' cents';
            bonusLabel.font = '14px Arial';
            bonusLabelNum.font = '14px Arial';
            bonusLabelNum.x = 210;
            bonusMeter.addChild(bonusLabel);
            bonusMeter.addChild(bonusLabelNum);
            var bonusBar = new Sprite(54,15);
            bonusBar.image = core.assets['./images/bar.png'];
            bonusBar.x = 145;
            bonusMeter.addChild(bonusBar);
            if(waitingBonus>0) {
                const orangeBar = [];
                for(let i = 0; i < Math.floor(waitingBonus/1.32); i++){
                    orangeBar[i] = new OrangeBar(bonusMeter, bonusBar.x + 2 + i, 2);
                }
            }
            scene.on('enterframe', function () {
                let this_age = this.age;
                if(Math.floor(restTime/1000) - Math.floor(this.age / core.fps)>=0) {
                    //waitingRoomLabel.text = 'The study starts in ' + (Math.floor(restTime/1000) - Math.floor(this.age / core.fps)) + ' sec.';
                    waitingRoomText2._element.innerHTML = '<p class="lead">The study starts in ' + (Math.floor(restTime/1000) - Math.floor(this.age / core.fps)) + ' sec.</p>';
                } else if (Math.floor(restTime/1000) - Math.floor(this.age / core.fps) < -10) {
                    //waitingRoomLabel.text = 'The study starts now.';
                    //waitingRoomText2._element.innerHTML = '<p class="lead">The study starts now.</p>';
                }
                bonusLabelNum.text = Math.floor(waitingBonus*100)/100 + ' cents';
                if(Math.floor(this.age) % (6 * core.fps) == 0) {
                    const orangeBar2 = [];
                    waitingBonus += 1.32; //1.32 cents per 6 seconds = 8 Euro per hour
                    for(let i = 0; i < Math.floor(waitingBonus/1.32); i++){
                        orangeBar2[i] = new OrangeBar(bonusMeter, bonusBar.x + 2 + i, 2);
                    }
                }
                if(Math.floor(restTime/1000) - Math.floor(this.age / core.fps) < 0){
                    //core.replaceScene(core.startingScene());
                }
            });
            //timerToAvoidGettingStuck = setTimeout(function(){ goToQuestionnaire() }, restTime+10000);
            // Adding things to waitingRoomScene
            //scene.addChild(waitingRoomLabel);
            scene.addChild(waitingRoomText1);
            scene.addChild(waitingRoomText2);
            scene.addChild(waitingRoomText3);
            scene.addChild(bonusMeter);
            //scene.addChild(timerToAvoidGettingStuck);

            setTimeout(function(){
                if(waitingRoomFinishedFlag == 0) {
                    completed = 'technicalIssueInWaitingRoom';
                    window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(pointCentConverisonRate*totalEarning/3)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency;
                    console.log('goToQuestionnaire has been fired!');
                } else {
                    console.log('waitingRoomFinishedFlag == 1, meaning that he/she proceeded to the Instruction successfully!');
                }
            },restTime + 10000);

            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // waitingOthersTestPassedScene 
        //////////////////////////////////////////////////////////////////
        core.waitingOthersTestPassedScene = function (restTime) {
            currentStage = 'secondWaitingRoom';
            //console.log('currentStage is -- ' + currentStage);
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";
            // texts
            const waitingRoomText1 = new Entity()
            ,   waitingRoomText2 = new Entity()
            ,   waitingRoomText3 = new Entity()
            ;
            waitingRoomText1._element = document.createElement('div');
            waitingRoomText2._element = document.createElement('div');
            waitingRoomText3._element = document.createElement('div');
            // title
            waitingRoomText1._element.innerHTML = '<h1>Waiting Room</h1>';
            waitingRoomText1.x = 20; 
            waitingRoomText1.y = 15;
            waitingRoomText1.width = coreSize - 40;
            // text
            waitingRoomText2.x = 100;
            waitingRoomText2.y = 153;
            waitingRoomText2.width = coreSize - 40;
            // text
            waitingRoomText3.x = 40;
            waitingRoomText3.y = 200;
            waitingRoomText3.width = coreSize - 40;
            waitingRoomText3._element.innerHTML = '<p class="lead"><span class="note">Please do not reload this page or open a new browser window.</span> <br>If you do so, the task will be terminated automatically.</p>';

            var bonusMeter = new Group();
            bonusMeter.x = 100;
            bonusMeter.y = 100;
            bonusMeter.num = 60;
            const bonusLabel = new Label();
            bonusLabel.text = 'Your waiting bonus: ';
            bonusLabel.font = '14px Arial';
            bonusMeter.addChild(bonusLabel);
            var bonusBar = new Sprite(54,15);
            bonusBar.image = core.assets['./images/bar.png'];
            bonusBar.x = 145;
            bonusMeter.addChild(bonusBar);
            if(waitingBonus>0) {
                const orangeBar = [];
                for(let i = 0; i < Math.floor(waitingBonus/1.32); i++){
                    orangeBar[i] = new OrangeBar(bonusMeter, bonusBar.x + 2 + i, 2);
                }
            }
            scene.on('enterframe', function () {
                waitingRoomText2._element.innerHTML = '<p class="lead">Your waiting bonus so far is ' + Math.round(waitingBonus*100)/100 + ' cents.</p>';
                if(Math.floor(this.age) % (6 * core.fps) == 0) {
                    const orangeBar2 = [];
                    waitingBonus += 1.32; //1.32 cents per 6 seconds = 8 Euro per hour
                    for(let i = 0; i < Math.floor(waitingBonus/1.32); i++){
                        orangeBar2[i] = new OrangeBar(bonusMeter, bonusBar.x + 2 + i, 2);
                    }
                }
            });
            // Adding things to waitingRoomScene
            scene.addChild(waitingRoomText1);
            scene.addChild(waitingRoomText2);
            scene.addChild(waitingRoomText3);
            scene.addChild(bonusMeter);

            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // startingScene 
        //////////////////////////////////////////////////////////////////
        core.startingScene = function () {
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";
            const startLabel = new Sprite(236, 48);
            startLabel.x = (coreSize - 236)/2;
            startLabel.y = (coreSize - 48)/2;
            startLabel.image = core.assets['./images/start.png'];
            startLabel.tl.scaleTo(3, 2*core.fps).and().fadeOut(2*core.fps);
            const countDownText = new Entity();
            countDownText._element = document.createElement('div');
            countDownText.x = 235;
            countDownText.y = 235;
            scene.addChild(countDownText);
            countDownText._element.innerHTML = '<h1 id="countDown">5</h1>';
            setTimeout(function(){
                countDownText._element.innerHTML = '<h1 id="countDown">4</h1>';
            },1000);
            setTimeout(function(){
                countDownText._element.innerHTML = '<h1 id="countDown">3</h1>';
            },2000);
            setTimeout(function(){
                countDownText._element.innerHTML = '<h1 id="countDown">2</h1>';
            },3000);
            setTimeout(function(){
                countDownText._element.innerHTML = '<h1 id="countDown">1</h1>';
            },4000);
            setTimeout(function(){
                scene.addChild(startLabel);
                scene.removeChild(countDownText);
            },5000);
            setTimeout(function(){
                core.replaceScene(core.mainScene());
            },6500);

            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // instructionScene 
        //////////////////////////////////////////////////////////////////
        core.instructionScene = function (exp_condition, indivOrGroup) {
            currentStage = 'instructionScene';
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";
            const instructionText1 = new Entity()
            ,   instructionText2 = new Entity()
            ,   instructionText3 = new Entity()
            ;
            instructionText1._element = document.createElement('h1');
            instructionText2._element = document.createElement('div');
            instructionText3._element = document.createElement('div');
            // title
            instructionText1._element.innerHTML = 'Instruction';
            instructionText1._element.font = 'Arial';
            //instructionText1.text = 'Instruction';
            instructionText1.width = coreSize - 40;
            //instructionText1._element.style.textAlign = 'centre';
            instructionText1.x = 20; // aligning to the centre
            instructionText1.y = 15;
            // instruction texts
            instructionText2._element.font = '18px Arial';
            instructionText2.x = 20;
            instructionText2.y = 100;
            instructionText2.width = coreSize - 40;
            instructionText2._element.style.backgroundColor = instructionTextBackgroundColor;
            instructionText3._element.font = '18px Arial';
            instructionText3.x = 20;
            instructionText3.width = coreSize - 40;
            instructionText3._element.style.backgroundColor = instructionTextBackgroundColor;
            instructionText3._element.innerHTML = '<p class="lead">Please <span class="note">DO NOT restart, reload a page, or go-back in your web browser</span> until you finish this HIT. If you do so, your participation will be terminated automatically without any reward from the decision-making task and you will not be able to participate in this study again.</p>';
            if (indivOrGroup == 1) {
                // group condition: 
                instructionText2._element.innerHTML = '<p class="lead">Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task. <br /><br />After answering these questions, you may spend some time in a waiting room until a sufficient number of participants has arrived to start the task. You will be paid <span class="note">13.2 cents per minute</span> ($8 per hour) for any time spent in the waiting room. <br /><br />When a group of participants is ready, the main task will start.</p>';
                instructionText3.y = 320;
            } else {
                // indvidual condition: 
                instructionText2._element.innerHTML = '<p class="lead">Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task. <br /><br />After answering these questions, the main task will start.</p>';
                instructionText3.y = 200;
            } 


            // goToTest Button
            const nextButton = new ButtonOriginal("NEXT", 100, 50);
            nextButton.moveTo(190, 430); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (nextButton.intersect(cursor)) {
                    if (!nextButton.onMouse) {
                        nextButton.onMouse = true;
                        // change colour
                        nextButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (nextButton.onMouse) {
                        nextButton.onMouse = false;
                        // 色を戻す
                        nextButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            nextButton.on('touchstart', function() {
                //scene.removeChild(instructionText1);
                //scene.removeChild(instructionText2);
                //scene.removeChild(instructionText3);
                //scene.removeChild(nextButton);
                if (indivOrGroup === 0) {
                    core.pushScene(core.instructionSceneIndiv(exp_condition, indivOrGroup));
                } else {
                    core.pushScene(core.instructionSceneGroup(exp_condition, indivOrGroup));
                }
            });

            scene.addChild(instructionText1);
            scene.addChild(instructionText2);
            scene.addChild(instructionText3);
            scene.addChild(nextButton);

            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // instructionSceneIndiv
        //////////////////////////////////////////////////////////////////
        core.instructionSceneIndiv = function (exp_condition, indivOrGroup) {
            currentStage = 'instructionSceneIndiv';
            const boxY = 180;
            let myCurrentActiveOptionDemo = [];
            let okFlag = 0;
            let okCounter = 0; 
            let demoCounter = 0;
            let demotarget = [0, 2, 4];
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";
            
            // order of objects' layer behave weirdly. 
            // using group makes the order of each layer clear
            const selectedIconsGroup = new Group();
            const optionButtonGroup = new Group();
            scene.addChild(optionButtonGroup);
            

            const instructionText1 = new Entity()
            ,   instructionText2 = new Entity()
            ,   instructionText3 = new Entity()
            ;
            instructionText1._element = document.createElement('h1');
            instructionText2._element = document.createElement('div');
            instructionText3._element = document.createElement('div');
            // title
            instructionText1._element.innerHTML = 'Instruction 2/n';
            instructionText1._element.font = 'Arial';
            //instructionText1.text = 'Instruction';
            instructionText1.width = coreSize - 40;
            //instructionText1._element.style.textAlign = 'centre';
            instructionText1.x = 20; // aligning to the centre
            instructionText1.y = 15;
            // instruction texts
            instructionText2._element.font = '18px Arial';
            instructionText2.x = 20;
            instructionText2.y = 15;
            instructionText2.width = coreSize - 40;
            instructionText2._element.style.backgroundColor = instructionTextBackgroundColor;
            const textList = [];
            textList.push(
                '<p class="lead">Throughout the main task, you are to make a series of choices between 5&nbsp;yellow slot machines (labeled by the letters&nbsp;A to&nbsp;E).<br>Overall, there will be <span class="note">100&nbsp;rounds</span>. On <span class="note">each round</span>, you are to make <span class="note">3&nbsp;choices</span>.</p>'
                );
            textList.push(
                '<p class="lead">Each choice will earn you a reward, which are <span class="note">added up in each round</span> and <span class="note">accumulated over the 100&nbsp;rounds</span>.</p>'
                );
            instructionText2._element.innerHTML = textList[0];
            let maxOK = textList.length;

            // OK Button
            const goButton = new ButtonOriginal("NEXT", 100, 50);
            const backButton = new ButtonOriginal("BACK", 100, 50);
            goButton.moveTo(250, 400); // 110, 60
            backButton.moveTo(130, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (goButton.intersect(cursor)) {
                    if (!goButton.onMouse) {
                        goButton.onMouse = true;
                        // change colour
                        goButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (goButton.onMouse) {
                        goButton.onMouse = false;
                        // 色を戻す
                        goButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
                // If any option is selected
                if (backButton.intersect(cursor)) {
                    if (!backButton.onMouse) {
                        backButton.onMouse = true;
                        // change colour
                        backButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (backButton.onMouse) {
                        backButton.onMouse = false;
                        // 色を戻す
                        backButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            goButton.on('touchstart', function() {
                if(okCounter < maxOK) {
                    okCounter++;
                }
                if(typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
                if(okCounter == maxOK) {
                    instructionText2._element.innerHTML = '<p class="lead">Click on <span class="note">PLAY DEMO</span> to play some demo rounds!</p>';
                    scene.addChild(playDemoButton);
                    scene.removeChild(goButton);
                    scene.removeChild(backButton);       
                }
            });

            backButton.on('touchstart', function() {
                if(okCounter >= 0) {
                    okCounter--;
                    if(okCounter < 0) {
                        core.popScene();           
                    }
                }
                if(okCounter >= 0 && typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
            });
            instructionText2._element.innerHTML = textList[0];

            // goToTest Button
            const playDemoButton = new ButtonOriginal("PLAY DEMO", 140, 50);
            playDemoButton.moveTo(190, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (playDemoButton.intersect(cursor)) {
                    if (!playDemoButton.onMouse) {
                        playDemoButton.onMouse = true;
                        // change colour
                        playDemoButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (playDemoButton.onMouse) {
                        playDemoButton.onMouse = false;
                        // 色を戻す
                        playDemoButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            // option buttons for demo
            const optionButtonsDummy = [];
            for (let i = 0; i < numOptions; i++) {
                optionButtonsDummy[i] = new Group();
                optionButtonsDummy[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, 50));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + 50/2 - 5;
                optionButtonsDummy[i].addChild(label);
            }
            let optionButtons = [];
            let selectedIconsList = [];
            for (let i = 0; i < numOptions; i++) {
                // creating option buttons
                optionButtons[i] = new Group();
                optionButtons[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, 50));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + 50/2 - 5;
                optionButtons[i].addChild(label);

                //optionButtons[i].text = optionText;
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtons[i].firstChild.intersect(cursor)) {
                        if (!optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = true;
                            optionButtons[i].firstChild.image.context.fillStyle = '#00f';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = false;
                            optionButtons[i].firstChild.image.context.fillStyle = '#ff0';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtons[i].on('touchstart', function() {
                    demoCounter = 0;
                    myCurrentActiveOptionDemo.push(i);
                    if(myCurrentActiveOptionDemo.length > choiceOpportunities) {
                        selectedIconsList[0].destroy = true;
                        selectedIconsList.splice(0,1);
                        let byebyeOption = myCurrentActiveOptionDemo[0];
                        myCurrentActiveOptionDemo.splice(0,1);
                    }
                    if(okFlag == 0) {
                        okFlag++;
                    }
                    //console.log('demoCounter: '+demoCounter+' and okFlag is '+okFlag+' choiceOpportunities: '+choiceOpportunities);
                    //console.log(myCurrentActiveOptionDemo);
                    //console.log(okFlag >= choiceOpportunities);
                    switch (okFlag) {
                        case 1:
                            okFlag++;
                            instructionText2._element.innerHTML = '<p class="lead"><span class="note">Great.</span> You have to make <span class="note">2</span> more choices in this round.<br />Let\'s choose A, C, and E in this round.</p>';
                            break;
                        case 2:
                            okFlag++;
                            instructionText2._element.innerHTML = '<p class="lead"><span class="note">Excellent.</span> You have to make <span class="note">1</span> more choice in this round.<br />Let\'s choose A, C, and E in this round.</p>';
                            break;
                        case 3:
                            for(let i=0; i<demotarget.length; i++) {
                                //console.log(myCurrentActiveOptionDemo.indexOf(demotarget[i]));
                                if(myCurrentActiveOptionDemo.indexOf(demotarget[i])>-1){
                                    demoCounter++;
                                }
                            }
                            if(demoCounter==choiceOpportunities){
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Hooray!</span> You are now choosing options <span class="note">A, C, and E</span>. <br />Note that you can <span class="note">change your choices</span> during each round, as long as you have not yet clicked on the OK button! For example, let\'s change 1&nbsp;of your current choices by choosing option&nbsp;<span class="note">B</span>.</p>';
                                demotarget = [1];
                                okFlag++;
                            }else{
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Ooops!!</span> You are now choosing options '+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'.<br />Let\'s try choosing options <span class="note">A, C, and E</span>.</p>';
                                //okFlag--;
                            }
                            break;
                        case 4:
                            for(let i=0; i<demotarget.length; i++) {
                                //console.log(myCurrentActiveOptionDemo.indexOf(demotarget[i]));
                                if(myCurrentActiveOptionDemo.indexOf(demotarget[i])>-1){
                                    demoCounter++;
                                }
                            }
                            if(demoCounter > 0){
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Well done!</span> You are now choosing options <span class="note">'+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'</span>. <br />Next, let\'s choose options <span class="note">B, B, and B</span>.<p>';
                                demotarget = [1, 1, 1];
                                okFlag++;
                            }else{
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Ooops!!</span> You are now choosing options <span class="note">'+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'</span>. <br />Let\'s change one of your current choices by choosing option&nbsp;<span class="note">B</span>.</p>';
                                //okFlag--;
                            }
                            break;
                        case 5:
                            for(let i=0; i<demotarget.length; i++) {
                                //console.log(myCurrentActiveOptionDemo.indexOf(demotarget[i]));
                                if(myCurrentActiveOptionDemo[i] == demotarget[i]){
                                    demoCounter++;
                                }
                            }
                            if(demoCounter == choiceOpportunities){
                                //console.log('demoCounter='+demoCounter);
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Well done!</span> You are now choosing options '+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'. <br />Finally, please make <span class="note">any 3&nbsp;choices</span> as you would do on any real round!<p>';
                                okFlag++;
                            }else{
                                instructionText2._element.innerHTML = '<p class="lead">You are now choosing options '+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'.<br />Let\'s try choosing options <span class="note">B, B, and B</span>.</p>';
                            }
                            break;
                        case 6:
                            instructionText2._element.innerHTML = '<p class="lead">Your current choices for this round are: <span class="note">'+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'</span>.<br />Are you happy with these choices? If yes, click on <span class="note">OK</span> to register these choices and move on to the next round.<p>';
                            scene.addChild(okButton);
                            okFlag++;
                            break;
                        default:
                            instructionText2._element.innerHTML = '<p class="lead">Your current choices for this round are: <span class="note">'+alphabetList[myCurrentActiveOptionDemo[0]]+', '+alphabetList[myCurrentActiveOptionDemo[1]]+', and '+alphabetList[myCurrentActiveOptionDemo[2]]+'</span>.<br />Are you happy with these choices? If yes, click on <span class="note">OK</span> to register these choices and move on to the next round.<p>';
                            break;
                    }
                    
                    let sameNumbers = myCurrentActiveOptionDemo.filter(function(value){ return value == myCurrentActiveOptionDemo[myCurrentActiveOptionDemo.length-1]}).length;
                    let thisPosition = 15+10*(i+1)+optionButtonSize*i+(optionButtonSize/2)-40 + sameNumbers*rand(20, 10);
                    selectedIconsList.push(new SelectionIcon(selectedIconsGroup, thisPosition, boxY-15+rand(2,-2), 5));
                    //console.log(selectedIconsList);
                });
            }

            playDemoButton.on('touchstart', function() {
                instructionText2._element.innerHTML = '<p class="lead">Let\'s choose the options <span class="note">A, C, and E</span>!</p>';
                for (let i = 0; i < numOptions; i++) {
                    scene.removeChild(optionButtonsDummy[i]);
                    //scene.removeChild(selectedIconsGroup);
                    optionButtonGroup.addChild(optionButtons[i]);
                    //let optionChar = i+1;
                    //eval('optionButtonGroup'+optionChar).addChild(optionButtons[i]);
                    //scene.addChild(selectedIconsGroup);
                }
                scene.removeChild(playDemoButton);
            });

            // OK Button
            const okButton = new ButtonOriginal("OK!", 100, 50);
            okButton.moveTo(190, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (okButton.intersect(cursor)) {
                    if (!okButton.onMouse) {
                        okButton.onMouse = true;
                        // change colour
                        okButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (okButton.onMouse) {
                        okButton.onMouse = false;
                        // 色を戻す
                        okButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            okButton.on('touchstart', function() {
                /*for (let i = 0; i < numOptions; i++) {
                    optionButtonGroup.removeChild(optionButtons[i]);
                }*/
                //scene.removeChild(instructionText2);
                scene.removeChild(playDemoButton);
                //scene.removeChild(selectedIconsGroup);
                //scene.removeChild(optionButtonGroup);
                core.pushScene(core.instructionSceneIndiv2(exp_condition, indivOrGroup, myCurrentActiveOptionDemo));
            });

            //scene.addChild(instructionText1);
            //scene.addChild(instructionText2);
            //scene.addChild(playDemoButton);
            scene.addChild(goButton);
            scene.addChild(backButton);
            for (let i = 0; i < numOptions; i++) {
                scene.addChild(optionButtonsDummy[i]);
            }
            scene.addChild(selectedIconsGroup);
            scene.addChild(instructionText2);
            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // instructionSceneIndiv2
        //////////////////////////////////////////////////////////////////
        core.instructionSceneIndiv2 = function (exp_condition, indivOrGroup, myPreviousChoiceDemo) {
            currentStage = 'instructionSceneIndiv2';
            let myCurrentActiveOptionDemo = [];
            let okCounter = 0;
            const boxY = 180;//180;
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";

            // order of objects' layer behave weirdly. 
            // using group makes the order of each layer clear
            const selectedIconsGroup = new Group();
            const optionButtonGroup = new Group();
            scene.addChild(optionButtonGroup);

            const instructionText1 = new Entity()
            ,   instructionText2 = new Entity()
            ,   instructionText3 = new Entity()
            ;
            instructionText1._element = document.createElement('h1');
            instructionText2._element = document.createElement('div');
            instructionText3._element = document.createElement('div');
            // title
            //instructionText1._element.innerHTML = 'Instruction 3/n';
            instructionText1._element.font = 'Arial';
            //instructionText1.text = 'Instruction';
            instructionText1.width = coreSize - 40;
            //instructionText1._element.style.textAlign = 'centre';
            instructionText1.x = 20; // aligning to the centre
            instructionText1.y = 15;
            // instruction texts
            instructionText2._element.font = '18px Arial';
            instructionText2.x = 20;
            instructionText2.y = 15;
            instructionText2.width = coreSize - 40;
            instructionText2._element.style.backgroundColor = instructionTextBackgroundColor;
            const textList = [];
            textList.push(
                '<p class="lead"><span class="note">After registering your 3&nbsp;choices for Round&nbsp;1 you proceed to Round&nbsp;2</span>.<br />At this point, you can see how many points you have received for your choices on the <span class="note">previous</span> round. In this example, you earned 5&nbsp;points, 15&nbsp;points and 10&nbsp;points from your 1st, 2nd and 3rd choice, respectively (1&nbsp;point = '+ Math.round(pointCentConverisonRate*(1/3)*1000)/1000 +' US-cents).<br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">The 3&nbsp;icons indicate your 3&nbsp;choices of your 1st (<span style="color:blue">blue</span>), 2nd (<span style="color:red">red</span>), and 3rd (<span style="color:yellow">yellow</span>) choice on the previous round, respectively.<br />For each choice, the corresponding payoff is indicated and they are added up to indicate the total payoff of the previous round.<br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">The payoff for each choice systematically depends on the chosen option, but is not always the same. This implies that, due to random fluctuations, <span class="note">choosing the same option repeatedly will not always yield the same payoff</span>.<br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">However, <span class="note">some of the options generate higher payoffs</span> (on average) than others. Thus, learning to maximize your points on each round will pay off in this task. <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">You will play for a total of <span class="note">100&nbsp;rounds</span>. As all <span class="note">payoffs are added up over all rounds</span>, your total reward is based on the <span class="note">sum of all payoffs</span>.<br />Try to make as many points as possible on every round to earn <span class="note">as much money as possible!</span> <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            let maxOK = textList.length;
            instructionText2._element.innerHTML = textList[0];

            // option buttons for demo
            let optionButtons = [];
            let selectedIconsList = [];
            for (let i = 0; i < numOptions; i++) {
                // creating option buttons
                optionButtons[i] = new Group();
                optionButtons[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, 50));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + 50/2 - 5;
                optionButtons[i].addChild(label);

                //optionButtons[i].text = optionText;
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtons[i].firstChild.intersect(cursor)) {
                        if (!optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = true;
                            optionButtons[i].firstChild.image.context.fillStyle = '#00f';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = false;
                            optionButtons[i].firstChild.image.context.fillStyle = '#ff0';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
            }
            // adding previous choice icon
            let mySocialInfo2 = myPreviousChoiceDemo;
            let myPublicInfo2 = ['5 points','15 points','10 points'];
            const placeOccupation = [0,1,2];
            const previousSum = new Label();
            previousSum.x = 10; //10
            previousSum.y = 375;
            previousSum.font = '14px Arial';
            previousSum.width = coreSize;
            previousSum.text = 'Sum of last round\'s rewards: 30 points';
            scene.addChild(previousSum);
            
            const others = [];
            const otherspayoffs = [];
            for (let i = 0; i < mySocialInfo2.length; i++) {
                let thisPosition = 15+10*(mySocialInfo2[i]+1)+optionButtonSize*mySocialInfo2[i];
                let thisPayoff = myPublicInfo2[i];
                let thisIconsY = 270 + 30 * placeOccupation[i]; //180 + 10 * placeOccupation[i];
                others[i] = new OthersIcons(scene, thisPosition+(optionButtonSize/2)-(otherIconSize/2), thisIconsY, placeOccupation[i]+2);
                otherspayoffs[i] = new OthersEarning(scene, thisPayoff, thisPosition+(optionButtonSize/2)-(otherIconSize/2)-5, thisIconsY-(otherIconSize/2)-8);
            }

            // OK Button
            const goButton = new ButtonOriginal("NEXT", 100, 50);
            const backButton = new ButtonOriginal("BACK", 100, 50);
            goButton.moveTo(250, 400); // 110, 60
            backButton.moveTo(130, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (goButton.intersect(cursor)) {
                    if (!goButton.onMouse) {
                        goButton.onMouse = true;
                        // change colour
                        goButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (goButton.onMouse) {
                        goButton.onMouse = false;
                        // 色を戻す
                        goButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
                // If any option is selected
                if (backButton.intersect(cursor)) {
                    if (!backButton.onMouse) {
                        backButton.onMouse = true;
                        // change colour
                        backButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (backButton.onMouse) {
                        backButton.onMouse = false;
                        // 色を戻す
                        backButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            goButton.on('touchstart', function() {
                if(okCounter < maxOK) {
                    okCounter++;
                }
                if(typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
                if(okCounter == maxOK) {
                    core.pushScene(core.testSceneIndiv(exp_condition, indivOrGroup));           
                }
            });

            backButton.on('touchstart', function() {
                if(okCounter >= 0) {
                    okCounter--;
                    if(okCounter < 0) {
                        core.popScene();           
                    }
                }
                if(okCounter >= 0 && typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
            });

            // Label
            const totalEarningsLabel = new Label();
            totalEarningsLabel.x = 10; //10
            totalEarningsLabel.y = boxY-25;
            totalEarningsLabel.font = '14px Arial';
            totalEarningsLabel.text = 'Total earnings so far: 30 points';
            totalEarningsLabel.color = 'orange';
            totalEarningsLabel.width = coreSize;
            
            const currentRoundText = new Label();
            currentRoundText.x = 300; //10
            currentRoundText.y = boxY-25;
            currentRoundText.font = '14px Arial';
            currentRoundText.text = 'Round: 2 / 100';

            const darkArea = new Sprite(460, 240);
            const darkAreaImage = new Surface(460, 240);
            darkArea.x = 10;
            darkArea.y = boxY - 30;
            
            darkAreaImage.context.fillStyle = "rgba(255,255,255, 0.5)";
            darkAreaImage.context.fillRect(0, 0, 460, 240);
            //darkAreaImage.context.fillStyle = "rgba(0,0,0, 0.5)";
            //darkAreaImage.context.fillRect(0, 0, 480, 480);
            darkArea.image = darkAreaImage;

            //scene.addChild(instructionText1);
            for (let i = 0; i < numOptions; i++) {
                optionButtonGroup.addChild(optionButtons[i]);
            }
            scene.addChild(goButton);
            scene.addChild(backButton);
            scene.addChild(totalEarningsLabel);
            scene.addChild(currentRoundText);
            //scene.addChild(darkArea);
            scene.addChild(selectedIconsGroup);
            scene.addChild(instructionText2);
            return scene;
        }

	    
        /////////////////////////////////////////////////////////////////
        // instructionSceneGroup
        //////////////////////////////////////////////////////////////////
        core.instructionSceneGroup = function (exp_condition, indivOrGroup) {
            currentStage = 'instructionSceneGroup';
            const boxY = 180;
            let myCurrentActiveOptionDemo = [];
            let okFlag = 0;
            let okCounter = 0;
            let demoCounter = 0;
            let demotarget = [2];
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";

            // order of objects' layer behave weirdly. 
            // using group makes the order of each layer clear
            const selectedIconsGroup = new Group();
            const optionButtonGroup = new Group();
            scene.addChild(optionButtonGroup);

            const instructionText1 = new Entity()
            ,   instructionText2 = new Entity()
            ,   instructionText3 = new Entity()
            ;
            instructionText1._element = document.createElement('h1');
            instructionText2._element = document.createElement('div');
            instructionText3._element = document.createElement('div');
            // title
            //instructionText1._element.innerHTML = 'Instruction 2/n';
            instructionText1._element.font = 'Arial';
            //instructionText1.text = 'Instruction';
            instructionText1.width = coreSize - 40;
            //instructionText1._element.style.textAlign = 'centre';
            instructionText1.x = 20; // aligning to the centre
            instructionText1.y = 15;
            // instruction texts
            instructionText2._element.font = '18px Arial';
            instructionText2.x = 20;
            instructionText2.y = 15;
            instructionText2.width = coreSize - 40;
            instructionText2._element.style.backgroundColor = instructionTextBackgroundColor;
            const textList = [];
            textList.push(
                '<p class="lead">Throughout the main task, you are to make a series of choices between 5&nbsp;yellow slot machines (labeled by the letters&nbsp;A to&nbsp;E).<br />  Overall, there will be <span class="note">100&nbsp;rounds</span>.<br />On <span class="note">each round</span>, you are to make <span class="note">1&nbsp;choice</span> and <span class="note">2&nbsp;other players</span> will also make <span class="note">1&nbsp;choice each</span>.</p>'
                );
            textList.push(
                '<p class="lead">Each choice will earn a reward, which are <span class="note">added up in each round and accumulated over the 100&nbsp;rounds</span>. <br />As all points are pooled and divided up equally among the 3&nbsp;players in the end, <span class="note">you and the 2&nbsp;other players are a team</span>, rather than in competition with each other.</p>'
                );
            instructionText2._element.innerHTML = textList[0];
            let maxOK = textList.length;

            // OK Button
            const goButton = new ButtonOriginal("NEXT", 100, 50);
            const backButton = new ButtonOriginal("BACK", 100, 50);
            goButton.moveTo(250, 400); // 110, 60
            backButton.moveTo(130, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (goButton.intersect(cursor)) {
                    if (!goButton.onMouse) {
                        goButton.onMouse = true;
                        // change colour
                        goButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (goButton.onMouse) {
                        goButton.onMouse = false;
                        // 色を戻す
                        goButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
                // If any option is selected
                if (backButton.intersect(cursor)) {
                    if (!backButton.onMouse) {
                        backButton.onMouse = true;
                        // change colour
                        backButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (backButton.onMouse) {
                        backButton.onMouse = false;
                        // 色を戻す
                        backButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            goButton.on('touchstart', function() {
                if(okCounter < maxOK) {
                    okCounter++;
                }
                if(typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
                if(okCounter == maxOK) {
                    instructionText2._element.innerHTML = 'Click on <span class="note">PLAY DEMO</span> to play some demo rounds!';
                    scene.addChild(playDemoButton);
                    scene.removeChild(goButton);
                    scene.removeChild(backButton);       
                }
            });

            backButton.on('touchstart', function() {
                if(okCounter >= 0) {
                    okCounter--;
                    if(okCounter < 0) {
                        core.popScene();           
                    }
                }
                if(okCounter >= 0 && typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
            });


            // goToTest Button
            const playDemoButton = new ButtonOriginal("PLAY DEMO", 140, 50);
            playDemoButton.moveTo(190, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (playDemoButton.intersect(cursor)) {
                    if (!playDemoButton.onMouse) {
                        playDemoButton.onMouse = true;
                        // change colour
                        playDemoButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (playDemoButton.onMouse) {
                        playDemoButton.onMouse = false;
                        // 色を戻す
                        playDemoButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            // option buttons for demo
            const optionButtonsDummy = [];
            for (let i = 0; i < numOptions; i++) {
                optionButtonsDummy[i] = new Group();
                optionButtonsDummy[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, 50));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + 50/2 - 5;
                optionButtonsDummy[i].addChild(label);
            }
            let optionButtons = [];
            let selectedIconsList = [];
            for (let i = 0; i < numOptions; i++) {
                /// creating option buttons
                optionButtons[i] = new Group();
                optionButtons[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, 50));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + 50/2 - 5;
                optionButtons[i].addChild(label);

                //optionButtons[i].text = optionText;
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtons[i].firstChild.intersect(cursor)) {
                        if (!optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = true;
                            optionButtons[i].firstChild.image.context.fillStyle = '#00f';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = false;
                            optionButtons[i].firstChild.image.context.fillStyle = '#ff0';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtons[i].on('touchstart', function() {
                    demoCounter = 0;
                    myCurrentActiveOptionDemo.push(i);
                    if(myCurrentActiveOptionDemo.length > choiceOpportunities) {
                        selectedIconsList[0].destroy = true;
                        selectedIconsList.splice(0,1);
                        let byebyeOption = myCurrentActiveOptionDemo[0];
                        myCurrentActiveOptionDemo.splice(0,1);
                    }
                    if(okFlag == 0) {
                        okFlag++;
                    }
                    switch (okFlag) {
                        case 1:
                            if (myCurrentActiveOptionDemo == 2) {
                                okFlag++;
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Good.</span> You are now choosing option <span class="note">C</span>. <br />Note that you can <span class="note">change your choice</span> during each round, as long as you have not yet clicked on the OK button! For example, let\'s change your current choice by choosing option&nbsp;<span class="note">B</span>.';
                            } else {
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Ooops!!</span> You are now choosing option '+alphabetList[myCurrentActiveOptionDemo[0]]+'. <br>Try choosing option&nbsp;<span class="note">C</span>.</p>';
                            }
                            break;
                        case 2:
                            if (myCurrentActiveOptionDemo == 1) {
                                okFlag++;
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Hooray!!</span> You are now choosing option&nbsp;<span class="note">B</span>. <br />On any round, you can choose any option and you can change your choice until you click on the <span class="note">OK</span> button to register your choice. <br />Alright, let\'s click on OK to register your current choice and move on to the next round!';
                                scene.addChild(okButton);
                            } else {
                                instructionText2._element.innerHTML = '<p class="lead"><span class="note">Ooops!!</span> You are now choosing option&nbsp;'+alphabetList[myCurrentActiveOptionDemo[0]]+'. <br>Let\'s try choosing option&nbsp;<span class="note">B</span>.</p>'; 
                            }
                            break;
                        default:
                            instructionText2._element.innerHTML = '<p class="lead">You are now choosing option&nbsp;<span class="note">'+alphabetList[myCurrentActiveOptionDemo[0]]+'</span>. <br />Note that you can <span class="note">change your choice</span> during each round, as long as you have not yet clicked on the OK button! <br />Alright, let\'s click on OK to register your current choice and move on to the next round!</p>';
                            break;
                    }
                    
                    let sameNumbers = myCurrentActiveOptionDemo.filter(function(value){ return value == myCurrentActiveOptionDemo[myCurrentActiveOptionDemo.length-1]}).length;
                    let thisPosition = 15+10*(i+1)+optionButtonSize*i+(optionButtonSize/2)-40 + sameNumbers*rand(20, 10);
                    selectedIconsList.push(new SelectionIcon(selectedIconsGroup, thisPosition, boxY-15+rand(2,-2), subjectNumber+1));
                    //console.log(selectedIconsList);
                });
            }

            playDemoButton.on('touchstart', function() {
                instructionText2._element.innerHTML = '<br><br /><br /><p class="lead">Let\'s choose option&nbsp;<span class="note">C</span>!</p>';
                for (let i = 0; i < numOptions; i++) {
                    scene.removeChild(optionButtonsDummy[i]);
                    optionButtonGroup.addChild(optionButtons[i]);
                }
                scene.removeChild(playDemoButton);
            });

	    // +++ here now +++ // 

            // OK Button
            const okButton = new ButtonOriginal("OK!", 100, 50);
            okButton.moveTo(190, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (okButton.intersect(cursor)) {
                    if (!okButton.onMouse) {
                        okButton.onMouse = true;
                        // change colour
                        okButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (okButton.onMouse) {
                        okButton.onMouse = false;
                        // 色を戻す
                        okButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            okButton.on('touchstart', function() {
                core.pushScene(core.instructionSceneGroup2(exp_condition, indivOrGroup, myCurrentActiveOptionDemo));
            });

            //scene.addChild(instructionText1);
            //scene.addChild(instructionText2);
            //scene.addChild(playDemoButton);
            for (let i = 0; i < numOptions; i++) {
                scene.addChild(optionButtonsDummy[i]);
            }
            scene.addChild(goButton);
            scene.addChild(backButton);
            scene.addChild(selectedIconsGroup);
            scene.addChild(instructionText2);
            return scene;
        }


        /////////////////////////////////////////////////////////////////
        // instructionSceneGroup2
        //////////////////////////////////////////////////////////////////
        core.instructionSceneGroup2 = function (exp_condition, indivOrGroup, myPreviousChoiceDemo) {
            currentStage = 'instructionSceneGroup2';
            let myCurrentActiveOptionDemo = [];
            const mySocialInfo = [3,1,4];
            mySocialInfo[subjectNumber-1] = myPreviousChoiceDemo[0];
            let myPublicInfo2 = ['5 points','15 points','10 points'];
            let othersPoints = ['5 points','15 points','10 points'];
            othersPoints.splice(subjectNumber-1, 1);
            let okCounter = 0;
            const boxY = 180;
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";

            // order of objects' layer behave weirdly. 
            // using group makes the order of each layer clear
            const selectedIconsGroup = new Group();
            const optionButtonGroup = new Group();
            scene.addChild(optionButtonGroup);

            const instructionText1 = new Entity()
            ,   instructionText2 = new Entity()
            ,   instructionText3 = new Entity()
            ;
            instructionText1._element = document.createElement('h1');
            instructionText2._element = document.createElement('div');
            instructionText3._element = document.createElement('div');
            // title
            //instructionText1._element.innerHTML = 'Instruction 3/n';
            instructionText1._element.font = 'Arial';
            //instructionText1.text = 'Instruction';
            instructionText1.width = coreSize - 40;
            //instructionText1._element.style.textAlign = 'centre';
            instructionText1.x = 20; // aligning to the centre
            instructionText1.y = 15;
            // instruction texts
            instructionText2._element.font = '18px Arial';
            instructionText2.x = 5;
            instructionText2.y = 15;
            instructionText2.width = coreSize - 40;
            instructionText2._element.style.backgroundColor = instructionTextBackgroundColor;
            const textList = [];
            textList.push(
                '<p class="lead">After registering the 3&nbsp;choices for Round&nbsp;1 you and the 2&nbsp;other players proceed to Round&nbsp;2</span>. <br />At this point, you can see how many points you and the 2&nbsp;other players have received for your choices on the <span class="note">previous</span> round. <br />  Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">In this example, your choice produced '+ myPublicInfo2[subjectNumber-1] +' and the 2&nbsp;other players produced '+ othersPoints[0] + ' and ' + othersPoints[1] +' (1&nbsp;point = '+ Math.round(pointCentConverisonRate*1000)/1000 +' US-cents). <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">The 3&nbsp;colored icons indicate the 3&nbsp;choices of you and the other players on the previous round. <br /> The color of your icon is <span style="color:'+iconColourList[subjectNumber-1]+'">'+iconColourList[subjectNumber-1]+'</span> throughout this task, but note that you can also see the choices made by the 2&nbsp;other players in different colors. <br />  Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">For each choice, the corresponding payoff is indicated and they are added up to indicate the total payoff of the previous round. <br />In this example, your total payoff is 30&nbsp;points which will be divided equally between all players in the end. So, actually, you earned an individual reward of 10&nbsp;points in Round&nbsp;1. <br />  Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">The payoff for each choice systematically depends on the chosen option, but is not always the same. This implies that choosing the same option repeatedly <span class="note">will not always yield the same payoff</span>. <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">However, <span class="note">some of the options generate higher payoffs</span> (on average) than others. Thus, learning to maximize your points on each round will pay off in this task. <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">You will play for a total of <span class="note">100&nbsp;rounds</span>. As all <span class="note">payoffs of all 3&nbsp;players are added up over all rounds</span>, your total reward is based on the <span class="note">sum of all payoffs</span>. In the end, the total payoff will be divided equally between all players. <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            textList.push(
                '<p class="lead">Let\'s try to make as many points as possible on every round to earn <span class="note">as much money as possible!</span> <br /> Click on <span class="note">NEXT</span> to continue.</p>'
                );
            let maxOK = textList.length;
            instructionText2._element.innerHTML = textList[0];

            // option buttons for demo
            let optionButtons = [];
            let selectedIconsList = [];
            for (let i = 0; i < numOptions; i++) {
                // creating option buttons
                optionButtons[i] = new Group();
                optionButtons[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, 50));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + 50/2 - 5;
                optionButtons[i].addChild(label);

                //optionButtons[i].text = optionText;
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtons[i].firstChild.intersect(cursor)) {
                        if (!optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = true;
                            optionButtons[i].firstChild.image.context.fillStyle = '#00f';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = false;
                            optionButtons[i].firstChild.image.context.fillStyle = '#ff0';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, 50);
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
            }
            // adding previous choice icon
            let mySocialInfo2 = mySocialInfo;
            const placeOccupation = [0,1,2];
            const previousSum = new Label();
            previousSum.x = 10; //10
            previousSum.y = 375;
            previousSum.width = coreSize;
            previousSum.font = '14px Arial';
            previousSum.text = 'Sum of last round\'s rewards: 30 points';
            scene.addChild(previousSum);
            
            const others = [];
            const otherspayoffs = [];
            for (let i = 0; i < mySocialInfo2.length; i++) {
                let thisPosition = 15+10*(mySocialInfo2[i]+1)+optionButtonSize*mySocialInfo2[i];
                let thisPayoff = myPublicInfo2[i];
                let thisIconsY = 270 + 30 * placeOccupation[i]; //180 + 10 * placeOccupation[i];
                others[i] = new OthersIcons(scene, thisPosition+(optionButtonSize/2)-(otherIconSize/2), thisIconsY, placeOccupation[i]+2);
                otherspayoffs[i] = new OthersEarning(scene, thisPayoff, thisPosition+(optionButtonSize/2)-(otherIconSize/2)-5, thisIconsY-(otherIconSize/2)-8);
            }

            // OK Button
            const goButton = new ButtonOriginal("NEXT", 100, 50);
            const backButton = new ButtonOriginal("BACK", 100, 50);
            goButton.moveTo(250, 400); // 110, 60
            backButton.moveTo(130, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (goButton.intersect(cursor)) {
                    if (!goButton.onMouse) {
                        goButton.onMouse = true;
                        // change colour
                        goButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (goButton.onMouse) {
                        goButton.onMouse = false;
                        // 色を戻す
                        goButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
                // If any option is selected
                if (backButton.intersect(cursor)) {
                    if (!backButton.onMouse) {
                        backButton.onMouse = true;
                        // change colour
                        backButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (backButton.onMouse) {
                        backButton.onMouse = false;
                        // 色を戻す
                        backButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            goButton.on('touchstart', function() {
                if(okCounter < maxOK) {
                    okCounter++;
                }
                if(typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
                if(okCounter == maxOK) {
                    core.pushScene(core.testSceneGroup(exp_condition, indivOrGroup));           
                }
            });

            backButton.on('touchstart', function() {
                if(okCounter >= 0) {
                    okCounter--;
                    if(okCounter < 0) {
                        core.popScene();           
                    }
                }
                if(okCounter >= 0 && typeof textList[okCounter] != 'undefined') {
                    instructionText2._element.innerHTML = textList[okCounter];
                }
            });

            // Label
            const totalEarningsLabel = new Label();
            totalEarningsLabel.x = 10; //10
            totalEarningsLabel.y = boxY-25;
            totalEarningsLabel.font = '14px Arial';
            totalEarningsLabel.text = 'Total earnings so far: 30 points';
            totalEarningsLabel.color = 'orange';
            totalEarningsLabel.width = coreSize;
            
            const currentRoundText = new Label();
            currentRoundText.x = 300; //10
            currentRoundText.y = boxY-25;
            currentRoundText.font = '14px Arial';
            currentRoundText.text = 'Round: 2 / 100';

            const darkArea = new Sprite(460, 240);
            const darkAreaImage = new Surface(460, 240);
            darkArea.x = 10;
            darkArea.y = boxY - 30;
            darkAreaImage.context.fillStyle = "rgba(255,255,255, 0.5)";
            darkAreaImage.context.fillRect(0, 0, 460, 240);
            darkArea.image = darkAreaImage;

            //scene.addChild(instructionText1);
            //scene.addChild(instructionText2);
            for (let i = 0; i < numOptions; i++) {
                optionButtonGroup.addChild(optionButtons[i]);
            }
            scene.addChild(goButton);
            scene.addChild(backButton);
            scene.addChild(totalEarningsLabel);
            scene.addChild(currentRoundText);
            //scene.addChild(darkArea);
            scene.addChild(selectedIconsGroup);
            scene.addChild(instructionText2);

            return scene;
        }


        /////////////////////////////////////////////////////////////////
        // testSceneIndiv
        //////////////////////////////////////////////////////////////////
        core.testSceneIndiv = function (exp_condition, indivOrGroup) {
            currentStage = 'testSceneIndiv';
            const answers = new Array(3).fill(-1);
            const correctAnswers = [2, 4, 0];
            const scene = new Scene();
            let nextButtonFlag = 0;
            scene.backgroundColor = "rgb(256, 256, 256)";
            const testText1 = new Entity()
            ,   testText2 = new Entity()
            ,   testText3 = new Entity()
            ,   testText4 = new Entity()
            ,   testText5 = new Entity()
            ;
            /*let testSceneTimer = setTimeout(function(){ 
                socket.io.opts.query = 'sessionName=already_finished';
                socket.disconnect();
                window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(pointCentConverisonRate*totalEarning/3)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency; 
            }, maxTimeTestScene ); // maximum time in the testScene is 4 minutes
            */
            testText1._element = document.createElement('h1');
            testText2._element = document.createElement('div');
            testText3._element = document.createElement('div');
            testText4._element = document.createElement('div');
            testText5._element = document.createElement('div');
            // title
            testText1._element.innerHTML = 'Understanding Instruction';
            testText1._element.font = 'Arial';
            testText1.x = 20; // aligning to the centre
            testText1.y = 15;
            testText1.width = coreSize;
            // 
            testText2.x = 20;
            testText2.y = 70;
            testText2.width = coreSize - 40;
            testText2._element.innerHTML = '<h3>Please answer the following questions.</h3>';
            // Q1
            testText3.x = 20;
            testText3.y = 120;
            testText3.width = coreSize - 40;
            testText3._element.innerHTML = '<p class="lead">How many choices will you make per round?</p>';
            // Q2
            testText4.x = 20;
            testText4.y = 230;
            testText4.width = coreSize - 40;
            testText4._element.innerHTML = '<p class="lead">How many rounds will you play in total?</p>';
            // Q3
            testText5.x = 20;
            testText5.y = 325;
            testText5.width = coreSize - 40;
            testText5._element.innerHTML = '<p class="lead">Is it possible and allowed to choose the same option repeatedly on a round?</p>';

            // A1
            const optionButtonsA1 = [];
            for (let i = 0; i < 5; i++) {
                let optionText = i+1; 
                optionButtonsA1[i] = new OptionButton(optionText, optionButtonSize, 40); //100, 50
                optionButtonsA1[i].moveTo(15+10*(i+1)+optionButtonSize*i, 150); // 15+10*(i+1)+100*i, 120
                optionButtonsA1[i].backgroundColor = '#ff0'; //default
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtonsA1[i].intersect(cursor)) {
                        if (!optionButtonsA1[i].onMouse) {
                            optionButtonsA1[i].onMouse = true;
                            // change colour
                            //optionButtonsA1[i].backgroundColor = '#00f';
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtonsA1[i].onMouse) {
                            optionButtonsA1[i].onMouse = false;
                            // back to original colour
                            //optionButtonsA1[i].backgroundColor = '#ff0';
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtonsA1[i].on('touchstart', function() {
                    if(i != answers[0]) {
                        optionButtonsA1[i].backgroundColor = '#00f';
                    }
                    if(i != answers[0] && answers[0] > -1) {
                        optionButtonsA1[answers[0]].backgroundColor = '#ff0';
                    }
                    answers[0] = i;
                    if(answers.indexOf(-1)==-1 && nextButtonFlag==0){
                        nextButtonFlag = 1;
                        scene.addChild(nextButton);
                    }
                    //console.log(answers);
                });
            }

            // A2
            const optionButtonsA2 = [];
            const answerListA2 = [10, 30, 50, 80, 100];
            for (let i = 0; i < 5; i++) {
                let optionText = answerListA2[i]; 
                optionButtonsA2[i] = new OptionButton(optionText, optionButtonSize, 40); //100, 50
                optionButtonsA2[i].moveTo(15+10*(i+1)+optionButtonSize*i, 260); // 15+10*(i+1)+100*i, 120
                optionButtonsA2[i].backgroundColor = '#ff0'; //default
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtonsA2[i].intersect(cursor)) {
                        if (!optionButtonsA2[i].onMouse) {
                            optionButtonsA2[i].onMouse = true;
                            // change colour
                            //optionButtonsA2[i].backgroundColor = '#00f';
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtonsA2[i].onMouse) {
                            optionButtonsA2[i].onMouse = false;
                            // back to original colour
                            //optionButtonsA2[i].backgroundColor = '#ff0';
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtonsA2[i].on('touchstart', function() {
                    if(i != answers[1]) {
                        optionButtonsA2[i].backgroundColor = '#00f';
                    }
                    if(i != answers[1] && answers[1] > -1) {
                        optionButtonsA2[answers[1]].backgroundColor = '#ff0';
                    }
                    answers[1] = i;
                    if(answers.indexOf(-1)==-1 && nextButtonFlag==0){
                        nextButtonFlag = 1;
                        scene.addChild(nextButton);
                    } 
                    //console.log(answers);
                }); 
            }

            // A3
            const optionButtonsA3 = [];
            const answerListA3 = ['YES','NO'];
            for (let i = 0; i < 2; i++) {
                let optionText = answerListA3[i]; 
                optionButtonsA3[i] = new OptionButton(optionText, optionButtonSize, 40); //100, 50
                optionButtonsA3[i].moveTo(15+10*(i+1)+optionButtonSize*i, 380); // 15+10*(i+1)+100*i, 120
                optionButtonsA3[i].backgroundColor = '#ff0'; //default
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtonsA3[i].intersect(cursor)) {
                        if (!optionButtonsA3[i].onMouse) {
                            optionButtonsA3[i].onMouse = true;
                            // change colour
                            //optionButtonsA3[i].backgroundColor = '#00f';
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtonsA3[i].onMouse) {
                            optionButtonsA3[i].onMouse = false;
                            // back to original colour
                            //optionButtonsA3[i].backgroundColor = '#ff0';
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtonsA3[i].on('touchstart', function() {
                    if(i != answers[2]) {
                        optionButtonsA3[i].backgroundColor = '#00f';
                    }
                    if(i != answers[2] && answers[2] > -1) {
                        optionButtonsA3[answers[2]].backgroundColor = '#ff0';
                    }
                    answers[2] = i;
                    if(answers.indexOf(-1)==-1 && nextButtonFlag==0){
                        nextButtonFlag = 1;
                        scene.addChild(nextButton);
                    } 
                    //console.log(answers);
                });
            }


            // goToTest Button
            const nextButton = new ButtonOriginal("START", 100, 40);
            nextButton.moveTo(250, 425); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (nextButton.intersect(cursor)) {
                    if (!nextButton.onMouse) {
                        nextButton.onMouse = true;
                        // change colour
                        nextButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (nextButton.onMouse) {
                        nextButton.onMouse = false;
                        // 色を戻す
                        nextButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            nextButton.on('touchstart', function() {
                let correctCounter = 0;
                for(let i=0; i<answers.length; i++) {
                    if(answers[i]==correctAnswers[i]) {correctCounter++;}
                }
                if (correctCounter==answers.length) {
                    //clearTimeout(testSceneTimer);
                    socket.emit('test passed');
                    scene.removeChild(nextButton);
                    scene.removeChild(testText1);
                    scene.removeChild(testText2);
                    scene.removeChild(testText3);
                    scene.removeChild(testText4);
                    scene.removeChild(testText5);
                    for (let i = 0; i < 5; i++) {
                        scene.removeChild(optionButtonsA1[i]);
                        scene.removeChild(optionButtonsA2[i]);
                    }
                    for (let i = 0; i < 2; i++) {
                        scene.removeChild(optionButtonsA3[i]);
                    }
                    scene.removeChild(backButton);
                } else {
                    testText2._element.innerHTML = '<p><span class="note">One or more of your answers were incorrect.</span> <br /> Try to correct them or you can go back and re-read the instructions.</p>';
                    //console.log('answers are '+ answers + '. correctCounter: '+ correctCounter);
                }
            });

            const backButton = new ButtonOriginal("BACK", 100, 40);
            backButton.moveTo(130, 425); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (backButton.intersect(cursor)) {
                    if (!backButton.onMouse) {
                        backButton.onMouse = true;
                        // change colour
                        backButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (backButton.onMouse) {
                        backButton.onMouse = false;
                        // 色を戻す
                        backButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            backButton.on('touchstart', function() {
                core.popScene();
            });

            scene.addChild(testText1);
            scene.addChild(testText2);
            scene.addChild(testText3);
            scene.addChild(testText4);
            scene.addChild(testText5);
            for (let i = 0; i < 5; i++) {
                scene.addChild(optionButtonsA1[i]);
                scene.addChild(optionButtonsA2[i]);
            }
            for (let i = 0; i < 2; i++) {
                scene.addChild(optionButtonsA3[i]);
            }
            scene.addChild(backButton);

            return scene;
        }


        /////////////////////////////////////////////////////////////////
        // testSceneGroup
        //////////////////////////////////////////////////////////////////
        core.testSceneGroup = function (exp_condition, indivOrGroup) {
            currentStage = 'testSceneGroup';
            const answers = new Array(3).fill(-1);
            const correctAnswers = [2, 4, 0];
            const scene = new Scene();
            let nextButtonFlag = 0;
            scene.backgroundColor = "rgb(256, 256, 256)";
            const testText1 = new Entity()
            ,   testText2 = new Entity()
            ,   testText3 = new Entity()
            ,   testText4 = new Entity()
            ,   testText5 = new Entity()
            ;
            let testSceneTimer = setTimeout(function(){ 
                socket.io.opts.query = 'sessionName=already_finished';
                socket.disconnect();
                completed = 'droppedTestScene';
                window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(pointCentConverisonRate*totalEarning/3)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency; 
            }, maxTimeTestScene ); // maximum time in the testScene is 4 minutes
            testText1._element = document.createElement('h1');
            testText2._element = document.createElement('div');
            testText3._element = document.createElement('div');
            testText4._element = document.createElement('div');
            testText5._element = document.createElement('div');
            // title
            testText1._element.innerHTML = 'Understanding instruction';
            testText1._element.font = 'Arial';
            testText1.x = 20; // aligning to the centre
            testText1.y = 15;
            testText1.width = coreSize;
            // 
            testText2.x = 20;
            testText2.y = 70;
            testText2.width = coreSize - 40;
            testText2._element.innerHTML = '<h3>Please answer the following questions.</h3>';
            // Q1
            testText3.x = 20;
            testText3.y = 120;
            testText3.width = coreSize - 40;
            testText3._element.innerHTML = '<p class="lead">How many other players will work with you on this task?</p>';
            // Q2
            testText4.x = 20;
            testText4.y = 210;
            testText4.width = coreSize - 40;
            testText4._element.innerHTML = '<p class="lead">How many rounds will you and the other players play in total?</p>';
            // Q3
            testText5.x = 20;
            testText5.y = 320;
            testText5.width = coreSize - 40;
            testText5._element.innerHTML = '<p class="lead">Is the payoff of all players pooled and shared equally in the end?</p>';

            // A1
            const optionButtonsA1 = [];
            const answerListA1 = [0,1,2,3,'random'];
            for (let i = 0; i < 5; i++) {
                let optionText = answerListA1[i]; 
                optionButtonsA1[i] = new OptionButton(optionText, optionButtonSize, 40); //100, 50
                optionButtonsA1[i].moveTo(15+10*(i+1)+optionButtonSize*i, 150); // 15+10*(i+1)+100*i, 120
                optionButtonsA1[i].backgroundColor = '#ff0'; //default
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtonsA1[i].intersect(cursor)) {
                        if (!optionButtonsA1[i].onMouse) {
                            optionButtonsA1[i].onMouse = true;
                            // change colour
                            //optionButtonsA1[i].backgroundColor = '#00f';
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtonsA1[i].onMouse) {
                            optionButtonsA1[i].onMouse = false;
                            // back to original colour
                            //optionButtonsA1[i].backgroundColor = '#ff0';
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtonsA1[i].on('touchstart', function() {
                    if(i != answers[0]) {
                        optionButtonsA1[i].backgroundColor = '#00f';
                    }
                    if(i != answers[0] && answers[0] > -1) {
                        optionButtonsA1[answers[0]].backgroundColor = '#ff0';
                    }
                    answers[0] = i;
                    if(answers.indexOf(-1)==-1 && nextButtonFlag==0){
                        nextButtonFlag = 1;
                        scene.addChild(nextButton);
                    }
                    //console.log(answers);
                });
            }

            // A2
            const optionButtonsA2 = [];
            const answerListA2 = [10, 30, 50, 80, 100];
            for (let i = 0; i < 5; i++) {
                let optionText = answerListA2[i]; 
                optionButtonsA2[i] = new OptionButton(optionText, optionButtonSize, 40); //100, 50
                optionButtonsA2[i].moveTo(15+10*(i+1)+optionButtonSize*i, 255); // 15+10*(i+1)+100*i, 120
                optionButtonsA2[i].backgroundColor = '#ff0'; //default
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtonsA2[i].intersect(cursor)) {
                        if (!optionButtonsA2[i].onMouse) {
                            optionButtonsA2[i].onMouse = true;
                            // change colour
                            //optionButtonsA2[i].backgroundColor = '#00f';
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtonsA2[i].onMouse) {
                            optionButtonsA2[i].onMouse = false;
                            // back to original colour
                            //optionButtonsA2[i].backgroundColor = '#ff0';
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtonsA2[i].on('touchstart', function() {
                    if(i != answers[1]) {
                        optionButtonsA2[i].backgroundColor = '#00f';
                    }
                    if(i != answers[1] && answers[1] > -1) {
                        optionButtonsA2[answers[1]].backgroundColor = '#ff0';
                    }
                    answers[1] = i;
                    if(answers.indexOf(-1)==-1 && nextButtonFlag==0){
                        nextButtonFlag = 1;
                        scene.addChild(nextButton);
                    } 
                    //console.log(answers);
                }); 
            }

            // A3
            const optionButtonsA3 = [];
            const answerListA3 = ['YES','NO'];
            for (let i = 0; i < 2; i++) {
                let optionText = answerListA3[i]; 
                optionButtonsA3[i] = new OptionButton(optionText, optionButtonSize, 40); //100, 50
                optionButtonsA3[i].moveTo(15+10*(i+1)+optionButtonSize*i, 380); // 15+10*(i+1)+100*i, 120
                optionButtonsA3[i].backgroundColor = '#ff0'; //default
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtonsA3[i].intersect(cursor)) {
                        if (!optionButtonsA3[i].onMouse) {
                            optionButtonsA3[i].onMouse = true;
                            // change colour
                            //optionButtonsA3[i].backgroundColor = '#00f';
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtonsA3[i].onMouse) {
                            optionButtonsA3[i].onMouse = false;
                            // back to original colour
                            //optionButtonsA3[i].backgroundColor = '#ff0';
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });
                // function
                optionButtonsA3[i].on('touchstart', function() {
                    if(i != answers[2]) {
                        optionButtonsA3[i].backgroundColor = '#00f';
                    }
                    if(i != answers[2] && answers[2] > -1) {
                        optionButtonsA3[answers[2]].backgroundColor = '#ff0';
                    }
                    answers[2] = i;
                    if(answers.indexOf(-1)==-1 && nextButtonFlag==0){
                        nextButtonFlag = 1;
                        scene.addChild(nextButton);
                    } 
                    //console.log(answers);
                });
            }


            // goToTest Button
            const nextButton = new ButtonOriginal("START", 100, 40);
            nextButton.moveTo(250, 425); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (nextButton.intersect(cursor)) {
                    if (!nextButton.onMouse) {
                        nextButton.onMouse = true;
                        // change colour
                        nextButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (nextButton.onMouse) {
                        nextButton.onMouse = false;
                        // 色を戻す
                        nextButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            nextButton.on('touchstart', function() {
                let correctCounter = 0;
                for(let i=0; i<answers.length; i++) {
                    if(answers[i]==correctAnswers[i]) {correctCounter++;}
                }
                if (correctCounter==answers.length) {
                    clearTimeout(testSceneTimer);
                    socket.emit('test passed');
                    scene.removeChild(nextButton);
                } else {
                    testText2._element.innerHTML = '<p><span class="note">One or more of your answers were incorrect.</span> Try to correct them or you can go back and reread the instruction.</p>';
                    //console.log('answers are '+ answers + '. correctCounter: '+ correctCounter);
                }
            });

            const backButton = new ButtonOriginal("BACK", 100, 40);
            backButton.moveTo(130, 425); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (backButton.intersect(cursor)) {
                    if (!backButton.onMouse) {
                        backButton.onMouse = true;
                        // change colour
                        backButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (backButton.onMouse) {
                        backButton.onMouse = false;
                        // 色を戻す
                        backButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            backButton.on('touchstart', function() {
                core.popScene();
            });

            scene.addChild(testText1);
            scene.addChild(testText2);
            scene.addChild(testText3);
            scene.addChild(testText4);
            scene.addChild(testText5);
            for (let i = 0; i < 5; i++) {
                scene.addChild(optionButtonsA1[i]);
                scene.addChild(optionButtonsA2[i]);
            }
            for (let i = 0; i < 2; i++) {
                scene.addChild(optionButtonsA3[i]);
            }
            scene.addChild(backButton);

            return scene;
        }


        /////////////////////////////////////////////////////////////////
        // testScene 
        //////////////////////////////////////////////////////////////////
        /*core.testScene = function (exp_condition, indivOrGroup) {
            currentStage = 'testScene';
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";
            const testText1 = new Label()
            ,   testText2 = new Label()
            ,   testText3 = new Label()
            ;
            testText1.x = 15;
            testText1.y = 15;
            testText1.font = '12px Arial';
            testText1.text = 'Select TRUE or FALSE for the following statements.';
            testText2.x = 15;
            testText2.y = 35;
            testText2.font = '12px Arial';
            testText3.x = 15;
            testText3.y = 55;
            testText3.font = '12px Arial';
            if (indivOrGroup == 1) {
                // group condition
                testText2.text = 'Money will be dropped randomly, but some options may drop higher payoff than others on average -- TRUE / FALSE';
                testText3.text = 'The money you get during the task will be accumulated together with those collected by other group members, and then the total sum of your group\'s money will be split evenly among the group members when the task is finished -- TURE / FALSE';
            } else {
                // indvidual condition
                testText2.text = 'Money will be dropped randomly, but some options may drop higher payoff than others on average -- TRUE / FALSE';
                testText3.text = 'The money you get during the task will be accumulated, and then the total sum of your money will be paid -- TURE / FALSE';
            } 


            // goToTest Button
            const goToFinalWaitingButton = new ButtonOriginal("GO TO TEST", 100, 50);
            goToFinalWaitingButton.moveTo(190, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (goToFinalWaitingButton.intersect(cursor)) {
                    if (!goToFinalWaitingButton.onMouse) {
                        goToFinalWaitingButton.onMouse = true;
                        // change colour
                        goToFinalWaitingButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (goToFinalWaitingButton.onMouse) {
                        goToFinalWaitingButton.onMouse = false;
                        // 色を戻す
                        goToFinalWaitingButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            if (indivOrGroup==1) {
                goToFinalWaitingButton.on('touchstart', function() {
                    socket.emit('test passed');
                    scene.removeChild(goToFinalWaitingButton);
                });
            } else {
                goToFinalWaitingButton.on('touchstart', function() {
                    socket.emit('test passed');
                    scene.removeChild(goToFinalWaitingButton);
                });
            }

            scene.addChild(testText1);
            scene.addChild(testText2);
            scene.addChild(testText3);
            scene.addChild(goToFinalWaitingButton);
            return scene;
        }*/

        /////////////////////////////////////////////////////////////////
        // mainScene 
        //////////////////////////////////////////////////////////////////
        core.mainScene = function () {
            currentStage = 'mainScene';
            //console.log('mainScene!');
            const scene = new Scene();
            scene.backgroundColor = "rgb(256, 256, 256)";

            let mainSceneTimer = setTimeout(function(){ 
                socket.io.opts.query = 'sessionName=already_finished';
                socket.disconnect();
                completed = 'maxChoiceStageTimeOver';
                window.location.href = htmlServer + portnumQuestionnaire +'/questionnaireForDisconnectedSubjects?amazonID='+amazonID+'&bonus_for_waiting='+waitingBonus+'&totalEarningInCent='+Math.round(pointCentConverisonRate*totalEarning/3)+'&confirmationID='+confirmationID+'&exp_condition='+exp_condition+'&indivOrGroup='+indivOrGroup+'&completed='+completed+'&latency='+submittedLatency; 
            }, maxChoiceStageTime);
            
            // order of objects' layer behave weirdly. 
            // using group makes the order of each layer clear
            let selectedIconsGroup = new Group();
            let optionButtonGroupMainScene = new Group();

            let okFlag = 0;

            // Create environmental field
            const oneDimensionEnvironmentSurface = new Surface(coreSize, coreSize)
            ,   oneDimensionEnvironment = new Sprite(coreSize, coreSize)
            ;
            oneDimensionEnvironment.image = oneDimensionEnvironmentSurface;
            

            // Adding others icons to the scene
            if(typeof mySocialInfo != 'undefined') {
                let mySocialInfo2 = mySocialInfo.filter(function(value){ return value >= 0});
                let myPublicInfo2 = myPublicInfo.filter(function(value){ return value >= 0});
                //console.log('mySocialInfo is '+mySocialInfo2);
                //console.log('myPublicInfo is '+myPublicInfo2);
                const myPreviousChoice = [];
                //const placeOccupation = new Array(numOptions).fill(0);
                const placeOccupation = new Array(maxNumPlayer).fill(0);
                for(let i = 0; i < maxNumPlayer; i++) {
                    placeOccupation[i] = i;
                }

                const previousSum = new Label();
                previousSum.x = 10; //10
                previousSum.y = 355;
                previousSum.width = coreSize;
                previousSum.font = '18px Arial';
                if(typeof myPublicInfo != 'undefined') {
                    previousSum.text = 'Sum of last round\'s rewards: ' + Math.round(Math.floor(100*sum(myPublicInfo2))/100);
                }
                scene.addChild(previousSum);
                
                const others = [];
                const otherspayoffs = [];
                for (let i = 0; i < mySocialInfo2.length; i++) {
                    let thisPosition = 15+10*(mySocialInfo2[i]+1)+optionButtonSize*mySocialInfo2[i];
                    let thisPayoff = Math.round(myPublicInfo2[i]);
                    //let thisIconsY = 180 + 60 * placeOccupation[mySocialInfo2[i]];
                    if (indivOrGroup == 1) {
                        let thisIconsY = 180 + 60 * placeOccupation[choiceOrder[i]-1];
                        others[i] = new OthersIcons(scene, thisPosition+(optionButtonSize/2)-(otherIconSize/2), thisIconsY, choiceOrder[i]+1);
                        otherspayoffs[i] = new OthersEarning(scene, thisPayoff, thisPosition+(optionButtonSize/2)-(otherIconSize/2)-5, thisIconsY-(otherIconSize/2)-8);
                    } else {
                        let thisIconsY = 180 + 60 * placeOccupation[i]
                        others[i] = new OthersIcons(scene, thisPosition+(optionButtonSize/2)-(otherIconSize/2), thisIconsY, placeOccupation[i]+2);
                        otherspayoffs[i] = new OthersEarning(scene, thisPayoff, thisPosition+(optionButtonSize/2)-(otherIconSize/2)-5, thisIconsY-(otherIconSize/2)-8);
                    }
                        
                }
            } else {
                // No social information at the first round
                //console.log('mySocialInfo is undefined because this is the first round.');
            }

            // option buttons
            let optionButtons = [];
            let selectedIconsList = [];
            let boxHeight = 50;
            let boxY = 85;
            for (let i = 0; i < numOptions; i++) {
                // creating option buttons
                optionButtons[i] = new Group();
                optionButtons[i].addChild(new OptionButtonSprite(15+10*(i+1)+optionButtonSize*i, boxY, optionButtonSize, boxHeight));
                let label = new Label();
                label.text = alphabetList[i];
                label.font = '18px Arial';
                label.x = 15+10*(i+1)+optionButtonSize*i + (optionButtonSize - label._boundWidth)/2;
                label.y = boxY + boxHeight/2 - 5;
                optionButtons[i].addChild(label);

                //optionButtons[i].text = optionText;
                scene.on('enterframe', function() {
                    // onMouse function
                    if (optionButtons[i].firstChild.intersect(cursor)) {
                        if (!optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = true;
                            optionButtons[i].firstChild.image.context.fillStyle = '#00f';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, boxHeight);
                            document.body.style.cursor = "pointer"; // change the cursor to pointer
                        }
                    } else {
                        if (optionButtons[i].firstChild.onMouse) {
                            optionButtons[i].firstChild.onMouse = false;
                            optionButtons[i].firstChild.image.context.fillStyle = '#ff0';
                            optionButtons[i].firstChild.image.context.fillRect(0, 0, optionButtonSize, boxHeight);
                            document.body.style.cursor = "default"; // change the cursor to pointer
                        }
                    }
                });

                // function
                optionButtons[i].on('touchstart', function() {
                    //console.log('clicked!!');
                    myCurrentActiveOption.push(i);
                    okFlag++;
                    if(myCurrentActiveOption.length > choiceOpportunities) {
                        selectedIconsList[0].destroy = true;
                        selectedIconsList.splice(0,1);
                        let byebyeOption = myCurrentActiveOption[0];
                        myCurrentActiveOption.splice(0,1);
                        
                    }
                    if(okFlag == choiceOpportunities) {
                        scene.addChild(okButton);
                    }
                    //console.log(myCurrentActiveOption);
                    let sameNumbers = myCurrentActiveOption.filter(function(value){ return value == myCurrentActiveOption[myCurrentActiveOption.length-1]}).length;
                    let thisPosition = 15+10*(i+1)+optionButtonSize*i+(optionButtonSize/2)-40 + sameNumbers*rand(20, 10);
                    if(indivOrGroup == 0) {
                        selectedIconsList.push(new SelectionIcon(selectedIconsGroup, thisPosition, boxY-15+rand(5,-2), 5));
                    }else{
                        selectedIconsList.push(new SelectionIcon(selectedIconsGroup, thisPosition, boxY-15+rand(5,-2), subjectNumber+1));
                    }
                    //console.log(selectedIconsList);
                });
            }

            // Selection indicator (finger symbol)

            // OK Button
            const okButton = new ButtonOriginal("OK!", 100, 50);
            okButton.moveTo(190, 400); // 110, 60
            scene.on('enterframe', function() {
                // If any option is selected
                if (okButton.intersect(cursor)) {
                    if (!okButton.onMouse) {
                        okButton.onMouse = true;
                        // change colour
                        okButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (okButton.onMouse) {
                        okButton.onMouse = false;
                        // 色を戻す
                        okButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });

            okButton.on('touchstart', function() {
                //scene.removeChild(digButton);
                //scene.removeChild(myIcon);
                for (let i = 0; i < numOptions; i++) {
                    optionButtonGroupMainScene.removeChild(optionButtons[i]);
                } 
                if(typeof mainSceneTimer != 'undefined') {
                    clearTimeout(mainSceneTimer);
                }
                choiceMade(myCurrentActiveOption, mySocialInfo, myPublicInfo, totalEarning, individualContribution);                
            });

            // Label
            const totalEarningsLabel = new Label();
            totalEarningsLabel.x = 10; //10
            totalEarningsLabel.y = 25;
            totalEarningsLabel.font = '20px Arial';
            totalEarningsLabel.text = 'Total earnings so far: ' + Math.round(totalEarning) + ' points';
            totalEarningsLabel.color = 'orange';
            totalEarningsLabel.width = coreSize;
            
            const currentRoundText = new Label();
            currentRoundText.x = 10; //10
            currentRoundText.y = 5;
            currentRoundText.font = '18px Arial';
            currentRoundText.text = 'Round: ' + currentRound + ' / ' + maxRound;

            // Adding things to scene
            scene.addChild(oneDimensionEnvironment);
            //scene.addChild(cursor);
            scene.addChild(totalEarningsLabel);
            scene.addChild(currentRoundText);
            for (let i = 0; i < numOptions; i++) {
                optionButtonGroupMainScene.addChild(optionButtons[i]);
            }
            scene.addChild(optionButtonGroupMainScene);
            scene.addChild(selectedIconsGroup);

            return scene;

        }

        /////////////////////////////////////////////////////////////////
        // payoffFeedbackScene
        //////////////////////////////////////////////////////////////////
        core.payoffFeedbackScene = function (payoff) {
            currentStage = 'payoffFeedbackScene';
            //console.log('payoffFeedbackScene!');
            const scene = new Scene();
            scene.backgroundColor = "rgb(247, 255, 209)";
            // Label
            const payoffFeedbackLabel = new Label();
            payoffFeedbackLabel.x = 110;
            payoffFeedbackLabel.y = 135;
            payoffFeedbackLabel.font = '14px Arial';
            // Payoff is displayed for 4 seconds
            payoffFeedbackLabel.text = 'YOU GOT ' + payoff + ' points.';
            setTimeout(function () {
                socket.emit('Result stage ended');
            }, 2000);
            // Add things to scene
            scene.addChild(payoffFeedbackLabel);

            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // waitOthersScene
        //////////////////////////////////////////////////////////////////
        core.waitOthersScene = function () {
            currentStage = 'waitOthersScene';
            //console.log(currentStage);
            const scene = new Scene();
            scene.backgroundColor = "rgb(247, 255, 209)";
            // Label
            const pleaseWaitText = new Label();
            pleaseWaitText.x = 110;
            pleaseWaitText.y = 135;
            pleaseWaitText.font = '14px Arial';
            // Payoff is displayed for 4 seconds
            if(indivOrGroup == 1) {
                pleaseWaitText.text = 'Waiting for others\' decision';
            } else {
                pleaseWaitText.text = 'Loading...';
            }
            // Add things to scene
            scene.addChild(pleaseWaitText);

            return scene;
        }

        /////////////////////////////////////////////////////////////////
        // resultScene
        //////////////////////////////////////////////////////////////////
        core.resultScene = function (result, waitingBonus) {
            currentStage = 'resultScene';
            //console.log('resultScene!');
            completed = 1;
            const scene = new Scene();
            scene.backgroundColor = "rgb(247, 255, 209)";
            let totalPoints = Math.round(100*result)/100;
            let myEarningsCents = Math.round(totalPoints*pointCentConverisonRate);
            const resultText1 = new Entity()
            ,   resultText2 = new Entity()
            ,   resultText3 = new Entity()
            ,   resultText4 = new Entity()
            ,   resultText5 = new Entity()
            ;
            resultText1._element = document.createElement('div');
            resultText2._element = document.createElement('div');
            resultText3._element = document.createElement('div');
            resultText4._element = document.createElement('div');
            resultText5._element = document.createElement('div');
            // title
            resultText1._element.innerHTML = '<h1>Well Done!!</h1>';
            resultText1._element.font = 'Arial';
            resultText1.x = 20; // aligning to the centre
            resultText1.y = 15;
            resultText1.width = coreSize;
            // Label
            if(indivOrGroup == 1) {
                // group condition
                resultText2._element.innerHTML = '<p>Total Points for your group = <span class="note">'+totalPoints+'</span> points (your share = <span class="note">'+Math.round(10*totalPoints/3)/10+'</span> points). Therefore, your share is <span class="note">USD '+Math.round(myEarningsCents/3)/100+'</span>.<p>';
                resultText2._element.font = '18px Arial';
                resultText2.x = 20; // aligning to the centre
                resultText2.y = 105;
                resultText2.width = coreSize;
                // Label
                resultText3._element.innerHTML = '<p>Your bonus from the waiting room = <span class="note">'+Math.round(waitingBonus)+' cents</span>.<p>';
                resultText3._element.font = '18px Arial';
                resultText3.x = 20; // aligning to the centre
                resultText3.y = 145;
                resultText3.width = coreSize;
                // Label
                resultText4._element.innerHTML = '<p>Total earnings from the decision-making task: <span class="note">USD '+Math.round(Math.round(100*myEarningsCents/3)/100)/100+'</span>.<p>';
                resultText4._element.font = '18px Arial';
                resultText4.x = 20; // aligning to the centre
                resultText4.y = 185;
                resultText4.width = coreSize;
            } else {
                // individual condition
                resultText2._element.innerHTML = '<p>Total Points = <span class="note">'+totalPoints+'</span> points. Therefore, you got <span class="note">USD '+Math.round(myEarningsCents/3)/100+'</span>.<p>';
                resultText2._element.font = '18px Arial';
                resultText2.x = 20; // aligning to the centre
                resultText2.y = 105;
                resultText2.width = coreSize;
                // Label
                resultText3._element.innerHTML = '<p>Your bonus from the waiting room = <span class="note">'+Math.round(waitingBonus)+' cents</span>.<p>';
                resultText3._element.font = '18px Arial';
                resultText3.x = 20; // aligning to the centre
                resultText3.y = 145;
                resultText3.width = coreSize;
                // Label
                resultText4._element.innerHTML = '<p>Total earnings from the task: <span class="note">USD '+(Math.round(myEarningsCents/3)/100+Math.round(waitingBonus)/100)+'</span>.<p>';
                resultText4._element.font = '18px Arial';
                resultText4.x = 20; // aligning to the centre
                resultText4.y = 185;
                resultText4.width = coreSize;
            }
            // Label
            resultText5._element.innerHTML = '<p>Please proceed to the next page and complete the questionnaire.<p>';
            resultText5._element.font = '18px Arial';
            resultText5.x = 20; // aligning to the centre
            resultText5.y = 255;
            resultText5.width = coreSize;




            // goToResult Button
            const goToResultButton = new ButtonOriginal("Proceed to Questionnaire", 150, 100);
            goToResultButton.moveTo(300, 360); // 110, 60
            scene.on('enterframe', function() {
                // オンマウス処理
                if (goToResultButton.intersect(cursor)) {
                    if (!goToResultButton.onMouse) {
                        goToResultButton.onMouse = true;
                        // 色を変える
                        goToResultButton.backgroundColor = '#00f';
                        document.body.style.cursor = "pointer"; // change the cursor to pointer
                    }
                } else {
                    if (goToResultButton.onMouse) {
                        goToResultButton.onMouse = false;
                        // 色を戻す
                        goToResultButton.backgroundColor = '#ff0';
                        document.body.style.cursor = "default"; // change the cursor to pointer
                    }
                }
            });
            goToResultButton.on('touchstart', function() {
                goToQuestionnaire();             
            });
            // Add things to scene
            scene.addChild(resultText1);
            scene.addChild(resultText2);
            scene.addChild(resultText3);
            scene.addChild(resultText4);
            scene.addChild(resultText5);
            scene.addChild(goToResultButton);

            return scene;
        }

        socket.on('Proceed to next round', function(data) {
            mySocialInfo = data.socialInfo[data.round-2];
            myPublicInfo = data.publicInfo[data.round-2];
            choiceOrder = data.choiceOrder[data.round-2];
            currentRound++;
            totalEarning += sum(data.publicInfo[data.round-2].filter(function(value){ return value >= 0})); //sum(data.publicInfo[data.round-2]); 
            totalEarning = Math.round(totalEarning*1000)/1000;
            $("#totalEarningInCent").val(Math.round(totalEarning*pointCentConverisonRate/3));
            $("#currentRound").val(currentRound);
            perIndivPayoffPrevious = sum(data.publicInfo[data.round-2])/data.n[data.round-2];
            myCurrentActiveOption = []; //-1
            core.replaceScene(core.mainScene());
            //console.log('Proceed to next round!!!!!!');
            //console.log(mySocialInfo);
            //console.log(myPublicInfo);
        });

        function startLottery (position, meanPayoffs, socialInfo, publicInfo) {
            var thisMean = meanPayoffs[position];
            payoff = parseInt(15*100) + BoxMuller(thisMean*100, 100);
            if(payoff != 0) payoff = Math.round(100*payoff/100)/100;
            if(payoff < 0 ) payoff = 0;
            myEarnings.push(payoff);
            myChoices.push(position);
            socket.emit('choice made', {choice: position, payoff: payoff, socialInfo:socialInfo, publicInfo:publicInfo, totalEarning: totalEarning, individualContribution: individualContribution, subjectNumber:subjectNumber});
            setTimeout(function () {
                core.pushScene(core.payoffFeedbackScene(payoff));
            }, 3000);
        }

        function choiceMade (options, socialInfo, publicInfo, totalEarning, individualContribution) {
            //console.log('my current active option is ' + options + '.');
            if(options.length == 1) {
                myChoices.push(options);
            } else {
                myChoices = options;
            }
            socket.emit('choice made', {choice: options, socialInfo:socialInfo, publicInfo:publicInfo, numOptions:numOptions, totalEarning: totalEarning, individualContribution: individualContribution});
            core.pushScene(core.waitOthersScene());
        }

        // Make Orange Bonus Indicator
        const OrangeBar = Class.create(Sprite, {
            initialize: function (scene, x, y) {
                Sprite.call(this, 1, 11);
                this.x = x;
                this.y = y;
                this.frame = 1;
                this.image = core.assets['./images/scaleOrange.png'];
            scene.addChild(this);
            }
        });

        socket.on('this is your parameters', function (data) {
            confirmationID = data.id;
            myRoom = data.room;
            maxChoiceStageTime = data.maxChoiceStageTime;
            maxTimeTestScene = data.maxTimeTestScene;
            indivOrGroup = data.indivOrGroup;
            exp_condition = exp_condition;
            subjectNumber = data.subjectNumber;
            pointCentConverisonRate = data.pointCentRate;

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
            // getting the landscape data
            //getCSV(data.landscapeId);
            ////console.log('this is your parameters');
            //socket.emit('my other event', {myLandscapeId: data.landscapeId});
        });
        // ２回目以降の connection (reconnection) でも、同じクライアントと認識させるための工夫
        // s.socket のプロパティとしてセッション名を保持させておき、それを認証キーのように使う
        // To recognize multiple connections (i.e. reconnection) from the same participant as a 
        // single client, in the following I save sassionName as a socket's property.
        // 
        socket.on('S_to_C_clientSessionName', function(data) {
            connectionCounter += 1;
            sessionName = data.sessionName;
            roomName = data.roomName;
            socket.io.opts.query = 'sessionName='+data.sessionName+'&roomName='+data.roomName+'&amazonID='+amazonID;
            //console.log('client session name is ' + socket.io.opts.query);
        });
        /*socket.on('your environment is ready', function () {
            for (let i=0; i<landscape.length; ++i) {
                payoffmeans.push(landscape[i][1]);
            }
            isEnvironmentReady = true;
            //console.log(payoffmeans);
        });*/
        socket.on('S_to_C_welcomeback', function (data) {
            //console.log('welcome back' + data);
            /*if (waitingChoiceTimer) {
                clearTimeout(waitingChoiceTimer);
            }*/
            /*if (waitingStageTimer) {
                clearTimeout(waitingStageTimer);
            }*/
            setTimeout(function(){
                    //強制的にquestionnaireへ移行させる
                //$("#bonus_for_wa"ting").val(Math.round(waitingBonus*100)/100);
                //$("#totalGamePay"ff").val(totalEarning[totalEarning.length-1]);
                //$("#totalGamePay"ff").val(totalPayoff);
                //$("#tab_over").v"l(2);
                    // main_task.php のフォームを介して、実験の変数をPOSTする
                socket.io.opts.query = 'sessionName=already_finished';
                socket.disconnect();
                setTimeout(function(){
                    //$("#form").submi"();
                    //window.location.href = htmlServer + portnumQuestionnaire +'/questionnaire';
                }, 100);
            }, 200); //waitingBonus がしっかり計算されるのを待ってから移動させる
        });
        /*socket.on('wait for starting', function(data){
            //console.log(data.room);
        });*/

        socket.on('this is the remaining waiting time', function(data){
            /*if(payoffmeans.length == 0) {
                for (let i=0; i<landscape.length; ++i) {
                    payoffmeans.push(landscape[i][1]);
                }
            }*/
            isEnvironmentReady = true;
            //console.log('My payoff mean is '+payoffmeans);
            //console.log('The study starts in ' + (data.restTime / 1000) + ' seconds.');
            maxWaitingTime = data.max;
            maxNumPlayer = data.maxNumPlayer;
            maxRound = data.maxRound;
            /*if(waitingStageTimerResetCounter > 0){
                clearTimeout(waitingStageTimer);
            }
            waitingStageTimerResetCounter += 1;*/
            //before = new Date();
            core.replaceScene(core.waitingRoomScene(data.restTime));
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
            core.replaceScene(core.instructionScene(exp_condition, indivOrGroup));
        });

        socket.on('wait for others finishing test', function () {
            core.replaceScene(core.waitingOthersTestPassedScene(5*60*1000));
        });

        socket.on('you guys are individual condition', function () {
            socket.emit('ok individual condition sounds good');
        });

        socket.on('all passed the test', function(data) {
            //console.log('testPassed reached ' + data.testPassed + ' conditoin: ' + data.exp_condition);
            core.replaceScene(core.startingScene());
        });

        socket.on('your instant number is', function(data) {
            myInstantNum = data;
        });

        socket.on('End this session', function(data) {
            totalEarning += sum(data.publicInfo[data.round-2]);
            totalEarning = Math.round(totalEarning*1000)/1000;
            $("#totalEarningInCent").val(Math.round(totalEarning*pointCentConverisonRate/3));
            socket.io.opts.query = 'sessionName=already_finished';
            //console.log('query is ' + socket.io.opts.query);
            //socket.disconnect();
            core.replaceScene(core.resultScene(totalEarning, waitingBonus));
        });

        socket.on('client disconnected', function (data) {
            //console.log('client '+ data.disconnectedClient+' disconnected: now n = '+ data.roomStatus['n'] +'.');
            switch (currentStage) {
                case 'secondWaitingRoom':
                    if(data.roomStatus['testPassed'] >= data.roomStatus['n']) {
                        //console.log('testPassed reached ' + data.roomStatus['testPassed'] + ' conditoin: ' + data.roomStatus['exp_condition']);
                        core.replaceScene(core.startingScene());
                    }
                    break;
                case 'waitOthersScene':
                    //socket.emit('I have already chosen');
                    break;
                default:
                    //console.log("Sorry, we are out of " + currentStage + ".");
                    break;
            }
        });

	};

	core.start();

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

    function goToQuestionnaire () {

        //location.replace("http://" + htmlServer + '/questionnaire?earnings=' + result);
        $("#bonus_for_waiting").val(Math.round(waitingBonus)); //cents
        $("#completed").val(completed);
        $("#confirmationID").val(confirmationID);
        $("#totalEarningInCent").val(Math.round(totalEarning*pointCentConverisonRate/3));
        $("#exp_condition").val(exp_condition);
        $("#indivOrGroup").val(indivOrGroup);
        window.sessionStorage.removeItem('uniqueConfirmationID');
        setTimeout ( function () {
            $("#form").submit();
        }, 100);
        socket.disconnect();
    }

    // ============================================
    // disconnect function for debug purpose ======
    function disconnectTest() {
        //console.log('disconnectTest!!!');
        setTimeout(function() {
           // 接続を切る
           socket.disconnect();
        }, 6000);
    }
    //disconnectTest(); // debug

    socket.on('disconnect', function (client) {
        //console.log('disconnected');
        $("#bonus_for_waiting").val(Math.round(waitingBonus));
        $("#confirmationID").val(confirmationID);
        $("#totalEarningInCent").val(Math.round(totalEarning*pointCentConverisonRate/3));
        $("#completed").val(completed);
        $("#exp_condition").val(exp_condition);
        $("#indivOrGroup").val(indivOrGroup);
        socket.io.opts.query = 'sessionName=already_finished';
    });
    // =============================================

    socket.on('pong', function (ms) {
        //console.log(`socket :: averageLatency :: ${averageLatency} ms`);
        averageLatency.push(ms);
        averageLatency.splice(0,1);
    });
};
