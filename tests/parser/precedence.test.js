import { Jison, RegExpLexer } from '../setup';

var lexData = {
  rules: [
    ['x', "return 'x';"],
    ['\\+', "return '+';"],
    ['$', "return 'EOF';"],
  ],
};

it('test Left associative rule', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['\\+', "return '+';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: ['x', '+', 'EOF'],
    startSymbol: 'S',
    operators: [['left', '+']],
    bnf: {
      S: [['E EOF', 'return $1;']],
      E: [
        ['E + E', "$$ = ['+', $1, $3];"],
        ['x', "$$ = ['x'];"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  var expectedAST = ['+', ['+', ['x'], ['x']], ['x']];

  var r = parser.parse('x+x+x');
  expect(r).toEqual(expectedAST);
});

it('test Right associative rule', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['\\+', "return '+';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: ['x', '+', 'EOF'],
    startSymbol: 'S',
    operators: [['right', '+']],
    bnf: {
      S: [['E EOF', 'return $1;']],
      E: [
        ['E + E', "$$ = ['+', $1, $3];"],
        ['x', "$$ = ['x'];"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  var expectedAST = ['+', ['x'], ['+', ['x'], ['x']]];

  var r = parser.parse('x+x+x');
  expect(r).toEqual(expectedAST);
});

it('test Multiple precedence operators', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['\\+', "return '+';"],
      ['\\*', "return '*';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: ['x', '+', '*', 'EOF'],
    startSymbol: 'S',
    operators: [
      ['left', '+'],
      ['left', '*'],
    ],
    bnf: {
      S: [['E EOF', 'return $1;']],
      E: [
        ['E + E', "$$ = ['+', $1, $3];"],
        ['E * E', "$$ = ['*', $1, $3];"],
        ['x', "$$ = ['x'];"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  var expectedAST = ['+', ['*', ['x'], ['x']], ['x']];

  var r = parser.parse('x*x+x');
  expect(r).toEqual(expectedAST);
});

it('test Multiple precedence operators', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['\\+', "return '+';"],
      ['\\*', "return '*';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: ['x', '+', '*', 'EOF'],
    startSymbol: 'S',
    operators: [
      ['left', '+'],
      ['left', '*'],
    ],
    bnf: {
      S: [['E EOF', 'return $1;']],
      E: [
        ['E + E', "$$ = [$1,'+', $3];"],
        ['E * E', "$$ = [$1, '*', $3];"],
        ['x', "$$ = ['x'];"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  var expectedAST = [['x'], '+', [['x'], '*', ['x']]];

  var r = parser.parse('x+x*x');
  expect(r).toEqual(expectedAST);
});

it('test Non-associative operator', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['=', "return '=';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: ['x', '=', 'EOF'],
    startSymbol: 'S',
    operators: [['nonassoc', '=']],
    bnf: {
      S: ['E EOF'],
      E: ['E = E', 'x'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lalr' });
  parser.lexer = new RegExpLexer(lexData);

  // throws parse error when operator used twice
  expect(() => parser.parse('x=x=x')).toThrow();
  // normal use is okay.
  expect(parser.parse('x=x')).toBeTruthy();
});

it('test Context-dependent precedence', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['-', "return '-';"],
      ['\\+', "return '+';"],
      ['\\*', "return '*';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: ['x', '-', '+', '*', 'EOF'],
    startSymbol: 'S',
    operators: [
      ['left', '-', '+'],
      ['left', '*'],
      ['left', 'UMINUS'],
    ],
    bnf: {
      S: [['E EOF', 'return $1;']],
      E: [
        ['E - E', "$$ = [$1,'-', $3];"],
        ['E + E', "$$ = [$1,'+', $3];"],
        ['E * E', "$$ = [$1,'*', $3];"],
        ['- E', "$$ = ['#', $2];", { prec: 'UMINUS' }],
        ['x', "$$ = ['x'];"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'slr' });
  parser.lexer = new RegExpLexer(lexData);

  var expectedAST = [[[['#', ['x']], '*', ['#', ['x']]], '*', ['x']], '-', ['x']];

  var r = parser.parse('-x*-x*x-x');
  expect(r).toEqual(expectedAST);
});

it('test multi-operator rules', () => {
  var lexData = {
    rules: [
      ['x', "return 'ID';"],
      ['\\.', "return 'DOT';"],
      ['=', "return 'ASSIGN';"],
      ['\\(', "return 'LPAREN';"],
      ['\\)', "return 'RPAREN';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    tokens: 'ID DOT ASSIGN LPAREN RPAREN EOF',
    startSymbol: 'S',
    operators: [
      ['right', 'ASSIGN'],
      ['left', 'DOT'],
    ],
    bnf: {
      S: [['e EOF', 'return $1;']],
      id: [['ID', "$$ = ['ID'];"]],
      e: [
        ['e DOT id', "$$ = [$1,'-', $3];"],
        ['e DOT id ASSIGN e', "$$ = [$1,'=', $3];"],
        ['e DOT id LPAREN e RPAREN', "$$ = [$1,'+', $3];"],
        ['id ASSIGN e', "$$ = [$1,'+', $3];"],
        ['id LPAREN e RPAREN', "$$ = [$1,'+', $3];"],
        ['id', '$$ = $1;'],
      ],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'slr' });

  expect(gen.conflicts).toBe(0);
});
