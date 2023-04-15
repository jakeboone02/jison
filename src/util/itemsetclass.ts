// ItemSet class to wrap arrays

import { typal } from './typal.js';

type ArrayOrObject = any[] | Record<string, any>;

// TODO: update these from any to real types
interface ISetMixin {
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

class SetMixin implements ISetMixin {
  _items: any[] = [];

  constructor(set: ArrayOrObject, raw: boolean) {
    if (set && set.constructor === Array) {
      this._items = raw ? set : set.slice(0);
    } else if (arguments.length) {
      this._items = [].slice.call(arguments, 0);
    }
  }

  concat(setB: SetMixin) {
    this._items.push.apply(this._items, setB._items || setB);
    return this;
  }

  eq(set: SetMixin): boolean {
    return this._items.length === set._items.length && this.subset(set);
  }

  indexOf(item: any): number {
    if (item && item.eq) {
      for (let k = 0; k < this._items.length; k++) {
        if (item.eq(this._items[k])) {
          return k;
        }
      }
      return -1;
    }
    return this._items.indexOf(item);
  }

  union(set: SetMixin) {
    return new ItemSet(this._items).concat(this.complement(set));
  }

  intersection(set: SetMixin) {
    return this.filter(function (elm) {
      return set.contains(elm);
    });
  }

  complement(set: SetMixin) {
    var that = this;
    return set.filter(elm => !that.contains(elm));
  }

  subset(set: SetMixin) {
    var cont = true;
    for (var i = 0; i < this._items.length && cont; i++) {
      cont = cont && set.contains(this._items[i]);
    }
    return cont;
  }

  superset(set: SetMixin) {
    return set.subset(this);
  }

  joinSet(set: SetMixin) {
    return this.concat(this.complement(set));
  }

  contains(item: any) {
    return this.indexOf(item) !== -1;
  }

  item(v: number) {
    return this._items[v];
  }

  i(v: number) {
    return this._items[v];
  }

  first() {
    return this._items[0];
  }

  last() {
    return this._items[this._items.length - 1];
  }

  size() {
    return this._items.length;
  }

  isEmpty() {
    return this._items.length === 0;
  }

  copy() {
    return new ItemSet(this._items);
  }

  toString() {
    return this._items.toString();
  }

  push(...items: any[]) {
    return Array.prototype.push.apply(this._items, items);
  }

  shift() {
    return Array.prototype.shift.apply(this._items);
  }

  unshift(...items: any[]) {
    return Array.prototype.unshift.apply(this._items, items);
  }

  forEach(predicate: (value: any, index: number, array: any[]) => void, thisArg?: any) {
    return Array.prototype.forEach.apply(this._items, [predicate, thisArg]);
  }

  some(predicate: (value: any, index: number, array: any[]) => unknown, thisArg?: any) {
    return Array.prototype.some.apply(this._items, [predicate, thisArg]);
  }

  every(predicate: (value: any, index: number, array: any[]) => unknown, thisArg?: any) {
    return Array.prototype.every.apply(this._items, [predicate, thisArg]);
  }

  join(separator?: string) {
    return Array.prototype.join.apply(this._items, [separator]);
  }

  sort(compareFn?: (a: any, b: any) => number) {
    return Array.prototype.sort.apply(this._items, [compareFn]);
  }

  filter(predicate: (value: any, index: number, array: any[]) => unknown, thisArg?: any) {
    return new ItemSet(Array.prototype.filter.apply(this._items, [predicate, thisArg]), true);
  }

  slice(start?: number, end?: number) {
    return new ItemSet(Array.prototype.slice.apply(this._items, [start, end]), true);
  }

  map(predicate: (value: any, index: number, array: any[]) => unknown, thisArg?: any) {
    return new ItemSet(Array.prototype.map.apply(this._items, [predicate, thisArg]), true);
  }
}

export const ItemSet = typal.construct(SetMixin).mix({
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
