import { expect, it } from 'bun:test';
import { Jison } from '../setup';

it('test right-recursive nullable grammar', function () {
  const grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ''],
    },
  };

  const gen = new Jison.Generator(grammar, { type: 'slr' });
  const gen2 = new Jison.Generator(grammar, { type: 'lalr' });

  // Table has 4 states
  expect(gen.table.length).toBe(4);
  // A is nullable
  expect(gen.nullable('A')).toBe(true);
  // Should have no conflict
  expect(gen.conflicts).toBe(0);
  // Should have identical tables
  expect(gen.table).toEqual(gen2.table);
});

it('test slr lalr lr tables are equal', function () {
  const grammar = {
    tokens: ['ZERO', 'PLUS'],
    startSymbol: 'E',
    bnf: {
      E: ['E PLUS T', 'T'],
      T: ['ZERO'],
    },
  };

  const gen = new Jison.Generator(grammar, { type: 'slr' });
  const gen2 = new Jison.Generator(grammar, { type: 'lalr' });
  const gen3 = new Jison.Generator(grammar, { type: 'lr' });

  // slr lalr should have identical tables
  expect(gen.table).toEqual(gen2.table);
  // lalr lr should have identical tables
  expect(gen2.table).toEqual(gen3.table);
});

it('test LL parse table', function () {
  const grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['x A', ''],
    },
  };

  const gen = new Jison.Generator(grammar, { type: 'll' });

  // ll table has 2 states
  expect(gen.table).toEqual({
    $accept: { x: [0], $end: [0] },
    A: { x: [1], $end: [2] },
  });
});

it('test LL parse table with conflict', function () {
  const grammar = {
    tokens: ['x'],
    startSymbol: 'L',
    bnf: {
      L: ['T L T', ''],
      T: ['x'],
    },
  };

  const gen = new Jison.Generator(grammar, { type: 'll' });

  // should have 1 conflict
  expect(gen.conflicts).toBe(1);
});

it('test Ambigous grammar', function () {
  const grammar = {
    tokens: ['x', 'y'],
    startSymbol: 'A',
    bnf: {
      A: ['A B A', 'x'],
      B: ['', 'y'],
    },
  };

  const gen = new Jison.Generator(grammar, { type: 'lr' });

  // should have 2 conflict
  expect(gen.conflicts).toBe(2);
});

// for Minimal LR testing. Not there yet.
/*
it('test Spector grammar G1', function () {
    const grammar = {
        "tokens": "z d b c a",
        "startSymbol": "S",
        "bnf": {
            "S" :[ "a A c",
                   "a B d",
                   "b A d",
                   "b B c"],
            "A" :[ "z" ],
            "B" :[ "z" ]
        }
    };

    const gen = new Jison.Generator(grammar, {type: "mlr", debug:true});

    // should have no conflict
    expect(gen.conflicts).toBe(0);
});

it('test De Remer G4', function () {
    const grammar = {
        "tokens": "z d b c a",
        "startSymbol": "S",
        "bnf": {
            "S" : "a A d | b A c | b B d",
            "A" : "e A | e",
            "B" : "e B | e" 
        }
    };

    const gen = new Jison.Generator(grammar, {type: "mlr", debug:true});

    // should have no conflict
    expect(gen.conflicts).toBe(0);
});
*/
