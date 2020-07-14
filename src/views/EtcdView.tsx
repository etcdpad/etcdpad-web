import { Component, Prop, Emit, Ref } from 'vue-property-decorator'
import { ChannelState, Channel } from 'node-channel'
import { Vue } from '@/tsx'
import { TreeView, ITreeNode, isFile, isDir } from '@/components/tree'
import { SpliterPanel } from '@/components/spliter_panel'
import { TabPane, Tabs } from '@/components/tabs'
import { CodeEditor, CodeEditorEvents } from '@/components/editor'
import { Dialog } from '@/components/dialog'
import { EtcdPad, EtcdPadEvent } from '@/api'
import { KeyOnly, KeyValue, EtcdCreateEvent, EtcdDeleteEvent, EtcdUpdateEvent, EtcdEventType } from '@/spec'
import { key2paths, DirTreeRoot } from '@/utils/dir_tree'
import { decode } from '@/utils/base64'
import style from './etcd.module.css'
import { MenuItem } from '@/components/tree/TreeView'
import CopyTextView from '@/components/copytextview'

export interface EtcdViewParams {
    dsn: string
}

interface EditorValue {
    key: string
    value: string
    ssv: string
    createRevision: number
    modeRevision: number
    version: number
    lease: number
}

enum Language {
    PlainText = 'plaintext',
    Json = 'json',
}
enum TrimType {
    None = 0,
    Key = 1,
    Value = 2,
    Both = 3,
}

const DSN_REGEXP = /^(?:etcd:\/\/)?(?:([^@]+)@)?([^/]+)(?:([a-zA-Z0-9/_-]+)(?:\?(.+))?)?$/
const BASE_PATH = function(path: string): string {
    if (path.endsWith('/')) return path
    const index = path.lastIndexOf('/')
    if (index > 0) {
        return path.slice(0, index)
    }
    return '/'
}(location.pathname)
const CORE_URL = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${BASE_PATH}epad/ws`

@Component
export default class EtcdView extends Vue<EtcdViewParams> {
    @Prop()
    private dsn!: string
    private etcdpad = new EtcdPad(CORE_URL, this.dsn)
    private data = new Map<string, KeyOnly>()
    private channel?: Channel<KeyOnly>
    // eslint-disable
    private values: EditorValue[] = []
    private tabActive = ''
    private isShowAddDialog = false
    private createKey = ''
    private createValue = ''
    private createLang: Language = Language.PlainText
    private autoTrim: TrimType = TrimType.None
    private closeTab(key: string): void {
        const index = this.values.findIndex(x => x.key === key)
        if (index > -1) {
            this.values.splice(index, 1)
        }
        if (this.tabActive === key) {
            if (index > 0) {
                this.tabActive = this.values[index - 1].key
            } else if (this.values.length > 0) {
                this.tabActive = this.values[0].key
            } else {
                this.tabActive = ''
            }
        }
    }
    private reflash() {
        this.updateRoot()
    }
    // eslint-enable
    private async mounted() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).etcdpad = this.etcdpad;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).tree = this.tree
        // eslint-disable-next-line
        this.data = (window as any).etcd_data = new Map<string, KeyOnly>()
        this.etcdpad.once(EtcdPadEvent.Open, this.updateRoot)
        this.etcdpad.once(EtcdPadEvent.Reconnect, this.updateRoot)
        this.etcdpad.on(EtcdPadEvent.Data, this.changeData)
    }
    private changeData(event: EtcdCreateEvent | EtcdDeleteEvent | EtcdUpdateEvent) {
        switch (event.type) {
            case EtcdEventType.Create:
                for (const item of event.kvs) {
                    this.tree.append(key2paths(item.key), item)
                    this.data.set(decode(item.key), item)
                    const value = this.values.find(x => x.key === decode(item.key))
                    if (value) {
                        value.value = decode(item.value)
                    }
                }
                break
            case EtcdEventType.Delete: {
                this.tree.remove(key2paths(event.prev_kv.key))
                this.data.delete(decode(event.prev_kv.key))
                const value = this.values.find(x => x.key === decode(event.prev_kv.key))
                if (value) {
                    value.value = ''
                }
                break
            }
            case EtcdEventType.Update: {
                for (const item of event.kvs) {
                    this.tree.change(key2paths(item.key), item)
                    const key = decode(item.key)
                    this.data.set(key, item)
                    const value = this.values.find(x => x.key === key)
                    if (value) {
                        const newVal = decode(item.value)
                        if (value.ssv === value.value) {
                            value.value = newVal
                        }
                        value.createRevision = item.create_revision
                        value.modeRevision = item.mod_revision
                        value.version = item.version
                        value.ssv = newVal
                    }
                }
                break
            }
        }
    }
    private async updateRoot() {
        if (this.channel) {
            this.channel.close()
        }
        const path = DSN_REGEXP.exec(this.dsn)
        if (!path) {
            // eslint-disable-next-line no-console
            console.error('[parse dsn]', DSN_REGEXP, this.dsn)
            return
        }
        const [endpoints, auth, hosts, prefix = '\x00', options = {}] = path
        // eslint-disable-next-line no-console
        console.info('[updateRoot] [%s] [%s] prefix: [%s], option:', auth, endpoints, prefix, options)
        const chan = this.channel = await this.etcdpad.get(prefix, true)
        this.data = new Map<string, KeyOnly>()
        this.tree = new DirTreeRoot<KeyOnly>(hosts, '/')
        while (chan.state !== ChannelState.CLosed) {
            const item = await chan.get()
            if (!item) continue
            const key = decode(item.key)
            this.data.set(key, item)
            const paths = key.split(/\//g)
            this.tree.append(paths, item)
        }
    }
    private async save(key: string, value: string) {
        if (this.data.get(key)?.value === value) return
        if (!await this.etcdpad.put(key, value)) {
            // eslint-disable-next-line no-console
            console.error('[save]', [key, value])
        }
    }
    private menulist: MenuItem<KeyOnly>[] = [{
        id: 'delete_key',
        title: 'Delete this key',
        disable: node => !isFile(node),
    }, {
        id: 'delete_prefix',
        title: 'Delete this prefix',
        disable: node => !isDir(node),
    }, {
        id: 'history',
        title: 'Last Version (Coming soon)',
        disable: () => true,
    }]
    @Ref('editor')
    private editor!: CodeEditor
    private tree = new DirTreeRoot<KeyOnly>('/localhost', '/')
    private showAddDialog() {
        this.isShowAddDialog = true
        this.$nextTick(() => {
            this.editor.layout()
        })
    }
    private async delete(path: string, prefix: boolean) {
        try {
            await this.etcdpad.del(path, prefix)
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[create fail]', err)
            alert('create fail')
            return
        }
    }
    private async handleMenu(payload: { node: ITreeNode<KeyOnly>; id: string }) {
        switch(payload.id) {
            case 'delete_key':
                return this.delete(payload.node.fullPath, false)
            case 'delete_prefix':
                return this.delete(payload.node.fullPath, true)
            case 'history':
                return
        }
    }
    private async addRecord() {
        const key = (this.autoTrim & TrimType.Key) ? this.createKey.trim() : this.createKey
        const value = (this.autoTrim & TrimType.Value) ? this.createValue.trim() : this.createValue
        if (key && value) {
            try {
                await this.etcdpad.put(key, value)
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[create fail]', err)
                alert('create fail')
                return
            }
            this.isShowAddDialog = false
        }
    }
    private ensureOpen(item: KeyValue) {
        const key = decode(item.key)
        if (this.values.findIndex(x => x.key === key) === -1) {
            this.values.push({
                key,
                value: decode(item.value),
                ssv: decode(item.value),
                createRevision: item.create_revision,
                modeRevision: item.mod_revision,
                version: item.version,
                lease: item.lease,
            })
        }
        this.tabActive = key
    }
    private async handleTree(node: ITreeNode<KeyOnly>) {
        if (!isFile(node)) return
        if (node.stat.value === undefined) {
            const [kv] = await this.etcdpad.get(node.fullPath)
            node.stat.value = kv.value
        }
        this.ensureOpen(node.stat as KeyValue)
    }
    protected render() {
        return <div class={ style.etcdview }>
            <SpliterPanel value={ 400 } min={ 400 } max={ 800 }>
                <TreeView data={this.tree} menulist={this.menulist} onChoose={this.handleTree} onMenu={this.handleMenu} slot="front">
                    <div class="btn-group" slot="helper">
                        <button onClick={ this.showAddDialog }>Add New</button>
                        <button onClick={ this.reflash }>Reflash</button>
                    </div>
                </TreeView>
                <Tabs class={style.preview} onClose={this.closeTab} onInput={v => this.tabActive = v} value={this.tabActive} slot="end">
                    { this.values.map(x => {
                        return <TabPane isModify={ x.value !== x.ssv } name={x.key} title={x.key} key={x.key}>
                            <EditorPane x={x} key={x.key} onInput={ value => x.value = value } onSave={value => this.save(x.key, value)}></EditorPane>
                        </TabPane>
                    })}
                </Tabs>
            </SpliterPanel>
            <Dialog width={1000} height={600} value={this.isShowAddDialog} onInput={v => this.isShowAddDialog = v} onOk={this.addRecord} title="test dialog">
                <div class={style.keyline} >
                    <div class={style.key}>
                        <input type="text" placeholder="Key" value={this.createKey} onInput={event => this.createKey = event.target.value as string}/>
                    </div>
                    <div class={style.options}>
                        <label>
                            lang:
                            <select value={this.createLang} onInput={event => this.createLang = event.target.value as Language}>
                                {Object.keys(Language).filter(x => isNaN(parseInt(x, 10))).map((key) => <option value={Language[key as keyof typeof Language]}>{key}</option>)}
                            </select>
                        </label>
                        <label>auto trim                            <select value={this.autoTrim} onInput={event => this.autoTrim = event.target.value as TrimType}>
                                {Object.keys(TrimType).filter(x => isNaN(parseInt(x, 10))).map((key) => <option value={TrimType[key as keyof typeof TrimType]}>{key}</option>)}
                            </select>
                        </label>
                    </div>
                </div>
                <CodeEditor ref="editor" value={this.createValue} onInput={value => this.createValue = value} language={this.createLang}></CodeEditor>
            </Dialog>
        </div>
    }
}

function isJson(json: string): boolean {
    if (/^\s*[{[]/.test(json) && /[\]}]\s*$/) {
        try {
            JSON.parse(json)
            return true
        } catch (error) {
            return false
        }
    }
    return false
}

@Component
class EditorPane extends Vue<{x: EditorValue}, CodeEditorEvents> {
    @Prop()
    x!: EditorValue
    get lang() {
        return isJson(this.x.value) ? 'json' : 'text'
    }
    public render() {
        return <div class={style.preview}>
            <CodeEditor value={this.x.value} onChange={this.change} style="height: calc(100% - 31px);" onInput={this.input} onSave={this.save} language={this.lang}></CodeEditor>
            <div class={style.toolbar}>
                <CopyTextView dark noborder label="Full Key" value={this.x.key}></CopyTextView>
                <CopyTextView dark noborder label="Create Revision" value={this.x.createRevision.toString()}></CopyTextView>
                <CopyTextView dark noborder label="Mod Revision" value={this.x.modeRevision.toString()}></CopyTextView>
                <CopyTextView dark noborder label="version" value={this.x.version.toString()}></CopyTextView>
            </div>
        </div>
    }
    @Emit('save')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    private save(value: string) {}
    @Emit('change')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    private change(value: string) {}
    @Emit('input')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    private input(value: string) {}
}
