import { Component, Prop } from 'vue-property-decorator'
import { Vue } from '@/tsx'
import style from './style.module.css'

export interface VTabPane {
    name: string
    isModify?: boolean
    readonly title: string
}
@Component
export default class TabPane extends Vue<VTabPane> {
    @Prop()
    private name!: string
    @Prop({ default: false })
    private isModify!: boolean
    @Prop()
    public readonly title!: string 
    get slots(): JSX.Element[] | undefined {
        return this.$slots.default
    }
    public render() {
        return <div class={style.pane}>
            {this.slots}
        </div>
    }
}
