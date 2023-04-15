/*
 * Introduces a typal object to make classical/prototypal patterns easier
 * Plus some AOP sugar
 *
 * By Zachary Carter <zach@carter.name>
 * MIT Licensed
 * */

const positionRegEx = /^(before|after)/;

export const typal = (function () {
  // basic method layering
  // always returns original method's return value
  function layerMethod(k: string, fun: Function /* ? */) {
    const pos = k.match(positionRegEx)?.[0];
    const key = k.replace(positionRegEx, '');
    const prop = this[key];

    if (pos === 'after') {
      this[key] = function () {
        var ret = prop.apply(this, arguments);
        var args = [].slice.call(arguments);
        args.splice(0, 0, ret);
        fun.apply(this, args);
        return ret;
      };
    } else if (pos === 'before') {
      this[key] = function () {
        fun.apply(this, arguments);
        var ret = prop.apply(this, arguments);
        return ret;
      };
    }
  }

  // mixes each argument's own properties into calling object,
  // overwriting them or layering them. i.e. an object method 'meth' is
  // layered by mixin methods 'beforemeth' or 'aftermeth'
  function typal_mix(...args: any[]) {
    for (var i = 0, o, k; i < args.length; i++) {
      o = args[i];
      if (!o) continue;
      if (Object.prototype.hasOwnProperty.call(o, 'constructor')) this.constructor = o.constructor;
      if (Object.prototype.hasOwnProperty.call(o, 'toString')) this.toString = o.toString;
      for (k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k)) {
          if (k.match(positionRegEx) && typeof this[k.replace(positionRegEx, '')] === 'function')
            layerMethod.call(this, k, o[k]);
          else this[k] = o[k];
        }
      }
    }
    return this;
  }

  return {
    // extend object with own typalperties of each argument
    mix: typal_mix,

    // sugar for object begetting and mixing
    // - Object.create(typal).mix(etc, etc);
    // + typal.beget(etc, etc);
    beget: function typal_beget(...args: any[]) {
      return args.length ? typal_mix.apply(Object.create(this), args) : Object.create(this);
    },

    // Creates a new Class function based on an object with a constructor method
    construct: function typal_construct(...args: any[]) {
      const o = typal_mix.apply(Object.create(this), args);
      const constructor = o.constructor;
      const Klass: { (): void; [k: string]: any } = (o.constructor = function () {
        return constructor.apply(this, arguments);
      });
      Klass.prototype = o;
      Klass.mix = typal_mix; // allow for easy singleton property extension
      return Klass;
    },

    // no op
    constructor: function typal_constructor() {
      return this;
    },
  };
})();
