import { Component, Prop, Ref } from 'vue-property-decorator'
import { Vue } from '@/tsx'
import style from './style.module.css'
import { Icon } from '@/components/icon'
const DEFAULT_TRANSITION_DURATION_MS = 1000

interface CopyTextViewParam {
    label?: string
    value: string
    noborder?: boolean
    dark?: boolean
}

interface CopyTextViewEvent {
    onCopy: void
}

@Component
export default class CopyTextView extends Vue<CopyTextViewParam, CopyTextViewEvent> {
    @Prop()
    private label?: string
    @Prop({ required: true })
    private value!: string
    @Prop({ required: false })
    private noborder!: boolean
    @Prop({ required: false })
    private dark!: boolean
    private type: 'md-copy' | 'md-done-all' = 'md-copy'
    private color: '#808695' | '#19be6b' = '#808695'
    private timer?: number
    @Ref('text')
    private text!: HTMLDivElement
    public selectAll() {
        const selection = window.getSelection()
        if (!selection) return
        const range = document.createRange()
        range.selectNodeContents(this.text)
        selection.removeAllRanges()
        selection.addRange(range)
    }
    public copy() {
        if (this.type === 'md-copy') {
            this.selectAll()
            if (document.execCommand('copy')) {
                this.showDone()
            }
        }
    }
    private done() {
        this.type = 'md-done-all'
        this.color = '#19be6b'
        this.$emit('copy')
    }
    private reset() {
        this.type = 'md-copy'
        this.color = '#808695'
        clearTimeout(this.timer)
        this.timer = 0
    }
    private showDone() {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = 0
        }
        this.done()
        this.timer = setTimeout(() => {
            this.reset()
        }, DEFAULT_TRANSITION_DURATION_MS)
    }
    public render() {
        return <div class={[ this.noborder ? style.text_pb__noborder : style.text_pb, this.dark ? style.dark : undefined ]}>
            {
                !this.label ? undefined :
                <div class={style.label}>{this.label}</div>
            }
            <div class={style.preview} onDblclick={this.selectAll} ref="text">{this.value}</div>
            <div class={style.btn} onClick={this.copy}>
                <Icon color={this.color} type={this.type}></Icon>
            </div>
        </div>
    }
}
