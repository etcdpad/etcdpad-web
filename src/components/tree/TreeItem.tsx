import { Component, Prop, Inject } from 'vue-property-decorator'
import { Vue } from '@/tsx'
import { ITreeNode, TreeNodeType, isDir } from './common'
import style from './tree.module.less'

export interface VTreeItem<T> {
    activeNode?: ITreeNode<T>
    data: ITreeNode<T>
    collapses: Record<string, boolean>
}
export interface VTreeMenuEvent<T> {
    x: number
    y: number
    node: ITreeNode<T>
}

@Component
export default class TreeItem<T> extends Vue<VTreeItem<T>> {
    @Prop()
    private readonly activeNode?: ITreeNode<T>
    @Prop({ required: true })
    private collapses!: Record<string, boolean>
    @Prop({ required: true })
    private data!: ITreeNode<T>
    private get collapse(): boolean {
        return !!this.collapses[this.data.fullPath]
    }
    private get collapseClass() {
        if (this.data.type === TreeNodeType.File) return ['icon', 'icon-empty-collapse']
        return ['icon', this.collapse ? 'icon-expand' : 'icon-collapse']
    }
    private get active(): boolean {
        return this.data.fullPath === this.activeNode?.fullPath
    }
    private get icon(): string[] {
        const clazz = ['icon']
        switch (this.data.type) {
            case TreeNodeType.FileDirectory:
                clazz.push('icon-folder-file')
                break
            case TreeNodeType.Directory:
                clazz.push('icon-folder')
                break
            case TreeNodeType.File:
                clazz.push('icon-file')
                break
        }
        return clazz
    }
    protected render() {
        const clazz = ['tree-item']
        if (this.active) clazz.push('active')
        const sublist = isDir(this.data) ? this.data.children.map(child =>
            <TreeItem collapses={this.collapses} data={child} key={child.fullPath}></TreeItem>
        ) : []
        return <li class={ this.active ? style.item__active : style.item }>
            <div class={ style.subtitle } onClick={this.handleClick} onContextmenu={this.handleCentextMenu} onDblclick={this.toggleSelf}>
                <div class={ style.title }>
                    <i class={ this.collapseClass} onClick={this.toggleSelf}></i>
                    <i class={this.icon}></i>
                    <span class="text">{this.data.name}</span>
                </div>
                <div class={ style.wrapper }></div>
            </div>
            <ul class={ style.sublist } v-show={this.collapse}>
                {
                    sublist
                }
            </ul>
        </li>
    }
    private handleClick(event: MouseEvent) {
        event.stopPropagation()
        event.preventDefault()
        this.chooseItem(this.data)
    }
    private toggleSelf(event: MouseEvent) {
        event.stopPropagation()
        event.preventDefault()
        this.toggleItem(this.data)
    }
    @Inject()
    private toggleItem!: (node: ITreeNode<T>) => void
    @Inject()
    private chooseItem!: (node: ITreeNode<T>) => void
    @Inject()
    private handleMenu!: (event: VTreeMenuEvent<T>) => void
    private handleCentextMenu(event: MouseEvent) {
        event.preventDefault()
        event.stopPropagation()
        this.chooseItem(this.data)
        // this.$emit('menu', {
        //     x: event.x,
        //     y: event.y,
        //     node: this.data
        // })
        this.handleMenu({
            x: event.x,
            y: event.y,
            node: this.data
        })
    }
}
