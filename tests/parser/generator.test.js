var Jison = require('../setup').Jison,
  Lexer = require('../setup').Lexer;

var fs = require('fs');
var path = require('path');

it('test amd module generator', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var input = 'xyxxxy';
  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateAMDModule();
  var parser = null,
    define = function (callback) {
      // temporary AMD-style define function, for testing.
      parser = callback();
    };
  eval(parserSource);

  expect(parser.parse(input)).toBeTruthy();
});

it('test commonjs module generator', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var input = 'xyxxxy';
  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateCommonJSModule();
  var exports = {};
  eval(parserSource);

  expect(exports.parse(input)).toBeTruthy();
});

it('test module generator', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var input = 'xyxxxy';
  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateModule();
  eval(parserSource);

  expect(parser.parse(input)).toBeTruthy();
});

it('test module generator with module name', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var input = 'xyxxxy';
  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generate({ moduleType: 'js', moduleName: 'parsey' });
  eval(parserSource);

  expect(parsey.parse(input)).toBeTruthy();
});

it('test module generator with namespaced module name', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    tokens: 'x y',
    startSymbol: 'A',
    bnf: {
      A: ['A x', 'A y', ''],
    },
  };

  var compiler = {};

  var input = 'xyxxxy';
  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateModule({ moduleName: 'compiler.parser' });
  eval(parserSource);

  expect(compiler.parser.parse(input)).toBeTruthy();
});

it('test module include', () => {
  var grammar = {
    comment: 'ECMA-262 5th Edition, 15.12.1 The JSON Grammar. (Incomplete implementation)',
    author: 'Zach Carter',

    lex: {
      macros: {
        digit: '[0-9]',
        exp: '([eE][-+]?{digit}+)',
      },
      rules: [
        ['\\s+', '/* skip whitespace */'],
        ['-?{digit}+(\\.{digit}+)?{exp}?', "return 'NUMBER';"],
        [
          '"[^"]*',
          function () {
            if (yytext.charAt(yyleng - 1) == '\\') {
              // remove escape
              yytext = yytext.substr(0, yyleng - 2);
              this.more();
            } else {
              yytext = yytext.substr(1); // swallow start quote
              this.input(); // swallow end quote
              return 'STRING';
            }
          },
        ],
        ['\\{', "return '{'"],
        ['\\}', "return '}'"],
        ['\\[', "return '['"],
        ['\\]', "return ']'"],
        [',', "return ','"],
        [':', "return ':'"],
        ['true\\b', "return 'TRUE'"],
        ['false\\b', "return 'FALSE'"],
        ['null\\b', "return 'NULL'"],
      ],
    },

    tokens: 'STRING NUMBER { } [ ] , : TRUE FALSE NULL',
    start: 'JSONText',

    bnf: {
      JSONString: ['STRING'],

      JSONNumber: ['NUMBER'],

      JSONBooleanLiteral: ['TRUE', 'FALSE'],

      JSONText: ['JSONValue'],

      JSONValue: [
        'JSONNullLiteral',
        'JSONBooleanLiteral',
        'JSONString',
        'JSONNumber',
        'JSONObject',
        'JSONArray',
      ],

      JSONObject: ['{ }', '{ JSONMemberList }'],

      JSONMember: ['JSONString : JSONValue'],

      JSONMemberList: ['JSONMember', 'JSONMemberList , JSONMember'],

      JSONArray: ['[ ]', '[ JSONElementList ]'],

      JSONElementList: ['JSONValue', 'JSONElementList , JSONValue'],
    },
  };

  var gen = new Jison.Generator(grammar);

  var parserSource = gen.generateModule();
  eval(parserSource);

  expect(parser.parse(JSON.stringify(grammar.bnf))).toBeTruthy();
});

it('test module include code', () => {
  var lexData = {
    rules: [['y', "return 'y';"]],
  };
  var grammar = {
    bnf: {
      E: [['E y', 'return test();'], ''],
    },
    moduleInclude: 'function test(val) { return 1; }',
  };

  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateCommonJSModule();
  var exports = {};
  eval(parserSource);

  // semantic action
  expect(parser.parse('y')).toBe(1);
});

it('test lexer module include code', () => {
  var lexData = {
    rules: [['y', 'return test();']],
    moduleInclude: 'function test() { return 1; }',
  };
  var grammar = {
    bnf: {
      E: [['E y', 'return $2;'], ''],
    },
  };

  var gen = new Jison.Generator(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateCommonJSModule();
  var exports = {};
  eval(parserSource);

  // semantic action
  expect(parser.parse('y')).toBe(1);
});

it('test generated parser instance creation', () => {
  var grammar = {
    lex: {
      rules: [['y', "return 'y'"]],
    },
    bnf: {
      E: [['E y', 'return $2;'], ''],
    },
  };

  var gen = new Jison.Generator(grammar);

  var parserSource = gen.generateModule();
  eval(parserSource);

  var p = new parser.Parser();

  // semantic action
  expect(p.parse('y')).toBe('y');

  parser.blah = true;

  // shouldn't inherit props
  expect(parser.blah).not.toEqual(p.blah);
});

it('test module include code using generator from parser', () => {
  var lexData = {
    rules: [['y', "return 'y';"]],
  };
  var grammar = {
    bnf: {
      E: [['E y', 'return test();'], ''],
    },
    moduleInclude: 'function test(val) { return 1; }',
  };

  var gen = new Jison.Parser(grammar);
  gen.lexer = new Lexer(lexData);

  var parserSource = gen.generateCommonJSModule();
  var exports = {};
  eval(parserSource);

  // semantic action
  expect(parser.parse('y')).toBe(1);
});

it('test module include with each generator type', () => {
  var lexData = {
    rules: [['y', "return 'y';"]],
  };
  var grammar = {
    bnf: {
      E: [['E y', 'return test();'], ''],
    },
    moduleInclude: 'var TEST_VAR;',
  };

  var gen = new Jison.Parser(grammar);
  gen.lexer = new Lexer(lexData);
  ['generateModule', 'generateAMDModule', 'generateCommonJSModule'].map(function (type) {
    var source = gen[type]();
    expect(/TEST_VAR/.test(source), type + ' supports module include').toBeTruthy();
  });
});

// test for issue #246
it('test compiling a parser/lexer', () => {
  var grammar =
    '// Simple "happy happy joy joy" parser, written by Nolan Lawson\n' +
    '// Based on the song of the same name.\n\n' +
    '%lex\n%%\n\n\\s+                   /* skip whitespace */\n' +
    '("happy")             return \'happy\'\n' +
    '("joy")               return \'joy\'\n' +
    "<<EOF>>               return 'EOF'\n\n" +
    '/lex\n\n%start expressions\n\n' +
    '%ebnf\n\n%%\n\n' +
    'expressions\n    : e EOF\n        {return $1;}\n    ;\n\n' +
    "e\n    : phrase+ 'joy'? -> $1 + ' ' + yytext \n    ;\n\n" +
    "phrase\n    : 'happy' 'happy' 'joy' 'joy' " +
    " -> [$1, $2, $3, $4].join(' '); \n    ;";

  var parser = new Jison.Parser(grammar);
  var generated = parser.generate();

  var tmpFile = path.resolve(__dirname, 'tmp-parser.js');
  fs.writeFileSync(tmpFile, generated);
  var parser2 = require('./tmp-parser');

  // original parser works
  expect(parser.parse('happy happy joy joy joy') === 'happy happy joy joy joy').toBe(true);
  // generated parser works
  expect(parser2.parse('happy happy joy joy joy') === 'happy happy joy joy joy').toBe(true);
  fs.unlinkSync(tmpFile);
});
