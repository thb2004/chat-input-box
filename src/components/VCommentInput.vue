<template>
  <div class="m-comment-input-box">
    <transition name="sendMsgTips">
      <div class="m-sendMsgTips" v-show="sendMsgTipsState">
        <span>{{sendMsgTips}}</span>
      </div>
    </transition>
    <!-- input输入框 -->
    <div class="m-input-wrapper">
      <div
        :class="['comments-textInput ignore', {'iphonexr-chat-input-focus': isFocus, 'iphonexr': isIphoneXr()}]"
        contenteditable="true"
        :id="boxId"
        :placeholder="placeholder"
        @cut="cut"
        @blur="blur"
        @copy="copy"
        @paste="paste"
        @input="input"
        @click="click"
        @focus="focus"
        @propertychange="propertychange"
      ></div>
    </div>
    <div
      :class="['flex horizotal-space-between m-chat-input-box-right ignore', {'is-facePanel-show ignore' :faceVisible}]"
    >
      <slot></slot>
      <div class="face-wraper ignore">
        <div @click="faceClick">
          <svg class="icon">
            <use xlink:href="#icon-pinglunbiaoqing" />
          </svg>
        </div>
      </div>
      <button @click.self="sendComs">{{ btnName }}</button>
    </div>
    <div class="m-face-list" key="m-face-list" v-show="faceVisible">
      <v-emoji @switchEmoji="(val) => {pushEmoji(val)}" :faceVisible="faceVisible"></v-emoji>
    </div>
  </div>
</template>
<style lang='scss'>
.comments-textInput {
  box-sizing: border-box;
  font-size: 15px;
  min-height: 50px;
  max-height: 120px;
  width: 230px;
  padding: 15px 0;
  background: #fff;
  position: relative;
  outline: none;
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
  overflow-y: scroll;
  overflow-x: hidden;
  word-wrap: break-word;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
  white-space: pre-wrap;
  &:empty::after {
    color: #8a8f99;
    content: attr(placeholder);
  }
  img {
    width: 25px;
    vertical-align: middle;
  }
}
// iphonexr点击body区域会导致自动聚焦,未聚焦的时候先让user-select为none,聚焦的时候再改回来为text;
.iphonexr {
  user-select: none;
  -webkit-user-select: none;
}
.iphonexr-chat-input-focus {
  user-select: text;
  -webkit-user-select: text;
}
.m-input-wrapper {
  box-sizing: border-box;
  position: relative;
  width: 230px;
  padding-right: 10px;
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
}
.comment-emojiPop {
  position: absolute;
  bottom: 50px;
  left: 0;
  background: #fff;
  z-index: 2000;
  color: #606266;
  line-height: 1.4;
  text-align: justify;
  font-size: 14px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.comment-emojiPop.ignore {
  border: 1px solid #ebeef5;
  padding: 12px;
}
button {
  padding: 6px 15px;
  border-radius: 19px;
  background: #3071f2;
  font-size: 16px;
  color: #fff;
}
.m-face-list {
  background: #fff;
  width: 100%;
}
.m-comment-input-box {
  position: relative;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  .face-wraper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    > div {
      display: flex;
      align-items: center;
      span {
        margin-left: 5px;
      }
    }
    span {
      color: #80aaff;
      vertical-align: top;
      font-size: 14px;
    }
    svg {
      width: 30px;
      height: 30px;
      color: #616063;
    }
  }
  .face-wraper.ignore {
    margin-right: 10px;
  }
  .m-sendMsgTips {
    position: absolute;
    top: -40px;
    left: 0;
    height: 12px;
    line-height: 12px;
    background-color: #ffdd99;
    border-radius: 15px;
    padding: 9px 15px; // animation:sendMsgTips 0.25s;
    span {
      font-size: 12px;
      color: #996b0f;
    }
  }
  .sendMsgTips-enter-active,
  .sendMsgTips-leave-active {
    transition: opacity 0.25s;
  }

  .sendMsgTips-enter,
  .sendMsgTips-leave-to {
    opacity: 0;
  }
  .m-chat-input-box-right {
    position: absolute;
    right: 0;
    bottom: 8px;
  }
  .is-facePanel-show.ignore {
    bottom: 168px;
  }
}
</style>

<script>
import Emoji from "@/components/emoji/emoji.vue";

import {
  htmlEscape,
  createFace,
  andEscape,
  wTrim,
  getBLen,
  textEscape,
  isAndroid,
  isIphoneXr
} from "@/utils/utils";

export default {
  name: "CommentInputBox",
  data() {
    return {
      sendMsgTipsState: false, //输入提示是否显示
      sendMsgTips: "", //输入提示
      sendMsgKey: "", //消息发送快捷键
      faceVisible: false,
      isFocus: false,
      lastEditRange: null // 保存上次光标位置信息
    };
  },
  props: {
    boxId: [String, Number],
    elId: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: "觉得不错说两句～"
    },
    btnName: {
      type: String,
      default: "发送"
    }
  },
  components: {
    "v-emoji": Emoji
  },
  methods: {
    isIphoneXr() {
      return isIphoneXr();
    },
    removeChild(element) {
      if (element) {
        document.body.removeChild(element);
        element = null;
      }
    },
    // 处理复制体信息
    dealMsg(nodes, config) {
      if (!nodes || !nodes.length) return;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        switch (node.nodeName) {
          case "#text": // 文本节点
            config.html += node.nodeValue;
            break;
          case "IMG": // 图片
            // 元素节点
            if (node.dataset.mobileNewsFace) {
              // 表情图片
              config.html += node.dataset.mobileNewsFace;
            } else {
              config.html += node.outerHTML;
            }
            break;
          case "BR":    // 换行符
            config.html += "\n";
            break;
          case "DIV":
            if (
              node.childNodes.length &&
              node.childNodes[0].nodeName !== "BR"
            ) {
              config.html += "\n";
            }
            this.dealMsg(node.childNodes, config);
            break;
        }
      }
    },
    // 剪切
    cut(e) {
      // 获取剪切的内容
      const range = window.getSelection().getRangeAt(0)
      let contents = range.cloneContents();
      let config = {
        html: ""
      };
      this.dealMsg(contents.childNodes, config);
      console.log(config.html);
      this.removeChild(this.element);
      range.deleteContents();
      this.element = document.createElement("textarea");
      this.element.style.position = "absolute";
      this.element.style.left = "-9999px";
      let yPosition = window.pageYOffset || document.documentElement.scrollTop;
      this.element.style.top = `${yPosition}px`;
      this.element.value = config.html;
      document.body.appendChild(this.element);
      this.element.select();
      this.element.setSelectionRange(0, this.element.value.length);
      try {
        this.succeeded = document.execCommand("cut");
      } catch (err) {
        this.succeeded = false;
      }
      setTimeout(() => {
        this.removeChild(this.element);
      }, 100);
    },
    // 复制
    copy(e) {
      // 获取复制的内容
      let contents = window
        .getSelection()
        .getRangeAt(0)
        .cloneContents();
      let config = {
        html: ""
      };
      this.dealMsg(contents.childNodes, config);
      console.log(config.html);
      this.removeChild(this.element);

      this.element = document.createElement("textarea");
      this.element.style.position = "absolute";
      this.element.style.left = "-9999px";
      let yPosition = window.pageYOffset || document.documentElement.scrollTop;
      this.element.style.top = `${yPosition}px`;
      this.element.setAttribute("readonly", "");
      this.element.value = config.html;
      document.body.appendChild(this.element);
      let isReadOnly = this.element.hasAttribute("readonly");

      if (!isReadOnly) {
        this.element.setAttribute("readonly", "");
      }

      this.element.select();
      this.element.setSelectionRange(0, this.element.value.length);

      if (!isReadOnly) {
        this.element.removeAttribute("readonly");
      }

      try {
        this.succeeded = document.execCommand("copy");
      } catch (err) {
        this.succeeded = false;
      }
    },
    createElement(tagName, htmlStr) {
      let temp = document.createElement(tagName);
      temp.innerHTML = htmlStr;
      return temp;
    },
    //创建节点
    createNode(htmlStr) {
      let temp = document.createElement("div");
      temp.innerHTML = htmlStr;
      return temp;
    },
    dealPasteMsg(e) {
      let paste = "";
      return new Promise((resolve, reject) => {
        if (e.clipboardData && e.clipboardData.items) {
          const len = e.clipboardData.items.length;
          const promiseArr = [];
          for (let i = 0; i < len; i++) {
            let item = e.clipboardData.items[i];
            if (item.kind === "string") {
              const promise = new Promise((resolve, reject) => {
                item.getAsString(str => {
                  // uri要解码
                  if (item.type.indexOf("uri") != -1) {
                    resolve(decodeURIComponent(str));
                  } else {
                    resolve(str);
                  }
                });
              });
              promiseArr.push(promise);
            }
          }
          Promise.all(promiseArr)
            .then(res => {
              // for (let i of res) {
              //   paste += i;
              // }
              try {
                paste = res[promiseArr.length - 1];
              } catch (err) {}
              resolve(paste);
            })
            .catch(err => {
              resolve(paste);
            });
        } else if (window.clipboardData) {
          paste = window.clipboardData.getData("Text");
          resolve(paste);
        } else {
          // console.log(e.clipboardData.getData("text/plain"))
          // console.log(e.clipboardData.getData("text/html"))
          // console.log(navigator.clipboard.readText())

          // document.execCommand("insertHTML");

          resolve(e.clipboardData.getData("text/plain"));
        }
      });
    },
    dealNode(dom) {
      switch (dom.nodeName) {
        case "IMG":
          //表情
          if (dom.dataset.key) {
            let data = {
              url: dom.src,
              index: 10,
              key: dom.dataset.key
            };
            this.pushEmoji(data);
          }
          break;
        case "A":
          //链接
          let oTextNode = document.createTextNode(
            textEscape(`${dom.innerText} `)
          );
          this.insertPositionNode(this.boxId, oTextNode);
          break;
        case "BR":
          let br = document.createElement("br");
          this.insertPositionNode(this.boxId, br);
          break;
        case "DIV":
          for (let i = 0; i < dom.childNodes.length; i++) {
            let node = dom.childNodes[i];
            this.dealNode(node);
          }
          break;
        case "SPAN":
          let span = document.createTextNode(textEscape(`${dom.innerText}`));
          this.insertPositionNode(this.boxId, span);
          break;
        case "#text":
          let other = document.createTextNode(textEscape(`${dom.data}`));
          this.insertPositionNode(this.boxId, other);
          break;
      }
    },
    //粘贴消息
    paste(e) {
      e.preventDefault();
      this.dealPasteMsg(e).then(paste => {
        console.log(paste);
        if (paste.trim()) {
          paste = andEscape(paste);
          paste = createFace(paste);
          let doms = this.createNode(paste);
          for (let i = 0; i < doms.childNodes.length; i++) {
            this.getFocus();
            let dom = doms.childNodes[i];
            this.dealNode(dom);
          }
        }
      });
    },
    input(ev) {
      if (!isAndroid()) {
        this.deleteBr(ev.target);
      }
      this.getLast();
    },
    blur() {
      this.isFocus = false;
      this.timer && clearInterval(this.timer);
    },
    click(ev) {
      this.getLast();
    },
    focus(ev) {
      this.isFocus = true;
      this.timer = setInterval(() => {
        document.body.scrollTop = document.body.scrollHeight;
      }, 0);
      this.getLast();
    },
    propertychange(ev) {
      if (!isAndroid()) {
        this.deleteBr(ev.target);
      }
      this.getLast();
    },
    // 获取光标所在位置
    getLast() {
      setTimeout(() => {
        const selection = window.getSelection
          ? window.getSelection()
          : document.getSelection();
        if (selection.rangeCount) {
          this.lastEditRange = selection.getRangeAt(0);
        }
      }, 0);
    },
    faceClick(ev) {
      ev.stopPropagation();
      this.faceVisible = !this.faceVisible;
    },
    // 兼容ios
    deleteBr(elInput) {
      const innerHTML = elInput.innerHTML;
      const LEN = innerHTML.length;
      if (LEN === 4 && innerHTML === "<br>") {
        elInput.innerHTML = "";
      }
    },
    // 根据消息类型切割消息
    cutMsg(preVal, config) {
      if (!preVal) return;
      !config &&
        (config = {
          messageArr_: [],
          ui_str: "", //推送到界面
          send_str: "" //推送到后台数据库
        });
      preVal = Array.from(preVal);
      if (!preVal.length) return;
      let count = preVal.length;
      let showType = 1;
      preVal.forEach((item, index, array) => {
        // 文本
        if (item.nodeName == "#text") {
          let text = item.data;
          let data = item.data;
          text = htmlEscape(text, false);
          let reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
          text = text.replace(reg, function(a, b, c) {
            return '<a href="javascript:void(0)" target="_blank">' + a + "</a>";
          });

          //纯文本需要HTML转义
          data = htmlEscape(data, true);
          config.ui_str += text;
          config.send_str += textEscape(data);
        }
        // 图片
        else if (item.nodeName == "IMG") {
          // 表情
          if (item.dataset.id) {
            config.ui_str += `<img src='${item.src}' class='m-emoji' data-key='${item.dataset.key}' >`;

            config.send_str += "[[" + item.dataset.key + "]]";
            if (count == 1) {
              showType = 10;
            }
          }
        }
        // 换行符
        else if (item.nodeName == "BR") {
          if (config.ui_str !== "") {
            config.ui_str += "<br>";
            config.send_str += "\n";
          }
        }
        // DIV
        else if (item.nodeName == "DIV") {
          const nodes = item.childNodes;
          if (nodes.length && nodes[0].nodeName !== "BR") {
            config.ui_str += "<br>";
            config.send_str += "\n";
          }
          this.cutMsg(nodes, config);
        }
      });

      if (wTrim(config.ui_str) == "" && config.messageArr_.length == 0) {
        if (preVal.length > 0) {
          preVal[0].data = "";
        }
        this.showTips("发送的内容不能为空，请重新输入");
        return;
      }

      if (config.ui_str !== "") {
        config.ui_str = config.ui_str.replace(new RegExp("\n", "g"), "<br>");
        config.messageArr_ = [
          {
            type: showType,
            ui_msg: config.ui_str,
            send_msg: config.send_str
          }
        ];
      }
      return config.messageArr_;
    },
    //显示提示
    showTips(msg) {
      this.sendMsgTips = msg;
      if (!this.sendMsgTipsState) {
        this.sendMsgTipsState = true;
        setTimeout(() => {
          this.sendMsgTipsState = false;
        }, 1000);
      }
    },
    // 发送评论
    sendComs(ev) {
      ev.stopPropagation();
      let preVal = this.editor.childNodes;
      let msgArr = this.cutMsg(preVal);
      if (!msgArr || msgArr.length === 0) {
        this.showTips("发送的内容不能为空，请重新输入");
        return;
      }
      //限制输入长度
      let index = msgArr.indexOf(
        msgArr.find(x => {
          return x.type == 1 && getBLen(x.send_msg) > 2000;
        })
      );
      if (index >= 0) {
        this.showTips("内容太多，请分条发送");
        return;
      }
      this.$emit("sendComs", msgArr);
      this.editor.innerHTML = "";
      this.faceVisible = false;
    },
    // 插入表情
    pushEmoji(val) {
      let doc_emoji = document.createElement("img");
      doc_emoji.setAttribute("src", val.url);
      doc_emoji.setAttribute("class", "m-emoji ignore");
      doc_emoji.setAttribute("data-id", val.index);
      doc_emoji.setAttribute("data-key", val.key);
      doc_emoji.setAttribute("data-mobile-news-face", `[[${val.key}]]`);
      // if (isAndroid()) {
      this.getFocus();
      this.insertPositionNode(this.boxId, doc_emoji);
      // } else {
      //   this.iosInsertPositionNode(this.boxId, doc_emoji);
      // }
    },
    initRange() {
      let range = document.createRange();
      range.setStart(this.editor, 0);
      return range;
    },
    // 自动追加光标至结尾处
    getFocus() {
      let selection = window.getSelection(); //获取当前选中区域
      //判断选中区域为当前输入框节点id时才能触发
      if (
        !(
          selection.baseNode &&
          (selection.baseNode.id == this.boxId ||
            selection.baseNode.parentElement.id == this.boxId)
        )
      ) {
        this.initRange();
      }
    },
    // 找出光标处的元素
    findRangeEle(arr, offset) {
      offset = offset || 1;
      return arr[offset - 1];
    },
    //在目标元素之后插入新元素
    insertAfter(newElement, targetElement) {
      if (!targetElement) return;
      let parent = targetElement.parentNode;
      if (parent.lastChild == targetElement) {
        parent.appendChild(newElement);
      } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
      }
    },

    // 判断选区是否在编辑器内
    rangeIsInEditor(el) {
      while (el) {
        if (el.id === this.boxId) {
          return true;
        } else {
          el = el.parentNode;
        }
      }
      return false;
    },
    iosInsertPositionNode(nodeId, doc) {
      // 创建片段
      let frag = document.createDocumentFragment();
      // 选区不存在，则初始化选区
      if (!this.lastEditRange) {
        this.lastEditRange = this.initRange();
      }
      let el = this.lastEditRange.startContainer;
      // 选区不在编辑器内，则初始化选区
      if (!this.rangeIsInEditor(el)) {
        this.lastEditRange = this.initRange();
        el = this.lastEditRange.startContainer;
      }
      // nodeType 3为text节点
      const { parentNode, nodeValue, nodeType } = el;
      const offset = this.lastEditRange.startOffset;

      if (nodeType === 3) {
        // 文本节点
        let startTextNode = document.createTextNode(
          textEscape(`${nodeValue.slice(0, offset)}`)
        );
        let endTextNode = document.createTextNode(
          textEscape(`${nodeValue.slice(offset, nodeValue.length)}`)
        );
        frag.appendChild(startTextNode);
        frag.appendChild(doc);
        frag.appendChild(endTextNode);
        parentNode.replaceChild(frag, el);
      } else if (nodeType === 1) {
        // 元素节点
        frag.appendChild(doc);
        if (!el.childNodes.length) {
          el.appendChild(frag);
        } else {
          const preEle = this.findRangeEle(el.childNodes, offset);
          this.insertAfter(frag, preEle);
        }
      }
      doc.scrollIntoView(); // 让插入的元素显示在可视范围中
      this.lastEditRange.setStartAfter(doc);
    },

    insertPositionNode(nodeId, doc) {
      let sel = window.getSelection();
      let range = this.lastEditRange;
      let el = document.createElement("div");
      let frag = document.createDocumentFragment(),
        node,
        lastNode;

      // this.editor.blur();
      this.editor.contentEditable = false;
      // 判断是否有最后光标对象存在
      if (this.lastEditRange) {
        // 存在最后光标对象，选定对象清除所有光标并添加最后光标还原之前的状态
        sel.removeAllRanges();
        sel.addRange(this.lastEditRange);
        if (!this.rangeIsInEditor(this.lastEditRange.startContainer)) {
          range = this.initRange();
        }
      } else {
        range = this.initRange();
      }
      // 避免插入的时候重新聚焦导致软键盘弹出
      range.deleteContents();
      el.appendChild(doc);

      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        this.lastEditRange = range;
        this.editor.contentEditable = true;
        const parentNode = lastNode.parentNode;
        const lastChild = parentNode ? parentNode.lastChild : null;
        if (lastChild && lastChild.nodeName === "BR") {
          parentNode.removeChild(lastChild);
        }
        console.log(lastChild);
      }
      doc.scrollIntoView && doc.scrollIntoView(); // 让插入的元素显示在可视范围中
    },
    closeFacePanel(ev) {
      this.faceVisible = false;
    },
    touchmoveFn(ev) {
      if (Array.from(ev.target.classList || []).indexOf("face") > -1) return;
      this.closeFacePanel();
    },
    chatInputBlur(ev) {
      if (!this.rangeIsInEditor(ev.target)) {
        this.editor && this.editor.blur();
      }
    }
  },
  beforeDestroy() {
    this.timer && clearInterval(this.timer);
    this.$bus.off("closeFacePanel", this.closeFacePanel);
    document.body.removeEventListener("click", this.closeFacePanel);
    document.body.removeEventListener("touchmove", this.touchmoveFn);
    document.body.removeEventListener("touchend", this.chatInputBlur);
    document.removeEventListener("selectionchange", this.getLast);
  },
  mounted() {
    this.$bus.on("closeFacePanel", this.closeFacePanel);
    this.editor = document.getElementById(this.boxId);
    document.body.addEventListener("click", this.closeFacePanel);
    document.body.addEventListener("touchmove", this.touchmoveFn);
    // ios聚焦的时候。。点击页面其他地方不失去焦点，，所以需js失去焦点,避免插入表情的时候会先聚焦导致软键盘弹出
    document.body.addEventListener("touchend", this.chatInputBlur);
    document.addEventListener("selectionchange", this.getLast);
  }
};
</script>

