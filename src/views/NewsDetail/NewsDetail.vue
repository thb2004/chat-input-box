<template>
  <div class="m-news-detail">
    <div class="m-news-list m-news-wrapper" ref="wrapper" v-if="newsDetail">
      <mt-loadmore
        :top-method="loadTop"
        :bottom-method="loadBottom"
        :bottom-all-loaded="allLoaded"
        ref="loadmore"
        :auto-fill="false"
        :bottomDistance="0"
      >
        <div class="m-news-title">{{newsDetail.name}}</div>
        <div class="m-news-info">
          <div class="m-left">
            <span class="m-creator">编辑：{{newsDetail.createName}}</span>
            <span class="m-visits">{{newsDetail.visits | changeUnit}}阅读</span>
          </div>
          <div>
            <span class="m-updated">{{newsDetail.updated}}</span>
          </div>
        </div>
        <ul class="m-news-images">
          <li v-for="item in images" :key="item.pictureId">
            <div v-viewer="options" v-if="item.type === 'image'" class="images">
              <img
                v-lazy="item.pictureUrl"
                :src="item.pictureUrl"
                :key="item.pictureId"
                :data-remote-src="item.remoteUrl"
                class="ignore"
              />
            </div>
            <video-player
              v-else-if="item.type === 'video' && item.loaded"
              class="video-player vjs-custom-skin m-videp-wraper"
              :ref="`videoPlayer_${item.pictureId}`"
              :webkit-playsinline="true"
              x5-video-player-fullscreen="“true”"
              :playsinline="true"
              :options="item.playerOptions"
              @play="onPlayerPlay($event, item)"
            ></video-player>
          </li>
        </ul>
        <div class="ql-snow">
          <div v-html="newsDetail.content" class="m-news-content ql-editor"></div>
        </div>
        <div>
          <div class="m-horizontal-line"></div>
          <div class="m-news-comments">
            <h3 class="m-all-comments">
              <span>全部评论 · {{newsDetail.allowComment != 0 ? 0 : totalComments}}</span>
              <div
                :class="{'m-comment-thumb':true,'m-praise-active':newsDetail.isZan, 'm-is-thumbing': newsDetail.isThumbing}"
              >
                <svg
                  class="icon m-icon-thumb"
                  @click="thumb(newsDetail.isZan, newsDetail.newsid, 1, newsDetail, $event)"
                >
                  <use
                    :xlink:href="`${newsDetail.isZan ? '#icon-dianzanwenzhang_h' : '#icon-dianzanwenzhang_nor'}`"
                  />
                </svg>
                <span>{{ newsDetail.zanNum }}</span>
              </div>
            </h3>
            <div v-if="newsDetail.allowComment != 0" class="m-fobidden-tips">
              <span>当前评论功能已关闭</span>
            </div>
            <div
              class="m-comment-detail"
              v-for="comment in commentList"
              :key="comment.id"
              @click="commentClick(comment, $event)"
              v-else
            >
              <v-comment-item
                :comment="comment"
                :author="newsDetail.author"
                :userId="userId"
                @goPage="goCommentsPage"
              />
            </div>
          </div>
          <!--  -->

          <div class="m-no-data" v-if="allLoaded">
            <span>没有更多啦</span>
          </div>
        </div>
      </mt-loadmore>
    </div>
    <div class="m-news-footer" v-if="newsDetail && newsDetail.allowComment == 0">
      <!-- 输入框 -->
      <v-comment-input
        :boxId="`comment${newsId}`"
        :placeholder="placeholder"
        ref="commentInputBox"
        @sendComs="publish"
      ></v-comment-input>
    </div>
    <v-no-access v-if="noAccess" tips="文章" />
  </div>
</template>

<style lang="scss">
@import "./NewsDetail.scss";
</style>

<script>
import { http } from "@/request/http.js";
import VNoAccess from "@/components/VNoAccess";
import VCommentInput from "@/components/VCommentInput";
import VCommentItem from "@/components/CommentItem";

import { openLoading, closeLoading, formatDate} from "@/utils/common";
import {
  htmlEscape,
  escapeMessage,
  parseQueryParams,
  getSuffix,
  getNameByUrl,
  createFace,
} from "@/utils/utils";
import { GLOBALCONFIG } from "@/define/consts/const";

import { toastConfig } from "@/utils/config";

export default {
  name: "newsDetail",
  data() {
    return {
      newsDetail: null,
      commentList: [],
      pageSize: 10,
      childPageSize: 2,
      showReplyNum: 2,
      topId: 0,
      childTopId: 0,
      showReply: false,
      newsId: "",
      userId: "",
      noAccess: false,
      placeholder: "",
      allLoaded: false,
      isRefresh: false,
      totalComments: 0,
      baseUrl: "",
      isFocus: false,
      activatedComment: null,
      images: [],
      options: {
        url: "data-remote-src"
      },
      latestCommentIds: []
    };
  },
  components: {
    VNoAccess,
    VCommentInput,
    VCommentItem
  },
  filters: {
    changeUnit(num) {
      num = num || 1;
      if (num < 10000) {
        return `${num}人`;
      } else {
        return `${num / 10000}万`;
      }
    }
  },
  methods: {
    onPlayerPlay(event, item) {
      if (this.curVideo && this.curVideo !== item.pictureId) {
        this.$refs[`videoPlayer_${this.curVideo}`][0].player.pause(); // 暂停
      }
      this.curVideo = item.pictureId;
    },
    goAllCommentsPage(ev) {
      ev.stopPropagation();
      this.$router.push({
        path: "/all-comments",
        query: {
          author: this.newsDetail.author,
          userId: this.userId,
          newsId: this.newsId,
          sex: this.sex,
          netName: this.netName,
          userHp: this.userHp
        }
      });
    },
    init() {
      this.replyUserId = 0;
      this.replyUserName = "";
      this.targetId = this.newsId;
      this.placeholder = "觉得不错说两句～";
      this.latestCommentId = [];
    },
    commentClick(comment, ev) {
      this.activatedComment = comment;
      const classList = Array.from(ev.target.classList || []);
      this.$bus.emit("closeFacePanel");
      ev.stopPropagation();
      if (classList.indexOf("btn-collapse") > -1) return;
      const elInput = document.getElementById(`comment${this.newsId}`);
      // 已经聚焦
      if (this.isFocus) {
        this.init();
        elInput.blur();
      } else {
        if (comment.status == 1) {
          setTimeout(() => {
            elInput.focus();
          });
          this.replyUserId = comment.userid;
          this.replyUserName = comment.userName;
          this.targetId = comment.id;
          this.placeholder = `回复 ${comment.userName}`;
        }
      }
      this.isFocus = !this.isFocus;
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
          const { code, info, rows } = res.data;
          this.$toast({
            message: info,
            position: toastConfig.position
          });
          if (code === 200) {
            if (!this.replyUserId) {
              this.latestCommentIds.push(String(rows.id));
              this.getMajorCommentDatail(rows.id, true);
            } else {
              this.getChildComments(this.targetId);
            }
            this.init();
          }
        })
        .catch(() => {
          this.$toast({
            message: "回复评论失败",
            position: toastConfig.position
          });
        });
    },
    // 点赞
    thumb(status, targetId, type, obj, ev) {
      this.$bus.emit("closeFacePanel");
      ev.stopPropagation();
      if (obj.thumbing) return;
      obj.thumbing = true;
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
      })
        .then(res => {
          const { code } = res.data;
          obj.thumbing = false;
          if (code === 200) {
            obj.isZan = !status;
            obj.isThumbing = !status;
            // 取消赞
            if (status) {
              obj[type === 1 ? "zanNum" : "zan"]--;
            } else {
              obj[type === 1 ? "zanNum" : "zan"]++;
            }
          }
        })
        .catch(() => {
          obj.thumbing = false;
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
    // 获取时讯详情
    getNewsDetail() {
      return new Promise((resolve, reject) => {
        http({
          url: `/news/detail?newsId=${this.newsId}&userId=${this.userId}&isRead=1`,
          method: "get"
        }).then(res => {
          const { code, rows } = res.data;
          if (!rows || rows.status == 2) {
            this.noAccess = true;
            reject("无权限查看");
            return;
          }
          if (code === 200) {
            rows.updated = formatDate(rows.updated);
            rows.pics.sort((a, b) => {
              return parseInt(a.sort) - parseInt(b.sort);
            });
            this.newsDetail = rows;
            this.$nextTick(() => {
              this.elNewsList = document.querySelector(".m-news-list");
              this.allA = Array.from(document.querySelectorAll("a"));
              this.elNewsList.addEventListener("click", this.clickFn);
              this.allA.forEach(elA => {
                elA.addEventListener("click", this.aLinkClickFn);
              });
            });
            this.images.push(...rows.pics);
            resolve(rows);
          }
        });
      });
    },
    getRemoteUrl({
      params,
      type,
      pic,
      url = GLOBALCONFIG.file_server_fastdfs.downloadFileApi
    }) {
      return new Promise((resolve, reject) => {
        http({
          url: `${GLOBALCONFIG.file_server_fastdfs.baseUrl}${url}`,
          method: "post",
          params
        })
          .then(result => {
            resolve({
              result,
              type,
              pic
            });
          })
          .catch(err => {
            resolve({
              result: null,
              type,
              pic
            });
          });
      });
    },
    // 获取视频地址
    getVideo(data) {
      let proArr = [];
      (data.pics || []).forEach((pic, index) => {
        if (pic.type === "video") {
          proArr.push(
            this.getRemoteUrl({
              params: {
                viewPath: pic.pictureId,
                groupName: "CC",
                type: "video"
              },
              type: "video",
              pic,
              url: GLOBALCONFIG.file_server_fastdfs.videoDownloadFileApi
            })
          );
        } else {
          const gifArr = ["gif", "tif", "tiff"];
          const isGif =
            gifArr.indexOf(getSuffix(getNameByUrl(pic.pictureUrl))) > -1
              ? true
              : false;
          const type = !isGif ? GLOBALCONFIG.file_server_fastdfs.imageType : "";
          const groupName = isGif
            ? GLOBALCONFIG.file_server_fastdfs.picGroup
            : GLOBALCONFIG.file_server_fastdfs.userInfo.groupName;
          proArr.push(
            this.getRemoteUrl({
              params: {
                viewPath: pic.pictureId,
                groupName,
                type
              },
              type: "image",
              pic
            })
          );
        }
      });
      Promise.all(proArr).then(res => {
        res.forEach(({ result, type, pic }, index) => {
          if (type === "video") {
            result && this.$set(pic, "loaded", true);
            pic.playerOptions = {
              autoplay: false, //如果true,浏览器准备好时开始回放。
              muted: false, // 默认情况下将会消除任何音频。
              loop: false, // 导致视频一结束就重新开始。
              preload: "auto", // 建议浏览器在<video>加载元素后是否应该开始下载视频数据。auto浏览器选择最佳行为,立即开始加载视频（如果浏览器支持）
              language: "zh-CN",
              aspectRatio: "44:29", // 将播放器置于流畅模式，并在计算播放器的动态大小时使用该值。值应该代表一个比例 - 用冒号分隔的两个数字（例如"16:9"或"4:3"）
              fluid: true, // 当true时，Video.js player将拥有流体大小。换句话说，它将按比例缩放以适应其容器。
              sources: [
                {
                  src: result ? result.data.data : "",
                  type: "video/mp4"
                }
              ],
              width: document.documentElement.clientWidth,
              poster: pic.pictureUrl,
              notSupportedMessage: "此视频暂无法播放，请稍后再试", //允许覆盖Video.js无法播放媒体源时显示的默认信息。
              controlBar: {
                timeDivider: true,
                durationDisplay: true,
                remainingTimeDisplay: false,
                fullscreenToggle: true //全屏按钮
              }
            };
          } else {
            this.$set(pic, "remoteUrl", "");
            pic.remoteUrl = result ? result.data.data : pic.pictureUrl;
          }
        });
      });
    },
    // 跳转到评论列表页
    goCommentsPage(comment) {
      this.activatedComment = comment;
      this.$router.push({
        path: "/comments-list",
        query: {
          newsId: this.newsId,
          commentId: comment.id,
          author: this.newsDetail.author,
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
          // 下拉加载的时候需要过滤掉刚最新发布的那条数据，避免页面数据重复
          if (this.latestCommentId.length) {
            rows = (rows || []).filter(item => {return this.latestCommentIds.indexOf(String(item.id)) === -1 });
          }
          (rows || []).forEach(comment => {
            comment.content = createFace(comment.content);
            comment.showReply = false;
            comment.reply = "";
            if (comment.child.total > 5) {
              comment.child.child = comment.child.child.slice(0, 2);
            }
            comment.child.child.forEach(child => {
              child.content = createFace(child.content);
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
    },
    getMajorCommentDatail(id, isInsert) {
      return new Promise((resolve, reject) => {
        http({
          url: `newsComment/detail`,
          method: "post",
          params: {
            id,
            userid: this.userId
          }
        }).then(res => {
          const { rows, code } = res.data;
          if (code === 200) {
            if (isInsert) {
              rows.content = createFace(rows.content);
              this.commentList.unshift(rows);
              this.totalComments += 1;
            } else {
              this.activatedComment.isZan = rows.isZan;
              this.activatedComment.zan = rows.zan;
            }
          }
        });
      });
    },
    // 获取子评论数
    getChildComments(commentId) {
      http({
        url: `newsComment/getPageChildlist?commentId=${commentId}&type=2&userId=${this.userId}`,
        method: "post",
        params: {
          number: this.childPageSize,
          topId: 0
        }
      }).then(res => {
        const { rows, code, total } = res.data;
        if (code === 200) {
          rows.forEach(comment => {
            comment.content = createFace(comment.content);
          });
          if (!this.activatedComment.child) {
            this.$set(this.activatedComment, "child", {})
            this.$set(this.activatedComment.child, "child", [])
          }
          this.activatedComment.child.child = rows;
          this.activatedComment.child.total = total;
        }
      });
    },
    aLinkClickFn(e) {
      const el = e.currentTarget;
      if (el.href) {
        e.preventDefault();
        this.$cordova.openUrl(el.href);
      }
    },
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.$refs.wrapper &&
        (vm.$refs.wrapper.scrollTop = to.meta.scollTopPosition);
    });
  },
  beforeRouteLeave(to, from, next) {
    from.meta.scollTopPosition = this.$refs.wrapper.scrollTop;
    next();
  },
  beforeDestroy() {
    this.elNewsList &&
      this.elNewsList.removeEventListener("click", this.clickFn, true);
    this.allA &&
      this.allA.forEach(elA => {
        elA.removeEventListener("click", this.aLinkClickFn, true);
      });
  },
  activated() {
    if (this.newsDetail) {
      this.activatedComment && this.getChildComments(this.activatedComment.id);
      this.activatedComment &&
        this.getMajorCommentDatail(this.activatedComment.id);
      this.$cordova && this.$cordova.setTop({ title: "联塑时讯" });
    }
  },
  mounted() {
    // 标题(必填),
    this.$cordova.setTop({ title: "联塑时讯" });
    const query = parseQueryParams();
    this.newsId = (query.newsId || "").replace(/[^0-9]+/g, "");
    

    // 本机测试代码

    // this.newsId = query.newsId || 1260;
    // this.userId = query.userId || "5087";
    // this.sex = query.sex || 1; // 1代表男， 2代表女
    // this.netName = query.nickName || "莫雪霞1";
    // this.userHp = query.avatarUrl || "";
    // this.getNewsDetail().then(res => {
    //   this.getComments();
    //   this.getVideo(res);
    // });
    this.init();
    // 获取用户信息
    this.$cordova.queryUserInfo().then(USERINFO => {
      typeof USERINFO === "string" && (USERINFO = JSON.parse(USERINFO));
      this.userId = USERINFO.UserID || "";
      this.sex = USERINFO.sex || 1; // 1代表男， 2代表女
      this.netName = USERINFO.nickName || "";
      this.userHp = USERINFO.avatarUrl || "";
      this.getNewsDetail().then(res => {
        this.getComments();
        this.getVideo(res);
      });
    });
  }
};
</script>
	