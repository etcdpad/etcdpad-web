import { Component } from 'vue-tsx-support'
export { Component as VueComponent } from 'vue-tsx-support'
export * from 'vue-tsx-support'

export abstract class Vue<T, Events = {}, ScopedSlotArgs = {}> extends Component<T, Events, ScopedSlotArgs> {
    protected abstract render(): JSX.Element
}
