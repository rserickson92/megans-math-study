/**
 * @title Megan's math study
 * @description Megan's math study
 * @version 0.5.0
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
      options: ['Person', 'Verify', 'Question'],
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
      jsPsych.data.addProperties(options);
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
    button_label: 'Next Question',
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
    on_finish: (data) => {
      jsPsych.data.addProperties({hideRetryButton: true});
    },
  };

  const feedbackNode = {
    timeline: [feedback],
    loop_function: (data) => {
      const testData = prevTestData(jsPsych);
      if (testData.isCorrect) {
        return false;
      }

      const [feedbackData] = data.values();
      const {alreadyCorrected} = jsPsych.data.dataProperties;
      if (!feedbackData.response.retry && !alreadyCorrected) {
        jsPsych.data.addProperties({alreadyCorrected: true});
        return true;
      }

      return false;
    },
  };

  const singleTestFeedback = {
    timeline: [test, feedbackNode],
    loop_function: (data) => {
      const [testData, feedbackData] = data.values();
      const retryPressed = !!feedbackData.response.retry;
      if (!testData.isCorrect && retryPressed) {
        return true;
      }

      jsPsych.data.addProperties({hideRetryButton: false, alreadyCorrected: false});
      return false;
    },
  };

  const testProcedure = {
    timeline: [singleTestFeedback],
    timeline_variables: testStimuli,
  };
  timeline.push(testProcedure);

  await jsPsych.run(timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}

function prevTrialData(jsPsych) {
  return jsPsych.data.get().last().values()[0];
}

function prevTestData(jsPsych) {
  return jsPsych.data.get().trials.findLast((t) => t.task === 'test');
}

function feedbackBanner(jsPsych, correct) {
  const {person, verify, participantName} = jsPsych.data.dataProperties;
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
  const {verify} = jsPsych.data.dataProperties;
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
  const {isCorrect} = prevTestData(jsPsych);

  return `
    <div class="feedback-images">
      ${feedbackBanner(jsPsych, isCorrect)}
    </div>
  `;
}

function feedbackAnswer(jsPsych) {
  const {isCorrect, answer} = prevTestData(jsPsych);
  const displayEquation = jsPsych.timelineVariable('displayEquation');
  const correctResponse = jsPsych.timelineVariable('correctResponse');
  const noRetries = isCorrect || jsPsych.data.dataProperties.hideRetryButton;

  const correctAnswerMessage = `
    <strong>
      The answer is
      <span class="correct-response">${correctResponse}</span>
    </strong>
  `;

  return `
    <div class="feedback-answer">
      ${noRetries ? correctAnswerMessage : ''}
      <p class="correct-equation">
        ${noRetries ? displayEquation(correctResponse, true) : displayEquation(answer, false)}
      </p>
    </div>
  `;
}

function feedbackButtonsContainer(jsPsych) {
  const {isCorrect} = prevTestData(jsPsych);
  const hideRetryButton = jsPsych.data.dataProperties.hideRetryButton;
  return `
    <div id="feedback-buttons">
      ${isCorrect ? '' : retryButton(hideRetryButton)}
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
