import { createStore } from '@tanstack/store'
import { concatenatePaths, getBy, makePathArray } from './utils'
import type {
  AnyFieldLikeMetaBase,
  FormLikeAPI,
  UpdateMetaOptions,
  ValidationCause,
} from './types'
import type { ReadonlyStore } from '@tanstack/store'
import type { Updater } from './utils'
import type {
  FormApi,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from './FormApi'
import type { FieldOptions } from './FieldApi'
import type {
  DeepKeys,
  DeepKeysOfType,
  DeepValue,
  FieldsMap,
} from './util-types'

export type AnyFieldGroupApi = FieldGroupApi<
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

export interface FieldGroupState<in out TFieldGroupData> {
  /**
   * The current values of the field group
   */
  values: TFieldGroupData
}

/**
 * An object representing the options for a field group.
 */
export interface FieldGroupOptions<
  in out TFormData,
  in out TFieldGroupData,
  in out TFields extends
    | DeepKeysOfType<TFormData, TFieldGroupData | null | undefined>
    | FieldsMap<TFormData, TFieldGroupData>,
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
> {
  form:
    | FormApi<
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
    | FieldGroupApi<
        any,
        TFormData,
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
        TSubmitMeta
      >
  /**
   * The path to the field group data.
   */
  fields: TFields
  /**
   * The expected subsetValues that the form must provide.
   */
  defaultValues?: TFieldGroupData
  /**
   * onSubmitMeta, the data passed from the handleSubmit handler, to the onSubmit function props
   */
  onSubmitMeta?: TSubmitMeta
}

export class FieldGroupApi<
  in out TFormData,
  in out TFieldGroupData,
  in out TFields extends
    | DeepKeysOfType<TFormData, TFieldGroupData | null | undefined>
    | FieldsMap<TFormData, TFieldGroupData>,
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
> implements FormLikeAPI<TFieldGroupData, TSubmitMeta> {
  /**
   * The form that called this field group.
   */
  readonly form: FormApi<
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

  readonly fieldsMap: TFields

  /**
   * Get the true name of the field. Not required within `Field` or `AppField`.
   * @private
   */
  getFormFieldName = <TField extends DeepKeys<TFieldGroupData>>(
    subfield: TField,
  ): DeepKeys<TFormData> => {
      throw new Error("STUB");
  }

  /**
   * Get the field options with the true form DeepKeys for validators
   * @private
   */
  getFormFieldOptions = <
    TOptions extends FieldOptions<
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
    >,
  >(
    props: TOptions,
  ): TOptions => {
      throw new Error("STUB");
  }

  store: ReadonlyStore<FieldGroupState<TFieldGroupData>>

  get state() {
    return this.store.state
  }

  /**
   * Constructs a new `FieldGroupApi` instance with the given form options.
   */
  constructor(
    opts: FieldGroupOptions<
      TFormData,
      TFieldGroupData,
      TFields,
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

  /**
   * Mounts the field group instance to listen to value changes.
   *
   * TODO: Remove
   */
  mount = () => {
    return () => {
        throw new Error("STUB");
    }
  }

  /**
   * Validates the children of a specified array in the form starting from a given index until the end using the correct handlers for a given validation type.
   */
  validateArrayFieldsStartingFrom = async <
    TField extends DeepKeysOfType<TFieldGroupData, any[]>,
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
  validateField = <TField extends DeepKeys<TFieldGroupData>>(
    field: TField,
    cause: ValidationCause,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Handles the form submission, performs validation, and calls the appropriate onSubmit or onSubmitInvalid callbacks.
   */
  handleSubmit(): Promise<void>
  handleSubmit(submitMeta: TSubmitMeta): Promise<void>
  async handleSubmit(submitMeta?: TSubmitMeta): Promise<void> {
    // cast is required since the implementation isn't one of the two overloads
    return this.form.handleSubmit(submitMeta as any)
  }

  /**
   * Gets the value of the specified field.
   */
  getFieldValue = <TField extends DeepKeys<TFieldGroupData>>(
    field: TField,
  ): DeepValue<TFieldGroupData, TField> => {
      throw new Error("STUB");
  }

  /**
   * Gets the metadata of the specified field.
   */
  getFieldMeta = <TField extends DeepKeys<TFieldGroupData>>(field: TField) => {
      throw new Error("STUB");
  }

  /**
   * Updates the metadata of the specified field.
   */
  setFieldMeta = <TField extends DeepKeys<TFieldGroupData>>(
    field: TField,
    updater: Updater<AnyFieldLikeMetaBase>,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Sets the value of the specified field and optionally updates the touched state.
   */
  setFieldValue = <TField extends DeepKeys<TFieldGroupData>>(
    field: TField,
    updater: Updater<DeepValue<TFieldGroupData, TField>>,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Delete a field and its subfields.
   */
  deleteField = <TField extends DeepKeys<TFieldGroupData>>(field: TField) => {
      throw new Error("STUB");
  }

  /**
   * Pushes a value into an array field.
   */
  pushFieldValue = <TField extends DeepKeysOfType<TFieldGroupData, any[]>>(
    field: TField,
    value: DeepValue<TFieldGroupData, TField> extends any[]
      ? DeepValue<TFieldGroupData, TField>[number]
      : never,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Insert a value into an array field at the specified index.
   */
  insertFieldValue = async <
    TField extends DeepKeysOfType<TFieldGroupData, any[]>,
  >(
    field: TField,
    index: number,
    value: DeepValue<TFieldGroupData, TField> extends any[]
      ? DeepValue<TFieldGroupData, TField>[number]
      : never,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Replaces a value into an array field at the specified index.
   */
  replaceFieldValue = async <
    TField extends DeepKeysOfType<TFieldGroupData, any[]>,
  >(
    field: TField,
    index: number,
    value: DeepValue<TFieldGroupData, TField> extends any[]
      ? DeepValue<TFieldGroupData, TField>[number]
      : never,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Removes a value from an array field at the specified index.
   */
  removeFieldValue = async <
    TField extends DeepKeysOfType<TFieldGroupData, any[]>,
  >(
    field: TField,
    index: number,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Swaps the values at the specified indices within an array field.
   */
  swapFieldValues = <TField extends DeepKeysOfType<TFieldGroupData, any[]>>(
    field: TField,
    index1: number,
    index2: number,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Moves the value at the first specified index to the second specified index within an array field.
   */
  moveFieldValues = <TField extends DeepKeysOfType<TFieldGroupData, any[]>>(
    field: TField,
    index1: number,
    index2: number,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  clearFieldValues = <TField extends DeepKeysOfType<TFieldGroupData, any[]>>(
    field: TField,
    opts?: UpdateMetaOptions,
  ) => {
      throw new Error("STUB");
  }

  /**
   * Resets the field value and meta to default state
   */
  resetField = <TField extends DeepKeys<TFieldGroupData>>(field: TField) => {
      throw new Error("STUB");
  }

  validateAllFields = (cause: ValidationCause) =>
    { throw new Error("STUB"); }
}
