/**
 * Advanced, recursive type that makes all fields within a
 * type readonly (apart from internal objects/types inside of structures
 * such as Array and Maps)
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends Record<PropertyKey, unknown>
    ? DeepReadonly<T[K]>
    : T[K];
};
