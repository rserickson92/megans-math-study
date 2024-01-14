const answerBox = '<input id="problem-answer-box" name="answer" type="text" />';

const testStimuli = [
  {
    equation: `
      ${equationSegment('3 + ')}
      ${answerBox}
      ${equationSegment('= 10')}
    `,
    correctResponse: 7,
  },
  {
    equation: `
      ${equationSegment('2 + ')}
      ${answerBox}
      ${equationSegment('= 4')}
    `,
    correctResponse: 2,
  },
  {
    equation: `
      ${equationSegment('12 - ')}
      ${answerBox}
      ${equationSegment('= 10')}
    `,
    correctResponse: 2,
  },
];
testStimuli.forEach((stimuli) => {
  stimuli.correctEquation = stimuli.equation.replace(
      answerBox,
      formatCorrectResponse(stimuli.correctResponse),
  );
});

function equationSegment(text) {
  return `<span>${text}</span>`;
}

function formatCorrectResponse(answer) {
  return `<span class="correct-response">${answer}</span>`;
}

const feedbackMessages = {
  correctYou: (name) => `Good job ${name}! YOU got it right!`,
  correctNoYou: 'Good job! That\'s right!',
  incorrectYou: (name) => `Uh oh ${name}! YOU got it wrong!`,
  incorrectNoYou: 'Uh oh! That\'s wrong!',
};

export {testStimuli, feedbackMessages};
