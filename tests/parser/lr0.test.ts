import { expect, it } from 'bun:test';
import { Jison, Lexer } from '../setup';

var lexData = {
  rules: [
    ['x', "return 'x';"],
    ['y', "return 'y';"],
  ],
};

it('test left-recursive nullable grammar', () => {
  var grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['A x', ''],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);

  // parse 3 x's
  expect(parser.parse('xxx')).toBeTruthy();
  // parse single x
  expect(parser.parse('x')).toBeTruthy();
  // throws parse error on invalid token
  expect(() => parser.parse('y')).toThrow();
});

it('test right-recursive nullable grammar', () => {
  var grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ''],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'lr0' });

  // table has 4 states
  expect(gen.table.length == 4).toBeTruthy();
  // encountered 2 conflicts
  expect(gen.conflicts == 2).toBeTruthy();
});

it('test 0+0 grammar', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
    ],
  };
  var grammar = {
    tokens: ['ZERO', 'PLUS'],
    startSymbol: 'E',
    bnf: {
      E: ['E PLUS T', 'T'],
      T: ['ZERO'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData2);

  // parse
  expect(parser.parse('0+0+0')).toBeTruthy();
  // parse single 0
  expect(parser.parse('0')).toBeTruthy();
  // throws parse error on invalid
  expect(() => parser.parse('+')).toThrow();
});
