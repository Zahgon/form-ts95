import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js'

import { useStyles } from '../styles/use-styles'

import type { Accessor } from 'solid-js'
import type { DevtoolsFormState } from '../contexts/eventClientContext'

dayjs.extend(relativeTime)

type StateHeaderProps = {
  selectedInstance: Accessor<DevtoolsFormState | null | undefined>
}

export function StateHeader(props: StateHeaderProps) {
    throw new Error("STUB");
}
