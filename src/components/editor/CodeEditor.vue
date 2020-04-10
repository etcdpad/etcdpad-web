<template>
    <div class="editor" :style="editorSize" ref="editor" @keydown.stop="noop" @keyup.stop="noop" @keypress.stop="noop"></div>
</template>

<script lang="ts">
import * as monaco from 'monaco-editor'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'

const DEFAULT_OPTION = {
    theme: 'vs-dark',
}

@Component
export default class Editor extends Vue {
    public editor!: monaco.editor.IStandaloneCodeEditor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private get editorSize(): any {
        return {
            width: this.width.endsWith('%') ? this.width : (this.width + 'px'),
            height: this.height.endsWith('%') ? this.height : (this.height + 'px'),
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private get editorOptions(): any {
        return {
            readOnly: this.readOnly,
            language: this.language,
            ...this.options,
        }
    }
    @Prop({ type: String, default: ''})
    private value!: string
    @Prop({type: Object, default() {return {}}})
    private options!: monaco.editor.IStandaloneEditorConstructionOptions
    @Prop({type: Boolean, default: false})
    private readOnly!: boolean
    @Prop({type: String, default: 'plain'})
    private language!: string
    @Prop({type: String, default: '100%'})
    private width!: string
    @Prop({type: String, default: '100%'})
    private height!: string
    @Prop()
    private onPasteFormat?: (code: string) => string
    private innerValue = this.value
    @Watch('width')
    @Watch('height')
    public layout() {
        this.editor.layout()
    }
    @Watch('options')
    @Watch('readOnly')
    @Watch('language')
    private updateEditorOption() {
        this.editor.updateOptions({...DEFAULT_OPTION, ...this.editorOptions})
        const model = this.editor.getModel()
        if (model)
            monaco.editor.setModelLanguage(model, this.language)
    }
    @Watch('value')
    private updateValue() {
        if (this.value === this.innerValue) return
        this.innerValue = this.value
        this.editor.setValue(this.value)
    }
    private mounted() {
        this.editor = monaco.editor.create((this.$refs.editor as HTMLElement), {
            ...DEFAULT_OPTION,
            ...this.editorOptions,
            value: this.value,
        })
        this.editor.addAction({
            id: 'save-file',
            label: 'Save',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
            ],
            run: (editor) => {
                this.$emit('save', editor.getValue())
            }
        })
        this.editor.onDidChangeModelContent(() => {
            const value = this.editor.getValue()
            if (value === this.innerValue) return
            this.innerValue = value
            this.$emit('input', this.innerValue)
        })
        this.editor.onDidBlurEditorText(() => {
            this.$emit('change', this.innerValue)
        })
        if (this.onPasteFormat) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.editor as any).onDidPaste((range: monaco.Range) => {
                if (!this.onPasteFormat) return
                const model = this.editor.getModel()
                if (model === null) {
                    return
                }
                const text = model.getValueInRange(range)
                this.editor.executeEdits('', [{
                    range,
                    text: this.onPasteFormat(text),
                }])
                this.editor.pushUndoStop()
            })
        }
    }
    private updated() {
        this.$nextTick(() => this.layout())
        setTimeout(() => this.layout(), 1000)
    }
    private created() {
        window.addEventListener('resize', this.layout)
    }
    private beforeDestroy() {
        window.removeEventListener('resize', this.layout)
    }
    private noop() {
        // noop
    }
}
</script>
