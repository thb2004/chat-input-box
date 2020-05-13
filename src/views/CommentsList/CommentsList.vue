<template>
  <div class="m-comment-list">
		<div :class='["m-comment-list-wrapper m-news-wrapper", {"m-hidden-footer": !parentComment}]' ref="wrapper">
    	<mt-loadmore :top-method="loadTop" :bottom-method="loadBottom" :bottom-all-loaded="allLoaded" ref="loadmore" :auto-fill="false" :bottomDistance="0">
				<div class="m-parent-comment m-comment-detail"  @click="commentClick(parentComment, $event)" v-if="parentComment">
          <v-comment-item :comment="parentComment" :author="author" :isterable="false" :userId="userId" />
				</div>
				<div class="m-comment-detail" v-for="comment in commentList" :key="comment.id" @click="commentClick(comment, $event)">
          <v-comment-item :comment="comment" :author="author" :majorComment="parentComment" :userId="userId" />
				</div>
    	</mt-loadmore>
		</div>
    <div class="m-news-footer" v-if="parentComment">
        <!-- 输入框 -->
        <v-comment-input
          :boxId="`comment${parentComment.id}`"
          :placeholder="placeholder"
          ref="commentInput"
          @sendComs="publish"
          @focus="isFocus=true"
        >
        </v-comment-input>
      </div>
  </div>
</template>


<style lang="scss">
  @import "./CommentsList.scss";
</style>
<script>
import VCommentInput from "@/components/VCommentInput";
import VUserImg from "@/components/UserImg";
import VCommentItem from "@/components/CommentItem";
import { http } from "@/request/http.js";
import { openLoading, closeLoading, unfold } from "@/utils/common";
import { createFace, htmlEscape, escapeMessage } from "@/utils/utils";
import { toastConfig } from "@/utils/config";

export default {
  name: "commentsList",
  data() {
    return {
      totalComments: "",
      parentComment: null,
      commentList: [],
      userId: "",
      replyUserId: "",
      replyUserName: "",
      targetId: "",
			author: "",
			topId: 0,
			pageSize: 10,
			allLoaded: false,
      isRefresh: false,
      placeholder: "",
      isFocus: false,           // 是否聚焦
    };
  },
  components: {
    VCommentInput,
    VUserImg,
    VCommentItem
  },
  methods: {
    commentClick(comment, ev){
      this.$bus.emit('closeFacePanel');
      ev.stopPropagation();
      const elInput = document.getElementById(`comment${this.parentComment.id}`);
      // 已经聚焦
      if (this.isFocus) {
        this.init();
        elInput.blur();
      } else {
        if (comment.status == 1) {
          setTimeout(() => {
            elInput.focus();
          })
          this.replyUserId = comment.userid;
          this.replyUserName = comment.userName;
          this.targetId = comment.id;
          this.placeholder=`回复 ${comment.userName}`;
        }
      }
      this.isFocus = !this.isFocus
    },
	 // 下拉刷新
    loadTop(){
      this.topId = 0;
      this.getChildComments(true);
      this.$refs.loadmore.onTopLoaded();
    },
    // 上拉加载
    loadBottom(){
      this.getChildComments();
      this.$refs.loadmore.onBottomLoaded();
    },
    publish(msgArr) {
      //分析输入内容
      let content = htmlEscape(msgArr[0].send_msg);
      content = escapeMessage(content);
      // 昵称待定
      if(!this.netName.trim()) {
        this.$toast({
          message: "昵称不能为空，请先到个人资料页面设置昵称名",
          position: toastConfig.position,
        })
        return;
      }
      let params = {
        content,
        replyUserId: this.replyUserId,
        replyUserName: this.replyUserName,
        status: 1,
        type: 2,
        targetId: this.targetId,
        userid: this.userId,
        userName: this.netName,
        userHp: this.userHp,
        sex: this.sex,
      };
      openLoading('评论发表中...');
      http({
        url: `newsComment/add`,
        method: "post",
        params
      }).then(res => {
        const { code, info, rows } = res.data;
        closeLoading();
        this.$toast({
          message: info,
          position: toastConfig.position,
        })
        if (code === 200) {
          this.getMajorCommentDatail(rows.id, true);
          this.setTitle( `共${this.totalComments + 1}条回复`)
          this.init();
        }
      }).catch(() => {
        closeLoading();
        this.$toast({
          message: "回复评论失败",
          position: toastConfig.position,
        })
      });
    },
    // isInsert 是否插入
    getMajorCommentDatail(id, isInsert){
      return new Promise((resolve, reject) => {
        http({
        url: `newsComment/detail`,
        method: "post",
        params: {
          id,
          userid: this.userId,
        }
      })
        .then(res => {
          const { rows, code } = res.data;
          if(code === 200) {
            rows.content = createFace(rows.content);
            if (isInsert) {
              this.commentList.unshift(rows);
            } else {
              this.parentComment = rows;
            }
            resolve()
          } else  {
          reject("获取主评论失败")
          }
        })
        .catch(e => {
          reject("获取主评论失败")
        });
      })
    },
    // 获取子评论数
    getChildComments(isInit, pageSize, isAdd) {
			this.allLoaded = false;
      if (this.isRefresh) return;
      openLoading('评论加载中...');
			this.isRefresh = true;
      http({
        url: `newsComment/getPageChildlist?commentId=${this.parentComment.id}&type=2&userId=${this.userId}`,
        method: "post",
        params: {
          number: pageSize || this.pageSize,
          topId: this.topId
        }
      }).then(res => {
				const { rows, code, total } = res.data;
        this.isRefresh = false;
        closeLoading();
        if (code === 200) {
          // 初始化
          if (isInit) {
            rows.forEach(comment => {
              comment.content = createFace(comment.content)
            })
            this.commentList = rows;
          } else {
            // 下拉加载的时候需要过滤掉刚最新发布的那条数据，避免页面数据重复
            rows.forEach(comment => {
              comment.content = createFace(comment.content);
              const isExist = this.commentList.some((item) => {
                  return item.id === comment.id
                });
                !isExist && this.commentList.push(comment)
            })
          }
          this.topId = this.commentList[this.commentList.length - 1].id;
          this.totalComments = total;
          this.setTitle( `共${this.totalComments}条回复`)
				}
				if (total === this.commentList.length) {
            this.allLoaded = true;
        }
      }).catch(() => {
        closeLoading();
				this.isRefresh = false;
			});
    },
    init(){
      this.replyUserId = this.parentComment.userid;
      this.replyUserName = this.parentComment.userName;
      this.targetId = this.parentComment.id;
      this.placeholder = "觉得不错说两句～";
      this.latestCommentId = [];
    },
    setTitle(title){
      this.$cordova && this.$cordova.setTop({
        title, // 标题(必填)
    })
    },
    clickFn() {
      this.isFocus = false;
      this.init();
    }
  },
  beforeDestroy(){
    this.elWrapper.removeEventListener("click", this.clickFn, true);
  },
  mounted() {
    const { newsId, commentId, author, sex = 0, userId, netName, userHp} = this.$route.query;
    this.sex = sex;
    this.userId = userId;
    this.author = author;
    this.netName = netName;
    this.userHp = userHp;
    this.newsId = newsId;
    this.commentId = commentId;
    this.elWrapper = document.querySelector(".m-comment-list-wrapper");
    this.elWrapper.addEventListener("click", this.clickFn);
    this.getMajorCommentDatail(commentId).then(() => {
      this.init();
      this.getChildComments();
    }).catch(message => {
      this.$toast({
          message,
          position: toastConfig.position,
        })
    })
  }
};
</script>