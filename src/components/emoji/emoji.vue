<template>
    <div class="m-expression ignore face" v-show="faceVisible">
        <ul ref="element" class="face clearfix">
            <li
                v-for="(item,index) in emojiList"
                class="ignore face"
                :key="index"
                @click="pushEmoji(`face/${item.url}`,index,item.key, $event)"
                :title="item.name"
            >
                <img :src="`face/${item.url}`" :alt="item.name" class="face">
            </li>
        </ul>
    </div>
</template>
<style lang="scss" scoped>
    .m-expression.ignore {
        height: 160px;
    }
    .m-expression{
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
        overflow: scroll;
        ul{
            li{
                float: left;
            }
            li.ignore {
                box-sizing: border-box;
                padding: 5px;
            }
        }
    }
</style>

<script>

import emojiList from "./emoji";

export default {
    name: "Emoji",
    data() {
        return {
            emojiList,
            hasLoaded: false,
        };
    },
    props: {
        faceVisible: Boolean,
    },
    watch: {
        faceVisible(val){
            if (val && !this.hasLoaded) {
                this.$nextTick(() => {
                    const elUl = document.querySelector('.m-expression');
                    const elLi = Array.from(elUl.querySelectorAll("li"));
                    const W = elUl.offsetWidth - 1;
                    const LINENUM = this.calcLineNum(W);
                    this.hasLoaded = true;
                    elLi.forEach(el => {
                        const perLiWidth = `${(W / LINENUM)}px`
                        el.style.width = perLiWidth;
                        el.style.height = perLiWidth;
                    })
                })
            }
        }
    },
    methods: {
        // 计算单行最多能放置的表情数
        calcLineNum (w) {
            // 单个表情最大的宽度
            const MAXWIDTH = 50;
            let i = 5;
            let maxCount = 0;
            while (i > 4) {
                if (w / i > MAXWIDTH) {
                    i++;
                } else {
                    maxCount = i;
                    break;
                }
            }
            return maxCount
        },
        pushEmoji(url, index,key, ev) {
            ev.stopPropagation();
            this.$emit("switchEmoji", { url, index,key });
        }
    },
    mounted() {
        // const el = document.querySelector('.m-expression');
        // el.addEventListener("touchmove", (e) => {
        //     e.preventDefault();
        // }, false)
    }
};
</script>
