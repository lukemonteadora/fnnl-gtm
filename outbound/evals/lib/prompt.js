// Prompt builders for the GTM eval suites. `run_eval.mjs prepare` calls the builder a suite.yaml names
// (voc, card or fit) once per case and writes the resulting message pair into that case's packet.
//
// The system message is always a canonical prompt FILE that production also uses, never a copy:
//   voc     -> voc-extraction/prompt.md   (handed to extraction sub-agents)
//   card    -> competitor-card/prompt.md  (handed to the Vector 1 page-reading sub-agent)
//   fit     -> the client's locked /icp-prompt-builder prompt, read in place from its profile folder
// So a benchmark always measures the instruction that actually runs, and editing that file is what the
// before-and-after comparison in README.md tests. HTML comments (the maintainer header) are stripped.

const fs = require('fs');
const path = require('path');

const EVALS = path.resolve(__dirname, '..');
const REPO_OUTBOUND = path.resolve(EVALS, '..');

function readPrompt(file) {
  return fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
}

function voc({ vars }) {
  return [
    { role: 'system', content: readPrompt(promptFile('voc')) },
    {
      role: 'user',
      content: [
        'CLIENT CONTEXT (use it only to judge icp_match):',
        vars.client_context || 'unknown',
        '',
        'SOURCE METADATA:',
        `platform: ${vars.platform || 'unknown'}`,
        `source_url: ${vars.source_url || 'unknown'}`,
        `source_date: ${vars.source_date || 'unknown'}`,
        `author (role or handle as published): ${vars.source_author || 'unknown'}`,
        vars.rating ? `rating: ${vars.rating}` : null,
        '',
        'RAW SOURCE TEXT (quote only from between the markers):',
        '<<<SOURCE',
        String(vars.source_text || '').trim(),
        'SOURCE>>>',
      ].filter(l => l !== null).join('\n'),
    },
  ];
}

function card({ vars }) {
  return [
    { role: 'system', content: readPrompt(promptFile('card')) },
    {
      role: 'user',
      content: [
        `PAGE URL: ${vars.page_url}`,
        `DATE READ: ${vars.date_read || 'unknown'}`,
        '',
        'PAGE TEXT (extracted from the page; extract only from between the markers):',
        '<<<PAGE',
        String(vars.page_text || '').trim(),
        'PAGE>>>',
      ].join('\n'),
    },
  ];
}

// vars.icp_prompt_file is relative to outbound/ (e.g. profiles/<slug>/icp-prompt.txt), matching how
// client-profile.yaml records the locked prompt's path.
function fit({ vars }) {
  const file = promptFile('fit', vars);
  return [
    { role: 'system', content: readPrompt(file) },
    {
      role: 'user',
      content: 'Evaluate this ONE company. Return the STRICT JSON object for it and nothing else.\n\n' + JSON.stringify(vars.company, null, 2),
    },
  ];
}

// The canonical prompt file a builder reads for one case. The runner hashes it into MANIFEST.json, so a
// before-and-after comparison can show that the prompt really changed between two runs.
function promptFile(builder, vars = {}) {
  if (builder === 'voc') return path.join(EVALS, 'voc-extraction', 'prompt.md');
  if (builder === 'card') return path.join(EVALS, 'competitor-card', 'prompt.md');
  if (builder === 'fit') {
    if (!vars.icp_prompt_file) throw new Error('company-fit case has no vars.icp_prompt_file');
    return path.resolve(REPO_OUTBOUND, vars.icp_prompt_file);
  }
  throw new Error(`unknown prompt builder: ${builder}`);
}

module.exports = { voc, card, fit, promptFile };
