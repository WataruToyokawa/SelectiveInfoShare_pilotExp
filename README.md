# Selective information sharing in risky bandit task -- pilot test

## Sample size

A group of 3 * 10 groups = 30 people

## Task

A two-armed bandit task (one risky one safe) with the following 2 * 2 different task setups:

Skewness (positively / negatively skewed) * risk premium (positive / negative) 

The pilot experiment is is aimed at estimating the relationship between the threshold and increasing cost of sharing information. 10 groups of 3 should be enough for this purpose. 

The task is 20-trial two-armed bandit. Each group will perform 4 rounds in total. The 4 different regime (i.e. the combination between is-risky-optimal/is-high-rare) will be assigned to each of the four rounds, with its order counter-balanced. Within a round, people play the multi-player task. Each trial starts with the choice stage where subjects have to choose one of the two options to obtain a payoff. This payoff information is private. 

However, they have an opportunity to decide whether they share this information. If they opt-in, the information of the payoff will be shown in the next choice stage. No social/public information is available otherwise. To share the payoff information, however, there is a wee cost incurred by the sharer's group (not sharer himself, as we don't want any social dilemma structures). The amount of the cost will vary trial-by-trial, i.e. it may be free in some trials but expensive in other trials, and people can know this at the sharing stage where they make the sharing decision.  

Then, we will collect a totally 20 trials * 30 individuals (10 groups) data points for each of the four task regime. A logistic regression to the information sharing behaviour (1 = yes/0 = no) with the sharing cost as a main effect (as well as with the individual and group random effects) will give us a marginal effect of increasing sharing cost to information sharing probability.
