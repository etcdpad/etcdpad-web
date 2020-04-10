<template>
    <div class="scroll-view" @mousewheel="handleScroll" ref="root" @mouseup.stop.prevent="moving_Y = false">
        <div class="move-wrap"
            v-show="moving_X || moving_Y"
            @mouseleave.stop.prevent="moving_X = moving_Y = false"
            @mouseup.stop.prevent="moving_X = moving_Y = false"
            @mousemove="handleMove"
        ></div>
        <div class="wrap" ref="wrap" :style="viewStyle">
            <slot></slot>
        </div>
        <template v-if="!quite">
        <div v-if="direction !== 'vertical'" class="scroll-bar scroll-bar-x" v-show="isShowX">
            <span class="scroll-tumb" :style="tumbStyleX" @mousedown.prevent.stop="moving_X = true"></span>
        </div>
        <div v-if="direction !== 'horizontal'" class="scroll-bar scroll-bar-y" v-show="isShowY">
            <span class="scroll-tumb" :style="tumbStyleY" @mousedown.prevent.stop="moving_Y = true"></span>
        </div>
        </template>
    </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
type CSSStyle = {
    [key in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[key]
}

@Component
export default class ScrollView extends Vue {
    @Prop({ type: String, default: 'all' })
    public direction!: 'horizontal' | 'vertical' | 'all'
    @Prop({ type: Boolean, default: false })
    public quite!: boolean
    @Prop({ type: Boolean, default: false })
    public fallthrough!: boolean
    public get scrollbarSizeY(): number {
        return this.rootSizeY / this.scaleY
    }
    public get scrollbarPosY(): number {
        return -this.scrollY / this.scaleY
    }
    public get scrollbarSizeX(): number {
        return this.rootSizeX / this.scaleX
    }
    public get scrollbarPosX(): number {
        return -this.scrollX / this.scaleX
    }
    public get tumbStyleY() {
        return {
            height: this.scrollbarSizeY + 'px',
            top: this.scrollbarPosY + 'px',
        }
    }
    public get tumbStyleX() {
        return {
            width: this.scrollbarSizeX + 'px',
            left: this.scrollbarPosX + 'px',
        }
    }
    public get isShowY(): boolean {
        return this.rootSizeY < this.wrapSizeY
    }
    public get isShowX(): boolean {
        return this.rootSizeX < this.wrapSizeX
    }
    public get viewStyle() {
        if (!this.isShowY) this.scrollY = 0
        const style: CSSStyle = {
            top: this.scrollY + 'px',
            left: this.scrollX + 'px',
        }
        if (this.direction === 'horizontal') {
            style.maxHeight = '100%'
        }
        if (this.direction === 'vertical') {
            style.maxWidth = '100%'
        }
        return style
    }
    public rootSizeX = 0
    public wrapSizeX = 0
    public rootSizeY = 0
    public wrapSizeY = 0
    protected moving_X = false
    protected moving_Y = false
    private scrollY = 0
    private scaleY = 1
    private scrollX = 0
    private scaleX = 1
    public handleMove(event: MouseEvent) {
        if (!this.moving_X && !this.moving_Y) return
        this.__updateSize()
        let handleX = false
        let handleY = false
        if (this.moving_X && event.movementX) {
            handleX = this.changeX(event.movementX)
        }
        if (this.moving_Y && event.movementY) {
            handleY = this.changeY(event.movementY)
        }
        if (handleX || handleY) {
            event.preventDefault()
            event.stopPropagation()
        }
    }
    public handleScroll(event: MouseWheelEvent) {
        this.__updateSize()
        let handleX = false
        let handleY = false
        if (event.deltaX) {
            handleX = this.changeX(event.deltaX)
        }
        if (event.deltaY) {
            handleY = this.changeY(event.deltaY)
        }
        if (handleX || handleY || !this.fallthrough) {
            event.preventDefault()
            event.stopPropagation()
        }
    }
    public updated() {
        this.__updateSize()
    }
    public beforeDestroy() {
        window.removeEventListener('resize', this.resize)
    }
    public resize() {
        const root = this.$refs.root as HTMLDivElement
        if (root) {
            this.rootSizeX = root.offsetWidth
            this.rootSizeY = root.offsetHeight
            this.__updateSize()
            this.$nextTick(() => {
                this.changeX(0)
                this.changeY(0)
            })
        }
    }
    public mounted() {
        window.addEventListener('resize', this.resize)
        this.$nextTick(() => {
            this.resize()
            this.__updateSize()
        })
    }
    private changeX(x: number): boolean {
        let maxPosX = this.rootSizeX - this.wrapSizeX
        const offsetX = this.scrollX
        if (maxPosX > 0) {
            maxPosX = 0
        }
        let topX = offsetX - x
        if (topX > 0 || maxPosX > 0) {
            topX = 0
        } else if (maxPosX > offsetX) {
            topX = maxPosX
        } else if (topX < maxPosX) {
            topX = maxPosX
        }
        if (this.scrollX !== topX) {
            this.scrollX = topX
            return true
        }
        return false
    }
    private changeY(y: number): boolean {
        let maxPosY = this.rootSizeY - this.wrapSizeY
        const offsetY = this.scrollY
        if (maxPosY > 0) {
            maxPosY = 0
        }
        let topY = offsetY - y
        if (topY > 0 || maxPosY > 0) {
            topY = 0
        } else if (maxPosY > offsetY) {
            topY = maxPosY
        } else if (topY < maxPosY) {
            topY = maxPosY
        }

        if (this.scrollY !== topY) {
            this.scrollY = topY
            return true
        }
        return false
    }
    private __updateSize() {
        const wrap = this.$refs.wrap as HTMLDivElement
        if (wrap && wrap.offsetHeight) {
            this.wrapSizeY = wrap.offsetHeight
        }
        if (this.rootSizeY && this.wrapSizeY && this.rootSizeY <= this.wrapSizeY) {
            this.scaleY = this.wrapSizeY / this.rootSizeY
        }
        if (wrap && wrap.offsetWidth) {
            this.wrapSizeX = wrap.offsetWidth
        }
        if (this.rootSizeX && this.wrapSizeX && this.rootSizeX <= this.wrapSizeX) {
            this.scaleX = this.wrapSizeX / this.rootSizeX
        }
    }
}
</script>

<style lang="less" scoped>
@size: 8px;

.scroll-view {
    height: 100%;
    width: 100%;
    position: relative;
    overflow: hidden;

    .move-wrap {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: 7;
        cursor: move;
    }
}
.wrap {
    position: absolute;
    display: flex;
    min-width: 100%;
    height: auto;
    min-height: 100%;
}
.scroll-bar {
    position: absolute;
    right: 0;
    bottom: 0;
    pointer-events: none;
    &.scroll-bar-x {
        left: 0;
        height: @size;
        .scroll-tumb {
            height: 80%;
        }
    }
    &.scroll-bar-y {
        top: 0;
        width: @size;
        .scroll-tumb {
            width: 80%;
        }
    }
    .scroll-tumb {
        cursor: move;
        pointer-events: auto;
        border-radius: 5px;
        display: block;
        position: relative;
        background-color: #999;
        &:hover {
            outline: #999 0px 0px;
        }
    }
}
.scroll-view .scroll-bar {
    transition: opacity 0.5s ease-in-out;
    opacity: 0.25;
}
.scroll-view:hover .scroll-bar {
    opacity: 1;
}
</style>
