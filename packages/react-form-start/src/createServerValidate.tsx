import {
  isGlobalFormValidationError,
  isStandardSchemaValidator,
  standardSchemaValidators,
} from '@tanstack/react-form'
import { getRequestHeader } from '@tanstack/react-start/server'
import { decode } from 'decode-formdata'
import { createServerFn } from '@tanstack/react-start'
import { ServerValidateError } from './error'
import { setInternalTanStackCookie } from './utils'

import type {
  FormAsyncValidateOrFn,
  FormOptions,
  FormValidateAsyncFn,
  FormValidateOrFn,
  ServerFormState,
  UnwrapFormAsyncValidateOrFn,
} from '@tanstack/react-form'
import type { FormDataInfo } from 'decode-formdata'

interface CreateServerValidateOptions<
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
  TSubmitMeta,
> extends FormOptions<
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
> {
  onServerValidate: TOnServer
}

const serverFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { formData: unknown; info?: unknown; defaultOpts: unknown }) => {
          throw new Error("STUB");
      },
  )
  .handler(async ({ data }) => {
      throw new Error("STUB");
  })

export const createServerValidate =
  <
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
    TSubmitMeta,
  >(
    defaultOpts: CreateServerValidateOptions<
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
  ) =>
  (formData: FormData, info?: Parameters<typeof decode>[1]) =>
    { throw new Error("STUB"); }
