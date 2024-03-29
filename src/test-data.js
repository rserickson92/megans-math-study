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
  stimuli.displayEquation = (inputAnswer, isCorrect) =>
    stimuli.equation.replace(
        answerBox,
        formatResponse(inputAnswer, isCorrect),
    );
});

// eslint-disable-next-line require-jsdoc
function equationSegment(text) {
  return `<span>${text}</span>`;
}

// eslint-disable-next-line require-jsdoc
function formatResponse(value, isCorrect) {
  if (isCorrect) {
    return `<span class="correct-response">${value}</span>`;
  } else {
    return value;
  }
}

const feedbackMessages = {
  correctYou: (name) => [`Good job ${name}!`, 'YOU got it right!'],
  correctNoYou: ['Good job! That\'s right!'],
  incorrectYou: (name) => [`Uh oh ${name}!`, 'YOU got it wrong!'],
  incorrectNoYou: ['Uh oh! That\'s wrong!'],
};

export {testStimuli, feedbackMessages};
