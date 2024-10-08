/**
 * @title Megan's math study
 * @description Megan's math study
 * @version 1.2.0
 *
 * @assets assets/
 */

/* eslint-disable require-jsdoc */
/* eslint-disable valid-jsdoc */
/* eslint-disable max-len */

// You can import stylesheets (.scss or .css).
import '../styles/main.scss';

import FullscreenPlugin from '@jspsych/plugin-fullscreen';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import PreloadPlugin from '@jspsych/plugin-preload';
import {initJsPsych} from 'jspsych';
import SurveyHtmlFormPlugin from '@jspsych/plugin-survey-html-form';
import SurveyTextPlugin from '@jspsych/plugin-survey-text';

import {testStimuli, feedbackMessages} from './test-data';
import {QUESTION_SET} from './config';
import SurveyMultiSelectPlugin from '@jspsych/plugin-survey-multi-select';

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({assetPaths, input = {}, environment, title, version}) {
  const jsPsych = initJsPsych();

  const timeline = [];

  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video,
  });

  // Welcome screen
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: '<p>Ready for our study?</p>',
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  // Configuration page
  timeline.push({
    type: SurveyMultiSelectPlugin,
    questions: [{
      prompt: '',
      options: ['Person', 'Verify'],
      required: false,
      name: 'options',
    }],
    button_label: '→',
    data: {
      task: 'config',
    },
    on_load: () => {
      document.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.click());
    },
    on_finish: (data) => {
      const options = Object.fromEntries(data.response.options.map((o) => [o.toLowerCase(), true]));
      jsPsych.data.addProperties({studyConfig: options});
    },
  });

  // Get participant name
  timeline.push({
    type: SurveyTextPlugin,
    questions: [
      {
        prompt: 'What\'s your name?',
        name: 'participantName',
        required: true,
      },
    ],
    on_finish: (data) => {
      jsPsych.data.addProperties({participantName: data.response.participantName});
      jsPsych.data.addProperties({feedbackStage: 'initial'});
    },
  });

  const test = {
    type: SurveyHtmlFormPlugin,
    html: () => {
      return jsPsych.timelineVariable('equation');
    },
    button_label: '→',
    css_classes: ['study-problem'],
    data: {
      task: 'test',
      correctResponse: jsPsych.timelineVariable('correctResponse'),
    },
    on_finish: (data) => {
      data.answer = data.response.answer;
      data.isCorrect = parseInt(data.response.answer) === data.correctResponse;
    },
  };

  const feedback = {
    type: SurveyHtmlFormPlugin,
    button_label: () => {
      const {isCorrect} = prevData(jsPsych, 'test');
      const {feedbackStage} = jsPsych.data.dataProperties;
      if (!isCorrect && ['initial', 'retry'].includes(feedbackStage)) {
        return 'See Answer';
      } else {
        return 'Next Question';
      }
    },
    css_classes: ['study-feedback'],
    data: {
      task: 'feedback',
    },
    on_start: (trial) => {
      trial.html = `
        ${feedbackImages(jsPsych)}
        ${feedbackButtonsContainer(jsPsych)}
        ${feedbackAnswer(jsPsych)}
      `;
    },
    on_load: () => {
      centerNextButton();
      configureRetryButton();
    },
  };

  const feedbackNode = {
    timeline: [feedback],
    loop_function: (data) => {
      const testData = prevData(jsPsych, 'test');
      if (testData.isCorrect) {
        jsPsych.data.addProperties({feedbackStage: 'success'});
        return false;
      }

      const [feedbackData] = data.values();
      const retryPressed = !!feedbackData.response.retry;
      if (retryPressed) {
        jsPsych.data.addProperties({feedbackStage: 'retry'});
        return false;
      }

      const {feedbackStage} = jsPsych.data.dataProperties;
      if (['success', 'failure'].includes(feedbackStage)) {
        return false;
      }

      jsPsych.data.addProperties({feedbackStage: 'failure'});
      return true;
    },
  };

  const singleTestFeedback = {
    timeline: [test, feedbackNode],
    loop_function: (data) => {
      const {feedbackStage} = jsPsych.data.dataProperties;
      if (feedbackStage === 'retry') {
        return true;
      }

      jsPsych.data.addProperties({feedbackStage: 'initial'});
      return false;
    },
  };

  const testProcedure = {
    timeline: [singleTestFeedback],
    timeline_variables: testStimuli[QUESTION_SET],
  };
  timeline.push(testProcedure);

  await jsPsych.run(timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}

function prevData(jsPsych, task) {
  return jsPsych.data.get().trials.findLast((t) => t.task === task);
}

function feedbackBanner(jsPsych, correct) {
  const {studyConfig: {person, verify}, participantName} = jsPsych.data.dataProperties;
  const correctMessage = person ? feedbackMessages.correctYou(participantName) : feedbackMessages.correctNoYou;
  const incorrectMessage = person ? feedbackMessages.incorrectYou(participantName) : feedbackMessages.incorrectNoYou;
  const neutralMessage = person ? feedbackMessages.neutralYou(participantName) : feedbackMessages.neutralNoYou;

  let bannerFilename;
  let displayMessage;
  if (verify) {
    bannerFilename = correct ? 'green-ribbon.png' : 'red-ribbon.png';
    displayMessage = correct ? correctMessage : incorrectMessage;
  } else {
    bannerFilename = 'blue-ribbon.png';
    displayMessage = neutralMessage;
  }

  // Workaround: inline style is needed here, presumably because
  // assets are not available yet during CSS compilation
  return `
    <div class="feedback-message" style="background-image: url('assets/${bannerFilename}')">
      ${displayMessage.map((line) => `<p>${line}</p>`).join('')}
      ${feedbackIcon(jsPsych, correct)}
    </div>
  `;
}

function feedbackIcon(jsPsych, correct) {
  const {verify} = jsPsych.data.dataProperties.studyConfig;
  if (!verify) {
    return '';
  }

  const iconFilename = correct ? 'correct.png' : 'incorrect.png';
  return `
    <div class="feedback-icon-container">
      <img class="feedback-icon" src="assets/${iconFilename}" />
    </div>
  `;
}

function feedbackImages(jsPsych) {
  const {isCorrect} = prevData(jsPsych, 'test');

  return `
    <div class="feedback-images">
      ${feedbackBanner(jsPsych, isCorrect)}
    </div>
  `;
}

function feedbackAnswer(jsPsych) {
  const {isCorrect, answer} = prevData(jsPsych, 'test');
  const displayEquation = jsPsych.timelineVariable('displayEquation');
  const correctResponse = jsPsych.timelineVariable('correctResponse');
  const {feedbackStage} = jsPsych.data.dataProperties;
  const showCorrection = isCorrect || feedbackStage === 'failure';

  const correctAnswerMessage = `
    <strong>
      The answer is
      <span class="correct-response">${correctResponse}</span>
    </strong>
  `;

  const incorrectAnswerMessage = `
    <strong>
      The answer is not
      <span class="incorrect-response">${answer}</span>
    </strong>
  `;

  return `
    <div class="feedback-answer">
      ${showCorrection ? correctAnswerMessage : incorrectAnswerMessage}
      <p class="correct-equation">
        ${showCorrection ? displayEquation(correctResponse, true) : displayEquation(answer, false)}
      </p>
    </div>
  `;
}

function feedbackButtonsContainer(jsPsych) {
  const {isCorrect} = prevData(jsPsych, 'test');
  const hideRetryButton = isCorrect || ['retry', 'failure', 'end'].includes(jsPsych.data.dataProperties.feedbackStage);
  return `
    <div id="feedback-buttons">
      ${retryButton(hideRetryButton)}
    </div>
  `;
}

function centerNextButton() {
  const nextButton = document.getElementById('jspsych-survey-html-form-next');
  const feedbackButtonsContainer = document.getElementById('feedback-buttons');

  feedbackButtonsContainer.insertAdjacentElement('beforeend', nextButton);
}

function configureRetryButton() {
  const retryButton = document.getElementById('feedback-retry-button');
  retryButton?.addEventListener('click', () => {
    retryButton.insertAdjacentHTML('afterend', retryHiddenInput());
  });
}

function retryButton(hide) {
  if (hide) {
    return '';
  }

  return `
    <input
      type="submit"
      id="feedback-retry-button"
      class="jspsych-btn jspsych-survey-html-form"
      value="Try Again"
    />
  `;
}

function retryHiddenInput() {
  return `<input type="hidden" name="retry" value="true" />`;
}
