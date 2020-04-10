import { ofType } from '@/tsx'
import VScrollView from './ScrollView.vue'

export interface ScrollViewParams {
    direction?: 'horizontal' | 'vertical' | 'all'
    quite?: boolean
    fallthrough?: boolean
}

export const ScrollView = ofType<ScrollViewParams>().convert(VScrollView)
