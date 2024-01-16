/**
 * @title Megan's math study
 * @description Megan's math study
 * @version 0.2.0
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
      const participantName = jsPsych.data.dataProperties.participantName;
      if (prevTrialData(jsPsych).isCorrect) {
        trial.html = `
          <div class="feedback-images">
            <img src="assets/correct.png" />
            ${randomizedFeedbackMessage(jsPsych, [
    feedbackMessages.correctYou(participantName),
    feedbackMessages.correctNoYou,
  ])}
          </div>
          ${feedbackAnswer(jsPsych)}
        `;
      } else {
        trial.html = `
          <div class="feedback-images">
            <img src="assets/incorrect.png" />
            ${randomizedFeedbackMessage(jsPsych, [
    feedbackMessages.incorrectYou(participantName),
    feedbackMessages.incorrectNoYou,
  ])}
          </div>
          ${feedbackAnswer(jsPsych)}
        `;
      }
    },
  };

  const testProcedure = {
    timeline: [test, feedback],
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
