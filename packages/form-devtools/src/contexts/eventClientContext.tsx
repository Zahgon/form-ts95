import dayjs from 'dayjs'
import {
  createContext,
  createEffect,
  createMemo,
  onCleanup,
  useContext,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { formEventClient } from '@tanstack/form-core'

import type { ParentComponent } from 'solid-js'
import type {
  AnyFormOptions,
  AnyFormState,
  BroadcastFormSubmissionState,
} from '@tanstack/form-core'
import type { Dayjs } from 'dayjs'

type BroadcastFormSubmissionStateWithoutId =
  BroadcastFormSubmissionState extends infer T
    ? T extends any
      ? Omit<T, 'id'>
      : never
    : never

export type DevtoolsFormState = {
  id: string
  state: AnyFormState
  date: Dayjs
  options: AnyFormOptions
  history: Array<BroadcastFormSubmissionStateWithoutId>
}

function useProviderValue() {
  const [store, setStore] = createStore<Array<DevtoolsFormState>>([])

  createEffect(() => {
      throw new Error("STUB");
  })

  createEffect(() => {
      throw new Error("STUB");
  })

  createEffect(() => {
      throw new Error("STUB");
  })

  createEffect(() => {
      throw new Error("STUB");
  })

  return { store }
}

type ContextType = ReturnType<typeof useProviderValue>

const FormEventClientContext = createContext<ContextType | undefined>(undefined)

export const FormEventClientProvider: ParentComponent = (props) => {
    throw new Error("STUB");
}

export function useFormEventClient() {
    throw new Error("STUB");
}
