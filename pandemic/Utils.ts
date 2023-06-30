export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends Record<PropertyKey, unknown>
    ? DeepReadonly<T[K]>
    : T[K];
};
