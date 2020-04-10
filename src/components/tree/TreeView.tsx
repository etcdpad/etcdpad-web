import { Component, Prop, Provide } from 'vue-property-decorator'
import { Vue } from '@/tsx'
import { ScrollView } from '@/components/scrollview'
import TreeItem, { VTreeMenuEvent } from './TreeItem'
import { ITreeNode } from './common'
import style from './tree.module.less'

export interface VTreeView<T> {
    data: ITreeNode<T>
    menulist?: MenuItem<T>[]
}
export interface VTreeViewEvent<T> {
    onChoose: ITreeNode<T>
    onMenu: {
        node: ITreeNode<T>
        id: string
    }
}
export interface MenuItem<T> {
    title: string
    id: string
    show?: (item: ITreeNode<T>) => boolean
    disable?: (item: ITreeNode<T>) => boolean
}

@Component
export default class TreeView<T> extends Vue<VTreeView<T>, VTreeViewEvent<T>> {
    @Prop({ required: true })
    public data!: ITreeNode<T>
    @Prop({ default: () => [] })
    private menulist!: MenuItem<T>[]
    private menuActive = false
    private activeNode = this.data
    protected render() {
        return <div class={ style.view }>
            <div class={style.helper}>
                { this.$slots.helper }
            </div>
            <ScrollView class={style.view}>
                <div class={ style.main }>
                    <ul class={ style.sublist } onContextmenu={this.end}>
                        <TreeItem
                            class={style.wrap}
                            collapses={this.collapses}
                            data={this.data}
                        ></TreeItem>
                        <div class={style.padding}></div>
                    </ul>
                </div>
            </ScrollView>
            <div class={this.menuActive ? style.menu_active : style.menu}
                onClick={() => this.menuActive = false}
                onContextmenu={() => this.menuActive = false}
            >
                <div class={style.menuWrap} style={this.menuPosition}>
                    { this.menulist.map(x => 
                    (x.disable ? x.disable(this.activeNode) : true) ?
                    <div v-show={x.show ? x.show(this.activeNode) : true} class={ style.menuItem__disable } onClick={this.end}>{x.title}</div>
                    :
                    <div v-show={x.show ? x.show(this.activeNode) : true} class={ style.menuItem } onClick={this.handleMenuItem(x.id)}>{x.title}</div>
                    ) }
                </div>
            </div>
        </div>
    }
    private collapses: Record<string, boolean> = {
        '/': true
    }
    private menuPosition = {
        left: '120px',
        top: '200px'
    }

    private handleMenuItem(id: string) {
        return (event: MouseEvent) => {
            event.preventDefault()
            event.stopPropagation()
            this.menuActive = false
            this.$emit('menu', {
                node: this.activeNode,
                id,
            })
        }
    }
    private end(event: MouseEvent) {
        event.preventDefault()
        event.stopPropagation()
    }
    @Provide()
    private toggleItem(node: ITreeNode<T>) {
        this.$set(this.collapses, node.fullPath, !this.collapses[node.fullPath])
    }
    @Provide()
    private chooseItem(node: ITreeNode<T>) {
        this.activeNode = node
        this.$emit('choose', node)
    }
    @Provide()
    private handleMenu(event: VTreeMenuEvent<T>) {
        this.chooseItem(event.node)
        if (this.menulist.length === 0) return
        this.menuActive = true
        // tslint:disable: no-magic-numbers
        this.menuPosition.left = event.x + 'px'
        this.menuPosition.top = event.y + 'px'
        // tslint:enable: no-magic-numbers
    }
}
