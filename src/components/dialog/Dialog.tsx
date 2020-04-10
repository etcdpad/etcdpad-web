import { Component, Prop } from 'vue-property-decorator'
import { Vue, } from '@/tsx'
import style from './style.module.css'

const headerHeigth = parseInt(style.fontSize)
const headerPadding = parseInt(style.headerPadding)

const base = 2*headerHeigth + 2*headerPadding

export interface VDialog {
    value: boolean
    noShadow?: boolean
    noClose?: boolean
    noFooter?: boolean
    title?: string
    width?: number
    height?: number
}
export interface VDialogEvent {
    onInput: boolean
    onClose: void
    onOk: void
    onCancel: void
}

@Component
export default class Dialog extends Vue<VDialog, VDialogEvent> {
    @Prop()
    private value!: boolean
    @Prop({ default: 600 })
    private width!: number
    @Prop({ default: 400 })
    private height!: number
    @Prop({ default: '' })
    private title!: string
    @Prop({ default: false })
    private noShadow!: boolean
    @Prop({ default: false })
    private noClose?: boolean
    @Prop({ default: false })
    private noFooter?: boolean
    private get contentStyle() {
        return {
            height: `calc(${this.height}px - ${base}px)`
        }
    }
    private get style() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const style: any = {}
        if (this.width) style.flexBasis = this.width + 'px'
        if (this.height) style.height = this.height + 'px'
        return style
    }
    private click() {
        this.$emit('ok')
    }
    private cancel() {
        this.$emit('cancel')
    }
    private close(event: MouseEvent) {
        event.preventDefault()
        event.stopPropagation()
        this.$emit('input', false)
        this.$emit('close')
    }
    public render() {
        return <div class={style.dialog} v-show={this.value}>
            { this.noShadow ? undefined : <div class={style.shadow} onClick={this.close}></div> }
            <div class={style.main} style={this.style}>
                <div class={style.header}>
                    <div class={style.title}>
                        { this.$slots.title ?? <h2>{this.title}</h2> }
                    </div>
                    {
                        this.noClose ? undefined :
                    <span class={style.close} onClick={this.close}>
                        <i class="icon icon-close"></i>
                    </span>
                    }
                </div>
                <div class={style.content} style={this.contentStyle}>
                    {this.$slots.default}
                </div>
                {
                    this.noFooter ? undefined :
                    <div class={style.footer}>
                        {this.$slots.footer ?? <div class={style.footer__default}>
                            <span class={style.btn} onClick={this.cancel}>Cancel</span>
                            <span class={style.ok} onClick={this.click}>OK</span>
                        </div>}
                    </div>
                }
            </div>
        </div>
    }
}
