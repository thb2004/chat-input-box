<template>
  <div class="m-notice-detail">
    <div v-if="Object.keys(notice).length && !noAccess" class="m-notice-detail1">
      <!-- 主体部分 -->
      <div class="m-body">
        <!-- 公告标题 -->
        <div class="m-notice-title">{{ notice.name }}</div>
        <!-- 公告创建信息 -->
        <div class="m-notice-info">
          <div class="m-user-info">
            <span class="m-depart">{{ notice.creatorDeptName }}</span>
            <span class="m-creator">{{ notice.creatorName }}</span>
          </div>
          <div class="m-updated">{{ notice.updated }}</div>
        </div>
        <!-- 公告图片或者pdf -->
        <ul class="m-notice-images">
          <li v-for="item in images" :key="item.pictureId">
            <div
              v-viewer="options"
              v-if="['pdf'].indexOf(item.suffix.toLowerCase()) === -1"
              class="images"
            >
              <img
                v-lazy="item.pictureUrl"
                :src="item.pictureUrl"
                :key="item.pictureId"
                :data-remote-src="item.remoteUrl"
                class="ignore"
              />
            </div>
            <viewer
              :images="pdfImages"
              v-else-if="['pdf'].indexOf(item.suffix.toLowerCase()) > -1 && item.pictureUrl"
            >
              <img v-for="(src,index) in pdfImages" :src="src" :key="index" v-show="index === 0" />
            </viewer>
            <!-- <div
              :class="`pdf-wrapper${index} m-pdf-wrapper`"
              v-else-if="['pdf'].indexOf(item.suffix.toLowerCase()) > -1 && item.pictureUrl"
            ></div>-->
          </li>
        </ul>
        <!-- 公告内容 -->
        <div class="ql-snow" v-if="notice.context">
          <div v-html="notice.context" class="m-notice-content ql-editor"></div>
        </div>
        <!-- 附件内容 -->
        <ul class="m-notice-attach" v-if="attachments.length">
          <li
            v-for="(attach, index) in attachments"
            :key="index"
            class="flex attach"
            @click="openFile(attach)"
          >
            <div class="m-attach-img ignore">
              <img :src="getImage(attach.suffix)" alt />
              <div class="m-attch-info ignore">
                <div class="m-attach-title">{{ attach.name }}</div>
                <span class="m-attach-size">{{ attach.fileSize }}</span>
              </div>
            </div>
            <div class="m-file-state" @click="download(attach)">
              <svg :class="['icon ignore', {'is-exist': attach.exist}]" v-if="!attach.downloading">
                <use :xlink:href="`#${ attach.exist ? 'icon-yiwancheng' : 'icon-xiazai'}`" />
              </svg>
              <radial-indicator
                v-if="attach.downloading"
                :percentNum="attach.percentage"
                speed="3"
                size="24"
                color="#3071F2"
                backgroundColor="#CACED7"
              />
            </div>
          </li>
        </ul>
      </div>
      <!-- 水平线 -->
      <div class="m-horizontal-line"></div>
      <!-- 消息已读未读统计 -->
      <div class="m-users-info">
        <mt-navbar v-model="readStatus">
          <mt-tab-item id="2">已读 {{readedTotal}}</mt-tab-item>
          <mt-tab-item id="1">未读 {{unreadTotal}}</mt-tab-item>
        </mt-navbar>

        <!-- tab-container -->
        <mt-tab-container v-model="readStatus" :swipeable="false">
          <mt-tab-container-item id="2">
            <mt-loadmore
              :bottom-method="loadBottom"
              :bottom-all-loaded="readedAllLoaded"
              ref="loadmore_2"
              :auto-fill="false"
              :bottomDistance="0"
            >
              <ul class="m-users m-read-users">
                <li v-for="user in readedList" :key="user.userId">
                  <div class="m-user">
                    <v-user-img :user="user" />
                    <div class="m-user-name">{{user.userName}}</div>
                  </div>
                  <div class="m-read-time">{{user.lastReadTime}}</div>
                </li>
              </ul>
            </mt-loadmore>
          </mt-tab-container-item>
          <mt-tab-container-item id="1">
            <mt-loadmore
              :bottom-method="loadBottom"
              :bottom-all-loaded="unreadAllLoaded"
              ref="loadmore_1"
              :auto-fill="false"
              :bottomDistance="0"
            >
              <ul class="m-users m-unread-users">
                <li v-for="user in unreadList" :key="user.userId">
                  <div class="m-user">
                    <v-user-img :user="user" />
                    <div class="m-user-name">{{user.userName}}</div>
                  </div>
                </li>
              </ul>
            </mt-loadmore>
          </mt-tab-container-item>
        </mt-tab-container>
      </div>
    </div>
    <v-no-access v-if="noAccess" />
    <div>
      <canvas id="preview" hidden></canvas>
    </div>
  </div>
</template>

<style lang="scss">
@import "pdfh5/css/pdfh5.css";
@import "./NoticeDetail.scss";
</style>

<script>
import Pdfh5 from "pdfh5";

import { http } from "@/request/http.js";
import VNoAccess from "@/components/VNoAccess";
import VUserImg from "@/components/UserImg";
import RadialIndicator from "@/components/circle/circle.vue";

import { formatDate, getImage } from "@/utils/common";
import {
  getFileSize,
  parseQueryParams,
  getSuffix,
  getNameByUrl
} from "@/utils/utils";

import { GLOBALCONFIG } from "@/define/consts/const";

import { toastConfig } from "@/utils/config";

export default {
  name: "NoticeDetail",
  data() {
    return {
      pdf: null,
      pageNum: 1,
      context: null,
      preview: null,
      pageSize: 10,
      readedTopId: 0, // 已读topid
      unreadTopId: 0, // 未读topid
      readedAllLoaded: false, // 已读列表数据是否全部加载
      unreadAllLoaded: false, // 未读列表数据是否全部加载
      readedList: [],
      unreadList: [],
      notice: {},
      readStatus: "2",
      noAccess: false,
      pdfh5: null,
      pdfList: [], // pdf数组
      attachments: [], // 附件数量
      readedTotal: 0,
      unreadTotal: 0,
      options: {
        url: "data-remote-src"
      },
      images: [],
      pdfImages: []
    };
  },
  components: {
    VNoAccess,
    VUserImg,
    RadialIndicator
  },
  methods: {
    // 渲染页面到canvas
    readerPage(callback) {
      this.pdf.getPage(this.pageNum).then(page => {
        let scale = 1.8; // 默认1.5倍缩放
        let viewport = page.getViewport(scale);
        this.preview.height = viewport.height;
        this.preview.width = viewport.width;
        let renderContext = { canvasContext: this.context, viewport: viewport };
        page.render(renderContext).promise.then(() => {
          this.pdfImages.push(this.preview.toDataURL("image/jpeg"));
          callback();
        });
      });
    },
    // 保存图片
    savePage() {
      if (this.pageNum > this.pdf.numPages) {
        return;
      }
      this.readerPage(() => {
        this.pageNum++;
        this.savePage();
      });
    },
    showPDF(url) {
      let loadingTask = pdfjsLib.getDocument(url);
      loadingTask.promise.then(doc => {
        this.pdf = doc;
        this.pageNum = 1;
        this.preview = document.getElementById("preview");
        this.context = preview.getContext("2d");
        this.savePage();
      });
    },
    // 获取附件的展示图片
    getImage(suffix) {
      return `./images/${getImage(suffix)}`;
    },
    // 上拉加载
    loadBottom() {
      this.getViewer(this.readStatus);
      this.$refs[`loadmore_${this.readStatus}`].onBottomLoaded();
    },
    aLinkClickFn(e) {
      const el = e.currentTarget;
      if (el.href) {
        e.preventDefault();
        this.$cordova.openUrl(el.href);
      }
    },
    // 获取公告详情已读未读情况
    getViewer(type) {
      return new Promise((resolve, reject) => {
        http({
          url: `/noticeUser/getPagelist?noticeId=${this.noticeId}`,
          method: "post",
          params: {
            number: this.pageSize,
            topId: this[type == 2 ? "readedTopId" : "unreadTopId"],
            type
          }
        }).then(res => {
          const { rows, total } = res.data;
          const arr = this[type == 2 ? "readedList" : "unreadList"];
          if (rows) {
            rows.forEach(item => {
              type == 2 && (item.lastReadTime = formatDate(item.lastReadTime));
              this[type == 2 ? "readedList" : "unreadList"].push(item);
            });
            this[type == 2 ? "readedTopId" : "unreadTopId"] =
              arr[arr.length - 1].topId;
            this[type == 2 ? "readedTotal" : "unreadTotal"] = total;
          }
          if (total === arr.length) {
            this[type == 2 ? "readedAllLoaded" : "unreadAllLoaded"] = true;
          }
          resolve(true);
        });
      });
    },
    // 获取pdf地址
    getPdfUrl(data) {
      let proArr = [];
      (data.noticePictrues || []).forEach((pic, index) => {
        if (pic.suffix === "pdf") {
          proArr.push(
            this.getRemoteUrl({
              params: {
                viewPath: pic.pictureId,
                groupName: GLOBALCONFIG.file_server_fastdfs.userInfo.groupName
              },
              type: "pdf",
              pic
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
          if (type === "pdf") {
            this.pdfList.push(result ? result.data.data : pic.pictureUrl);
            pic.pictureUrl = result ? result.data.data : pic.pictureUrl;
          } else {
            this.$set(pic, "remoteUrl", "");
            pic.remoteUrl = result ? result.data.data : pic.pictureUrl;
          }
        });
        this.$nextTick(() => {
          this.pdfList.forEach((pdfurl, index) => {
            this.showPDF(pdfurl);
          });
        });
      });
    },
    // 检查文件是否已下载
    checkLocalPath(attachList) {
      const arr = [];
      attachList.forEach(attach => {
        arr.push({
          viewPath: attach.id,
          fileName: attach.name
        });
      });
      cordova.exec(
        function(success) {
          success.forEach((item, index) => {
            const attach = attachList.find(i => {
              return i.id == item.viewPath;
            });
            attach.exist = item.exist;
            attach.filePath = item.filePath;
          });
        },
        function(error) {},
        "ApplicationPlugin",
        "checkLocalPath",
        arr
      );
    },

    // 下载文件
    download(attach) {
      // 获取文件的下载地址和存储地址
      if (attach.downloading) return;
      if (attach.filePath) return;
      attach.downloading = true;
      this.getDownloadUrl(attach)
        .then(() => {
          let fileTransfer = new FileTransfer();
          let url = attach.downloadUrl;
          let filePath = attach.filePath;
          fileTransfer.download(
            url,
            filePath,
            entry => {
              console.log("下载成功");
              attach.exist = true;
              attach.downloading = false;
            },
            error => {
              console.log("下载失败");
              attach.downloading = false;
            },
            false,
            {
              headers: {
                Authorization: "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
              }
            }
          );

          fileTransfer.onprogress = function(progressEvent) {
            console.log(progressEvent);
            if (progressEvent.lengthComputable) {
              attach.percentage = parseInt(
                (100 * progressEvent.loaded) / progressEvent.total
              );
            }
          };
        })
        .catch(() => {
          attach.downloading = false;
        });
    },

    // 根据viewPath获取真实下载路径
    getDownloadUrl(attach) {
      console.log(attach);
      return new Promise((resolve, reject) => {
        cordova.exec(
          function(success) {
            attach.downloadUrl = success.downloadUrl;
            attach.filePath = success.filePath;
            console.log("getDownloadUrl成功");
            resolve(true);
          },
          function(error) {
            console.log(error);
            console.log("getDownloadUrl失败");
            reject(false);
          },
          "ApplicationPlugin",
          "viewPath",
          [{ viewPath: attach.id, fileName: attach.name, imageTypeFlag: false }]
        );
      });
    },
    openFile(attach) {
      console.log("openfile");
      console.log(attach);
      // 本地文件不存在，则先下载文件
      if (!attach.filePath) {
        !attach.downloading && this.download(attach);
        return;
      }
      cordova.exec(
        function(success) {
          console.log("成功的回调函数");
          console.log(JSON.stringify(success));
        },
        function(error) {
          console.log("失败的回调函数");
          console.log(error);
        },
        "ApplicationPlugin",
        "openFile",
        [{ filePath: attach.filePath }]
      );
    },
    // 获取图片原图地址
    getRemoteUrl({ params, pic, type }) {
      return new Promise((resolve, reject) => {
        http({
          url: `${this.baseUrl}${this.downloadUrl}`,
          method: "post",
          params
        })
          .then(result => {
            resolve({
              result,
              pic,
              type
            });
          })
          .catch(err => {
            resolve({
              result: null,
              pic,
              type
            });
          });
      });
    },
    getNoticeDetail() {
      return new Promise((resolve, reject) => {
        this.attachments = [];
        http({
          url: `/notice/detail?userId=${this.userId}&noticeId=${this.noticeId}&userName=${this.userName}&isRead=1`,
          method: "get"
        })
          .then(res => {
            const { code, rows, info } = res.data;
            if (!rows || rows.status == 2) {
              this.noAccess = true;
              reject("无权限查看");
              return;
            }
            if (code === 200) {
              rows.updated = formatDate(rows.updated);
              rows.noticePictrues.sort((a, b) => {
                return parseInt(a.pictureSort) - parseInt(b.pictureSort);
              });
              (rows.attachments || []).forEach(item => {
                this.attachments.push({
                  id: item.id,
                  name: item.name,
                  size: item.length,
                  fileSize: getFileSize(item.length),
                  suffix: item.suffix,
                  downloading: "",
                  exist: false,
                  percentage: 0
                });
              });
              this.notice = rows;
              this.images.push(...rows.noticePictrues);
              this.$nextTick(() => {
                this.allA = Array.from(document.querySelectorAll("a"));
                this.allA.forEach(elA => {
                  elA.addEventListener("click", this.aLinkClickFn);
                });
              });
              this.checkLocalPath(this.attachments);
              resolve(rows);
            } else {
              reject(info);
            }
          })
          .catch(e => {
            console.log(e);
            reject("获取公告详情失败,请检查网络");
          });
      });
    }
  },
  beforeDestroy() {
    this.allA &&
      this.allA.forEach(elA => {
        elA.removeEventListener("click", this.aLinkClickFn, true);
      });
  },
  mounted() {
    this.$cordova.setTop({ title: "公告详情" });
    const query = parseQueryParams();
    this.noticeId = (query.noticeId || "").replace(/[^0-9]+/g, "");
    // 群是否被解散或者当前人员是否在群里面
    this.noAccess = (query.noAccess || "") == 1 ? true : false;

    //测试代码
    // this.noticeId = query.noticeId || 1453 || 1448 || 1421; // || 1448
    // this.userId = "5086";
    // this.userName = query.userName || "谭海斌";
    // this.baseUrl = GLOBALCONFIG.file_server_fastdfs.baseUrl;
    // this.downloadUrl = GLOBALCONFIG.file_server_fastdfs.downloadFileApi;
    // this.getNoticeDetail()
    //   .then(res => {
    //     this.getPdfUrl(res);
    //   })
    //   .catch(message => {
    //     this.$toast({
    //       message,
    //       position: toastConfig.position
    //     });
    //   });
    // Promise.all([this.getViewer(2), this.getViewer(1)]);

    // 获取用户信息
    !this.noAccess && this.$cordova.queryUserInfo().then(USERINFO => {
      typeof USERINFO === "string" && (USERINFO = JSON.parse(USERINFO));
      this.userId = USERINFO.UserID || "";
      this.userName = USERINFO.name || "";
      this.baseUrl = GLOBALCONFIG.file_server_fastdfs.baseUrl;
      this.downloadUrl = GLOBALCONFIG.file_server_fastdfs.downloadFileApi;
      this.getNoticeDetail()
        .then(res => {
          this.getPdfUrl(res);
        })
        .catch(message => {
          this.$toast({
            message,
            position: toastConfig.position
          });
        });
      Promise.all([this.getViewer(2), this.getViewer(1)]);
    });
  }
};
</script>