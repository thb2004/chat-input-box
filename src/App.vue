<template>
  <div id="app">
    <keep-alive inlcude="newsDetail" exclude="commentsList">
      <router-view />
    </keep-alive>
  </div>
</template>
<style lang="scss" scoped>
#app {
  height: 100%;
}
</style>

<script>
import { isInArea, isAndroid } from "@/utils/utils";
export default {
  data() {
    return {
      lastTouchTime: null
    };
  },
  methods: {
    restoreEvent(event) {
      switch (event.type) {
        case "touchstart":
          this.startY = event.touches[0].clientY;
          break;
        case "touchmove":
          if(isAndroid()) return;
          if (isInArea(event.target, "face")) return;
          if (isInArea(event.target, "m-input-wrapper")) return;
          this.moveY = event.touches[0].clientY;
          //滑动距离
          this.touchesY = this.startY - this.moveY;

          let tabView = document.querySelector(".m-news-wrapper");
          if (!tabView) return;
          let contentHeight = tabView.scrollHeight; //内容高度
          let scrollTop = tabView.scrollTop; //滚动高度
          let viewHeight = tabView.clientHeight;

          if (Math.ceil(scrollTop) === contentHeight - viewHeight) {
            this.isScrill_bottom = true;
          } else {
            this.isScrill_bottom = false;
          }

          //滚动条底部
          if (this.isScrill_bottom) {
            if (this.touchesY >= 0) {
              event.preventDefault();
            } else {
              event.stopPropagation();
            }
          }
          break;
        case "touchend":
          if(isAndroid()) return;
          let iNow = new Date().getTime();

          this.lastTouchTime = this.lastTouchTime || iNow + 1 /** 第一次时将lastTouchTime设为当前时间+1 */;

          let delta = iNow - this.lastTouchTime;

          if (delta < 500 && delta > 0) {
            event.preventDefault();
            return false;
          }
          this.lastTouchTime = iNow;
          break;
      }
    }
  },
  beforeDestroy() {
    // document.body.removeEventListener("touchstart", this.restoreEvent);
    // document.body.removeEventListener("touchmove", this.restoreEvent);
    // document.body.removeEventListener("touchend", this.restoreEvent);
  },
  mounted() {
    /*监听容器的 touch 触发事件处理逻辑*/
    // document.body.addEventListener("touchstart", this.restoreEvent);
    // document.body.addEventListener("touchmove", this.restoreEvent);
    // document.body.addEventListener("touchend", this.restoreEvent);
  }
};
</script>