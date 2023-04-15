#!/usr/bin/env node

import { program } from 'commander';
import ebnfParser from 'ebnf-parser';
import cjson from 'jsonc-parser';
import lexParser from 'lex-parser';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, extname, normalize } from 'node:path';
import { Jison } from '../dist/jison.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

program
  .name('jison')
  .version(version)
  .argument('[file]', 'File containing a grammar')
  .argument('[lexfile]', 'File containing a lexical grammar')
  .option('-j, --json', 'Force jison to expect a grammar in JSON format', false)
  .option('-o, --outfile <FILE>', 'Filename and base module name of the generated parser')
  .option('-t, --debug', 'Enable debug mode', false)
  .option('-m, --module-type <TYPE>', 'Type of module to generate (esm, commonjs, amd, js)', 'esm')
  .option(
    '-p, --parser-type <TYPE>',
    'Type of algorithm to use for the parser (lr0, slr, lalr, lr)'
  )
  .option('-v, --version', 'Print version and exit');

const opts = program.parse().opts();
opts.file = program.args[0];
opts.lexfile = program.args[1];

console.log(opts);

function readin(cb) {
  let data = '';

  // process.stdin.setEncoding('utf8');
  process.stdin.on('readable', chunk => {
    data += chunk;
  });

  process.stdin.on('end', () => {
    cb(data);
  });
}

function generateParserString(opts, grammar) {
  opts = opts || {};

  const settings = grammar.options || {};

  if (opts['parser-type']) {
    settings.type = opts['parser-type'];
  }
  if (opts.moduleName) {
    settings.moduleName = opts.moduleName;
  }
  settings.debug = opts.debug;
  if (!settings.moduleType) {
    settings.moduleType = opts['module-type'];
  }

  const generator = new Jison.Generator(grammar, settings);
  return generator.generate(settings);
}

function processGrammars(file, lexFile = false, jsonMode = false) {
  lexFile = lexFile || false;
  jsonMode = jsonMode || false;
  let grammar;
  try {
    if (jsonMode) {
      grammar = cjson.parse(file);
    } else {
      grammar = ebnfParser.parse(file);
    }
  } catch (e) {
    throw new Error('Could not parse jison grammar');
  }
  try {
    if (lexFile) {
      grammar.lex = lexParser.parse(lexFile);
    }
  } catch (e) {
    throw new Error('Could not parse lex grammar');
  }
  return grammar;
}

function processGrammar(raw, lex, opts) {
  const grammar = processGrammars(raw, lex, opts.json);
  return generateParserString(opts, grammar);
}

function processStdin() {
  readin(raw => {
    console.log(processGrammar(raw, null, opts));
  });
}

function processInputFile() {
  // getting raw files
  let lex;
  if (opts.lexfile) {
    lex = readFileSync(normalize(opts.lexfile), 'utf8');
  }
  const raw = readFileSync(normalize(opts.file), 'utf8');

  // making best guess at json mode
  opts.json = extname(opts.file) === '.json' || opts.json;

  // setting output file name and module name based on input file name
  // if they aren't specified.
  const name = basename(opts.outfile || opts.file).replace(/\.[^\.]+$/g, '');

  // opts.outfile = opts.outfile || name + '.js';

  if (!opts.moduleName && name) {
    opts.moduleName = name.replace(/-\w/g, match => match.charAt(1).toUpperCase());
  }

  const parser = processGrammar(raw, lex, opts);

  if (opts.outfile) {
    writeFileSync(opts.outfile, parser);
  } else {
    console.log(parser);
  }
}

// if an input file wasn't given, assume input on stdin
if (opts.file) {
  processInputFile();
} else {
  processStdin();
}
