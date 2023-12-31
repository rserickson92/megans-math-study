const blank = '____';

const testStimuli = [
  {
    equation: `3 + ${blank} = 10`,
    correctResponse: 7,
  },
  {
    equation: `2 + 2 = ${blank}`,
    correctResponse: 4
  },
  {
    equation: `${blank} + 12 = 15`,
    correctResponse: 3
  }
];
testStimuli.forEach(stimuli => {
  stimuli.correctEquation = stimuli.equation.replace(blank, stimuli.correctResponse);
});

const feedbackMessages = {
    correctNoYou: "That's correct! The right answer was typed!",
    correctYou: "That's correct! YOU typed the right answer!",
    incorrectNoYou: "That's incorrect! The wrong answer was typed!",
    incorrectYou: "That's incorrect! YOU typed the wrong answer!"
}

export { testStimuli, feedbackMessages };