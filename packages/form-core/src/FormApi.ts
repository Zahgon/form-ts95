import { batch, createStore } from '@tanstack/store'
import {
  deleteBy,
  determineFormLevelErrorSourceAndValue,
  evaluate,
  functionalUpdate,
  getAsyncValidatorArray,
  getBy,
  getSyncValidatorArray,
  isFieldInGroup,
  isGlobalFormValidationError,
  isNonEmptyArray,
  mergeOpts,
  setBy,
  throttleFormState,
  uuid,
} from './utils'
import { defaultValidationLogic } from './ValidationLogic'
import {
  isStandardSchemaValidator,
  standardSchemaValidators,
} from './standardSchemaValidator'
import { defaultFieldMeta, metaHelper } from './metaHelper'
import { formEventClient } from './EventClient'
import type {
  AnyFieldLikeMeta,
  AnyFieldLikeMetaBase,
  ExtractGlobalFormError,
  FieldInfo,
  FormLikeAPI,
  FormValidationError,
  FormValidationErrorMap,
  GlobalFormValidationError,
  ListenerCause,
  UpdateMetaOptions,
  ValidationCause,
  ValidationError,
  ValidationErrorMap,
  ValidationErrorMapKeys,
} from './types'
import type { ReadonlyStore, Store } from '@tanstack/store'

// types
import type { ValidationLogicFn } from './ValidationLogic'
import type {
  StandardSchemaV1,
  StandardSchemaV1Issue,
  TStandardSchemaValidatorValue,
} from './standardSchemaValidator'
import type { AnyFieldApi } from './FieldApi'
import type {
  AnyFormGroupApi,
  AnyFormGroupMeta,
  FormGroupState,
} from './FormGroupApi'
import type {
  DeepKeys,
  DeepKeysOfType,
  DeepValue,
  RejectPromiseValidator,
} from './util-types'
import type { Updater } from './utils'

/**
 * @private
 */
// TODO: Add the `Unwrap` type to the errors
type FormErrorMapFromValidator<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
> = Partial<
  Record<
    DeepKeys<TFormData>,
    ValidationErrorMap<
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
  >
>

export type FormValidateFn<TFormData> = (props: {
  value: TFormData
  formApi: FormApi<
    TFormData,
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
    any
  >
}) => unknown

/**
 * @private
 */
export type FormValidateOrFn<TFormData> =
  | FormValidateFn<TFormData>
  | StandardSchemaV1<TFormData, unknown>

export type UnwrapFormValidateOrFn<
  TValidateOrFn extends undefined | FormValidateOrFn<any>,
> = [TValidateOrFn] extends [FormValidateFn<any>]
  ? ExtractGlobalFormError<ReturnType<TValidateOrFn>>
  : [TValidateOrFn] extends [StandardSchemaV1<any, any>]
    ? Record<string, StandardSchemaV1Issue[]>
    : undefined

/**
 * @private
 */
export type FormValidateAsyncFn<TFormData> = (props: {
  value: TFormData
  formApi: FormApi<
    TFormData,
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
    any
  >
  signal: AbortSignal
}) => unknown | Promise<unknown>

export type FormValidator<TFormData, TType, TFn = unknown> = {
  validate(options: { value: TType }, fn: TFn): ValidationError
  validateAsync(
    options: { value: TType },
    fn: TFn,
  ): Promise<FormValidationError<TFormData>>
}

type ValidationPromiseResult<TFormData> =
  | {
      fieldErrors: Partial<Record<DeepKeys<TFormData>, ValidationError>>
      errorMapKey: ValidationErrorMapKeys
    }
  | undefined

/**
 * @private
 */
export type FormAsyncValidateOrFn<TFormData> =
  | FormValidateAsyncFn<TFormData>
  | StandardSchemaV1<TFormData, unknown>

export type UnwrapFormAsyncValidateOrFn<
  TValidateOrFn extends undefined | FormAsyncValidateOrFn<any>,
> = [TValidateOrFn] extends [FormValidateAsyncFn<any>]
  ? ExtractGlobalFormError<Awaited<ReturnType<TValidateOrFn>>>
  : [TValidateOrFn] extends [StandardSchemaV1<any, any>]
    ? Record<string, StandardSchemaV1Issue[]>
    : undefined

export interface FormValidators<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
> {
  /**
   * Optional function that fires as soon as the component mounts.
   */
  onMount?: RejectPromiseValidator<TOnMount>
  /**
   * Optional function that checks the validity of your data whenever a value changes
   */
  onChange?: RejectPromiseValidator<TOnChange>
  /**
   * Optional onChange asynchronous counterpart to onChange. Useful for more complex validation logic that might involve server requests.
   */
  onChangeAsync?: TOnChangeAsync
  /**
   * The default time in milliseconds that if set to a number larger than 0, will debounce the async validation event by this length of time in milliseconds.
   */
  onChangeAsyncDebounceMs?: number
  /**
   * Optional function that validates the form data when a field loses focus, returns a `FormValidationError`
   */
  onBlur?: RejectPromiseValidator<TOnBlur>
  /**
   * Optional onBlur asynchronous validation method for when a field loses focus returns a ` FormValidationError` or a promise of `Promise<FormValidationError>`
   */
  onBlurAsync?: TOnBlurAsync
  /**
   * The default time in milliseconds that if set to a number larger than 0, will debounce the async validation event by this length of time in milliseconds.
   */
  onBlurAsyncDebounceMs?: number
  onSubmit?: RejectPromiseValidator<TOnSubmit>
  onSubmitAsync?: TOnSubmitAsync
  onDynamic?: RejectPromiseValidator<TOnDynamic>
  onDynamicAsync?: TOnDynamicAsync
  onDynamicAsyncDebounceMs?: number
}

interface FormListenersPropsGroup<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta = never,
> {
  formApi: FormApi<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >
  groupApi: AnyFormGroupApi
}

interface FormListenersPropsField<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta = never,
> {
  formApi: FormApi<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >
  fieldApi: AnyFieldApi
}

export interface FormListeners<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta = never,
> {
  onChange?: (
    props: FormListenersPropsField<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
  ) => void
  onChangeDebounceMs?: number

  onChangeGroup?: (
    props: FormListenersPropsGroup<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
  ) => void
  onChangeGroupDebounceMs?: number

  onBlur?: (props: {
    formApi: FormApi<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >
    fieldApi: AnyFieldApi
  }) => void
  onBlurDebounceMs?: number

  onMount?: (props: {
    formApi: FormApi<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >
  }) => void

  onSubmit?: (props: {
    formApi: FormApi<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >
    meta: TSubmitMeta
  }) => void

  onFieldUnmount?: (
    props: FormListenersPropsField<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
  ) => void

  onGroupUnmount?: (
    props: FormListenersPropsGroup<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
  ) => void
}

/**
 * An object representing the base properties of a form, unrelated to any validators
 */
export interface BaseFormOptions<in out TFormData, in out TSubmitMeta = never> {
  /**
   * Set initial values for your form.
   */
  defaultValues?: TFormData
  /**
   * onSubmitMeta, the data passed from the handleSubmit handler, to the onSubmit function props
   */
  onSubmitMeta?: TSubmitMeta
}

/**
 * An object representing the options for a form.
 */
export interface FormOptions<
  in out TFormData,
  in out TOnMount extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChange extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  in out TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  in out TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  in out TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TSubmitMeta = never,
> extends BaseFormOptions<TFormData, TSubmitMeta> {
  /**
   * The form name, used for devtools and identification
   */
  formId?: string
  /**
   * The default state for the form.
   */
  defaultState?: Partial<
    FormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    >
  >
  /**
   * If true, always run async validation, even when sync validation has produced an error. Defaults to undefined.
   */
  asyncAlways?: boolean
  /**
   * Optional time in milliseconds if you want to introduce a delay before firing off an async action.
   */
  asyncDebounceMs?: number
  /**
   * If true, allows the form to be submitted in an invalid state i.e. canSubmit will remain true regardless of validation errors. Defaults to undefined.
   */
  canSubmitWhenInvalid?: boolean
  /**
   * A list of validators to pass to the form
   */
  validators?: FormValidators<
    TFormData,
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

  validationLogic?: ValidationLogicFn

  /**
   * form level listeners
   */
  listeners?: FormListeners<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >

  /**
   * A function to be called when the form is submitted, what should happen once the user submits a valid form returns `any` or a promise `Promise<any>`
   */
  onSubmit?: (props: {
    value: TFormData
    formApi: FormApi<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >
    meta: TSubmitMeta
  }) => any | Promise<any>
  /**
   * Specify an action for scenarios where the user tries to submit an invalid form.
   */
  onSubmitInvalid?: (props: {
    value: TFormData
    formApi: FormApi<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >
    meta: TSubmitMeta
  }) => void
  // Only runs in `core` for the first run on the Form, any additional transforms
  // need to be handled at framework runtime due to complexity of comparison check
  // and state merging
  //
  // Made intentionally type loose to avoid headaches with framework's individual
  // `useTransform` hooks
  transform?: (data: unknown) => unknown
}

export type AnyFormOptions = FormOptions<
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
 * An object representing the validation metadata for a field. Not intended for public usage.
 */
export type ValidationMeta = {
  /**
   * An abort controller stored in memory to cancel previous async validation attempts.
   */
  lastAbortController: AbortController
}

/**
 * An object representing the current state of the form.
 */
export type BaseFormState<
  in out TFormData,
  in out TOnMount extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChange extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  in out TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  in out TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  in out TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
> = {
  /**
   * The current values of the form fields.
   */
  values: TFormData
  /**
   * The error map for the form itself.
   */
  errorMap: ValidationErrorMap<
    UnwrapFormValidateOrFn<TOnMount>,
    UnwrapFormValidateOrFn<TOnChange>,
    UnwrapFormAsyncValidateOrFn<TOnChangeAsync>,
    UnwrapFormValidateOrFn<TOnBlur>,
    UnwrapFormAsyncValidateOrFn<TOnBlurAsync>,
    UnwrapFormValidateOrFn<TOnSubmit>,
    UnwrapFormAsyncValidateOrFn<TOnSubmitAsync>,
    UnwrapFormValidateOrFn<TOnDynamic>,
    UnwrapFormAsyncValidateOrFn<TOnDynamicAsync>,
    UnwrapFormAsyncValidateOrFn<TOnServer>
  >
  /**
   * An internal mechanism used for keeping track of validation logic in a form.
   */
  validationMetaMap: Record<ValidationErrorMapKeys, ValidationMeta | undefined>
  /**
   * A record of field metadata for each field in the form, not including the derived properties, like `errors` and such
   */
  fieldMetaBase: Partial<Record<DeepKeys<TFormData>, AnyFieldLikeMetaBase>>
  /**
   * A record of submission lifecycle state for each mounted `FormGroupApi`,
   * keyed by the group's fully-qualified field name. Stored on the form so
   * group-level state can be read from `FormApi` without having to walk the
   * mounted group instances.
   */
  formGroupStateBase: Partial<Record<string, FormGroupState>>
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
  /**
   * @private, used to force a re-evaluation of the form state when options change
   */
  _force_re_eval?: boolean
}

export type AnyBaseFormState = BaseFormState<
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

export type DerivedFormState<
  in out TFormData,
  in out TOnMount extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChange extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  in out TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  in out TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  in out TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
> = {
  /**
   * A boolean indicating if the form is currently validating.
   */
  isFormValidating: boolean
  /**
   * A boolean indicating if the form is valid.
   */
  isFormValid: boolean
  /**
   * The error array for the form itself.
   */
  errors: Array<
    NonNullable<
      | UnwrapFormValidateOrFn<TOnMount>
      | UnwrapFormValidateOrFn<TOnChange>
      | UnwrapFormAsyncValidateOrFn<TOnChangeAsync>
      | UnwrapFormValidateOrFn<TOnBlur>
      | UnwrapFormAsyncValidateOrFn<TOnBlurAsync>
      | UnwrapFormValidateOrFn<TOnSubmit>
      | UnwrapFormAsyncValidateOrFn<TOnSubmitAsync>
      | UnwrapFormValidateOrFn<TOnDynamic>
      | UnwrapFormAsyncValidateOrFn<TOnDynamicAsync>
      | UnwrapFormAsyncValidateOrFn<TOnServer>
    >
  >
  /**
   * A boolean indicating if any of the form fields are currently validating.
   */
  isFieldsValidating: boolean
  /**
   * A boolean indicating if all the form fields are valid. Evaluates `true` if there are no field errors.
   */
  isFieldsValid: boolean
  /**
   * A boolean indicating if any of the form fields have been touched.
   */
  isTouched: boolean
  /**
   * A boolean indicating if any of the form fields have been blurred.
   */
  isBlurred: boolean
  /**
   * A boolean indicating if any of the form's fields' values have been modified by the user. Evaluates `true` if the user have modified at least one of the fields. Opposite of `isPristine`.
   */
  isDirty: boolean
  /**
   * A boolean indicating if none of the form's fields' values have been modified by the user. Evaluates `true` if the user have not modified any of the fields. Opposite of `isDirty`.
   */
  isPristine: boolean
  /**
   * A boolean indicating if all of the form's fields are the same as default values.
   */
  isDefaultValue: boolean
  /**
   * A boolean indicating if the form and all its fields are valid. Evaluates `true` if there are no errors.
   */
  isValid: boolean
  /**
   * A boolean indicating if the form can be submitted based on its current state.
   */
  canSubmit: boolean
  /**
   * A record of field metadata for each field in the form.
   */
  fieldMeta: Partial<Record<DeepKeys<TFormData>, AnyFieldLikeMeta>>
}

export interface FormState<
  in out TFormData,
  in out TOnMount extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChange extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  in out TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  in out TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  in out TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
>
  extends
    BaseFormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    >,
    DerivedFormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    > {}

export type AnyFormState = FormState<
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

function getDefaultFormState<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
>(
  defaultState: Partial<
    FormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    >
  >,
): BaseFormState<
  TFormData,
  TOnMount,
  TOnChange,
  TOnChangeAsync,
  TOnBlur,
  TOnBlurAsync,
  TOnSubmit,
  TOnSubmitAsync,
  TOnDynamic,
  TOnDynamicAsync,
  TOnServer
> {
    throw new Error("STUB");
}

/**
 * @public
 *
 * A type representing the Form API with all generics set to `any` for convenience.
 */
export type AnyFormApi = FormApi<
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

interface ValidateOpts<TFormData> {
  // Useful in FormGroup where validation doesn't update form error map
  dontUpdateFormErrorMap?: boolean
  // Filter which field names to validate, useful for FormGroup validation to filter out fields that don't start with the FormGroup name
  filterFieldNames?: (fieldName: DeepKeys<TFormData>) => boolean
  // When form-level validators are run on behalf of a `FormGroupApi` (e.g.
  // because a field inside that group is revalidating), pass the group so
  // strategies like `revalidateLogic` can gate on the group's own
  // `submissionAttempts` instead of the parent form's.
  group?: AnyFormGroupApi
}

/**
 * We cannot use methods and must use arrow functions. Otherwise, our React adapters
 * will break due to loss of the method when using spread.
 */

/**
 * A class representing the Form API. It handles the logic and interactions with the form state.
 *
 * Normally, you will not need to create a new `FormApi` instance directly. Instead, you will use a framework
 * hook/function like `useForm` or `createForm` to create a new instance for you that uses your framework's reactivity model.
 * However, if you need to create a new instance manually, you can do so by calling the `new FormApi` constructor.
 */
export class FormApi<
  in out TFormData,
  in out TOnMount extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChange extends undefined | FormValidateOrFn<TFormData>,
  in out TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  in out TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  in out TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  in out TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
  in out TSubmitMeta = never,
> implements FormLikeAPI<TFormData, TSubmitMeta> {
  /**
   * The options for the form.
   */
  options: FormOptions<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  > = {}

  baseStore!: Store<
    BaseFormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    >
  >
  fieldMetaDerived: Store<
    FormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    >['fieldMeta']
  >
  /**
   * A derived store of every mounted `FormGroupApi`'s `meta`, keyed by
   * group name. Mirrors `fieldMetaDerived` for fields: per-group `meta`
   * is computed once on the form (from `baseStore.formGroupStateBase`,
   * `fieldMetaDerived`, and the registered `formGroupApis`) so reads
   * from a `FormGroupApi.store` instance stay minimal.
   */
  formGroupMetaDerived!: ReadonlyStore<Record<string, AnyFormGroupMeta>>
  store: ReadonlyStore<
    FormState<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer
    >
  >
  /**
   * A record of field information for each field in the form.
   */
  fieldInfo: Partial<Record<DeepKeys<TFormData>, FieldInfo<TFormData>>> = {}
  /**
   * The set of currently-mounted `FormGroupApi` instances belonging to
   * this form. Used by `FieldApi.validate` to cascade field-level changes
   * into the validators of any group that encompasses the field.
   */
  formGroupApis: Set<AnyFormGroupApi> = new Set()
  get state() {
    return this.store.state
  }

  /**
   * @private
   */
  timeoutIds: {
    validations: Record<ValidationCause, ReturnType<typeof setTimeout> | null>
    listeners: Record<ListenerCause, ReturnType<typeof setTimeout> | null>
    formListeners: Record<ListenerCause, ReturnType<typeof setTimeout> | null>
  }
  /**
   * @private
   */
  _formId: string
  /**
   * @private
   */
  private _devtoolsSubmissionOverride: boolean

  /**
   * Constructs a new `FormApi` instance with the given form options.
   */
  constructor(
    opts?: FormOptions<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
  ) {
      throw new Error("STUB");
  }

  get formId(): string {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  runValidator<
    TValue extends TStandardSchemaValidatorValue<TFormData> & {
      formApi: AnyFormApi
    },
    TType extends 'validate' | 'validateAsync',
  >(props: {
    validate: TType extends 'validate'
      ? FormValidateOrFn<TFormData>
      : FormAsyncValidateOrFn<TFormData>
    value: TValue
    type: TType
  }): unknown {
    if (isStandardSchemaValidator(props.validate)) {
      return standardSchemaValidators[props.type](
        props.value,
        props.validate,
      ) as never
    }

    return (props.validate as FormValidateFn<any>)(props.value) as never
  }

  mount = () => {
    // devtool broadcasts
    const cleanupDevtoolBroadcast = this.store.subscribe(() => {
        throw new Error("STUB");
    })

    // devtool requests
    const cleanupFormStateListener = formEventClient.on(
      'request-form-state',
      (e) => {
          throw new Error("STUB");
      },
    )

    const cleanupFormResetListener = formEventClient.on(
      'request-form-reset',
      (e) => {
          throw new Error("STUB");
      },
    )

    const cleanupFormForceSubmitListener = formEventClient.on(
      'request-form-force-submit',
      (e) => {
          throw new Error("STUB");
      },
    )

    const cleanup = () => {
      cleanupFormForceSubmitListener()
      cleanupFormResetListener()
      cleanupFormStateListener()
      cleanupDevtoolBroadcast.unsubscribe()

      // broadcast form unmount for devtools
      formEventClient.emit('form-unmounted', {
        id: this._formId,
      })
    }

    this.options.listeners?.onMount?.({ formApi: this })

    const { onMount } = this.options.validators || {}

    // broadcast form state for devtools on mounting
    formEventClient.emit('form-api', {
      id: this._formId,
      state: this.store.state,
      options: this.options,
    })

    // if no validation skip
    if (!onMount) return cleanup

    // validate
    this.validateSync('mount')
    return cleanup
  }

  /**
   * Updates the form options and form state.
   */
  update = (
    options?: FormOptions<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync,
      TOnServer,
      TSubmitMeta
    >,
  ) => {
    if (!options) return

    const oldOptions = this.options

    // Options need to be updated first so that when the store is updated, the state is correct for the derived state
    this.options = options

    const shouldUpdateValues =
      options.defaultValues &&
      !evaluate(options.defaultValues, oldOptions.defaultValues) &&
      !this.state.isTouched

    const shouldUpdateState =
      !evaluate(options.defaultState, oldOptions.defaultState) &&
      !this.state.isTouched

    if (!shouldUpdateValues && !shouldUpdateState) return

    batch(() => {
        throw new Error("STUB");
    })

    if (shouldUpdateValues) {
      const helper = metaHelper(this)
      for (const fieldKey of Object.keys(
        this.fieldInfo,
      ) as DeepKeys<TFormData>[]) {
        if (Array.isArray(this.getFieldValue(fieldKey))) {
          helper.bumpArrayVersion(fieldKey)
        }
      }
    }

    formEventClient.emit('form-api', {
      id: this._formId,
      state: this.store.state,
      options: this.options,
    })
  }

  /**
   * Resets the form state to the default values.
   * If values are provided, the form will be reset to those values instead and the default values will be updated.
   *
   * @param values - Optional values to reset the form to.
   * @param opts - Optional options to control the reset behavior.
   */
  reset = (values?: TFormData, opts?: { keepDefaultValues?: boolean }) => {
      throw new Error("STUB");
  }

  /**
   * Validates all fields according to the FIELD level validators.
   * This will ignore FORM level validators, use form.validate({ValidationCause}) for a complete validation
   */
  validateAllFields = async (cause: ValidationCause) => {
      throw new Error("STUB");
  }

  /**
   * Validates the children of a specified array in the form starting from a given index until the end using the correct handlers for a given validation type.
   */
  validateArrayFieldsStartingFrom = async <
    TField extends DeepKeysOfType<TFormData, any[]>,
  >(
    field: TField,
    index: number,
    cause: ValidationCause,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Validates a specified field in the form using the correct handlers for a given validation type.
   */
  validateField = <TField extends DeepKeys<TFormData>>(
    field: TField,
    cause: ValidationCause,
  ) => {
      throw new Error("STUB");
  }

  /**
   * TODO: This code is copied from FieldApi, we should refactor to share
   * @private
   */
  validateSync = (
    cause: ValidationCause,
    validateOpts?: ValidateOpts<TFormData>,
  ): {
    hasErrored: boolean
    fieldsErrorMap: FormErrorMapFromValidator<
      TFormData,
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
  } => {
      throw new Error("STUB");
  }

  /**
   * @private
   */
  validateAsync = async (
    cause: ValidationCause,
    validateOpts?: ValidateOpts<TFormData>,
  ): Promise<
    FormErrorMapFromValidator<
      TFormData,
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
  > => {
    const validates = getAsyncValidatorArray(cause, {
      ...this.options,
      form: this,
      group: validateOpts?.group,
      validationLogic: this.options.validationLogic || defaultValidationLogic,
    })

    if (!this.state.isFormValidating) {
      this.baseStore.setState((prev) => { throw new Error("STUB"); })
    }

    /**
     * We have to use a for loop and generate our promises this way, otherwise it won't be sync
     * when there are no validators needed to be run
     */
    const promises: Promise<ValidationPromiseResult<TFormData>>[] = []

    let fieldErrorsFromFormValidators:
      | Partial<Record<DeepKeys<TFormData>, ValidationError>>
      | undefined

    for (const validateObj of validates) {
      if (!validateObj.validate) continue
      const key = getErrorMapKey(validateObj.cause)
      const fieldValidatorMeta = this.state.validationMetaMap[key]

      fieldValidatorMeta?.lastAbortController.abort()
      const controller = new AbortController()

      this.state.validationMetaMap[key] = {
        lastAbortController: controller,
      }

      promises.push(
        new Promise<ValidationPromiseResult<TFormData>>(async (resolve) => {
            throw new Error("STUB");
        }),
      )
    }

    let results: ValidationPromiseResult<TFormData>[] = []

    const fieldsErrorMap: FormErrorMapFromValidator<
      TFormData,
      TOnMount,
      TOnChange,
      TOnChangeAsync,
      TOnBlur,
      TOnBlurAsync,
      TOnSubmit,
      TOnSubmitAsync,
      TOnDynamic,
      TOnDynamicAsync
    > = {}
    if (promises.length) {
      results = await Promise.all(promises)
      for (const fieldValidationResult of results) {
        if (fieldValidationResult?.fieldErrors) {
          const { errorMapKey } = fieldValidationResult

          for (const [field, fieldError] of Object.entries(
            fieldValidationResult.fieldErrors,
          )) {
            const oldErrorMap =
              fieldsErrorMap[field as DeepKeys<TFormData>] || {}
            const newErrorMap = {
              ...oldErrorMap,
              [errorMapKey]: fieldError,
            }
            fieldsErrorMap[field as DeepKeys<TFormData>] = newErrorMap
          }
        }
      }
    }

    this.baseStore.setState((prev) => { throw new Error("STUB"); })

    return fieldsErrorMap
  }

  /**
   * @private
   */
  validate = (
    cause: ValidationCause,
    validateOpts?: ValidateOpts<TFormData>,
  ):
    | FormErrorMapFromValidator<
        TFormData,
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
    | Promise<
        FormErrorMapFromValidator<
          TFormData,
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
      > => {
    // Attempt to sync validate first
    const { hasErrored, fieldsErrorMap } = this.validateSync(
      cause,
      validateOpts,
    )

    if (hasErrored && !this.options.asyncAlways) {
      return fieldsErrorMap
    }

    // No error? Attempt async validation
    return this.validateAsync(cause, validateOpts)
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

  /**
   * Gets the value of the specified field.
   */
  getFieldValue = <TField extends DeepKeys<TFormData>>(
    field: TField,
  ): DeepValue<TFormData, TField> => { throw new Error("STUB"); }

  /**
   * Gets the metadata of the specified field.
   */
  getFieldMeta = <TField extends DeepKeys<TFormData>>(
    field: TField,
  ): AnyFieldLikeMeta | undefined => {
      throw new Error("STUB");
  }

  /**
   * Gets the derived `meta` of the form group registered at the given
   * name. Mirrors `getFieldMeta` for fields. Returns `undefined` if no
   * `FormGroupApi` with that name is currently mounted.
   */
  getFormGroupMeta = (name: string): AnyFormGroupMeta | undefined => {
      throw new Error("STUB");
  }

  /**
   * Gets the field info of the specified field.
   */
  getFieldInfo = <TField extends DeepKeys<TFormData>>(
    field: TField,
  ): FieldInfo<TFormData> => {
      throw new Error("STUB");
  }

  /**
   * Updates the metadata of the specified field.
   */
  setFieldMeta = <TField extends DeepKeys<TFormData>>(
    field: TField,
    updater: Updater<AnyFieldLikeMetaBase>,
  ) => {
      throw new Error("STUB");
  }

  /**
   * resets every field's meta
   */
  resetFieldMeta = <TField extends DeepKeys<TFormData>>(
    fieldMeta: Partial<Record<TField, AnyFieldLikeMeta>>,
  ): Partial<Record<TField, AnyFieldLikeMeta>> => {
      throw new Error("STUB");
  }

  /**
   * Sets the value of the specified field and optionally updates the touched state.
   */
  setFieldValue = <TField extends DeepKeys<TFormData>>(
    field: TField,
    updater: Updater<DeepValue<TFormData, TField>>,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  deleteField = <TField extends DeepKeys<TFormData>>(field: TField) => {
      throw new Error("STUB");
  }

  /**
   * Pushes a value into an array field.
   */
  pushFieldValue = <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    value: DeepValue<TFormData, TField> extends any[]
      ? DeepValue<TFormData, TField>[number]
      : never,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  insertFieldValue = async <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    index: number,
    value: DeepValue<TFormData, TField> extends any[]
      ? DeepValue<TFormData, TField>[number]
      : never,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Replaces a value into an array field at the specified index.
   */
  replaceFieldValue = async <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    index: number,
    value: DeepValue<TFormData, TField> extends any[]
      ? DeepValue<TFormData, TField>[number]
      : never,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Removes a value from an array field at the specified index.
   */
  removeFieldValue = async <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    index: number,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Swaps the values at the specified indices within an array field.
   */
  swapFieldValues = <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    index1: number,
    index2: number,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Moves the value at the first specified index to the second specified index within an array field.
   */
  moveFieldValues = <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    index1: number,
    index2: number,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Clear all values within an array field.
   */
  clearFieldValues = <TField extends DeepKeysOfType<TFormData, any[]>>(
    field: TField,
    options?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Resets the field value and meta to default state
   */
  resetField = <TField extends DeepKeys<TFormData>>(field: TField) => {
      throw new Error("STUB");
  }

  /**
   * Updates the form's errorMap
   */
  setErrorMap = (
    errorMap: FormValidationErrorMap<
      TFormData,
      UnwrapFormValidateOrFn<TOnMount>,
      UnwrapFormValidateOrFn<TOnChange>,
      UnwrapFormAsyncValidateOrFn<TOnChangeAsync>,
      UnwrapFormValidateOrFn<TOnBlur>,
      UnwrapFormAsyncValidateOrFn<TOnBlurAsync>,
      UnwrapFormValidateOrFn<TOnSubmit>,
      UnwrapFormAsyncValidateOrFn<TOnSubmitAsync>,
      UnwrapFormValidateOrFn<TOnDynamic>,
      UnwrapFormAsyncValidateOrFn<TOnDynamicAsync>,
      UnwrapFormAsyncValidateOrFn<TOnServer>
    >,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Returns form and field level errors
   */
  getAllErrors = (): {
    form: {
      errors: Array<
        NonNullable<
          | UnwrapFormValidateOrFn<TOnMount>
          | UnwrapFormValidateOrFn<TOnChange>
          | UnwrapFormAsyncValidateOrFn<TOnChangeAsync>
          | UnwrapFormValidateOrFn<TOnBlur>
          | UnwrapFormAsyncValidateOrFn<TOnBlurAsync>
          | UnwrapFormValidateOrFn<TOnSubmit>
          | UnwrapFormAsyncValidateOrFn<TOnSubmitAsync>
          | UnwrapFormValidateOrFn<TOnDynamic>
          | UnwrapFormAsyncValidateOrFn<TOnDynamicAsync>
          | UnwrapFormAsyncValidateOrFn<TOnServer>
        >
      >
      errorMap: ValidationErrorMap<
        UnwrapFormValidateOrFn<TOnMount>,
        UnwrapFormValidateOrFn<TOnChange>,
        UnwrapFormAsyncValidateOrFn<TOnChangeAsync>,
        UnwrapFormValidateOrFn<TOnBlur>,
        UnwrapFormAsyncValidateOrFn<TOnBlurAsync>,
        UnwrapFormValidateOrFn<TOnSubmit>,
        UnwrapFormAsyncValidateOrFn<TOnSubmitAsync>,
        UnwrapFormValidateOrFn<TOnDynamic>,
        UnwrapFormAsyncValidateOrFn<TOnDynamicAsync>,
        UnwrapFormAsyncValidateOrFn<TOnServer>
      >
    }
    fields: Record<
      DeepKeys<TFormData>,
      { errors: ValidationError[]; errorMap: ValidationErrorMap }
    >
  } => {
      throw new Error("STUB");
  }

  /**
   * Parses the form's values with a given standard schema and returns
   * issues (if any). This method does NOT set any internal errors.
   * @param schema The standard schema to parse the form values with.
   */
  parseValuesWithSchema = (schema: StandardSchemaV1<TFormData, unknown>) => {
      throw new Error("STUB");
  }

  /**
   * Parses the form's values with a given standard schema and returns
   * issues (if any). This method does NOT set any internal errors.
   * @param schema The standard schema to parse the form values with.
   */
  parseValuesWithSchemaAsync = (
    schema: StandardSchemaV1<TFormData, unknown>,
  ) => {
      throw new Error("STUB");
  }
}

function normalizeError<TFormData>(rawError?: FormValidationError<unknown>): {
  formError: ValidationError
  fieldErrors?: Partial<Record<DeepKeys<TFormData>, ValidationError>>
} {
    throw new Error("STUB");
}

function getErrorMapKey(cause: ValidationCause) {
    throw new Error("STUB");
}
