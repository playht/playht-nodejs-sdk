import { deepMergeMaintainingDefaults } from './deepMergeMaintainingDefaults';

describe('deepMergeMaintainingDefaults', () => {
  it('merges multiple objects, keeping defaults from the first', () => {
    const myFn = () => {};
    const ab = new AbortController();
    const obj1 = {
      a: 1, // not included in second param, first param should be kept
      b: 2, // undefined in second param, first param should be kept
      c: 3, // null in second param, first param should be kept
      d: 4, // included in second param, second param should be kept
      e: undefined, // undefined in both, result should be undefined
      f: undefined, // undefined in first gets overwritten by null in second
      g: null, // undefined in second does not overwrite null in first
      fn: myFn, // function declaration object should be preserved as-is
    };
    const obj2 = {
      b: undefined,
      c: null,
      d: 44,
      e: undefined,
      f: null,
      g: undefined,
      nonPlain: ab, // other non-plain objects should be preserved
    };
    const obj3 = {
      thirdParam: 123,
    };

    const merged = deepMergeMaintainingDefaults(obj1, obj2 as any, obj3 as any);

    expect(merged).toEqual({
      a: 1,
      b: 2,
      c: 3,
      d: 44,
      e: undefined,
      f: null,
      g: null,
      fn: myFn,
      nonPlain: ab,
      thirdParam: 123,
    });
    expect(merged.fn).toBe(myFn);
    expect((merged as any).nonPlain).toBe(ab);
  });
});
