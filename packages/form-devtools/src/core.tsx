import { constructCoreClass } from '@tanstack/devtools-utils/solid'

export interface FormDevtoolsInit {}

const [FormDevtoolsCore, FormDevtoolsCoreNoOp] = constructCoreClass(
  () => { throw new Error("STUB"); },
)

export { FormDevtoolsCore, FormDevtoolsCoreNoOp }
