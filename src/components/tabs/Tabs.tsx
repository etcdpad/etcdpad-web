import { Component, Prop } from 'vue-property-decorator'
import { Vue, } from '@/tsx'
import { ScrollView } from '@/components/scrollview'
import { VTabPane } from './TabPane'
import style from './style.module.css'
import { VNode } from 'vue/types/umd'

export interface VTabs {
    value: string
}
export interface VTabsEvent {
    onInput: string
    onClose: string
}

function addClass(node: VNode, ...clazz: string[]): void {
    if (!node.data) {
        node.data = {}
    }

    if (typeof node.data.class === 'string') {
        node.data.class = node.data.class.split(/\s+/g)
    }
    if (Array.isArray(node.data.class)) {
        node.data.class.push(...clazz)
        return
    }
    node.data.class = clazz
}

@Component
export default class Tabs extends Vue<VTabs, VTabsEvent> {
    @Prop()
    private value!: string
    private click(item: string): (event: MouseEvent) => void {
        return (event: MouseEvent) => {
            event.preventDefault()
            event.stopPropagation()
            this.$emit('input', item)
        }
    }
    private close(item: string): (event: MouseEvent) => void {
        return (event: MouseEvent) => {
            event.preventDefault()
            event.stopPropagation()
            this.$emit('close', item)
        }
    }
    public render() {
        return <div class={style.tabs}>
            <div class={style.tabbar}>
                <ScrollView direction="horizontal" quite>
                    {this.$slots.default?.map(x => {
                        const node = x.componentOptions?.propsData as VTabPane
                        return <div class={node.name === this.value ? style.tab_active : style.tab} onClick={this.click(node.name)}>
                            <span class={node.isModify ? style.icon_modify : style.icon}></span>
                            <span class={style.title}>{(x.componentOptions?.propsData as VTabPane).title ?? ''}</span>
                            <span class={style.btnClose} onClick={this.close(node.name)}>
                                <i class="icon icon-close"></i>
                            </span>
                        </div>
                    })}
                </ScrollView>
            </div>
            <div class={style.panes}>
                {this.$slots.default?.map(x => {
                    addClass(x, (x.componentOptions?.propsData as VTabPane).name === this.value ? style.pane_active : style.pane)
                    return x
                })}
            </div>
        </div>
    }
}
