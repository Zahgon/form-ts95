import { For, Show, createMemo } from 'solid-js'
import { JsonTree } from '@tanstack/devtools-ui'
import { useStyles } from '../styles/use-styles'
import { useFormEventClient } from '../contexts/eventClientContext'
import { ActionButtons } from './ActionButtons'
import { StateHeader } from './StateHeader'

import type { Accessor } from 'solid-js'

type DetailsPanelProps = {
  selectedKey: Accessor<string>
}

export function DetailsPanel({ selectedKey }: DetailsPanelProps) {
    throw new Error("STUB");
}
