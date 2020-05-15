import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style/reset.css'

import 'babel-polyfill'
import Es6Promise from 'es6-promise'
Es6Promise.polyfill();

import NProgress from 'nprogress'

import 'nprogress/nprogress.css'

import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload, {
  loading: './images/loading.png',//加载中图片，一定要有，不然会一直重复加载占位图
  error: './images/loadFail.png',  //加载失败图片
  preLoad: 2
});

import Mint from 'mint-ui';

import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
Vue.use(Viewer, {
  defaultOptions: {
    toolbar: {
      zoomIn: 1, //放大
      zoomOut: 1, //缩小
      play: 1, //播放
      prev:1,//上一张
      next:1,//下一张
      rotateLeft: 1, //向左旋转
      rotateRight: 1, //向右旋转
      flipHorizontal: 1, //水平翻转
      flipVertical: 1, //垂直翻转
      oneToOne: 1, //缩放比例1:1
    },
    title: false, //是否显示标题（文件名）
    navbar: true, //工具栏下面的导航条
  }
})


import VueBus from '@/utils/bus'
Vue.use(VueBus);


// import Vconsole from 'vconsole'
// const vConsole = new Vconsole()
// Vue.use(vConsole)

import VideoPlayer from 'vue-video-player'

require('video.js/dist/video-js.css')

require('vue-video-player/src/custom-theme.css')

Vue.use(VideoPlayer)

Vue.use(Mint);
import 'mint-ui/lib/style.css'

import LessoCordova from "@lesso/cordova-utils"
Vue.use(LessoCordova)


// 即完成,设置已生效

router.beforeEach((to, from, next) => {
  NProgress.start()
  next()

})

router.afterEach(transition => {
  NProgress.done()
})

Vue.config.productionTip = false


const initVue = () => {
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

if (!!window.cordova) {
  // 监听 cordova deviceready 事件后调用
  document.addEventListener('deviceready', () => {
    initVue()
  })
} else {
  initVue()
}
