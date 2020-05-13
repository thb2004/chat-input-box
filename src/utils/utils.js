import emojiList from "@/components/emoji/emoji.js";
import { GLOBALCONFIG } from "@/define/consts/const";
import { http } from "@/request/http.js";
import Vue from 'vue'


/*HTML转义*/
export const htmlEscape = (text, ifBlank) => {
    //&
    text = text.replace(/[<>"]/g, function (match, pos, originalText) {
        switch (match) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            //case "&":
            //    return "&amp;"; 
            case "\"":
                return "&quot";
        }
    });
    if (ifBlank) {
        text = text.replace(/\n/g, '<br>'); //替换换行符
        text = text.replace(/\s/g, '&nbsp;')
    }
    return text;
}

/**空格转义 */
export const blankEscape = (text) => {
    return text.replace(/\s/g, '&nbsp;');
}

///文本转义
export const textEscape = (text) => {
    text = text.toString();
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot/g, '\"');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/<br>/g, '\n'); //替换换行符

    return text;
}

//&转义
export const andEscape = (text) => {
    text = text.replace(/&/g, "&amp;");
    return text;
}

//替换文本
export const wTrim = (str) => {
    str = str.replace(/\n/g, '');
    str = str.replace(/<br>/g, ''); //替换换行符    
    str = str.replace(/&nbsp;/g, ''); //替换空格     
    str = str.replace(/nbsp;/g, '');
    str = str.replace(/ /g, '');
    str = str.replace(/\s/g, '');
    return str;
}

//获取字符长度
export const getBLen = (str) => {
    if (str == null) return 0;
    if (typeof str != "string") {
        str += "";
    }
    return str.replace(/[^\x00-\xff]/g, "01").length;
}

//生成表情
export const createFace = (text) => {
    emojiList.forEach(e => {
        let url = `<img src='./face/${e.url}' class='m-emoji' data-key='${e.key}'>`;
        let key = `[[${e.key}]]`
        if (text.indexOf(key) >= 0) {
            text = text.split(key).join(url);
        }
    });
    return text;
}


//创建节点
export const createNode = (htmlStr) => {
    let temp = document.createElement("div");
    temp.innerHTML = htmlStr;
    return temp;
}

// 计算文件大小
export const getFileSize = (fileSizeByte) => {
    let fileSizeMsg = "";
    if (fileSizeByte < 1048576) fileSizeMsg = (fileSizeByte / 1024).toFixed(2) + "KB";
    else if (fileSizeByte == 1048576) fileSizeMsg = "1MB";
    else if (fileSizeByte > 1048576 && fileSizeByte < 1073741824) fileSizeMsg = (fileSizeByte / (1024 * 1024)).toFixed(2) + "MB";
    else if (fileSizeByte > 1048576 && fileSizeByte == 1073741824) fileSizeMsg = "1GB";
    else if (fileSizeByte > 1073741824 && fileSizeByte < 1099511627776) fileSizeMsg = (fileSizeByte / (1024 * 1024 * 1024)).toFixed(2) + "GB";
    else fileSizeMsg = "文件超过1TB";
    return fileSizeMsg;
}

export const escapeMessage = (text) => {
    let temp = document.createElement("div");
    temp.innerHTML = text;
    let rstl = "";
    for (let i = 0; i < temp.childNodes.length; i++) {
        let dom = temp.childNodes[i];
        if (dom.nodeName == "#text") {
            rstl += htmlEscape(dom.nodeValue, true);
        } else {
            rstl += dom.outerHTML;
        }
    }
    return rstl;
}

export const isAndroid = () => {
    const UA = window.navigator.userAgent;
    return /Android/i.test(UA);
}

export const isIphoneXr = () => {
  return /iphone/gi.test(window.navigator.userAgent) && window.devicePixelRatio && window.devicePixelRatio === 2 && window.screen.width === 414 && window.screen.height === 896;
}

export const parseQueryParams = () => {
    let url = window.location.href;
    let search = url.substring(url.lastIndexOf("?") + 1);
    let obj = {};
    let reg = /([^?&=]+)=([^?&=]*)/g;
    search.replace(reg, function (rs, $1, $2) {
        let name = decodeURIComponent($1);
        let val = decodeURIComponent($2);
        val = String(val);
        obj[name] = val;
    });
    return obj;
}

export const getSuffix =  (fileName) => {
    // 后缀获取
    let suffix = "";
    try {
        let fileSufIndex = fileName.lastIndexOf(".");
        suffix = fileName.substring(fileSufIndex + 1).toLowerCase();
    } catch (err) {
        suffix = "";
    }
    return suffix
}

//根据路径截取文件名
export const getNameByUrl =  (url) => {
    let fname = '';
    let lastIdx = url.lastIndexOf('/')
    if (url.indexOf('?') >= 0) {
        let arr = url.split('?')
        fname = arr[0].substr(lastIdx + 1)
    } else {
        fname = url.substr(lastIdx + 1)
    }
    return fname
}
export const isInArea = (el, className) => {
    while (el) {
      if (Array.from(el.classList || []).indexOf(className) > -1) {
        return true;
      } else {
        el = el.parentNode;
      }
    }
    return false;
  }
// 获取远端地址
export const getRemoteUrl = (images, imgsObj) => {
    const promiseArr = [];
    const gifArr = ["gif", "tif", "tiff"];
    let post_url = `${GLOBALCONFIG.file_server_fastdfs.baseUrl}${GLOBALCONFIG.file_server_fastdfs.downloadFileApi}`;
    const promise = pic => {
      const isGif = gifArr.indexOf(getSuffix(getNameByUrl(pic.pictureUrl))) > -1 ? true : false;
      const type = !isGif ? GLOBALCONFIG.file_server_fastdfs.imageType : "";
      const groupName = isGif
        ? GLOBALCONFIG.file_server_fastdfs.picGroup
        : GLOBALCONFIG.file_server_fastdfs.userInfo.groupName;
      return new Promise((resolve, reject) => {
        http({
          url: post_url,
          method: "post",
          params: {
            viewPath: pic.pictureId,
            groupName,
            type
          }
        })
          .then(res => {
            resolve({
                pictureId: pic.pictureId,
              remoteUrl: res.data.data || pic.pictureUrl
            });
          })
          .catch(err => {
            resolve({
                pictureId: pic.pictureId,
              remoteUrl: pic.pictureUrl
            });
          });
      });
    };
    images.forEach((pic, index) => {
      promiseArr.push(promise(pic));
    });
    Promise.all(promiseArr).then(result => {
      result.forEach((i, index) => {
        images[index].remoteUrl = i.remoteUrl;
        imgsObj[i.pictureId] = i.remoteUrl
      });
    });
  }
