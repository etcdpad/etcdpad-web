import { Component, Vue } from 'vue-property-decorator'
import EtcdView from '@/views/EtcdView'
import '@/assets/iconfont.css'
import { Dialog } from './components/dialog'

@Component
export default class App extends Vue<{}> {
    private etcddsn = ''
    private done = false
    protected render() {
        return <div id="app">
            { this.done ? 
            <EtcdView dsn={this.etcddsn}></EtcdView>
            :
            <Dialog value={!this.done} noClose noFooter title="Input etcd endpoints">
                <input type="text" value={this.etcddsn} onInput={ event => this.etcddsn = (event.target.value as string).trim() } placeholder="etcd://[username:password@]host1:port1[,...hostN:portN][/[defaultPrefix][?options]]"></input>
                <button type="button" onClick={() => this.done = !!this.etcddsn.trim()}>Connect</button>
            </Dialog>
        }
        </div>
    }
}
