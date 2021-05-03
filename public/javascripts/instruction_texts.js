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
const instructionText_indiv =
	[ 'Please read the following instructions carefully. After reading the instructions, we will ask a few questions to verify your understanding of the experimental task.'

	, '<br><br>Throughout the main task, you are to make a series of choices between '//+numOptions+' slot machines.'

	, '<br><br>Overall, you will play <span class="note">4&nbsp;games</span>. There will be <span class="note">20&nbsp;trials</span> in each game. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>.'

	, '<br><br>Each choice will earn you a reward. Your total payout will be based on <span class="note">the sum of all points</span> you earn over the 20&nbsp;trials.'

	, '<br><br>The total reward you get will be converted into real money in the end. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;pence.</span>'
	// , '<br><br>The total reward you get will be converted into real money. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;US cents.</span>'

	, '<br>The reward for each slot seems random, but <span class="note">some of the slots will generate a higher payoff on average than the other</span>. The average payoff of each slot is constant over trials.'

	, '<br><br>However, the average payoff of the slot machines will be reset for every new game.'

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

	, '<br>Throughout the main task, you are to make a series of choices between '//+numOptions+' slot machines.'

	, '<br>Overall, you will play <span class="note">4&nbsp;games</span>. There will be <span class="note">20&nbsp;trials</span> in each game. On <span class="note">each trial</span>, you are to make <span class="note">1&nbsp;choice</span>.'

	, '<br>The slot machines will be reset for every new game.'

	, '<br>Other people will participate in this online experiment at the same time with you. You will be in a group of 3 people.'

	, '<br>Your choice will generate some rewards. The points you and other members generate are summed up. The sum of the points is your group\'s total reward.'

	, '<br>Your final payout will be one third of <span class=“note">group\'s total points</span> over the 20&nbsp;trials.'

	, '<br>The total reward you get will be converted into real money. The exchange rate is <span class="note">500&nbsp;points = 10&nbsp;pence</span>.'

	, '<br>The reward for each slot seems random, but <span class="note">some of the slots will generate a higher payoff on average than the other</span>. The average payoff of each slot is constant over trials, and is <span class="note">same for all members</span>. '

	, '<br>After each choice, you can see how much points you generated. Here, <span class="note">you can tell your experience to other members</span> if you choose to pay some costs.'

	, '<br>If you choose "YES", the cost is paid. In this case, 200 points minus the cost of 50 points, that is, 150 points will be added to the group\'s total payoff.'

	, '<br>If you choose to share the information, other members can see how much payoffs the slot has generated in the preceding trial. This may be helpful for other members to quickly guess which seems to be a better option.'

	, '<br>If you see numbers shown above the slots, this means that another group member has also chosen to share information at some costs.'

	, '<br>The sharing cost will vary from trial to trial. At some trials, you can share information more cheaply, while other times it is more expensive. Use the "information sharing" wisely!'

	, '<br><br><br>On the next page, you will play a tutorial to get familiar with the task!'
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

const goToNewGameRoundText =
	[ 'Well done!'
	, 'You have completed Round No. '
	, 'Please proceed to the new game!'
	, ''
	];

const testText = ['this is a test'];
