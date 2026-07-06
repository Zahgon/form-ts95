import { For } from 'solid-js'
import clsx from 'clsx'

import { useStyles } from '../styles/use-styles'
import { useFormEventClient } from '../contexts/eventClientContext'

type UtilListProps = {
  selectedKey: () => string | null
  setSelectedKey: (key: string | null) => void
}

export function UtilList(props: UtilListProps) {
    throw new Error("STUB");
}
