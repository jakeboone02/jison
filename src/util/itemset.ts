// ItemSet class to wrap arrays

import { typal } from './typal.js';

// TODO: update these from any to real types
interface SetMixin {
  constructor: any;
  concat: any;
  eq: any;
  indexOf: any;
  union: any;
  intersection: any;
  complement: any;
  subset: any;
  superset: any;
  joinSet: any;
  contains: any;
  item: any;
  i: any;
  first: any;
  last: any;
  size: any;
  isEmpty: any;
  copy: any;
  toString: any;
  push?: any;
  shift?: any;
  unshift?: any;
  forEach?: any;
  some?: any;
  every?: any;
  join?: any;
  sort?: any;
  filter?: any;
  slice?: any;
  map?: any;
}

const setMixin: SetMixin = {
  constructor: function Set_constructor(set, raw) {
    this._items = [];
    if (set && set.constructor === Array) this._items = raw ? set : set.slice(0);
    else if (arguments.length) this._items = [].slice.call(arguments, 0);
  },
  concat: function concat(setB) {
    this._items.push.apply(this._items, setB._items || setB);
    return this;
  },
  eq: function eq(set): boolean {
    return this._items.length === set._items.length && this.subset(set);
  },
  indexOf: function indexOf(item): number {
    if (item && item.eq) {
      for (var k = 0; k < this._items.length; k++) if (item.eq(this._items[k])) return k;
      return -1;
    }
    return this._items.indexOf(item);
  },
  union: function union(set) {
    return new ItemSet(this._items).concat(this.complement(set));
  },
  intersection: function intersection(set) {
    return this.filter(function (elm) {
      return set.contains(elm);
    });
  },
  complement: function complement(set) {
    var that = this;
    return set.filter(function sub_complement(elm) {
      return !that.contains(elm);
    });
  },
  subset: function subset(set) {
    var cont = true;
    for (var i = 0; i < this._items.length && cont; i++) {
      cont = cont && set.contains(this._items[i]);
    }
    return cont;
  },
  superset: function superset(set) {
    return set.subset(this);
  },
  joinSet: function joinSet(set) {
    return this.concat(this.complement(set));
  },
  contains: function contains(item) {
    return this.indexOf(item) !== -1;
  },
  item: function item(v, val) {
    return this._items[v];
  },
  i: function i(v, val) {
    return this._items[v];
  },
  first: function first() {
    return this._items[0];
  },
  last: function last() {
    return this._items[this._items.length - 1];
  },
  size: function size() {
    return this._items.length;
  },
  isEmpty: function isEmpty() {
    return this._items.length === 0;
  },
  copy: function copy() {
    return new ItemSet(this._items);
  },
  toString: function toString() {
    return this._items.toString();
  },
};

for (const e of ['push', 'shift', 'unshift', 'forEach', 'some', 'every', 'join', 'sort'] as const) {
  setMixin[e] = function (...args: any[]) {
    return Array.prototype[e].apply(this._items, args);
  };
}
for (const e of ['filter', 'slice', 'map'] as const) {
  setMixin[e] = function (...args: any[]) {
    return new ItemSet(Array.prototype[e].apply(this._items, args), true);
  };
}

export const ItemSet = typal.construct(setMixin).mix({
  union: function (a: Record<string, any>, b: Record<string, any>) {
    const ar: Record<string, any> = {};
    for (let k = a.length - 1; k >= 0; --k) {
      ar[a[k]] = true;
    }
    for (let i = b.length - 1; i >= 0; --i) {
      if (!ar[b[i]]) {
        a.push(b[i]);
      }
    }
    return a;
  },
});
