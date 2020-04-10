<template>
    <div class="spliter" :class="{ right: direction === 'right' }" ref="spliter">
        <div class="spliter-wrapper" :style="{ display: changing ? 'block' : 'none' }" ref="wrapper" @mousemove="move" @mouseup="end"></div>
        <div class="front" :style="panelStyle">
            <slot name="front"></slot>
        </div>
        <div class="spliter-toggle" @mousedown="start"></div>
        <div class="end">
            <slot name="end"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class SpliterPanel extends Vue {
    public get panelStyle() {
        let size = this.size
        if (size > this.maxSize && this.maxSize > 0) {
            size = this.maxSize
        }
        if (size < this.minSize) {
            size = this.minSize
        }
        return {
            width: size + 'px',
        }
    }
    @Prop({ type: String, default: 'left' })
    public direction!: 'left' | 'right'
    @Prop({ type: Number, default: 0 })
    public min!: number
    public minSize = this.min
    @Prop({ type: Number, default: 0 })
    public max!: number
    public maxSize = this.max
    public changing = false
    @Prop({ type: Number, default: 500 })
    private value!: number
    private size = this.value
    public move(event: MouseEvent) {
        const { movementX } = event
        if (this.direction === 'left') {
            this.size += movementX
        } else {
            this.size -= movementX
        }
        this.$emit('resizing', this.size)
    }
    public mounted() {
        if (this.maxSize === 0) {
            const spliter = this.$refs.spliter as HTMLDivElement
            this.maxSize = spliter.offsetWidth
        }
        if (this.minSize > this.maxSize) {
            this.minSize = this.maxSize
        }
    }
    private end() {
        this.changing = false
        if (this.size > this.maxSize && this.maxSize > 0) {
            this.size = this.maxSize
        }
        if (this.size < this.minSize) {
            this.size = this.minSize
        }
        this.$emit('resizeEnd')
    }
    private start() {
        this.changing = true
        this.$emit('resizeStart')
    }
}
</script>

<style lang="less" scoped>
.spliter {
    &.right {
        flex-direction: row-reverse;
    }
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: row;
}
.spliter-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    cursor: ew-resize;
}
.spliter-toggle {
    width: 5px;
    box-sizing: content-box;
    height: 100%;
    background-color: #fff;
    border-color: #000;
    border-style: solid;
    border-width: 0 1px;
    background-clip: content-box;
    cursor: ew-resize;
}
.front, .end {
    position: relative;
}
.end {
    display: flex;
    flex: 1;
}
</style>
