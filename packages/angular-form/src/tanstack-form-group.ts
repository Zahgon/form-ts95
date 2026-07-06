import {
  ChangeDetectorRef,
  Directive,
  Injector,
  OnInit,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  untracked,
} from '@angular/core'
import { FormApi, FormGroupApi, FormGroupApiOptions } from '@tanstack/form-core'
import { injectStore } from '@tanstack/angular-store'
import type {
  DeepKeys,
  DeepValue,
  FieldLikeMeta,
  FormAsyncValidateOrFn,
  FormGroupAsyncValidateOrFn,
  FormGroupListeners,
  FormGroupState,
  FormGroupValidateOrFn,
  FormGroupValidators,
  FormValidateOrFn,
} from '@tanstack/form-core'

@Directive({
  selector: '[tanstackFormGroup]',
  standalone: true,
  exportAs: 'formGroup',
})
export class TanStackFormGroup<
  TParentData,
  const TName extends DeepKeys<TParentData>,
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
  TSubmitMeta,
  TFormOnMount extends undefined | FormValidateOrFn<TParentData>,
  TFormOnChange extends undefined | FormValidateOrFn<TParentData>,
  TFormOnChangeAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnBlur extends undefined | FormValidateOrFn<TParentData>,
  TFormOnBlurAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnSubmit extends undefined | FormValidateOrFn<TParentData>,
  TFormOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnDynamic extends undefined | FormValidateOrFn<TParentData>,
  TFormOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnServer extends undefined | FormAsyncValidateOrFn<TParentData>,
  TParentSubmitMeta,
> implements OnInit {
  name = input.required<TName>()
  defaultValue = input<NoInfer<TData>>()
  asyncDebounceMs = input(undefined as never as number, {
    transform: numberAttribute,
  })
  asyncAlways = input(undefined as never as boolean, {
    transform: booleanAttribute,
  })
  canSubmitWhenInvalid = input(undefined as never as boolean, {
    transform: booleanAttribute,
  })
  tanstackFormGroup =
    input.required<
      FormApi<
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
    >()

  validators =
    input<
      NoInfer<
        FormGroupValidators<
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
      >
    >()

  listeners = input<NoInfer<FormGroupListeners<TParentData, TName, TData>>>()

  defaultMeta =
    input<
      Partial<
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
        >
      >
    >()

  defaultState = input<Partial<FormGroupState>>()

  onSubmitMeta = input<NoInfer<TSubmitMeta>>()

  onGroupSubmit =
    input<
      NoInfer<
        FormGroupApiOptions<
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
        >['onGroupSubmit']
      >
    >()

  onGroupSubmitInvalid =
    input<
      NoInfer<
        FormGroupApiOptions<
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
        >['onGroupSubmitInvalid']
      >
    >()

  mode = input<'value' | 'array'>()

  _api = computed(() => {
      throw new Error("STUB");
  })

  get api(): FormGroupApi<
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
      throw new Error("STUB");
  }

  options = computed(
    () =>
      { throw new Error("STUB"); },
  )

  injector = inject(Injector)

  constructor() {
      throw new Error("STUB");
  }

  cd = inject(ChangeDetectorRef)

  ngOnInit() {
      throw new Error("STUB");
  }
}
