import { expect, it } from 'bun:test';
import { unlink } from 'node:fs/promises';
import { Jison, Lexer } from '../setup';

const writeToFile = async (contents: string) => {
  const tempModulePath = `${import.meta.dir}/../../tmp-${crypto.randomUUID()}.js`;
  await Bun.write(tempModulePath, contents);
  return tempModulePath;
};

// We'll probably remove the AMD functionality
it.skip('test amd module generator', () => {
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
  var parser = null;
  var define = function (callback) {
    // temporary AMD-style define function, for testing.
    parser = callback();
  };
  eval(parserSource);

  expect(parser?.parse(input)).toBeTruthy();
});

it.skip('test commonjs module generator', async () => {
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

  const tempModulePath = await writeToFile(parserSource);
  try {
    const { parse } = await import(tempModulePath);
    expect(parse(input)).toBeTruthy();
  } finally {
    await unlink(tempModulePath);
  }
});

it('test es module generator', async () => {
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

  var parserSource = gen.generateESModule();

  const tempModulePath = await writeToFile(parserSource);
  try {
    const { parse } = await import(tempModulePath);
    expect(parse(input)).toBeTruthy();
  } finally {
    await unlink(tempModulePath);
  }
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

  expect(parser.parse(input)).toBeTruthy();
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
    // type + ' supports module include'
    expect(/TEST_VAR/.test(source)).toBeTruthy();
  });
});

// test for issue #246
it('test compiling a parser/lexer', async () => {
  const grammar = `// Simple "happy happy joy joy" parser, written by Nolan Lawson
// Based on the song of the same name.

%lex
%%

\\s+                   /* skip whitespace */
("happy")             return 'happy'
("joy")               return 'joy'
<<EOF>>               return 'EOF'

/lex

%start expressions

%ebnf

%%

expressions
    : e EOF
        {return $1;}
    ;

e
    : phrase+ 'joy'? -> $1 + ' ' + yytext
    ;

phrase
    : 'happy' 'happy' 'joy' 'joy' -> [$1, $2, $3, $4].join(' ');
    ;
`;

  const parser = new Jison.Parser(grammar);
  const generated = parser.generate();

  const tempModulePath = await writeToFile(generated);

  try {
    const parser2 = await import(tempModulePath);
    // original parser works
    expect(parser.parse('happy happy joy joy joy')).toBe('happy happy joy joy joy');
    // generated parser works
    expect(parser2.parse('happy happy joy joy joy')).toBe('happy happy joy joy joy');
  } finally {
    await unlink(tempModulePath);
  }
});
