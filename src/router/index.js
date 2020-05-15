import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  // 时讯详情
  {
    path: '/',
    name: 'newsDetail',
    component: r => require.ensure([], () => r(require('@/views/NewsDetail/NewsDetail'))),
    meta: {
      scollTopPosition: 0
    }
  },
  // 子评论列表
  {
    path: '/comments-list',
    name: 'commentsList',
    component: r => require.ensure([], () => r(require('@/views/CommentsList/CommentsList'))),

  },
  // 所有评论列表
  // {
  //   path: '/all-comments',
  //   name: 'allComments',
  //   component: resolve => require(['../views/AllComments/AllComments'], resolve),
  // },
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
