import { Jison, Lexer } from '../setup';

it('test error caught', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['.', "return 'ERR';"],
    ],
  };
  var grammar = {
    bnf: {
      A: ['A x', 'A y', ['A error', "return 'caught';"], ''],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);
  // should parse
  expect(parser.parse('xxy')).toBeTruthy();
  // should return 'caught'
  expect(parser.parse('xyg')).toBe('caught');
});

it('test error recovery', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['.', "return 'ERR';"],
    ],
  };
  var grammar = {
    bnf: {
      A: ['A x', ['A y', "return 'recovery'"], 'A error', ''],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);
  // should return foo
  expect(parser.parse('xxgy')).toBe('recovery');
});

it('test deep error recovery', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['g', "return 'g';"],
      [';', "return ';';"],
      ['.', "return 'ERR';"],
    ],
  };
  var grammar = {
    bnf: {
      S: ['g A ;', ['g error ;', 'return "nested"']],
      A: ['A x', 'x'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);
  // should parse
  expect(parser.parse('gxxx;')).toBeTruthy();
  // should return nested
  expect(parser.parse('gxxg;')).toBe('nested');
});

it('test no recovery', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['.', "return 'ERR';"],
    ],
  };
  var grammar = {
    bnf: {
      A: ['A x', ['A y', "return 'recovery'"], ''],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);
  // should throw
  expect(() => parser.parse('xxgy')).toThrow();
});

it('test error after error recovery', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['g', "return 'g';"],
      ['.', "return 'ERR';"],
    ],
  };
  var grammar = {
    bnf: {
      S: ['g A y', ['g error y', 'return "nested"']],
      A: ['A x', 'x'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);
  // should return bar
  expect(() => parser.parse('gxxx;')).toThrow();
});

it('test throws error despite recovery rule', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
      [';', "return ';';"],
      ['.', "return 'INVALID'"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['Exp EOF', 'return $1']],
      Exp: [
        ['E ;', '$$ = $1;'],
        ['E error', '$$ = $1;'],
      ],
      E: [
        ['E PLUS T', "$$ = ['+',$1,$3]"],
        ['T', '$$ = $1'],
      ],
      T: [['ZERO', '$$ = [0]']],
    },
  };

  var parser = new Jison.Parser(grammar, { debug: true });
  parser.lexer = new Lexer(lexData2);

  var expectedAST = ['+', ['+', [0], [0]], [0]];

  // expectedAST
  expect(() => parser.parse('0+0+0>')).toThrow();
});

it('test correct AST after error recovery abrupt end', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
      [';', "return ';';"],
      ['$', "return 'EOF';"],
      ['.', "return 'INVALID';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['Exp EOF', 'return $1']],
      Exp: [
        ['E ;', '$$ = $1;'],
        ['E error', '$$ = $1;'],
      ],
      E: [
        ['E PLUS T', "$$ = ['+',$1,$3]"],
        ['T', '$$ = $1'],
      ],
      T: [['ZERO', '$$ = [0]']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData2);

  var expectedAST = ['+', ['+', [0], [0]], [0]];

  expect(parser.parse('0+0+0')).toEqual(expectedAST);
});

it('test bison error recovery example', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
      [';', "return ';';"],
      ['$', "return 'EOF';"],
      ['.', "return 'INVALID';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['stmt stmt EOF', 'return $1']],
      stmt: [
        ['E ;', '$$ = $1;'],
        ['error ;', '$$ = $1;'],
      ],
      E: [
        ['E PLUS T', "$$ = ['+',$1,$3]"],
        ['T', '$$ = $1'],
      ],
      T: [['ZERO', '$$ = [0]']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData2);

  // should recover
  expect(parser.parse('0+0++++>;0;')).toBeTruthy();
});
