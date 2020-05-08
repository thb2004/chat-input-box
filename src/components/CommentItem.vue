<template>
  <div class="m-comment-wrapper">
    <v-user-img :user="comment" />
    <div class="m-comment-right">
      <div class="m-comment-top">
        <div class="m-comentator-info">
          <span class="m-commentator">{{comment.userName}}</span>
          <span class="m-author" v-if="comment.userid == author">作者</span>
        </div>
        <div
          :class="{'m-comment-thumb':true,'m-praise-active':comment.isZan, 'm-is-thumbing': comment.isThumbing}"
          @click="thumb(comment.isZan, comment.id, 2, comment, $event)"
          v-if="comment.status != 0"
        >
          <span class="m-praise-num">
            <span v-if="comment.zan > 0">{{comment.zan}}</span>
            <svg class="icon">
              <use
                :xlink:href="`${comment.isZan ? '#icon-dianzanwenzhang_h' : '#icon-dianzanwenzhang_nor'}`"
              />
            </svg>
          </span>
        </div>
      </div>
      <div class="m-comment-content">
        <span v-if="Object.keys(majorComment).length && comment.replyUserId != majorComment.userid && comment.replyUserName" class="m-reply-op">&nbsp;回复&nbsp;</span>
          <span v-if="Object.keys(majorComment).length && comment.replyUserId != majorComment.userid && comment.replyUserName" class="m-reply-user">{{comment.replyUserName}}</span>
          <!-- &&comment.userid != author &&comment.replyUserId !=majorComment.userid  -->
          <span
            class="m-author"
            v-if="Object.keys(majorComment).length && comment.replyUserId != majorComment.userid &&comment.replyUserId == author"
          >作者</span>
          <span v-if="Object.keys(majorComment).length && comment.replyUserId != majorComment.userid && comment.replyUserName">&nbsp;:&nbsp;</span>
        <pre
          v-html="comment.status == '0' ? tips : comment.content"
          :class="{'m-fobidden-tips': comment.status == '0'}"
        ></pre>
        <div class="btn-collapse btn-spread" @click="spread" v-if="comment.status != '0'">展开</div>
        <div class="m-comment-time" v-if="comment.status != '0'">{{comment.timeText}}</div>
      </div>
      <div
        class="m-reply-list"
        v-if="isterable && comment.child && comment.child.child && comment.child.child.length && comment.status != '0'"
        @click="goCommentsPage(comment, $event)"
      >
        <div
          class="m-replyer"
          v-for="(childComment, index) in comment.child.child"
          :key="childComment.id"
        >
          <div class="m-replyer-item">
            <div class="m-replyer-info">
              <span class="m-reply-user">{{childComment.userName}}</span>
              <span class="m-author" v-if="childComment.userid == author">作者</span>
              <span
                v-if="childComment.replyUserId != comment.userid && childComment.replyUserName"
                class="m-reply-op"
              >&nbsp;回复&nbsp;</span>
              <span v-if="childComment.replyUserId != comment.userid && childComment.replyUserName" class="m-reply-user">{{childComment.replyUserName}}</span>
              <!--  && childComment.userid != author && childComment.replyUserId != comment.userid -->
              <span
                class="m-author"
                v-if="childComment.replyUserId != comment.userid && childComment.replyUserId == author"
              >作者</span>
              <span>&nbsp;:&nbsp;</span>
            </div>
            <pre
              v-html="childComment.status == '0' ? tips : childComment.content"
              class="m-reply-content"
            ></pre>
          </div>
          <div
            class="m-more-reply"
            v-if="comment.child.child.length != comment.child.total && (index === comment.child.child.length - 1)"
          >共{{comment.child.total}}条回复 &nbsp;&nbsp;></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "@/style/animation.scss";
.m-comment-wrapper {
  display: flex;
  padding-bottom: 30px;

  .m-comment-right {
    box-sizing: border-box;
    padding-left: 10px;
    width: calc(100% - 32px);
    font-size: 14px;
    .m-comment-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      .m-comentator-info {
        display: flex;
        align-items: center;
        margin-right: 5px;
        .m-commentator {
          font-size: 15px;
          color: #668BD5;
          font-weight: 500;
          line-height: 21px;
          word-break: break-all;
          overflow-wrap: break-word;
          white-space: nowrap;
          overflow: hidden;
          max-width: 220px;
          text-overflow: ellipsis;
        }
      }

      .m-comment-thumb {
        color: #a1a5ac;

        .m-praise-num {
          display: flex;
          align-items: center;
        }

        svg {
          margin-left: 5px;
        }
      }
    }
  }

  .btn-collapse {
    display: none;
    height: 20px;
    font-size: 14px;
    color: #3071f2;
    padding-top: 10px;
    line-height: 20px;
  }
  .m-comment-content {
    position: relative;
    line-height: 22px;
    font-size: 16px;
    font-weight: 400;
    pre {
      line-height: 22px;
      img {
        width: 22px;
        vertical-align: middle;
      }
    }
    .m-reply-user {
      color: #5478c0;
    }
  }
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    pre {
      display: -webkit-box;
      overflow: hidden;
      white-space: normal;
      text-overflow: ellipsis;
      word-wrap: break-word;
      -webkit-line-clamp: 6;
      -webkit-box-orient: vertical;
    }
    .btn-spread {
      display: block;
    }
  }
  .m-block {
    display: block !important;
  }

  .m-comment-time {
    line-height: 18px;
    font-size: 13px;
    color: #a1a5ac;
    margin: 10px 0 6px 0;
  }

  .m-reply-list {
    border-radius: 4px;
    background: #f7f9fc;
    padding: 10px;

    .m-replyer {
      line-height: 20px;
    }

    .m-replyer-item {
      position: relative;
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      .m-replyer-info {
        display: inline;
      }
    }

    .m-reply-user {
      font-size: 14px;
      color: #5478c0;
      font-weight: 400;
      line-height: 20px;
      // 测试所提的bug,到时候是否需要
      display: inline-block;
      vertical-align: middle;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .m-reply-content {
      line-height: 20px;
      img {
        width: 20px;
        vertical-align: middle;
      }
    }

    .m-more-reply {
      color: #5478c0;
    }
  }
  .m-fobidden-tips {
    display: block;
    height: 75px !important;
    line-height: 75px !important;
    border-radius: 4px;
    background: #f7f9fc;
    font-size: 16px;
    color: #caced7;
    text-align: center;
  }
  .m-author {
    display: inline-block;
    flex-shrink: 0;
    width: 28px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    font-size: 11px;
    border-radius: 4px;
    border: 1px solid #668bd5;
    color: #668bd5;
    margin-left: 6px;
  }
  .m-praise-active {
    color: #3071f2 !important;
    svg {
      color: #3071f2;
    }
  }
  .m-is-thumbing {
    svg {
      animation: thumb 1s;
    }
  }
}
</style>

<script>
import { http } from "@/request/http.js";
import { htmlEscape } from "@/utils/utils";
import VUserImg from "@/components/UserImg";
import { formatStrByLine, caclIndent } from "@/utils/common";
import { MessageBox } from 'mint-ui';

export default {
  data() {
    return {
      isFocus: false,
      tips: "评论已被管理员删除"
    };
  },
  components: {
    VUserImg
  },
  methods: {
    viewUserName(e, username){
      e.stopPropagation();
      MessageBox.alert(username, "昵称")
    },
    // 展开
    spread(ev) {
      ev.stopPropagation();
      const curEl = ev.target;
      const parentNode = curEl.parentNode;
      if (Array.from(parentNode.classList).indexOf("ellipsis") > -1) {
        curEl.innerHTML = "收起";
        curEl.classList.add("m-block");
        parentNode.classList.remove("ellipsis");
      } else {
        curEl.innerHTML = "展开";
        parentNode.classList.add("ellipsis");
      }
    },
    goCommentsPage(comment, ev) {
      ev.stopPropagation();
      this.$emit("goPage", comment);
    },
    // 点赞
    thumb(status, targetId, type, obj, ev) {
      this.$bus.emit("closeFacePanel");
      ev.stopPropagation();
      const params = {
        status: status ? 0 : 1,
        targetId,
        type,
        userId: this.userId
      };
      http({
        url: `newsZan/like`,
        method: "post",
        params
      }).then(res => {
        const { code, rows } = res.data;
        if (code === 200) {
          obj.isZan = !status;
          obj.isThumbing = !status;
          obj[type === 1 ? "zanNum" : "zan"] = rows.zanNum;
        }
      });
    }
  },
  props: {
    // 是否需要遍历评论下的回复
    isterable: {
      type: Boolean,
      default: true
    },
    comment: {
      type: Object,
      default() {
        return {};
      }
    },
    majorComment: {
      type: Object,
      default() {
        return {};
      }
    },
    author: String,
    userId: String,
    // 评论是否显示展开或者收起按钮
    isShowCollapsedBtn: {
      type: Boolean,
      default: true
    },
    // 评论下的回复是否超出行数省略号显示
    isShowEllipsis: {
      type: Boolean,
      default: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      formatStrByLine(".m-comment-content");
      // caclIndent(".m-reply-content");
    });
  }
};
</script>