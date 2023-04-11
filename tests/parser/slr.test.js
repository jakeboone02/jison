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

  var gen = new Jison.Generator(grammar, { type: 'slr' });
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);

  expect(parser.parse('xxx'), "parse 3 x's").toBeTruthy();
  // parse single x
  expect(parser.parse('x')).toBeTruthy();
  // throws parse error on invalid token
  expect(() => parser.parse('y')).toThrow();
  // no conflicts
  expect(gen.conflicts == 0).toBeTruthy();
});

it('test right-recursive nullable grammar', () => {
  var grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ''],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'slr' });
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);

  expect(parser.parse('xxx'), "parse 3 x's").toBeTruthy();
  // table has 4 states
  expect(gen.table.length == 4).toBeTruthy();
  // no conflicts
  expect(gen.conflicts == 0).toBeTruthy();
  // A is nullable
  expect(gen.nullable('A')).toBe(true);
});
