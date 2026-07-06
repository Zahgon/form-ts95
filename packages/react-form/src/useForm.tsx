'use client'

import { FormApi, functionalUpdate, mergeAndUpdate } from '@tanstack/form-core'
import { useStore } from '@tanstack/react-store'
import { useMemo, useRef, useState } from 'react'
import { Field } from './useField'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'
import { useFormId } from './useFormId'
import { FormGroup } from './useFormGroup'
import type { FormGroupComponent } from './useFormGroup'
import type {
  AnyFormApi,
  AnyFormState,
  FormAsyncValidateOrFn,
  FormOptions,
  FormState,
  FormValidateOrFn,
} from '@tanstack/form-core'
import type { FunctionComponent, PropsWithChildren, ReactNode } from 'react'
import type { FieldComponent } from './useField'

/**
 * Fields that are added onto the `FormAPI` from `@tanstack/form-core` and returned from `useForm`
 */
export interface ReactFormApi<
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
  in out TSubmitMeta,
> {
  /**
   * A React component to render form fields. With this, you can render and manage individual form fields.
   */
  Field: FieldComponent<
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
  FormGroup: FormGroupComponent<
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
   * A `Subscribe` function that allows you to listen and react to changes in the form's state. It's especially useful when you need to execute side effects or render specific components in response to state updates.
   */
  Subscribe: <
    TSelected = NoInfer<
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
  >(props: {
    selector?: (
      state: NoInfer<
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
    ) => TSelected
    children: ((state: NoInfer<TSelected>) => ReactNode) | ReactNode
  }) => ReturnType<FunctionComponent>
}

/**
 * An extended version of the `FormApi` class that includes React-specific functionalities from `ReactFormApi`
 */
export type ReactFormExtendedApi<
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
> = FormApi<
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
> &
  ReactFormApi<
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

function LocalSubscribe({
  form,
  selector = (state) => { throw new Error("STUB"); },
  children,
}: PropsWithChildren<{
  form: AnyFormApi
  selector?: (state: AnyFormState) => AnyFormState
}>): ReturnType<FunctionComponent> {
    throw new Error("STUB");
}

/**
 * A custom React Hook that returns an extended instance of the `FormApi` class.
 *
 * This API encapsulates all the necessary functionalities related to the form. It allows you to manage form state, handle submissions, and interact with form fields
 */
export function useForm<
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
  const fallbackFormId = useFormId()
  const [prevFormId, setPrevFormId] = useState<string>(opts?.formId as never)

  const [formApi, setFormApi] = useState(() => {
      throw new Error("STUB");
  })

  if (prevFormId !== opts?.formId) {
    const formId = opts?.formId ?? fallbackFormId
    setFormApi(new FormApi({ ...opts, formId }))
    setPrevFormId(formId)
  }

  const extendedFormApi = useMemo(() => {
      throw new Error("STUB");
  }, [formApi])

  useIsomorphicLayoutEffect(formApi.mount, [])

  /**
   * formApi.update should not have any side effects. Think of it like a `useRef`
   * that we need to keep updated every render with the most up-to-date information.
   */
  useIsomorphicLayoutEffect(() => {
      throw new Error("STUB");
  })

  const hasRan = useRef(false)

  useIsomorphicLayoutEffect(() => {
      throw new Error("STUB");
  }, [formApi, opts?.transform])

  useIsomorphicLayoutEffect(() => {
      throw new Error("STUB");
  })

  return extendedFormApi
}
