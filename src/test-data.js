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
  correctNoYou: 'That\'s correct! The right answer was typed!',
  correctYou: 'That\'s correct! YOU typed the right answer!',
  incorrectNoYou: 'That\'s incorrect! The wrong answer was typed!',
  incorrectYou: 'That\'s incorrect! YOU typed the wrong answer!',
};

export {testStimuli, feedbackMessages};
