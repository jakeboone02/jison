var Jison = require('../setup').Jison,
  Lexer = require('../setup').Lexer;

var lexData = {
  rules: [
    ['x', "return 'x';"],
    ['y', "return 'y';"],
  ],
};

it('test tokens as a string', () => {
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData);
  // parse xyx
  expect(parser.parse('xyx')).toBeTruthy();
});

it('test generator', () => {
  var grammar = {
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData);
  // parse xyx
  expect(parser.parse('xyx')).toBeTruthy();
});

it('test extra spaces in productions', () => {
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x ', 'A y', ''],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData);
  // parse xyx
  expect(parser.parse('xyx')).toBeTruthy();
});

it('test | seperated rules', () => {
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: 'A x | A y | ',
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData);
  // parse xyx
  expect(parser.parse('xyx')).toBeTruthy();
});

it('test start symbol optional', () => {
  var grammar = {
    tokens: 'x y',
    bnf: {
      A: 'A x | A y | ',
    },
  };

  var parser = new Jison.Parser(grammar);
  var ok = true;
  // no error
  expect(ok).toBeTruthy();
});

it('test start symbol should be nonterminal', () => {
  var grammar = {
    tokens: 'x y',
    startSymbol: 'x',
    bnf: {
      A: 'A x | A y | ',
    },
  };

  // throws error
  expect(() => new Jison.Generator(grammar)).toThrow();
});

it('test token list as string', () => {
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: 'A x | A y | ',
    },
  };

  var gen = new Jison.Generator(grammar);
  expect(gen.terminals.indexOf('x') >= 0).toBeTruthy();
});

it('test grammar options', () => {
  var grammar = {
    options: { type: 'slr' },
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var gen = new Jison.Generator(grammar);
  expect(gen).toBeTruthy();
});

it('test overwrite grammar options', () => {
  var grammar = {
    options: { type: 'slr' },
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'lr0' });
  expect(gen.constructor).toBe(Jison.LR0Generator);
});

it('test yy shared scope', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return yy.xed ? 'yfoo' : 'ybar';"],
    ],
  };
  var grammar = {
    tokens: 'x yfoo ybar',
    startSymbol: 'A',
    bnf: {
      A: [
        ['A x', 'yy.xed = true;'],
        ['A yfoo', " return 'foo';"],
        ['A ybar', " return 'bar';"],
        '',
      ],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr0' });
  parser.lexer = new Lexer(lexData);
  // should return bar
  expect(parser.parse('y')).toBe('bar');
  // should return foo
  expect(parser.parse('xxy')).toBe('foo');
});

it('test optional token declaration', () => {
  var grammar = {
    options: { type: 'slr' },
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'lr0' });
  expect(gen.constructor).toBe(Jison.LR0Generator);
});

it('test custom parse error method', () => {
  var lexData = {
    rules: [
      ['a', "return 'a';"],
      ['b', "return 'b';"],
      ['c', "return 'c';"],
      ['d', "return 'd';"],
      ['g', "return 'g';"],
    ],
  };
  var grammar = {
    tokens: 'a b c d g',
    startSymbol: 'S',
    bnf: {
      S: ['a g d', 'a A c', 'b A d', 'b g c'],
      A: ['B'],
      B: ['g'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lalr' });
  parser.lexer = new Lexer(lexData);
  var result = {};
  parser.yy.parseError = function (str, hash) {
    result = hash;
    throw str;
  };

  expect(() => parser.parse('aga')).toThrow();
  // parse error text should equal b
  expect(result.text).toBe('a');
  // parse error token should be a string
  expect(typeof result.token).toBe('string');
  // hash should include line number
  expect(result.line).toBe(0);
});

it('test jison grammar as string', () => {
  var grammar = '%% A : A x | A y | ;';

  var parser = new Jison.Generator(grammar).createParser();
  parser.lexer = new Lexer(lexData);
  // parse xyx
  expect(parser.parse('xyx')).toBeTruthy();
});

it('test no default resolve', () => {
  var grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ''],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'lr0', noDefaultResolve: true });
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);

  // table has 4 states
  expect(gen.table.length == 4).toBeTruthy();
  // encountered 2 conflicts
  expect(gen.conflicts == 2).toBeTruthy();
  // throws parse error for multiple actions
  expect(() => parser.parse('xx')).toThrow();
});

it('test EOF in "Unexpected token" error message', () => {
  var grammar = {
    bnf: {
      A: ['x x y'],
    },
  };

  var parser = new Jison.Parser(grammar);
  parser.lexer = new Lexer(lexData);
  parser.lexer.showPosition = null; // needed for "Unexpected" message
  parser.yy.parseError = function (str, hash) {
    expect(str.match('end of input')).toBeTruthy();
  };

  expect(() => parser.parse('xx')).toThrow();
});

it('test locations', () => {
  var grammar = {
    tokens: ['x', 'y'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ['y', 'return @1'], ''],
    },
  };

  var lexData = {
    rules: [
      ['\\s', '/*ignore*/'],
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var gen = new Jison.Generator(grammar);
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);
  var loc = parser.parse('xx\nxy');

  // first line correct
  expect(loc.first_line).toBe(2);
  // last line correct
  expect(loc.last_line).toBe(2);
  // first column correct
  expect(loc.first_column).toBe(1);
  // last column correct
  expect(loc.last_column).toBe(2);
});

it('test default location action', () => {
  var grammar = {
    tokens: ['x', 'y'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ['y', 'return @$'], ''],
    },
  };

  var lexData = {
    rules: [
      ['\\s', '/*ignore*/'],
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var gen = new Jison.Generator(grammar);
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);
  var loc = parser.parse('xx\nxy');

  // first line correct
  expect(loc.first_line).toBe(2);
  // last line correct
  expect(loc.last_line).toBe(2);
  // first column correct
  expect(loc.first_column).toBe(1);
  // last column correct
  expect(loc.last_column).toBe(2);
});

it('test locations by term name in action', () => {
  var grammar = {
    tokens: ['x', 'y'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ['B', 'return @B'], ''],
      B: ['y'],
    },
  };

  var lexData = {
    rules: [
      ['\\s', '/*ignore*/'],
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var gen = new Jison.Generator(grammar);
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);
  var loc = parser.parse('xx\nxy');

  // first line correct
  expect(loc.first_line).toBe(2);
  // last line correct
  expect(loc.last_line).toBe(2);
  // first column correct
  expect(loc.first_column).toBe(1);
  // last column correct
  expect(loc.last_column).toBe(2);
});

it('test lexer with no location support', () => {
  var grammar = {
    tokens: ['x', 'y'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ['B', 'return @B'], ''],
      B: ['y'],
    },
  };

  var gen = new Jison.Generator(grammar);
  var parser = gen.createParser();
  parser.lexer = {
    toks: ['x', 'x', 'x', 'y'],
    lex: function () {
      return this.toks.shift();
    },
    setInput: function () {},
  };
  var loc = parser.parse('xx\nxy');
});

it('test intance creation', () => {
  var grammar = {
    tokens: ['x', 'y'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ['B', 'return @B'], ''],
      B: ['y'],
    },
  };

  var gen = new Jison.Generator(grammar);
  var parser = gen.createParser();
  parser.lexer = {
    toks: ['x', 'x', 'x', 'y'],
    lex: function () {
      return this.toks.shift();
    },
    setInput: function () {},
  };
  var parser2 = new parser.Parser();
  parser2.lexer = parser.lexer;
  parser2.parse('xx\nxy');

  parser.blah = true;

  // should not inherit
  expect(parser.blah).not.toEqual(parser2.blah);
});

it('test reentrant parsing', () => {
  var grammar = {
    bnf: {
      S: ['A EOF'],
      A: ['x A', 'B', 'C'],
      B: [['y', 'return "foo";']],
      C: [['w', 'return yy.parser.parse("xxxy") + "bar";']],
    },
  };

  var lexData = {
    rules: [
      ['\\s', '/*ignore*/'],
      ['w', "return 'w';"],
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['$', "return 'EOF';"],
    ],
  };
  var gen = new Jison.Generator(grammar);
  var parser = gen.createParser();
  parser.lexer = new Lexer(lexData);
  var result = parser.parse('xxw');
  expect(result).toBe('foobar');
});
