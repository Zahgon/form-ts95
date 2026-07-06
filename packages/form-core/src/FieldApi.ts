import { batch, createStore } from '@tanstack/store'
import {
  isStandardSchemaValidator,
  standardSchemaValidators,
} from './standardSchemaValidator'
import { defaultFieldMeta } from './metaHelper'
import {
  determineFieldLevelErrorSourceAndValue,
  evaluate,
  getAsyncValidatorArray,
  getSyncValidatorArray,
  isFieldInGroup,
  mergeOpts,
} from './utils'
import { defaultValidationLogic } from './ValidationLogic'
import type { AnyFormGroupApi } from './FormGroupApi'
import type {
  FieldErrorMapFromValidator,
  FieldInfo,
  FieldLikeAPI,
  FieldLikeApiOptions,
  FieldLikeMetaBase,
  FieldLikeOptions,
  FieldLikeState,
  ListenerCause,
  UnwrapFieldAsyncValidateOrFn,
  UnwrapFieldValidateOrFn,
  UpdateMetaOptions,
  ValidationCause,
  ValidationError,
  ValidationErrorMap,
} from './types'
import type { ReadonlyStore } from '@tanstack/store'
import type { DeepKeys, DeepValue, RejectPromiseValidator } from './util-types'
import type {
  StandardSchemaV1,
  TStandardSchemaValidatorValue,
} from './standardSchemaValidator'
import type { FormAsyncValidateOrFn, FormValidateOrFn } from './FormApi'
import type { AsyncValidator, SyncValidator, Updater } from './utils'

/**
 * @private
 */
export type FieldValidateFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> = (props: {
  value: TData
  fieldApi: FieldApi<
    TParentData,
    TName,
    TData,
    // This is technically an edge-type; which we try to keep non-`any`, but in this case
    // It's referring to an inaccessible type from the field validate function inner types, so it's not a big deal
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
}) => unknown

/**
 * @private
 */
export type FieldValidateAsyncFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> = (options: {
  value: TData
  fieldApi: FieldApi<
    TParentData,
    TName,
    TData,
    // This is technically an edge-type; which we try to keep non-`any`, but in this case
    // It's referring to an inaccessible type from the field validate function inner types, so it's not a big deal
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
  signal: AbortSignal
}) => unknown | Promise<unknown>

/**
 * @private
 */
export type FieldListenerFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> = (props: {
  value: TData
  fieldApi: FieldApi<
    TParentData,
    TName,
    TData,
    // This is technically an edge-type; which we try to keep non-`any`, but in this case
    // It's referring to an inaccessible type from the field listener function inner types, so it's not a big deal
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
}) => void

/**
 * @private
 */
export type FieldValidateOrFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> =
  | FieldValidateFn<TParentData, TName, TData>
  | StandardSchemaV1<TData, unknown>

/**
 * @private
 */
export type FieldAsyncValidateOrFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> =
  | FieldValidateAsyncFn<TParentData, TName, TData>
  | StandardSchemaV1<TData, unknown>

export interface FieldValidators<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
  TOnMount extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChange extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChangeAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnBlur extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnBlurAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnSubmit extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnSubmitAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnDynamic extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnDynamicAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
> {
  /**
   * An optional function, that runs on the mount event of input.
   */
  onMount?: RejectPromiseValidator<TOnMount>
  /**
   * An optional function, that runs on the change event of input.
   *
   * @example z.string().min(1)
   */
  onChange?: RejectPromiseValidator<TOnChange>
  /**
   * An optional property similar to `onChange` but async validation
   *
   * @example z.string().refine(async (val) => val.length > 3, { message: 'Testing 123' })
   */
  onChangeAsync?: TOnChangeAsync
  /**
   * An optional number to represent how long the `onChangeAsync` should wait before running
   *
   * If set to a number larger than 0, will debounce the async validation event by this length of time in milliseconds
   */
  onChangeAsyncDebounceMs?: number
  /**
   * An optional list of field names that should trigger this field's `onChange` and `onChangeAsync` events when its value changes
   */
  onChangeListenTo?: DeepKeys<TParentData>[]
  /**
   * An optional function, that runs on the blur event of input.
   *
   * @example z.string().min(1)
   */
  onBlur?: RejectPromiseValidator<TOnBlur>
  /**
   * An optional property similar to `onBlur` but async validation.
   *
   * @example z.string().refine(async (val) => val.length > 3, { message: 'Testing 123' })
   */
  onBlurAsync?: TOnBlurAsync

  /**
   * An optional number to represent how long the `onBlurAsync` should wait before running
   *
   * If set to a number larger than 0, will debounce the async validation event by this length of time in milliseconds
   */
  onBlurAsyncDebounceMs?: number
  /**
   * An optional list of field names that should trigger this field's `onBlur` and `onBlurAsync` events when its value changes
   */
  onBlurListenTo?: DeepKeys<TParentData>[]
  /**
   * An optional function, that runs on the submit event of form.
   *
   * @example z.string().min(1)
   */
  onSubmit?: RejectPromiseValidator<TOnSubmit>
  /**
   * An optional property similar to `onSubmit` but async validation.
   *
   * @example z.string().refine(async (val) => val.length > 3, { message: 'Testing 123' })
   */
  onSubmitAsync?: TOnSubmitAsync
  onDynamic?: RejectPromiseValidator<TOnDynamic>
  onDynamicAsync?: TOnDynamicAsync
  onDynamicAsyncDebounceMs?: number
}

export interface FieldListeners<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> {
  onChange?: FieldListenerFn<TParentData, TName, TData>
  onChangeDebounceMs?: number
  onBlur?: FieldListenerFn<TParentData, TName, TData>
  onBlurDebounceMs?: number
  onMount?: FieldListenerFn<TParentData, TName, TData>
  onUnmount?: FieldListenerFn<TParentData, TName, TData>
  onSubmit?: FieldListenerFn<TParentData, TName, TData>
  onGroupSubmit?: FieldListenerFn<TParentData, TName, TData>
}

interface FieldExtraOptions<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
  TOnMount extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChange extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChangeAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnBlur extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnBlurAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnSubmit extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnSubmitAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnDynamic extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnDynamicAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
> {
  /**
   * A list of validators to pass to the field
   */
  validators?: FieldValidators<
    TParentData,
    TName,
    TData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync
  >

  /**
   * A list of listeners which attach to the corresponding events
   */
  listeners?: FieldListeners<TParentData, TName, TData>
}

/**
 * An object type representing the options for a field in a form.
 */
export interface FieldOptions<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
  TOnMount extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChange extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChangeAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnBlur extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnBlurAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnSubmit extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnSubmitAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnDynamic extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnDynamicAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
>
  extends
    FieldExtraOptions<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync
    >,
    FieldLikeOptions<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync
    > {}

export interface FieldApiOptions<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TFormOnMount extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnChange extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnChangeAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnBlur extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnBlurAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnSubmit extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnSubmitAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnDynamic extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnDynamicAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnServer extends undefined | FormAsyncValidateOrFn<TParentData>,
  in out TParentSubmitMeta,
>
  extends
    FieldLikeApiOptions<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TFormOnMount,
      TFormOnChange,
      TFormOnChangeAsync,
      TFormOnBlur,
      TFormOnBlurAsync,
      TFormOnSubmit,
      TFormOnSubmitAsync,
      TFormOnDynamic,
      TFormOnDynamicAsync,
      TFormOnServer,
      TParentSubmitMeta
    >,
    FieldExtraOptions<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync
    > {}

/**
 * @public
 *
 * A type representing the Field API with all generics set to `any` for convenience.
 */
export type AnyFieldApi = FieldApi<
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

/**
 * We cannot use methods and must use arrow functions. Otherwise, our React adapters
 * will break due to loss of the method when using spread.
 */

/**
 * A class representing the API for managing a form field.
 *
 * Normally, you will not need to create a new `FieldApi` instance directly.
 * Instead, you will use a framework hook/function like `useField` or `createField`
 * to create a new instance for you that uses your framework's reactivity model.
 * However, if you need to create a new instance manually, you can do so by calling
 * the `new FieldApi` constructor.
 */
export class FieldApi<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FieldValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  in out TFormOnMount extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnChange extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnChangeAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnBlur extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnBlurAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnSubmit extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnSubmitAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnDynamic extends undefined | FormValidateOrFn<TParentData>,
  in out TFormOnDynamicAsync extends
    | undefined
    | FormAsyncValidateOrFn<TParentData>,
  in out TFormOnServer extends undefined | FormAsyncValidateOrFn<TParentData>,
  in out TParentSubmitMeta,
> implements FieldLikeAPI<
  TParentData,
  TName,
  TData,
  TOnMount,
  TOnChange,
  TOnChangeAsync,
  TOnBlur,
  TOnBlurAsync,
  TOnSubmit,
  TOnSubmitAsync,
  TOnDynamic,
  TOnDynamicAsync,
  TFormOnMount,
  TFormOnChange,
  TFormOnChangeAsync,
  TFormOnBlur,
  TFormOnBlurAsync,
  TFormOnSubmit,
  TFormOnSubmitAsync,
  TFormOnDynamic,
  TFormOnDynamicAsync,
  TFormOnServer,
  TParentSubmitMeta,
  FieldExtraOptions<
    TParentData,
    TName,
    TData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync
  >
> {
  /**
   * A reference to the form API instance.
   */
  form: FieldApiOptions<
    TParentData,
    TName,
    TData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TFormOnMount,
    TFormOnChange,
    TFormOnChangeAsync,
    TFormOnBlur,
    TFormOnBlurAsync,
    TFormOnSubmit,
    TFormOnSubmitAsync,
    TFormOnDynamic,
    TFormOnDynamicAsync,
    TFormOnServer,
    TParentSubmitMeta
  >['form']
  /**
   * The field name.
   */
  name: TName
  /**
   * The field options.
   */
  options: FieldApiOptions<
    TParentData,
    TName,
    TData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TFormOnMount,
    TFormOnChange,
    TFormOnChangeAsync,
    TFormOnBlur,
    TFormOnBlurAsync,
    TFormOnSubmit,
    TFormOnSubmitAsync,
    TFormOnDynamic,
    TFormOnDynamicAsync,
    TFormOnServer,
    TParentSubmitMeta
  > = {} as any
  /**
   * The field state store.
   */
  store!: ReadonlyStore<
    FieldLikeState<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TFormOnMount,
      TFormOnChange,
      TFormOnChangeAsync,
      TFormOnBlur,
      TFormOnBlurAsync,
      TFormOnSubmit,
      TFormOnSubmitAsync,
      TFormOnDynamic,
      TFormOnDynamicAsync
    >
  >
  /**
   * The current field state.
   */
  get state() {
    return this.store.state
  }
  timeoutIds: {
    validations: Record<ValidationCause, ReturnType<typeof setTimeout> | null>
    listeners: Record<ListenerCause, ReturnType<typeof setTimeout> | null>
    formListeners: Record<ListenerCause, ReturnType<typeof setTimeout> | null>
  }

  /**
   * Initializes a new `FieldApi` instance.
   */
  constructor(
    opts: FieldApiOptions<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TFormOnMount,
      TFormOnChange,
      TFormOnChangeAsync,
      TFormOnBlur,
      TFormOnBlurAsync,
      TFormOnSubmit,
      TFormOnSubmitAsync,
      TFormOnDynamic,
      TFormOnDynamicAsync,
      TFormOnServer,
      TParentSubmitMeta
    >,
  ) {
    this.form = opts.form
    this.name = opts.name
    this.options = opts

    this.timeoutIds = {
      validations: {} as Record<ValidationCause, never>,
      listeners: {} as Record<ListenerCause, never>,
      formListeners: {} as Record<ListenerCause, never>,
    }

    this.store = createStore(
      (
        prevVal:
          | FieldLikeState<
              TParentData,
              TName,
              TData,
              TOnMount,
              TOnChange,
              TOnChangeAsync,
              TOnBlur,
              TOnBlurAsync,
              TOnSubmit,
              TOnSubmitAsync,
              TOnDynamic,
              TOnDynamicAsync,
              TFormOnMount,
              TFormOnChange,
              TFormOnChangeAsync,
              TFormOnBlur,
              TFormOnBlurAsync,
              TFormOnSubmit,
              TFormOnSubmitAsync,
              TFormOnDynamic,
              TFormOnDynamicAsync
            >
          | undefined,
      ) => {
            throw new Error("STUB");
        },
    )
  }

  /**
   * @private
   */
  runValidator<
    TValue extends TStandardSchemaValidatorValue<TData> & {
      fieldApi: AnyFieldApi
    },
    TType extends 'validate' | 'validateAsync',
  >(props: {
    validate: TType extends 'validate'
      ? FieldValidateOrFn<any, any, any>
      : FieldAsyncValidateOrFn<any, any, any>
    value: TValue
    type: TType
    // When `api` is 'field', the return type cannot be `FormValidationError`
  }): unknown {
    if (isStandardSchemaValidator(props.validate)) {
      return standardSchemaValidators[props.type](
        props.value,
        props.validate,
      ) as never
    }

    return (props.validate as FieldValidateFn<any, any>)(props.value) as never
  }

  /**
   * Mounts the field instance to the form.
   * @returns A function to unmount the field instance.
   */
  mount = () => {
    if (this.options.defaultValue !== undefined && !this.getMeta().isTouched) {
      this.form.setFieldValue(this.name, this.options.defaultValue, {
        dontUpdateMeta: true,
      })
    }

    const info = this.getInfo()
    info.instance = this as never

    this.update(this.options as never)

    const { onMount } = this.options.validators || {}

    if (onMount) {
      const error = this.runValidator({
        validate: onMount,
        value: {
          value: this.state.value,
          fieldApi: this,
          validationSource: 'field',
        },
        type: 'validate',
      })
      if (error) {
        this.setMeta(
          (prev) =>
            { throw new Error("STUB"); },
        )
      }
    }

    this.options.listeners?.onMount?.({
      value: this.state.value,
      fieldApi: this,
    })

    return () => {
        throw new Error("STUB");
    }
  }

  /**
   * Updates the field instance with new options.
   */
  update = (
    opts: FieldApiOptions<
      TParentData,
      TName,
      TData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TFormOnMount,
      TFormOnChange,
      TFormOnChangeAsync,
      TFormOnBlur,
      TFormOnBlurAsync,
      TFormOnSubmit,
      TFormOnSubmitAsync,
      TFormOnDynamic,
      TFormOnDynamicAsync,
      TFormOnServer,
      TParentSubmitMeta
    >,
  ) => {
    this.options = opts
    this.name = opts.name

    // Default Value
    if (!this.state.meta.isTouched && this.options.defaultValue !== undefined) {
      const formField = this.form.getFieldValue(this.name)
      if (!evaluate(formField, opts.defaultValue)) {
        this.form.setFieldValue(this.name, opts.defaultValue as never, {
          dontUpdateMeta: true,
          dontValidate: true,
          dontRunListeners: true,
        })
      }
    }

    if (!this.form.getFieldMeta(this.name)) {
      this.form.setFieldMeta(this.name, this.state.meta)
    }
  }

  /**
   * Gets the current field value.
   * @deprecated Use `field.state.value` instead.
   */
  getValue = (): TData => {
      throw new Error("STUB");
  }

  /**
   * Sets the field value and run the `change` validator.
   */
  setValue = (updater: Updater<TData>, options?: UpdateMetaOptions) => {
      throw new Error("STUB");
  }

  getMeta = () => { throw new Error("STUB"); }

  /**
   * Sets the field metadata.
   */
  setMeta = (
    updater: Updater<
      FieldLikeMetaBase<
        TParentData,
        TName,
        TData,
        TOnMount,
        TOnChange,
        TOnChangeAsync,
        TOnBlur,
        TOnBlurAsync,
        TOnSubmit,
        TOnSubmitAsync,
        TOnDynamic,
        TOnDynamicAsync,
        TFormOnMount,
        TFormOnChange,
        TFormOnChangeAsync,
        TFormOnBlur,
        TFormOnBlurAsync,
        TFormOnSubmit,
        TFormOnSubmitAsync,
        TFormOnDynamic,
        TFormOnDynamicAsync
      >
    >,
  ) => { throw new Error("STUB"); }

  /**
   * Gets the field information object.
   */
  getInfo = () => { throw new Error("STUB"); }

  /**
   * Pushes a new value to the field.
   */
  pushValue = (
    value: TData extends any[] ? TData[number] : never,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Inserts a value at the specified index, shifting the subsequent values to the right.
   */
  insertValue = (
    index: number,
    value: TData extends any[] ? TData[number] : never,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Replaces a value at the specified index.
   */
  replaceValue = (
    index: number,
    value: TData extends any[] ? TData[number] : never,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Removes a value at the specified index.
   */
  removeValue = (index: number, options?: UpdateMetaOptions) => {
      throw new Error("STUB");
  }

  /**
   * Swaps the values at the specified indices.
   */
  swapValues = (
    aIndex: number,
    bIndex: number,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Moves the value at the first specified index to the second specified index.
   */
  moveValue = (aIndex: number, bIndex: number, options?: UpdateMetaOptions) => {
      throw new Error("STUB");
  }

  /**
   * Clear all values from the array.
   */
  clearValues = (options?: UpdateMetaOptions) => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  getLinkedFields = (cause: ValidationCause) => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  validateSync = (
    cause: ValidationCause,
    errorFromForm: ValidationErrorMap,
  ) => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  validateAsync = async (
    cause: ValidationCause,
    formValidationResultPromise: Promise<
      FieldErrorMapFromValidator<
        TParentData,
        TName,
        TData,
        TOnMount,
        TOnChange,
        TOnChangeAsync,
        TOnBlur,
        TOnBlurAsync,
        TOnSubmit,
        TOnSubmitAsync
      >
    >,
  ) => {
    const validates = getAsyncValidatorArray(cause, {
      ...this.options,
      form: this.form,
      fieldName: this.name,
      validationLogic:
        this.form.options.validationLogic || defaultValidationLogic,
    })

    // Get the field-specific error messages that are coming from the form's validator
    const asyncFormValidationResults = await formValidationResultPromise

    const linkedFields = this.getLinkedFields(cause)
    const linkedFieldValidates = linkedFields.reduce(
      (acc, field) => {
            throw new Error("STUB");
        },
      [] as Array<
        AsyncValidator<any> & {
          field: AnyFieldApi
        }
      >,
    )

    /**
     * We have to use a for loop and generate our promises this way, otherwise it won't be sync
     * when there are no validators needed to be run
     */
    const validatesPromises: Promise<ValidationError | undefined>[] = []
    const linkedPromises: Promise<ValidationError | undefined>[] = []

    // Check if there are actual async validators to run before setting isValidating
    // This prevents unnecessary re-renders when there are no async validators
    // See: https://github.com/TanStack/form/issues/1130
    const hasAsyncValidators =
      validates.some((v) => { throw new Error("STUB"); }) ||
      linkedFieldValidates.some((v) => { throw new Error("STUB"); })

    if (hasAsyncValidators) {
      if (!this.state.meta.isValidating) {
        this.setMeta((prev) => { throw new Error("STUB"); })
      }

      for (const linkedField of linkedFields) {
        linkedField.setMeta((prev) => { throw new Error("STUB"); })
      }
    }

    const validateFieldAsyncFn = (
      field: AnyFieldApi,
      validateObj: AsyncValidator<any>,
      promises: Promise<ValidationError | undefined>[],
    ) => {
        throw new Error("STUB");
    }

    // TODO: Dedupe this logic to reduce bundle size
    for (const validateObj of validates) {
      if (!validateObj.validate) continue
      validateFieldAsyncFn(this, validateObj, validatesPromises)
    }
    for (const fieldValitateObj of linkedFieldValidates) {
      if (!fieldValitateObj.validate) continue
      validateFieldAsyncFn(
        fieldValitateObj.field,
        fieldValitateObj,
        linkedPromises,
      )
    }

    let results: ValidationError[] = []
    if (validatesPromises.length || linkedPromises.length) {
      results = await Promise.all(validatesPromises)
      await Promise.all(linkedPromises)
    }

    // Only reset isValidating if we set it to true earlier
    if (hasAsyncValidators) {
      this.setMeta((prev) => { throw new Error("STUB"); })

      for (const linkedField of linkedFields) {
        linkedField.setMeta((prev) => { throw new Error("STUB"); })
      }
    }

    return results.filter(Boolean)
  }

  /**
   * Validates the field value.
   */
  validate = (
    cause: ValidationCause,
    opts?: { skipFormValidation?: boolean; skipGroupValidation?: boolean },
  ): ValidationError[] | Promise<ValidationError[]> => {
    // If the field is pristine, do not validate
    if (!this.state.meta.isTouched) return []

    // Cascade into any encompassing `FormGroupApi`'s own validators so
    // group-scoped strategies (e.g. `revalidateLogic` gated on the group's
    // own `submissionAttempts`) get a chance to react to this field change.
    // Mirror the field's sync→short-circuit-on-error→async semantics for
    // each group: only kick off async validators if the group's sync pass
    // was clean (or its `asyncAlways` flag is set).
    const encompassingGroups = opts?.skipGroupValidation
      ? []
      : Array.from(this.form.formGroupApis).filter((group) =>
          { throw new Error("STUB"); },
        )

    // Attempt to sync validate first
    const formSyncResult = opts?.skipFormValidation
      ? { fieldsErrorMap: {} as never }
      : this.form.validateSync(cause)
    let fieldsErrorMap = (formSyncResult.fieldsErrorMap[this.name] ??
      {}) as ValidationErrorMap

    // For each encompassing group whose own submission has been attempted,
    // also re-run the parent form's validators with that group as the
    // gating context. This ensures form-level errors (e.g. those produced
    // by a form-level z.object onDynamic during a group submit) are kept
    // fresh on subsequent field changes — even though the form itself
    // hasn't been submitted directly.
    if (!opts?.skipFormValidation) {
      for (const group of encompassingGroups) {
        if (group.state.meta.submissionAttempts === 0) continue
        const { fieldsErrorMap: groupFormErrors } = this.form.validateSync(
          cause,
          {
            group,
            dontUpdateFormErrorMap: true,
            filterFieldNames: (fieldName) =>
              { throw new Error("STUB"); },
          },
        )
        fieldsErrorMap = {
          ...fieldsErrorMap,
          ...(groupFormErrors[this.name] ?? {}),
        }
      }
    }

    const { hasErrored } = this.validateSync(cause, fieldsErrorMap)

    const groupHasErroredWeakMap = new WeakMap<AnyFormGroupApi, boolean>()
    for (const group of encompassingGroups) {
      const { hasErrored: groupHasErrored } = group.validateSync(
        cause,
        {},
        { skipRelatedFieldValidation: true },
      )

      groupHasErroredWeakMap.set(group, groupHasErrored)
    }

    if (hasErrored && !this.options.asyncAlways) {
      this.getInfo().validationMetaMap[
        getErrorMapKey(cause)
      ]?.lastAbortController.abort()

      const groupErrors = [] as ValidationError[][]

      for (const group of encompassingGroups) {
        group
          .getInfo()
          .validationMetaMap[getErrorMapKey(cause)]?.lastAbortController.abort()

        groupErrors.push(group.state.meta.errors)
      }

      return [...this.state.meta.errors, ...groupErrors.flat()]
    }

    // No error? Attempt async validation
    const formValidationResultPromise = opts?.skipFormValidation
      ? Promise.resolve({})
      : this.form.validateAsync(cause)

    const fieldAsyncResults = this.validateAsync(
      cause,
      formValidationResultPromise,
    )

    const groupAsyncResults: Promise<ValidationError[]>[] = []
    for (const group of encompassingGroups) {
      if (groupHasErroredWeakMap.get(group) && !group.options.asyncAlways) {
        continue
      }

      groupAsyncResults.push(
        group.validateAsync(cause, formValidationResultPromise, {
          skipRelatedFieldValidation: true,
        }),
      )
    }

    if (groupAsyncResults.length === 0) {
      return fieldAsyncResults
    }

    return Promise.all([fieldAsyncResults, ...groupAsyncResults]).then(
      (results) => { throw new Error("STUB"); },
    )
  }

  /**
   * Handles the change event.
   */
  handleChange = (updater: Updater<TData>) => {
    this.setValue(updater)
  }

  /**
   * Handles the blur event.
   */
  handleBlur = () => {
      throw new Error("STUB");
  }

  /**
   * Updates the field's errorMap
   */
  setErrorMap = (
    errorMap: ValidationErrorMap<
      UnwrapFieldValidateOrFn<TName, TOnMount, TFormOnMount>,
      UnwrapFieldValidateOrFn<TName, TOnChange, TFormOnChange>,
      UnwrapFieldAsyncValidateOrFn<TName, TOnChangeAsync, TFormOnChangeAsync>,
      UnwrapFieldValidateOrFn<TName, TOnBlur, TFormOnBlur>,
      UnwrapFieldAsyncValidateOrFn<TName, TOnBlurAsync, TFormOnBlurAsync>,
      UnwrapFieldValidateOrFn<TName, TOnSubmit, TFormOnSubmit>,
      UnwrapFieldAsyncValidateOrFn<TName, TOnSubmitAsync, TFormOnSubmitAsync>,
      UnwrapFieldValidateOrFn<TName, TOnDynamic, TFormOnDynamic>,
      UnwrapFieldAsyncValidateOrFn<TName, TOnDynamicAsync, TFormOnDynamicAsync>
    >,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Parses the field's value with the given schema and returns
   * issues (if any). This method does NOT set any internal errors.
   * @param schema The standard schema to parse this field's value with.
   */
  parseValueWithSchema = (schema: StandardSchemaV1<TData, unknown>) => {
      throw new Error("STUB");
  }

  /**
   * Parses the field's value with the given schema and returns
   * issues (if any). This method does NOT set any internal errors.
   * @param schema The standard schema to parse this field's value with.
   */
  parseValueWithSchemaAsync = (schema: StandardSchemaV1<TData, unknown>) => {
      throw new Error("STUB");
  }

  private triggerOnBlurListener = () => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  triggerOnChangeListener = () => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  triggerOnSubmitListener = () => {
      throw new Error("STUB");
  }
}

function normalizeError(rawError?: ValidationError) {
    throw new Error("STUB");
}

function getErrorMapKey(cause: ValidationCause) {
    throw new Error("STUB");
}
