import { formEventClient } from '@tanstack/form-core'

import { useStyles } from '../styles/use-styles'

import type { Accessor } from 'solid-js'
import type { DevtoolsFormState } from '../contexts/eventClientContext'

type ActionButtonsProps = {
  selectedInstance: Accessor<DevtoolsFormState | null | undefined>
}

export function ActionButtons(props: ActionButtonsProps) {
    throw new Error("STUB");
}
