/**
 * Introduces a typal object to make classical/prototypal patterns easier
 * Plus some AOP sugar
 *
 * By Zachary Carter <zach@carter.name>
 * MIT Licensed
 */

const positionRegEx = /^(before|after)(.+)/;

// Basic method layering. Always returns original method's return value.
function layerMethod(k: string, fun: Function /* ? */) {
  const match = k.match(positionRegEx);
  if (!match) {
    return;
  }
  const [, pos, key] = match;
  const prop = this[key];

  if (pos === 'after') {
    this[key] = function (...funcArgs: any[]) {
      const ret = prop.apply(this, funcArgs);
      const args = [].slice.call(funcArgs);
      args.splice(0, 0); //, ret);
      fun.apply(this, args);
      return ret;
    };
  } else if (pos === 'before') {
    this[key] = function (...funcArgs: any[]) {
      fun.apply(this, funcArgs);
      return prop.apply(this, funcArgs);
    };
  }
}

// Mixes each argument's own properties into calling object,
// overwriting them or layering them. I.e., an object method 'meth' is
// layered by mixin methods 'beforemeth' and/or 'aftermeth'.
function typal_mix(...args: any[]) {
  for (let i = 0; i < args.length; i++) {
    const o = args[i];
    if (!o) {
      continue;
    }
    if (Object.hasOwn(o, 'constructor')) {
      this.constructor = o.constructor;
    }
    if (Object.hasOwn(o, 'toString')) {
      this.toString = o.toString;
    }
    for (const k in o) {
      if (Object.hasOwn(o, k)) {
        const match = k.match(positionRegEx);
        if (match && typeof this[match[2]] === 'function') {
          layerMethod.call(this, k, o[k]);
        } else {
          this[k] = o[k];
        }
      }
    }
  }
  return this;
}

function Typal() {
  return {
    // Extend object with own typalperties of each argument
    mix: typal_mix,

    // Sugar for object begetting and mixing
    // - Object.create(typal).mix(etc, etc);
    // + typal.beget(etc, etc);
    beget(...args: any[]) {
      return typal_mix.apply(Object.create(this), args);
    },

    // Creates a new Class function based on an object with a constructor method
    construct(...args: any[]) {
      const o = typal_mix.apply(Object.create(this), args);
      const constructor = o.constructor;
      const Klass: { (): void; [k: string]: any } = (o.constructor = function () {
        return constructor.apply(this, arguments);
      });
      Klass.prototype = o;
      // Allow for easy singleton property extension
      Klass.mix = typal_mix;
      return Klass;
    },

    // no-op
    constructor() {
      return this;
    },
  };
}

export const typal = Typal();
