import { Component, Prop } from 'vue-property-decorator'
import { Vue } from '@/tsx'
import './style.css'

export interface VIcon {
    type: string
    color?: string
    size?: 'normal' | 'large' | 'small'
}

@Component
export class Icon extends Vue<VIcon> {
    @Prop()
    private type!: string
    @Prop({ default: '#000000' })
    private color!: string
    @Prop({ default: 'normal' })
    private size!: 'normal' | 'large' | 'small'
    public render() {
        return <i style={{color: this.color}} class={['icon', this.size, `icon-${this.type}`]}></i>
    }
}
