import { liteThrottle } from '@tanstack/pacer-lite'
import { formEventClient } from './EventClient'
import { AnyFormGroupApi } from './FormGroupApi'
import type { ValidationLogicProps } from './ValidationLogic'
import type { FieldValidators } from './FieldApi'
import type { AnyFormApi, FormValidators } from './FormApi'
import type {
  GlobalFormValidationError,
  ValidationCause,
  ValidationError,
  ValidationSource,
} from './types'

export type UpdaterFn<TInput, TOutput = TInput> = (input: TInput) => TOutput

export type Updater<TInput, TOutput = TInput> =
  | TOutput
  | UpdaterFn<TInput, TOutput>

/**
 * @private
 */
export function functionalUpdate<TInput, TOutput = TInput>(
  updater: Updater<TInput, TOutput>,
  input: TInput,
): TOutput {
  return typeof updater === 'function'
    ? (updater as UpdaterFn<TInput, TOutput>)(input)
    : updater
}

/**
 * Get a value from an object using a path, including dot notation.
 * @private
 */
export function getBy(obj: unknown, path: string | (string | number)[]): any {
    throw new Error("STUB");
}

/**
 * Set a value on an object using a path, including dot notation.
 * @private
 */
export function setBy(obj: any, _path: any, updater: Updater<any>) {
    throw new Error("STUB");
}

/**
 * Delete a field on an object using a path, including dot notation.
 * @private
 */
export function deleteBy(obj: any, _path: any) {
    throw new Error("STUB");
}

// Char codes used by the parser below.
const CC_DOT = 0x2e // '.'
const CC_OPEN = 0x5b // '['
const CC_CLOSE = 0x5d // ']'
const CC_ZERO = 0x30 // '0'
const CC_NINE = 0x39 // '9'

/**
 * @private
 */
export function makePathArray(str: string | Array<string | number>) {
    throw new Error("STUB");
}

/**
 * @private
 */
export function concatenatePaths(path1: string, path2: string): string {
    throw new Error("STUB");
}

/**
 * @private
 */
export function isNonEmptyArray(obj: any) {
    throw new Error("STUB");
}

interface AsyncValidatorArrayPartialOptions<T> {
  validators?: T
  asyncDebounceMs?: number
}

/**
 * @private
 */
export interface AsyncValidator<T> {
  cause: ValidationCause
  validate: T
  debounceMs: number
}

interface SyncValidatorArrayPartialOptions<T> {
  validators?: T
}

/**
 * @private
 */
export interface SyncValidator<T> {
  cause: ValidationCause
  validate: T
}

/**
 * @private
 */
export function getSyncValidatorArray<T>(
  cause: ValidationCause,
  options: SyncValidatorArrayPartialOptions<T> & {
    validationLogic?: any
    form?: any
    group?: any
    fieldName?: string
  },
): T extends FieldValidators<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>
  ? Array<
      SyncValidator<
        | T['onChange']
        | T['onBlur']
        | T['onSubmit']
        | T['onMount']
        | T['onDynamic']
      >
    >
  : T extends FormValidators<any, any, any, any, any, any, any, any, any, any>
    ? Array<
        SyncValidator<
          | T['onChange']
          | T['onBlur']
          | T['onSubmit']
          | T['onMount']
          | T['onDynamic']
        >
      >
    : never {
    throw new Error("STUB");
}

/**
 * @private
 */
export function getAsyncValidatorArray<T>(
  cause: ValidationCause,
  options: AsyncValidatorArrayPartialOptions<T> & {
    validationLogic?: any
    form?: any
    group?: any
    fieldName?: string
  },
): T extends FieldValidators<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>
  ? Array<
      AsyncValidator<
        | T['onChangeAsync']
        | T['onBlurAsync']
        | T['onSubmitAsync']
        | T['onDynamicAsync']
      >
    >
  : T extends FormValidators<any, any, any, any, any, any, any, any, any, any>
    ? Array<
        AsyncValidator<
          | T['onChangeAsync']
          | T['onBlurAsync']
          | T['onSubmitAsync']
          | T['onDynamicAsync']
        >
      >
    : never {
    throw new Error("STUB");
}

export const isGlobalFormValidationError = (
  error: unknown,
): error is GlobalFormValidationError<unknown> => {
  return !!error && typeof error === 'object' && 'fields' in error
}

export function evaluate<T>(objA: T, objB: T) {
    throw new Error("STUB");
}

/**
 * Determines the logic for determining the error source and value to set on the field meta within the form level sync/async validation.
 * @private
 */
export const determineFormLevelErrorSourceAndValue = ({
  newFormValidatorError,
  isPreviousErrorFromFormValidator,
  previousErrorValue,
}: {
  newFormValidatorError: ValidationError
  isPreviousErrorFromFormValidator: boolean
  previousErrorValue: ValidationError
}): {
  newErrorValue: ValidationError
  newSource: ValidationSource | undefined
} => {
    throw new Error("STUB");
}

/**
 * Determines the logic for determining the error source and value to set on the field meta within the field level sync/async validation.
 * @private
 */
export const determineFieldLevelErrorSourceAndValue = ({
  formLevelError,
  fieldLevelError,
}: {
  formLevelError: ValidationError
  fieldLevelError: ValidationError
}): {
  newErrorValue: ValidationError
  newSource: ValidationSource | undefined
} => {
    throw new Error("STUB");
}

export function createFieldMap<T>(values: Readonly<T>): { [K in keyof T]: K } {
    throw new Error("STUB");
}

/**
 * Merge the first parameter with the given overrides.
 * @private
 */
export function mergeOpts<T>(
  originalOpts: T | undefined | null,
  overrides: T,
): T {
    throw new Error("STUB");
}

/*
/ credit is due to https://github.com/lukeed/uuid for this code, with current npm
/ attacks we didn't feel comfortable installing directly from npm. But big appreciation
/ from the TanStack Form team <3.
*/

let IDX = 256
const HEX: string[] = []
let BUFFER: number[] | undefined

while (IDX--) {
  HEX[IDX] = (IDX + 256).toString(16).substring(1)
}

export function uuid(): string {
    throw new Error("STUB");
}

export const throttleFormState = liteThrottle(
  (form: AnyFormApi) =>
    { throw new Error("STUB"); },
  {
    wait: 300,
  },
)

// Do not use a serialize and deserialize method like JSON.stringify/parse
// as that will drop functions, dates, undefined, Infinity, NaN, etc.
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (Array.isArray(obj)) {
    const arrCopy = [] as any[]
    for (let i = 0; i < obj.length; i++) {
      arrCopy[i] = deepCopy(obj[i])
    }
    return arrCopy as any
  }

  if (obj instanceof Map) {
    const mapCopy = new Map()
    obj.forEach((value, key) => {
        throw new Error("STUB");
    })
    return mapCopy as any
  }

  if (obj instanceof Set) {
    const setCopy = new Set()
    obj.forEach((value) => {
        throw new Error("STUB");
    })
    return setCopy as any
  }

  const copy: { [key: string]: any } = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy((obj as any)[key])
    }
  }
  return copy as T
}

/**
 * @private
 */
export function isFieldInGroup(groupName: string, fieldName: string) {
    throw new Error("STUB");
}
