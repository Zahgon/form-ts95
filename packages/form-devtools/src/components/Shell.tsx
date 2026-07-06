import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import { Header, HeaderLogo, MainPanel } from '@tanstack/devtools-ui'
import { useStyles } from '../styles/use-styles'
import { UtilList } from './UtilList'
import { DetailsPanel } from './DetailsPanel'

import type { Accessor } from 'solid-js'

export function Shell() {
    throw new Error("STUB");
}
