import { createServerFn } from '@tanstack/react-start'
import {
  deleteInternalTanStackCookie,
  getInternalTanStackCookie,
} from './utils'
import type { ServerFormState } from '@tanstack/react-form'

export const initialFormState = {
  errorMap: {
    onServer: undefined,
  },
  errors: [],
}

export const getFormData = createServerFn().handler(async () => {
    throw new Error("STUB");
})
