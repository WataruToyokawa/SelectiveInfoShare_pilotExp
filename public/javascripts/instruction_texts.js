'use strict';

const waitingRoomText0 =
	[ 'Welcome!'
	, 'The task will start shortly.'
	// , 'If nothing happens and you seem getting stuck in this page for more than 15 seconds, please reload this page.'
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

const instructionText_group =
	[ 'Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task. <br><br>After answering these questions, you may spend some more time in a waiting room until sufficient number of participants have arrived to start the task. <br><br>You will be paid <span class="note">10&nbsp;pence per minute</span> (that is, £6 per hour) for any time spent in the waiting room. When your group is ready, the main task will start.'

	, '<br>Throughout the main task, you are to make a series of choices between '//+numOptions+' slot machines.'

	, '<br>Overall, you will play <span class="note">4&nbsp;games</span>. There will be <span class="note">20&nbsp;trials</span> in each game. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>.'

	, '<br>The slot machines will be reset for every new game.'

	, '<br>Other people will participate in this online experiment at the same time with you. You will be in a group of 3 people.'

	, '<br>Your choice will generate some rewards. The points you and other group members generate are summed up. The sum of the points is your group\'s total reward.'

	, '<br>Your final payout will be one third of the <span class=“note">group\'s total points</span> over the whole experiment.'

	, '<br>The total reward you get will be converted into real money. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;pence</span>.'

	, 'The reward for each slot seems random, but <span class="note">one of the slots may generate a higher payoff on average than the other one</span>. The average payoff of each slot is constant over trials, and is same for all members; however, the exact amount of payoff you get may be different from what other group members get from the same slot, due to the randomness.'

	, 'After each choice, you can see how much points you generated. Subsequently, <span class="note">you may share your experience of that trial to other group members</span> if you choose to pay some costs incurred on the group\'s total reward.'

	, '<br>If you choose "YES", the cost is paid. In this case, 200 points minus the cost of 50 points, that is, 150 points will be added to the group\'s total payoff.'

	, '<br>If you choose to share the information, other members can see how much payoffs the slot has generated in the preceding trial. This may be helpful for other members to quickly guess which slot seems to be a better option.'

	, 'If you see numbers shown above the slots, this means that <span class="note">another group member has chosen to share information at some costs</span>. In this example, the information indicates that the slot 2 has dropped 130 points in the preceding trial to another member of your group. This may help you and the other group members to determine which slot provides the better outcomes in a given game.'

	, '<br>The sharing cost will vary from trial to trial. At some trials, you can share information more cheaply, while other times it is more expensive. Thus, use the "information sharing" wisely!'

	, '<br><br><br>On the next page, you will play a tutorial to get familiar with the task!'
	];
const tutorialText_group =
	[ '<br>This is the tutorial task. <br><br>Start by choosing whichever slot machine you like!'

	, '<br>You got 100 points! Well done. Now, you have to choose whether you share this information to other group members. Let\'s click "Yes" this time! ("No" button is inactivated right now)'

	, '<br>Note, although your choice provided 100 points, <span class="note">your total contribution at this trial was 80 points</span> since you chose "Yes" for information sharing costing 20 points,.'

	, 'This is trial 2. The <span class="note">same slot machines</span> will appear again. You see "200" above the slot 2. This means that another member of your group shared the information that she (or he) got 200 points from slot 2 in the last trial. Again choose one of the slots you like!'

	, '<br><br>Hooray! You got 150 points! Note, the information sharing costs 100 points this time.'

	, 'You have <span class="note">up to 15 seconds</span> to make a choice. <br><br>Note: You cannot click any options here in the tutorial for illustrative purposes. Let\'s see what happens if time is up.'

	// , 'Time was up and you missed the trial (which means 0 contribution)! Try not to miss any trial! <br><br>Alright, you completed the tutorial. Well done! Then go to a short quiz.'

	, 'Time was up and you missed the trial (which means 0 contribution)! Try not to miss any trial! <br><br>If you miss a trial, you are asked to confirm you are still participating in the experiment. If you do not manage to confirm you are still in the experiment in another 8 seconds, we have to assume you ended the study and the study will abort without compensation. Please click the "Yes, I am!" button below.'

	, '<br>The tutorial is done. <br><br>Next, you will proceed to a short comprehension quiz!'
	];
const understandingCheckText_group =
	[ '<h3>Please answer the following questions.</h3>'

	, 'How many trials will you play in each Game?' // 20

	// , 'Is it possible to choose the same option repeatedly?' //YES
	, 'Is the exact amount of payoff you get from a slot maybe different from what other group members get from the same slot?' // YES

	, 'Does your personal monetary bonus of this task increase by contributing more points to your group?' //YES

	, 'Suppose your choice generated 50 and the information-sharing cost was 70 in a trial. Would your net contribution at the trial become -20 if you choose to share information?' //YES

	, 'Is the cost of sharing information always the same?' //NO
	];







const instructionText_indiv =
	[ 'Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task.'

	, '<br><br>Throughout the main task, you are to make a series of choices between '//+numOptions+' slot machines.'

	, '<br><br>Overall, you will play <span class="note">4&nbsp;games</span>. There will be <span class="note">20&nbsp;trials</span> in each game. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>.'

	, '<br><br>Each choice will earn you a reward. Your total payout will be based on <span class="note">the sum of all points you earn</span> over the whole experiment.'

	, '<br><br>The total reward you get will be converted into real money in the end. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;pence.</span>'
	// , '<br><br>The total reward you get will be converted into real money. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;US cents.</span>'

	, '<br>The reward for each slot seems random, but <span class="note">one of the slots will generate a higher payoff on average than the other</span>. The average payoff of each slot is constant over trials.'

	, '<br><br>However, the average payoff of the slot machines will be reset for every new game.'

	, '<br><br><br><br>On the next page, you will play a tutorial to get familiar with the task!'
	];
const tutorialText_indiv =
	[ '<br>This is the tutorial task. <br><br>Start by choosing whichever slot machine you like!'

	, '<br><br>You got 100 points! Well done.'

	, '<br>This is the second trial. The <span class="note">same slot machines</span> will appear again. <br><br>Please make another choice!'

	, '<br><br>Hooray! You got 150 points!'

	, 'You have <span class="note">up to 15 seconds</span> in making a choice. <br><br>Note: You cannot click any options here for the tutorial purpose. Let\'s see what happens if time is up.'

	, 'Time was up and you missed the trial! Try not to miss any trial! <br><br>If you miss a trial, you are asked to confirm you are still participating in the experiment. If you do not manage to confirm you are still in the experiment in another 8 seconds, we have to assume you ended the study and the study will abort without compensation. Please click the "Yes, I am!" button below.'

	, '<br>The tutorial is done. <br><br>Next, you will proceed to a short comprehension quiz!'
	];
const understandingCheckText_indiv =
	[ '<h3>Please answer the following questions.</h3>'

	, 'How many trials will you play in total?' // 70

	, 'Is it possible to choose the same option repeatedly?' //YES

	, 'Does your monetary bonus of this task increase by accumulating more points?' //YES
	];



const revisitingInstructionText =
	[ '<br><br><span class="note">Woops! One or more answers were incorrect.</span> Please read the instruction again!'

	, '<br><br>That\'s it! Take the comprehension quiz again in the next page.'
	]

const goToQuestionnaireText =
	[ 'Well done!'
	, 'Your total game reward: £'
	, 'Waiting bonus: £'
	, 'Flat fee for completion of the task: £'
	];

const goToNewGameRoundText =
	[ 'Well done!'
	, 'You have completed Game No. '
	, 'Please proceed to the new Game!'
	, ''
	];

const testText = ['this is a test'];
