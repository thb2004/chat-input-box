<template>
  <div class="m-all-comments m-news-detail">
    <div class="m-news-comments">
      <h3 class="m-all-comments">全部评论 · {{totalComments}}</h3>
      <mt-loadmore
        :top-method="loadTop"
        :bottom-method="loadBottom"
        :bottom-all-loaded="allLoaded"
        ref="loadmore"
        :auto-fill="false"
        :bottomDistance="0"
      >
        <div
          class="m-comment-detail"
          v-for="comment in commentList"
          :key="comment.id"
          @click="commentClick(comment, $event)"
        >
          <v-comment-item :comment="comment" :author="author" @goPage="goCommentsPage" :userId="userId" />
        </div>
      </mt-loadmore>
    </div>

    <div class="m-news-footer">
      <!-- 输入框 -->
      <v-comment-input
        :boxId="`comment${newsId}`"
        :placeholder="placeholder"
        ref="commentInputBox"
        @sendComs="publish"
      ></v-comment-input>
    </div>
  </div>
</template>

<style lang="scss">
@import "./AllComments.scss";
</style>

<script>
import { http } from "@/request/http.js";
import VCommentInput from "@/components/VCommentInput";
import VCommentItem from "@/components/CommentItem";

import {
  openLoading,
  closeLoading,
} from "@/utils/common";
import { htmlEscape, escapeMessage } from "@/utils/utils";
import { toastConfig } from "@/utils/config";
export default {
  name: "allComments",
  data() {
    return {
      commentList: [],
      pageSize: 10,
      childPageSize: 2,
      showReplyNum: 2,
      topId: 0,
      childTopId: 0,
      showReply: false,
      newsId: "",
      userId: "",
      author: "",
      placeholder: "",
      allLoaded: false,
      isRefresh: false,
      totalComments: 0,
      isFocus: false
    };
  },
  components: {
    VCommentInput,
    VCommentItem
  },
  methods: {
    commentClick(comment, ev) {
      const classList = Array.from(ev.target.classList);
      this.$bus.emit("closeFacePanel");
      ev.stopPropagation();
      if (classList.indexOf("btn-collapse") > -1) return;
      const elInput = document.getElementById(`comment${this.newsId}`);
      // 已经聚焦
      if (this.isFocus) {
        this.init();
        elInput.blur();
      } else {
        setTimeout(() => {
          elInput.focus();
        });
        this.init(comment);
      }
      this.isFocus = !this.isFocus;
    },
    init(comment) {
      if (comment) {
        this.replyUserId = comment.userid;
        this.replyUserName = comment.userName;
        this.targetId = comment.id;
        this.placeholder = `回复 ${comment.userName}`;
      } else {
        this.replyUserId = 0;
        this.replyUserName = "";
        this.targetId = this.newsId;
        this.placeholder = "觉得不错说两句～";
      }
    },
    // 发表评论或者回复
    publish(msgArr) {
      //分析输入内容
      let content = htmlEscape(msgArr[0].send_msg);
      content = escapeMessage(content);
      // 昵称待定
      if (!this.netName.trim()) {
        this.$toast({
          message: "昵称不能为空，请先到个人资料页面设置昵称名",
          position: toastConfig.position
        });
        return;
      }
      openLoading("评论发表中...");
      let params = {
        content,
        replyUserId: this.replyUserId,
        replyUserName: this.replyUserName,
        status: 1,
        type: this.targetId === this.newsId ? 1 : 2,
        targetId: this.targetId,
        userid: this.userId,
        userName: this.netName,
        userHp: this.userHp,
        sex: this.sex
      };
      http({
        url: `newsComment/add`,
        method: "post",
        params
      })
        .then(res => {
          const { code, info } = res.data;
          closeLoading();
          this.$toast({
            message: info,
            position: toastConfig.position
          });
          if (code === 200) {
            this.init();
            this.topId = 0;
            this.getComments(true, this.commentList.length + 1);
          }
        })
        .catch(() => {
          this.$toast({
            message: "回复评论失败",
            position: toastConfig.position
          });
          closeLoading();
        });
    },

    // 下拉刷新
    loadTop() {
      this.topId = 0;
      this.getComments(true);
      this.$refs.loadmore.onTopLoaded();
    },
    // 上拉加载
    loadBottom() {
      this.getComments();
      this.$refs.loadmore.onBottomLoaded();
    },
    // 跳转到评论列表页
    goCommentsPage(comment) {
      this.$router.push({
        path: "/comments-list",
        query: {
          comment,
          userId: this.userId,
          sex: this.sex,
          netName: this.netName,
          userHp: this.userHp
        }
      });
    },
    // 获取评论数
    getComments(isInit, pageSize) {
      this.allLoaded = false;
      if (this.isRefresh) return;
      this.isRefresh = true;
      openLoading("评论加载中...");
      http({
        url: `newsComment/getPagelist?newsId=${this.newsId}&type=1&userId=${this.userId}`,
        method: "post",
        params: {
          number: pageSize || this.pageSize,
          topId: this.topId,
          childNumber: this.childPageSize,
          childTopId: this.childTopId
        }
      })
        .then(res => {
          const { rows, total } = res.data;
          this.isRefresh = false;
          closeLoading();
          (rows || []).forEach(comment => {
            comment.showReply = false;
            comment.reply = "";
            if (comment.child.total > 5) {
              comment.child.child = comment.child.child.slice(0, 2);
            }
            comment.child.child.forEach(child => {
              child.showReply = false;
              child.reply = "";
            });
          });
          this.totalComments = total;
          if (isInit) {
            this.commentList = rows || [];
          } else {
            this.commentList.push(...(rows || []));
          }
          this.topId = this.commentList.length
            ? this.commentList[this.commentList.length - 1].topId
            : 0;
          if (total === this.commentList.length || !rows) {
            this.allLoaded = true;
          }
        })
        .catch(e => {
          closeLoading();
          this.$toast({
            message: "获取评论失败",
            position: toastConfig.position
          });
          this.isRefresh = false;
        });
    },
    clickFn() {
      this.isFocus = false;
      this.init();
    }
  },
  beforeDestroy() {
    this.commentWrapper.removeEventListener("click", this.clickFn);
  },
  mounted() {
    this.$cordova && this.$cordova.setTop({
        title: "评论数", // 标题(必填)
    })
    const query = this.$route.query;
    this.newsId = query.newsId;
    this.userId = query.userId;
    this.sex = query.sex == 2 ? 0 : 1; // 1代表男， 2代表女
    this.netName = query.netName;
    this.userHp = query.userHp;
    this.author = query.author;
		this.getComments();
		this.init();
    this.commentWrapper = document.querySelector(".m-news-comments");
    this.commentWrapper.addEventListener("click", this.clickFn);
  }
};
</script>