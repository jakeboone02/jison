import { Jison, RegExpLexer } from '../setup';

it('test Semantic action basic return', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      E: [['E x', 'return 0'], ['E y', 'return 1'], ''],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // semantic action
  expect(parser.parse('x')).toBe(0);
  // semantic action
  expect(parser.parse('y')).toBe(1);
});

it('test return null', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      E: [['E x', 'return null;'], ''],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // semantic action
  expect(parser.parse('x')).toBeNull();
});

it('test terminal semantic values are not null', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      E: [['E x', "return [$2 === 'x']"], ['E y', 'return [$2]'], ''],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // semantic action
  expect(parser.parse('x')).toEqual([true]);
  // semantic action
  expect(parser.parse('y')).toEqual(['y']);
});

it('test Semantic action stack lookup', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      pgm: [['E', 'return $1']],
      E: [
        ['B E', 'return $1+$2'],
        ['x', "$$ = 'EX'"],
      ],
      B: [['y', "$$ = 'BY'"]],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first token
  expect(parser.parse('x')).toBe('EX');
  // return first after reduction
  expect(parser.parse('yx')).toBe('BYEX');
});

it('test Semantic actions on nullable grammar', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      S: [['A', 'return $1']],
      A: [
        ['x A', "$$ = $2+'x'"],
        ['', "$$ = '->'"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first after reduction
  expect(parser.parse('xx')).toBe('->xx');
});

it('test named semantic value', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      S: [['A', 'return $A']],
      A: [
        ['x A', "$$ = $A+'x'"],
        ['', "$$ = '->'"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first after reduction
  expect(parser.parse('xx')).toBe('->xx');
});

it('test ambiguous named semantic value', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    operators: [['left', 'y']],
    bnf: {
      S: [['A', 'return $A']],
      A: [
        ['A y A', "$$ = $A2+'y'+$A1"],
        ['x', "$$ = 'x'"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first after reduction
  expect(parser.parse('xyx')).toBe('xyx');
});

it("test vars that look like named semantic values shouldn't be replaced", () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      S: [['A', 'return $A']],
      A: [
        ['x A', "var $blah = 'x', blah = 8; $$ = $A + $blah"],
        ['', "$$ = '->'"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first after reduction
  expect(parser.parse('xx')).toBe('->xx');
});

it('test previous semantic value lookup ($0)', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['A B', 'return $A + $B']],
      A: [
        ['A x', "$$ = $A+'x'"],
        ['x', '$$ = $1'],
      ],
      B: [['y', '$$ = $0']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first after reduction
  expect(parser.parse('xxy')).toBe('xxxx');
});

it('test negative semantic value lookup ($-1)', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['z', "return 'z';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['G A B', 'return $G + $A + $B']],
      G: [['z', '$$ = $1']],
      A: [
        ['A x', "$$ = $A+'x'"],
        ['x', '$$ = $1'],
      ],
      B: [['y', '$$ = $-1']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first after reduction
  expect(parser.parse('zxy')).toBe('zxz');
});

it('test Build AST', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      S: [['A', 'return $1;']],
      A: [
        ['x A', "$2.push(['ID',{value:'x'}]); $$ = $2;"],
        ['', "$$ = ['A',{}];"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  var expectedAST = [
    'A',
    {},
    ['ID', { value: 'x' }],
    ['ID', { value: 'x' }],
    ['ID', { value: 'x' }],
  ];

  var r = parser.parse('xxx');
  expect(r).toEqual(expectedAST);
});

it('test 0+0 grammar', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['E EOF', 'return $1']],
      E: [
        ['E PLUS T', "$$ = ['+',$1,$3]"],
        ['T', '$$ = $1'],
      ],
      T: [['ZERO', '$$ = [0]']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData2);

  var expectedAST = ['+', ['+', [0], [0]], [0]];

  expect(parser.parse('0+0+0')).toEqual(expectedAST);
});

it('test implicit $$ = $1 action', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
      ['$', "return 'EOF';"],
    ],
  };
  var grammar = {
    bnf: {
      S: [['E EOF', 'return $1']],
      E: [['E PLUS T', "$$ = ['+',$1,$3]"], 'T'],
      T: [['ZERO', '$$ = [0]']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData2);

  var expectedAST = ['+', ['+', [0], [0]], [0]];

  expect(parser.parse('0+0+0')).toEqual(expectedAST);
});

it('test yytext', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      pgm: [['Xexpr', 'return $1;']],
      Xexpr: [['x', '$$ = yytext;']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first token
  expect(parser.parse('x')).toBe('x');
});

it('test yyleng', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    bnf: {
      pgm: [['Xexpr', 'return $1;']],
      Xexpr: [['x', '$$ = yyleng;']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first token
  expect(parser.parse('x')).toBe(1);
});

it('test yytext more', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      pgm: [['expr expr', 'return $1+$2;']],
      expr: [
        ['x', '$$ = yytext;'],
        ['y', '$$ = yytext;'],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first token
  expect(parser.parse('xy')).toBe('xy');
});

it('test action include', () => {
  var lexData = {
    rules: [['y', "return 'y';"]],
  };
  var grammar = {
    bnf: {
      E: [['E y', 'return test();'], ''],
    },
    actionInclude: function () {
      function test(val) {
        return 1;
      }
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // semantic action
  expect(parser.parse('y')).toBe(1);
});

it('test next token not shifted if only one action', () => {
  var lexData = {
    rules: [
      ['\\(', "return '(';"],
      ['\\)', "return ')';"],
      ['y', "return yy.xed ? 'yfoo' : 'ybar';"],
    ],
  };
  var grammar = {
    bnf: {
      prog: ['e ybar'],
      esub: [['(', 'yy.xed = true;']],
      e: [['esub yfoo )', 'yy.xed = false;']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);
  // should parse correctly
  expect(parser.parse('(y)y')).toBeTruthy();
});

it('test token array LIFO', () => {
  var lexData = {
    rules: [
      ['a', "return ['b','a'];"],
      ['c', "return 'c';"],
    ],
  };
  var grammar = {
    ebnf: {
      pgm: [['expr expr expr', 'return $1+$2+$3;']],
      expr: [
        ['a', "$$ = 'a';"],
        ['b', "$$ = 'b';"],
        ['c', "$$ = 'c';"],
      ],
    },
    options: { 'token-stack': true },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);
  // should return second token
  expect(parser.parse('ac')).toBe('abc');
});

it('test YYACCEPT', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      pgm: [['E', 'return $1']],
      E: [
        ['B E', 'return $1+$2'],
        ['x', "$$ = 'EX'"],
      ],
      B: [['y', 'YYACCEPT']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first token
  expect(parser.parse('x')).toBe('EX');
  // return first after reduction
  expect(parser.parse('yx')).toBe(true);
});

it('test YYABORT', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    bnf: {
      pgm: [['E', 'return $1']],
      E: [
        ['B E', 'return $1+$2'],
        ['x', "$$ = 'EX'"],
      ],
      B: [['y', 'YYABORT']],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // return first token
  expect(parser.parse('x')).toBe('EX');
  // return first after reduction
  expect(parser.parse('yx')).toBe(false);
});

it('test parse params', () => {
  var lexData = {
    rules: [['y', "return 'y';"]],
  };
  var grammar = {
    bnf: {
      E: [['E y', 'return first + second;'], ''],
    },
    parseParams: ['first', 'second'],
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);

  // semantic action
  expect(parser.parse('y', 'foo', 'bar')).toBe('foobar');
});

it('test symbol aliases', () => {
  var lexData = {
    rules: [
      ['a', "return 'a';"],
      ['b', "return 'b';"],
      ['c', "return 'c';"],
    ],
  };
  var grammar = {
    bnf: {
      pgm: [['expr[alice] expr[bob] expr[carol]', 'return $alice+$bob+$carol;']],
      expr: [
        ['a', "$$ = 'a';"],
        ['b', "$$ = 'b';"],
        ['c', "$$ = 'c';"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);
  // should return original string
  expect(parser.parse('abc')).toBe('abc');
});

it('test symbol aliases in ebnf', () => {
  var lexData = {
    rules: [
      ['a', "return 'a';"],
      ['b', "return 'b';"],
      ['c', "return 'c';"],
    ],
  };
  var grammar = {
    ebnf: {
      pgm: [['expr[alice] (expr[bob] expr[carol])+', 'return $alice+$2;']],
      expr: [
        ['a', "$$ = 'a';"],
        ['b', "$$ = 'b';"],
        ['c', "$$ = 'c';"],
      ],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new RegExpLexer(lexData);
  // should tolerate aliases in subexpression
  expect(parser.parse('abc')).toBe('ab');
});
