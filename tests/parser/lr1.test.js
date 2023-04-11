var Jison = require('../setup').Jison,
  Lexer = require('../setup').Lexer;

it('test xx nullable grammar', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
    ],
  };
  var grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['A x', ''],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr' });
  parser.lexer = new Lexer(lexData);

  // parse
  expect(parser.parse('xxx')).toBeTruthy();
  // parse single x
  expect(parser.parse('x')).toBeTruthy();
  // throws parse error on invalid
  expect(() => parser.parse('+')).toThrow();
});

it('test LR parse', () => {
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
  var parser = new Jison.Parser(grammar, { type: 'lr' });
  parser.lexer = new Lexer(lexData2);

  // parse
  expect(parser.parse('0+0+0')).toBeTruthy();
});

it('test basic JSON grammar', () => {
  var grammar = {
    lex: {
      macros: {
        digit: '[0-9]',
      },
      rules: [
        ['\\s+', '/* skip whitespace */'],
        ['{digit}+(\\.{digit}+)?', "return 'NUMBER';"],
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
    bnf: {
      JsonThing: ['JsonObject', 'JsonArray'],

      JsonObject: ['{ JsonPropertyList }'],

      JsonPropertyList: ['JsonProperty', 'JsonPropertyList , JsonProperty'],

      JsonProperty: ['StringLiteral : JsonValue'],

      JsonArray: ['[ JsonValueList ]'],

      JsonValueList: ['JsonValue', 'JsonValueList , JsonValue'],

      JsonValue: [
        'StringLiteral',
        'NumericalLiteral',
        'JsonObject',
        'JsonArray',
        'TRUE',
        'FALSE',
        'NULL',
      ],

      StringLiteral: ['STRING'],

      NumericalLiteral: ['NUMBER'],
    },
  };

  var source =
    '{"foo": "Bar", "hi": 42, "array": [1,2,3.004,4], "false": false, "true":true, "null": null, "obj": {"ha":"ho"}, "string": "string\\"sgfg" }';

  var parser = new Jison.Parser(grammar, { type: 'lr' });
  expect(parser.parse(source)).toBeTruthy();
});

it('test compilers test grammar', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    tokens: ['x'],
    startSymbol: 'S',
    bnf: {
      S: ['A'],
      A: ['B A', ''],
      B: ['', 'x'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr' });
  parser.lexer = new Lexer(lexData);

  // parse
  expect(parser.parse('xxx')).toBeTruthy();
});

it('test compilers test grammar 2', () => {
  var grammar = '%% n : a b ; a : | a x ; b : | b x y ;';

  var parser = new Jison.Generator(grammar, { type: 'lr' });

  // only one conflict
  expect(parser.conflicts).toBe(1);
});

it('test nullables', () => {
  var lexData = {
    rules: [
      ['x', "return 'x';"],
      ['y', "return 'y';"],
      ['z', "return 'z';"],
      [';', "return ';';"],
    ],
  };
  var grammar = {
    tokens: [';', 'x', 'y', 'z'],
    startSymbol: 'S',
    bnf: {
      S: ['A ;'],
      A: ['B C'],
      B: ['x'],
      C: ['y', 'D'],
      D: ['F'],
      F: ['', 'F z'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lr' });
  parser.lexer = new Lexer(lexData);

  // parse
  expect(parser.parse('x;')).toBeTruthy();
});
