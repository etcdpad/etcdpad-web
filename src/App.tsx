import { Component, Vue } from 'vue-property-decorator'
import EtcdView from '@/views/EtcdView'
import '@/assets/iconfont.css'
import { Dialog } from './components/dialog'

const LAST_ETCD_DSN_LIST = 'LAST_ETCD_DSN_LIST'

function uniq<T>(list: T[]): T[] {
    const set = new Set<T>()
    const res: T[] = []
    for (const item of list) {
        if (!set.has(item)) {
            res.push(item)
        }
        set.add(item)
    }
    set.clear()
    return res
}
@Component
export default class App extends Vue<{}> {
    private recentList: string[] = JSON.parse(localStorage.getItem(LAST_ETCD_DSN_LIST) ?? '[]') ?? []
    private etcddsn = this.recentList[0] ?? ''
    private done = false
    private connect(dsn: string) {
        if (!dsn) return
        this.recentList.unshift(dsn)
        this.recentList = uniq(this.recentList)
        this.etcddsn = this.recentList[0]
        localStorage.setItem(LAST_ETCD_DSN_LIST, JSON.stringify(this.recentList))
        this.done = true
    }
    protected render() {
        return <div id="app">
            { this.done ? 
            <EtcdView dsn={this.etcddsn}></EtcdView>
            :
            <Dialog value={!this.done} noClose noFooter title="Input etcd endpoints">
                <input type="text" value={this.etcddsn} onInput={ event => this.etcddsn = (event.target.value as string).trim() } placeholder="etcd://[username:password@]host1:port1[,...hostN:portN][/[defaultPrefix][?options]]"></input>
                <button type="button" onClick={() => this.connect(this.etcddsn)}>Connect</button>
                <ol>
                    {
                        this.recentList.map(x => <li onClick={() => this.connect(x)}>{x}</li>)
                    }
                </ol>
            </Dialog>
        }
        </div>
    }
}
