import { ofType } from '@/tsx'
import VSpliterPanel from './SpliterPanel.vue'

export interface SpliterPanelParam {
    min?: number
    max?: number
    value?: number
}
export interface SpliterPanelEvent {
    onResizing: number
    onResizeEnd: void
    onResizeStart: void
}

export const SpliterPanel = ofType<SpliterPanelParam, SpliterPanelEvent>().convert(VSpliterPanel)
