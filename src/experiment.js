/**
 * @title Megan's math study
 * @description Megan's math study
 * @version 0.3.0
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
      data.isCorrect = parseInt(data.response.answer) === data.correctResponse;
    },
  };

  const feedback = {
    type: SurveyHtmlFormPlugin,
    css_classes: ['study-feedback'],
    data: {
      task: 'feedback',
    },
    on_start: (trial) => {
      if (prevTrialData(jsPsych).isCorrect) {
        trial.html = `
          ${feedbackImages(jsPsych, true)}
          ${feedbackAnswer(jsPsych)}
        `;
      } else {
        trial.html = `
          ${feedbackImages(jsPsych, false)}
          ${feedbackAnswer(jsPsych)}
          ${retryButton(jsPsych.data.dataProperties.hideRetryButton)}
        `;
      }
    },
    on_load: () => {
      const retryButton = document.getElementById('feedback-retry-button');
      retryButton?.addEventListener('click', () => {
        retryButton.insertAdjacentHTML('afterend', retryHiddenInput());
      });
    },
    on_finish: (data) => {
      if (!!data.response.retry) {
        jsPsych.data.addProperties({hideRetryButton: true});
      } else {
        jsPsych.data.addProperties({hideRetryButton: false});
      }
    },
  };

  const singleTestFeedback = {
    timeline: [test, feedback],
    loop_function: (data) => {
      const [testData, feedbackData] = data.values();
      const retryPressed = !!feedbackData.response.retry;
      return !testData.isCorrect && retryPressed;
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

// Unused, but leaving in incase needed later
function randomizedFeedbackMessage(jsPsych, choices) {
  const message = jsPsych.randomization.sampleWithoutReplacement(choices, 1);

  // Workaround: inline style is needed here, presumably because
  // assets are not available yet during CSS compilation
  return `
    <div class="feedback-message" style="background-image: url('assets/ribbon.png')">
      <p>${message}</p>
    </div>
  `;
}

function personalizedFeedbackMessage(jsPsych, correct) {
  const {person, participantName} = jsPsych.data.dataProperties;
  const correctMessage = person ? feedbackMessages.correctYou(participantName) : feedbackMessages.correctNoYou;
  const incorrectMessage = person ? feedbackMessages.incorrectYou(participantName) : feedbackMessages.incorrectNoYou;

  // Workaround: inline style is needed here, presumably because
  // assets are not available yet during CSS compilation
  return `
    <div class="feedback-message" style="background-image: url('assets/ribbon.png')">
      <p>${correct ? correctMessage : incorrectMessage}</p>
    </div>
  `;
}

function feedbackImages(jsPsych, correct) {
  const verify = jsPsych.data.dataProperties.verify;
  const imageFilename = correct ? 'correct.png' : 'incorrect.png';

  let images;
  if (verify) {
    images = `
      <img src="assets/${imageFilename}" />
      ${personalizedFeedbackMessage(jsPsych, correct)}
    `;
  } else {
    images = `
      ${personalizedFeedbackMessage(jsPsych, correct)}
      <img src="assets/${imageFilename}" />
    `;
  }

  return `
    <div class="feedback-images">
      ${images}
    </div>
  `;
}

function feedbackAnswer(jsPsych) {
  const correctEquation = jsPsych.timelineVariable('correctEquation');
  const correctResponse = jsPsych.timelineVariable('correctResponse');
  return `
    <div class="feedback-answer">
      <strong>
        The correct answer is
        <span class="correct-response">${correctResponse}</span>
      </strong>
      <p class="correct-equation">${correctEquation}</p>
    </div>
  `;
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
      value="Retry"
    />
  `;
}

function retryHiddenInput() {
  return `<input type="hidden" name="retry" value="true" />`;
}
