/**
 * @title Megan's math study
 * @description Megan's math study
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";
import SurveyHtmlFormPlugin from "@jspsych/plugin-survey-html-form";
import ImageKeyboardResponsePlugin from "@jspsych/plugin-image-keyboard-response";

import { testStimuli, feedbackMessages } from "./test-data";

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
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
    stimulus: "<p>Ready for our study? 2+2 is 4, minus 1 that's 3 quick maths</p>",
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  const test = {
    type: SurveyHtmlFormPlugin,
    preamble: jsPsych.timelineVariable('equation'),
    html: '<input name="answer" type="text" />',
    data: {
      task: 'test',
      correctResponse: jsPsych.timelineVariable('correctResponse')
    },
    on_finish: (data) => {
      data.isCorrect = parseInt(data.response.answer) === data.correctResponse;
    }
  };

  const feedback = {
    type: ImageKeyboardResponsePlugin,
    choices: "ALL_KEYS",
    stimulus: '',
    data: {
      task: 'feedback'
    },
    on_start: (trial) => {
      if (prevTrialData(jsPsych).isCorrect) {
        trial.stimulus = 'assets/correct.png';
        trial.prompt = jsPsych.randomization.sampleWithoutReplacement([
          feedbackMessages.correctYou,
          feedbackMessages.correctNoYou
        ], 1);
      } else {
        trial.stimulus = 'assets/incorrect.png';
        trial.prompt = jsPsych.randomization.sampleWithoutReplacement([
          feedbackMessages.incorrectYou,
          feedbackMessages.incorrectNoYou
        ], 1);
      }
    }
  }

  const testProcedure = {
    timeline: [test, feedback],
    timeline_variables: testStimuli
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
