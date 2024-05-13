const answerBox = (value = null, isCorrect = false) => {
  return `
    <input
      id="problem-answer-box"
      name="answer"
      type="text"
      ${value && isCorrect ? 'class="correct-response"' : ''}
      ${value ? `value=${value}` : ''}
      ${value ? 'disabled' : ''}
    />
  `;
};

const testStimuli = [
  [
    {
      equation: `
      ${equationSegment('3 + ')}
      ${answerBox()}
      ${equationSegment(' = 10')}
    `,
      correctResponse: 7,
    },
    {
      equation: `
      ${equationSegment('5 + 6 + 4 = 4 + ')}
      ${answerBox()}
    `,
      correctResponse: 11,
    },
    {
      equation: `
      ${equationSegment('3 + 7 = 3 + ')}
      ${answerBox()}
    `,
      correctResponse: 7,
    },
    {
      equation: `
      ${equationSegment('9 + 6 = ')}
      ${answerBox()}
      ${equationSegment(' + 5')}
    `,
      correctResponse: 10,
    },
    {
      equation: `
      ${equationSegment('8 = 5 + ')}
      ${answerBox()}
    `,
      correctResponse: 3,
    },
    {
      equation: `
      ${equationSegment('6 + 2 + 3 = ')}
      ${answerBox()}
      ${equationSegment(' + 8')}
    `,
      correctResponse: 3,
    },
    {
      equation: `
      ${equationSegment('3 + 5 = 4 + ')}
      ${answerBox()}
    `,
      correctResponse: 4,
    },
    {
      equation: `
      ${equationSegment('4 + 7 = 4 + ')}
      ${answerBox()}
    `,
      correctResponse: 7,
    },
  ],
  [
    {
      equation: `
        ${equationSegment('10 = 7 + ')}
        ${answerBox()}
      `,
      correctResponse: 3,
    },
    {
      equation: `
        ${equationSegment('8 + 2 + 5 = ')}
        ${answerBox()}
        ${equationSegment('+ 5')}
      `,
      correctResponse: 10,
    },
    {
      equation: `
        ${equationSegment('3 + 7 = 5 + ')}
        ${answerBox()}
      `,
      correctResponse: 5,
    },
    {
      equation: `
        ${equationSegment('5 + 5 + 5 = ')}
        ${answerBox()}
        ${equationSegment(' + 6')}
      `,
      correctResponse: 9,
    },
    {
      equation: `
        ${equationSegment('3 + 5 = 5 + ')}
        ${answerBox()}
      `,
      correctResponse: 3,
    },
    {
      equation: `
        ${equationSegment('4 + 2 + 5 = 5 + ')}
        ${answerBox()}
      `,
      correctResponse: 6,
    },
    {
      equation: `
        ${equationSegment('7 + 1 = ')}
        ${answerBox()}
        ${equationSegment(' + 4')}
      `,
      correctResponse: 4,
    },
    {
      equation: `
        ${equationSegment('4 + 7 = 3 + ')}
        ${answerBox()}
      `,
      correctResponse: 8,
    },
  ],
];

testStimuli.forEach((stimuliGroup) => {
  stimuliGroup.forEach((stimuli) => {
    stimuli.displayEquation = (inputAnswer, isCorrect) =>
      stimuli.equation.replace(
          answerBox(),
          answerBox(inputAnswer, isCorrect),
      );
  });
});

// eslint-disable-next-line require-jsdoc
function equationSegment(text) {
  return `<span>${text}</span>`;
}

// Note: line wrapping could be better by splitting up dynamically
// based on long names. But not required for now
const feedbackMessages = {
  correctYou: (name) => [`Good job ${name}!`, 'YOU got it right!'],
  correctNoYou: ['Good job! That\'s right!'],
  incorrectYou: (name) => [`Uh oh ${name}!`, 'YOU got it wrong!'],
  incorrectNoYou: ['Uh oh! That\'s wrong!'],
  neutralYou: (name) => [`${name}! YOU`, 'submitted', 'an answer!'],
  neutralNoYou: ['An answer was', 'submitted!'],
};

export {testStimuli, feedbackMessages};
