import { editor } from 'monaco-editor'
import { ofType } from '@/tsx'
import VCodeEditor from './CodeEditor.vue'

export interface CodeEditorParams {
    value?: string
    options?: editor.IStandaloneEditorConstructionOptions
    readOnly?: string
    language?: string
    width?: string
    height?: string
    onPasteFormat?: (code: string) => string
}

export interface CodeEditorEvents {
    onInput: string
    onChange: string
    onSave: string
}

export const CodeEditor = ofType<CodeEditorParams, CodeEditorEvents>().convert(VCodeEditor)
export type CodeEditor = VCodeEditor & {
    layout: () => void
}
