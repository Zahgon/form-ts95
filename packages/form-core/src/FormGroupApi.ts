import { batch, createStore } from '@tanstack/store'
import {
  determineFieldLevelErrorSourceAndValue,
  determineFormLevelErrorSourceAndValue,
  evaluate,
  getAsyncValidatorArray,
  getSyncValidatorArray,
  isFieldInGroup,
  mergeOpts,
} from './utils'
import { defaultValidationLogic } from './ValidationLogic'
import {
  isStandardSchemaValidator,
  standardSchemaValidators,
} from './standardSchemaValidator'
import { defaultFieldMeta } from './metaHelper'
import { FieldApi } from './FieldApi'
import { FieldLikeApiOptions } from './types'
import type { ValidationLogicFn } from './ValidationLogic'
import type {
  AnyFieldLikeMeta,
  AnyFieldLikeMetaBase,
  FieldErrorMapFromValidator,
  FieldInfo,
  FieldLikeAPI,
  FieldLikeMeta,
  FieldLikeMetaBase,
  FieldLikeOptions,
  FieldLikeState,
  FormLikeAPI,
  ListenerCause,
  UnwrapFieldAsyncValidateOrFn,
  UnwrapFieldValidateOrFn,
  UpdateMetaOptions,
  ValidationCause,
  ValidationError,
  ValidationErrorMap,
} from './types'
import type {
  FormApi,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from './FormApi'
import type { AnyFieldApi } from './FieldApi'
import type {
  StandardSchemaV1,
  TStandardSchemaValidatorValue,
} from './standardSchemaValidator'
import type { AsyncValidator, SyncValidator, Updater } from './utils'
import type { ReadonlyStore } from '@tanstack/store'
import type {
  DeepKeys,
  DeepKeysOfType,
  DeepValue,
  UnwrapOneLevelOfArray,
} from './util-types'

/**
 * @private
 */
export type FormGroupValidateFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> = (props: {
  value: TData
  groupApi: FormGroupApi<
    TParentData,
    TName,
    TData,
    // This is technically an edge-type; which we try to keep non-`any`, but in this case
    // It's referring to an inaccessible type from the group validate function inner types, so it's not a big deal
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
}) => unknown

/**
 * @private
 */
export type FormGroupValidateOrFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> =
  | FormGroupValidateFn<TParentData, TName, TData>
  | StandardSchemaV1<TData, unknown>

/**
 * @private
 */
export type FormGroupValidateAsyncFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> = (options: {
  value: TData
  groupApi: FormGroupApi<
    TParentData,
    TName,
    TData,
    // This is technically an edge-type; which we try to keep non-`any`, but in this case
    // It's referring to an inaccessible type from the group validate function inner types, so it's not a big deal
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
  signal: AbortSignal
}) => unknown | Promise<unknown>

/**
 * @private
 */
export type FormGroupAsyncValidateOrFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> =
  | FormGroupValidateAsyncFn<TParentData, TName, TData>
  | StandardSchemaV1<TData, unknown>

/**
 * @private
 */
export type FormGroupListenerFn<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> = (props: {
  value: TData
  groupApi: FormGroupApi<
    TParentData,
    TName,
    TData,
    // This is technically an edge-type; which we try to keep non-`any`, but in this case
    // It's referring to an inaccessible type from the group listener function inner types, so it's not a big deal
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
}) => void

// TODO: Add `listenTo` props back
export interface FormGroupValidators<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
  TOnMount extends undefined | FormGroupValidateOrFn<TParentData, TName, TData>,
  TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  TOnBlur extends undefined | FormGroupValidateOrFn<TParentData, TName, TData>,
  TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
> {
  /**
   * An optional function, that runs on the mount event of input.
   */
  onMount?: TOnMount
  /**
   * An optional function, that runs on the change event of input.
   *
   * @example z.string().min(1)
   */
  onChange?: TOnChange
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
  // onChangeListenTo?: DeepKeys<TParentData>[]
  /**
   * An optional function, that runs on the blur event of input.
   *
   * @example z.string().min(1)
   */
  onBlur?: TOnBlur
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
  // onBlurListenTo?: DeepKeys<TParentData>[]
  /**
   * An optional function, that runs on the submit event of form.
   *
   * @example z.string().min(1)
   */
  onSubmit?: TOnSubmit
  /**
   * An optional property similar to `onSubmit` but async validation.
   *
   * @example z.string().refine(async (val) => val.length > 3, { message: 'Testing 123' })
   */
  onSubmitAsync?: TOnSubmitAsync
  onDynamic?: TOnDynamic
  onDynamicAsync?: TOnDynamicAsync
  onDynamicAsyncDebounceMs?: number
}

export interface FormGroupListeners<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName> = DeepValue<TParentData, TName>,
> {
  onChange?: FormGroupListenerFn<TParentData, TName, TData>
  onChangeDebounceMs?: number
  onBlur?: FormGroupListenerFn<TParentData, TName, TData>
  onBlurDebounceMs?: number
  onMount?: FormGroupListenerFn<TParentData, TName, TData>
  onUnmount?: FormGroupListenerFn<TParentData, TName, TData>
  onSubmit?: FormGroupListenerFn<TParentData, TName, TData>
  onGroupSubmit?: FormGroupListenerFn<TParentData, TName, TData>
}

interface FormGroupExtraOptions<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TSubmitMeta,
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
> {
  /**
   * A list of validators to pass to the field
   */
  validators?: FormGroupValidators<
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
   * If true, allows the form to be submitted in an invalid state i.e. canSubmit will remain true regardless of validation errors. Defaults to undefined.
   */
  canSubmitWhenInvalid?: boolean

  /**
   * A list of listeners which attach to the corresponding events
   */
  listeners?: FormGroupListeners<TParentData, TName, TData>

  defaultState?: FormGroupState
  /**
   * Optional validation logic strategy to use for this group's own
   * validators (e.g. `revalidateLogic()`). When omitted, the parent form's
   * `validationLogic` (or the default) is used.
   */
  validationLogic?: ValidationLogicFn
  /**
   * onSubmitMeta, the data passed from the handleSubmit handler, to the onSubmit function props
   */
  onSubmitMeta?: TSubmitMeta

  /**
   * A function to be called when the form is submitted, what should happen once the user submits a valid form returns `any` or a promise `Promise<any>`
   */
  onGroupSubmit?: (props: {
    value: TData
    groupApi: FormGroupApi<
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
      TSubmitMeta,
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
    >
    meta: TSubmitMeta
  }) => any | Promise<any>
  /**
   * Specify an action for scenarios where the user tries to submit an invalid form.
   */
  onGroupSubmitInvalid?: (props: {
    value: TData
    groupApi: FormGroupApi<
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
      TSubmitMeta,
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
    >
    meta: TSubmitMeta
  }) => void
}

export interface FormGroupOptions<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TSubmitMeta,
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
    >,
    FormGroupExtraOptions<
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
      TSubmitMeta,
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
    > {}

export interface FormGroupApiOptions<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TSubmitMeta,
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
> extends FormGroupOptions<
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
  TSubmitMeta,
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
> {
  form: FormApi<
    TParentData,
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
  >
}

export interface FormGroupState {
  /**
   * A boolean indicating if the form is currently in the process of being submitted after `handleSubmit` is called.
   *
   * Goes back to `false` when submission completes for one of the following reasons:
   * - the validation step returned errors.
   * - the `onSubmit` function has completed.
   *
   * Note: if you're running async operations in your `onSubmit` function make sure to await them to ensure `isSubmitting` is set to `false` only when the async operation completes.
   *
   * This is useful for displaying loading indicators or disabling form inputs during submission.
   *
   */
  isSubmitting: boolean
  /**
   * A boolean indicating if the `onSubmit` function has completed successfully.
   *
   * Goes back to `false` at each new submission attempt.
   *
   * Note: you can use isSubmitting to check if the form is currently submitting.
   */
  isSubmitted: boolean
  /**
   * A boolean indicating if the form or any of its fields are currently validating.
   */
  isValidating: boolean
  /**
   * A counter for tracking the number of submission attempts.
   */
  submissionAttempts: number
  /**
   * A boolean indicating if the last submission was successful.
   */
  isSubmitSuccessful: boolean
}

function getDefaultFormGroupState(
  defaultState: Partial<FormGroupState>,
): FormGroupState {
    throw new Error("STUB");
}

/**
 * @public
 *
 * A type representing the FormGroup API with all generics set to `any` for convenience.
 */
export type AnyFormGroupApi = FormGroupApi<
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
  any,
  any
>

/**
 * @public
 *
 * The `meta` shape exposed on `FormGroupApi.state.meta`. Mirrors
 * `FieldApi.state.meta` (since `FormGroupMeta extends FieldLikeMeta`) but
 * additionally surfaces the group's submission lifecycle and aggregated
 * validity flags. All derivation lives on the parent `FormApi` (in
 * `formGroupMetaDerived`), keeping per-instance `FormGroupApi.store` as
 * minimal as `FieldApi.store`.
 *
 * Aggregated booleans (`isTouched`, `isBlurred`, `isDirty`, `isPristine`,
 * `isDefaultValue`) are computed across the group's descendant fields
 * rather than the group's own field-meta entry.
 */
export interface FormGroupMeta<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
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
>
  extends
    FieldLikeMeta<
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
    >,
    FormGroupState {
  isFieldsValidating: boolean
  isFieldsValid: boolean
  isGroupValid: boolean
  isValid: boolean
  canSubmit: boolean
}

/**
 * @public
 *
 * `FormGroupMeta` with all generics widened to `any`.
 */
export type AnyFormGroupMeta = FormGroupMeta<
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

export interface FormGroupStoreState<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
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
> {
  /**
   * The current value of the form group.
   */
  value: TData
  /**
   * The current metadata of the form group, including aggregated validity,
   * group-level errors, and submission lifecycle.
   */
  meta: FormGroupMeta<
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
}

/**
 * @private
 *
 * Builds a default `FormGroupMeta` value, used as a fallback when the
 * parent form's `formGroupMetaDerived` store has no entry for this group
 * yet (e.g. between `new FormGroupApi(...)` and `mount()`).
 */
export function getDefaultFormGroupMeta(
  defaultMeta?: Partial<AnyFieldLikeMetaBase>,
): AnyFormGroupMeta {
    throw new Error("STUB");
}

export class FormGroupApi<
  in out TParentData,
  in out TName extends DeepKeys<TParentData>,
  in out TData extends DeepValue<TParentData, TName>,
  in out TOnMount extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChange extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnChangeAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnBlur extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnBlurAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmit extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnSubmitAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamic extends
    | undefined
    | FormGroupValidateOrFn<TParentData, TName, TData>,
  in out TOnDynamicAsync extends
    | undefined
    | FormGroupAsyncValidateOrFn<TParentData, TName, TData>,
  in out TSubmitMeta,
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
  implements
    FormLikeAPI<TParentData, TSubmitMeta>,
    FieldLikeAPI<
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
      FormGroupExtraOptions<
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
        TSubmitMeta,
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
      >
    >
{
  /**
   * A reference to the form API instance.
   */
  form: FormGroupApiOptions<
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
    TSubmitMeta,
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
  options: FormGroupApiOptions<
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
    TSubmitMeta,
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
    FormGroupStoreState<
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

  /**
   * @private
   *
   * Updates this group's submission lifecycle state on the parent form's
   * `baseStore` (where group state is now persisted), preserving entries
   * for any other mounted groups. After writing, the form's
   * `formGroupMetaDerived` re-derives so this group's `state.meta` picks
   * up the new lifecycle values automatically.
   */
  private setFormGroupState = (
    updater: (prev: FormGroupState) => FormGroupState,
  ) => {
      throw new Error("STUB");
  }

  timeoutIds: {
    validations: Record<ValidationCause, ReturnType<typeof setTimeout> | null>
    listeners: Record<ListenerCause, ReturnType<typeof setTimeout> | null>
    formListeners: Record<ListenerCause, ReturnType<typeof setTimeout> | null>
  }

  /**
   * @private
   *
   * Tracks the set of fully-qualified child field names that this group's
   * validators last set form-source errors on, keyed by `errorMap` key.
   * Used to clear stale group-level field errors on subsequent runs without
   * trampling errors set by the parent form's validators.
   */
  private _lastDistributedFieldNames: Partial<Record<string, Set<string>>> = {}

  private fieldInfo: FieldInfo<TParentData>

  constructor(
    opts: FormGroupApiOptions<
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
      TSubmitMeta,
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

    this.fieldInfo = {
      instance: null,
      validationMetaMap: {
        onChange: undefined,
        onBlur: undefined,
        onSubmit: undefined,
        onMount: undefined,
        onServer: undefined,
        onDynamic: undefined,
      },
    }

    this.store = createStore(
      (
        prevVal:
          | FormGroupStoreState<
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

    this.handleSubmit = this.handleSubmit.bind(this)
  }

  /**
   * Updates the field instance with new options.
   */
  update = (
    opts: FormGroupApiOptions<
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
      TSubmitMeta,
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
      this.form.setFieldMeta(this.name, {
        ...defaultFieldMeta,
        ...(this.options.defaultMeta as Partial<AnyFieldLikeMetaBase>),
      } as never)
    }
  }

  /**
   * @private
   */
  runValidator<
    TValue extends TStandardSchemaValidatorValue<TData> & {
      groupApi: AnyFormGroupApi
    },
    TType extends 'validate' | 'validateAsync',
  >(props: {
    validate: TType extends 'validate'
      ? FormGroupValidateOrFn<any, any, any>
      : FormGroupAsyncValidateOrFn<any, any, any>
    value: TValue
    type: TType
    // When `api` is 'field', the return type cannot be `FormValidationError`
  }): unknown {
    if (isStandardSchemaValidator(props.validate)) {
      const result = standardSchemaValidators[props.type](
        props.value,
        props.validate,
      ) as unknown

      // Standard schemas with `validationSource: 'form'` return `{ form, fields }`.
      // For groups we expose the same fan-out shape but under a `group` key
      // (a `form` key on a group-level validator would be misleading), so
      // remap the standard-schema result here. Manual functions on a group
      // are expected to return `{ group, fields }` already.
      if (props.type === 'validate') {
        return remapStandardSchemaResultForGroup(result)
      }
      return (result as Promise<unknown>).then(
        remapStandardSchemaResultForGroup,
      )
    }

    return (props.validate as FormGroupValidateFn<any, any>)(
      props.value,
    ) as never
  }

  mount = () => {
    this.update(this.options as never)
    this.form.formGroupApis.add(this)
    this.fieldInfo.instance = this as never

    // Seed the parent form's `formGroupStateBase` entry for this group.
    // We always write so that `formGroupMetaDerived` re-derives now that
    // `formGroupApis` includes this instance — this is what makes
    // `state.meta` populated on the very first read after mount. Mirrors
    // `FieldApi.mount`'s lifecycle: per-group lifecycle state lives on
    // the form so it can be read off `FormApi` directly without walking
    // the mounted group instances.
    this.form.baseStore.setState((prev) => { throw new Error("STUB"); })

    const { onMount } = this.options.validators || {}

    if (onMount) {
      const rawError = this.runValidator({
        validate: onMount,
        value: {
          value: this.state.value,
          groupApi: this,
          validationSource: 'form',
        },
        type: 'validate',
      })

      let groupOwnRawError = rawError
      let groupFieldErrors: Record<string, unknown> | undefined = undefined
      if (isGlobalGroupValidationError(rawError)) {
        groupOwnRawError = rawError.group
        groupFieldErrors = rawError.fields
      }

      const error = normalizeError(groupOwnRawError as ValidationError)
      if (error) {
        this.setMeta(
          (prev) =>
            { throw new Error("STUB"); },
        )
      }

      this.distributeFieldErrors('onMount', groupFieldErrors)
    }

    this.options.listeners?.onMount?.({
      value: this.state.value,
      groupApi: this,
    })

    return () => {
        throw new Error("STUB");
    }
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
   * @private
   */
  getRelatedFields = () => {
      throw new Error("STUB");
  }
  /**
   * @private
   */
  getRelatedFieldMetasDerived = () => {
      throw new Error("STUB");
  }

  /**
   * @private
   *
   * Builds a fully-qualified field name from a path that is relative to this
   * group, supporting both dot (`name`, `nested.value`) and bracket
   * (`[0].name`) notation.
   */
  private buildChildFieldName = (relativeName: string): string => {
      throw new Error("STUB");
  }

  /**
   * @private
   *
   * Distributes a `{ fields: { ... } }` payload returned by one of this
   * group's own validators onto the corresponding child fields. Tracks
   * which fields have been touched so subsequent runs can clear stale
   * errors without trampling errors set by the parent form's validators.
   */
  private distributeFieldErrors = (
    errorMapKey: string,
    fieldErrors: Record<string, unknown> | undefined,
  ): boolean => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  validateSync = (
    cause: ValidationCause,
    errorFromForm: ValidationErrorMap,
    opts: {
      skipRelatedFieldValidation?: boolean
    } = {},
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
    opts: {
      skipRelatedFieldValidation?: boolean
    } = {},
  ) => {
    const validates = getAsyncValidatorArray(cause, {
      ...this.options,
      form: this.form,
      group: this,
      validationLogic:
        this.options.validationLogic ||
        this.form.options.validationLogic ||
        defaultValidationLogic,
    })

    // Get the field-specific error messages that are coming from the form's validator
    const asyncFormValidationResults = await formValidationResultPromise

    const relatedFields = opts.skipRelatedFieldValidation
      ? []
      : this.getRelatedFields()
    const relatedFieldValidates = relatedFields.reduce(
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
      relatedFieldValidates.some((v) => { throw new Error("STUB"); })

    if (hasAsyncValidators) {
      if (!this.state.meta.isValidating) {
        this.setMeta((prev) => { throw new Error("STUB"); })
      }

      for (const linkedField of relatedFields) {
        linkedField.setMeta((prev) => { throw new Error("STUB"); })
      }
    }

    const validateFieldOrGroupAsyncFn = (
      fieldOrGroup: AnyFieldApi | AnyFormGroupApi,
      validateObj: AsyncValidator<any>,
      promises: Promise<ValidationError | undefined>[],
    ) => {
        throw new Error("STUB");
    }

    // TODO: Dedupe this logic to reduce bundle size
    for (const validateObj of validates) {
      if (!validateObj.validate) continue
      validateFieldOrGroupAsyncFn(this, validateObj, validatesPromises)
    }
    for (const fieldValitateObj of relatedFieldValidates) {
      if (!fieldValitateObj.validate) continue
      validateFieldOrGroupAsyncFn(
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

      for (const linkedField of relatedFields) {
        linkedField.setMeta((prev) => { throw new Error("STUB"); })
      }
    }

    return results.filter(Boolean)
  }

  /**
   * Validates all fields according to the FIELD level validators.
   * This will ignore FORM level validators, use form.validate({ValidationCause}) for a complete validation
   */
  validateAllFields = async (cause: ValidationCause) => {
      throw new Error("STUB");
  }

  validateArrayFieldsStartingFrom = <
    TField extends DeepKeysOfType<TParentData, any[]>,
  >(
    field: TField,
    index: number,
    cause: ValidationCause,
  ) => {
      throw new Error("STUB");
  }

  validateField = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
    cause: ValidationCause,
  ) => {
      throw new Error("STUB");
  }

  getFieldValue = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
  ) => {
      throw new Error("STUB");
  }

  getFieldMeta = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
  ) => {
      throw new Error("STUB");
  }

  setFieldMeta = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
    updater: Updater<AnyFieldLikeMetaBase>,
  ) => {
      throw new Error("STUB");
  }

  setFieldValue = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
    value: any,
  ) => {
      throw new Error("STUB");
  }

  deleteField = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
  ) => {
      throw new Error("STUB");
  }

  pushFieldValue = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
    value: any,
  ) => {
      throw new Error("STUB");
  }

  insertFieldValue = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
    index: number,
    value: any,
  ) => {
      throw new Error("STUB");
  }

  replaceFieldValue = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
    index: number,
    value: any,
  ) => {
      throw new Error("STUB");
  }

  swapFieldValues = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
    index1: number,
    index2: number,
  ) => {
      throw new Error("STUB");
  }

  moveFieldValues = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
    fromIndex: number,
    toIndex: number,
  ) => {
      throw new Error("STUB");
  }

  clearFieldValues = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
  ) => {
      throw new Error("STUB");
  }

  resetField = <TField extends DeepKeysOfType<TParentData, any>>(
    field: TField,
  ) => {
      throw new Error("STUB");
  }

  removeFieldValue = <TField extends DeepKeysOfType<TParentData, any[]>>(
    field: TField,
    index: number,
  ) => {
      throw new Error("STUB");
  }

  areRelatedFieldsValid = () => {
      throw new Error("STUB");
  }

  /**
   * Validates the form group and all related children.
   */
  validate = (
    cause: ValidationCause,
    opts?: {
      skipFormValidation?: boolean
      skipRelatedFieldValidation?: boolean
    },
  ): ValidationError[] | Promise<ValidationError[]> => {
    // Attempt to sync validate first
    const { fieldsErrorMap } = opts?.skipFormValidation
      ? { fieldsErrorMap: {} as never }
      : this.form.validateSync(cause, {
          dontUpdateFormErrorMap: true,
          filterFieldNames: (fieldName) => { throw new Error("STUB"); },
        })
    const { hasErrored } = this.validateSync(
      cause,
      fieldsErrorMap[this.name] ?? {},
      { skipRelatedFieldValidation: opts?.skipRelatedFieldValidation },
    )

    if (hasErrored && !this.options.asyncAlways) {
      this.getInfo().validationMetaMap[
        getErrorMapKey(cause)
      ]?.lastAbortController.abort()
      return this.state.meta.errors
    }

    // No error? Attempt async validation
    const formValidationResultPromise = opts?.skipFormValidation
      ? Promise.resolve({})
      : this.form.validateAsync(cause, {
          dontUpdateFormErrorMap: true,
          filterFieldNames: (fieldName) => { throw new Error("STUB"); },
        })
    return this.validateAsync(cause, formValidationResultPromise, {
      skipRelatedFieldValidation: opts?.skipRelatedFieldValidation,
    })
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

  // Needs to edgecase in the React adapter specifically to avoid type errors
  handleSubmit(): Promise<void>
  handleSubmit(submitMeta: TSubmitMeta): Promise<void>
  handleSubmit(submitMeta?: TSubmitMeta): Promise<void> {
    return this._handleSubmit(submitMeta)
  }

  /**
   * Handles the form submission, performs validation, and calls the appropriate onSubmit or onSubmitInvalid callbacks.
   */
  _handleSubmit = async (submitMeta?: TSubmitMeta): Promise<void> => {
      throw new Error("STUB");
  }
}

function normalizeError(rawError?: ValidationError) {
    throw new Error("STUB");
}

/**
 * @private
 *
 * Type guard for the group-level analogue of `GlobalFormValidationError`.
 * Group-level validators that want to fan errors out to child fields return
 * `{ group?: ValidationError, fields: { ...relativePath: ValidationError } }`.
 */
function isGlobalGroupValidationError(
  error: unknown,
): error is { group?: unknown; fields?: Record<string, unknown> } {
    throw new Error("STUB");
}

/**
 * @private
 *
 * Standard schemas produce `{ form, fields }`. For groups we prefer to expose
 * a `{ group, fields }` shape because `form` would be misleading on a
 * group-level validator. This rename keeps the rest of the group validation
 * pipeline operating on a single shape.
 */
function remapStandardSchemaResultForGroup(result: unknown): unknown {
  if (!result || typeof result !== 'object') return result
  if (!('form' in result) && !('fields' in result)) return result
  const { form, fields, ...rest } = result as {
    form?: unknown
    fields?: unknown
  }
  return { ...rest, group: form, fields }
}

function getErrorMapKey(cause: ValidationCause) {
    throw new Error("STUB");
}
