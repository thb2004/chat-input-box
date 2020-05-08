import { Indicator } from 'mint-ui';
import { createFace, htmlEscape } from "@/utils/utils";

import emojiList from "@/components/emoji/emoji.js";


// 格式化日期
export const formatDate = (dateTime) => {
    if (!dateTime || typeof (dateTime) !== "string") return "";
    const currentY = new Date().getFullYear();
    const [year] = dateTime.split('-');
    const REG = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/g;
    const replaceStr = currentY == year ? '$2-$3 $4:$5' : '$1-$2-$3 $4:$5'
    return dateTime.replace(REG, replaceStr);
}
// 显示加载框
export const openLoading = (text = '加载中...', spinnerType = 'fading-circle') => {
    Indicator.open({
        text, 
        spinnerType 
    });
}
// 关闭加载框
export const closeLoading = () => {
    Indicator.close();
}
export const calcLen = (textArr) => {
    let num1 = 0;
    for (let j = 0; j < textArr.length; j ++){
        const regzn = new RegExp("[\\u4E00-\\u9FFF]+$","g");
        if (!regzn.test(textArr[j])) {
            /* 非中文字符*/
          num1 = num1 + 1;
        } else {
            num1 = num1 + 2;
        }
    }
    return num1;
}


export const formatStrByLine = (selector, lineHeight = 30, line = 6) => {
    lineHeight = document.documentElement.clientWidth * lineHeight / 375;
    const nodeList = document.querySelectorAll(selector);
    Array.from(nodeList).forEach(ele => {
        if (ele.clientHeight > (lineHeight * line)) {
            ele.classList.add("ellipsis")
        }
    })
}
// 计算缩进
export const caclIndent = (selector) => {
    const nodeList = document.querySelectorAll(selector);
    Array.from(nodeList).forEach(ele => {
        const W = ele.previousSibling.offsetWidth;
        ele.style.textIndent = W + 2 + "px";
    })
}

export const formatStr = (selector, lineHeight = 20, line = 6) => {
    const nodeList = document.querySelectorAll(selector);
    lineHeight = document.documentElement.clientWidth * lineHeight / 375;
    Array.from(nodeList).forEach(ele => {
        const emojiMap = {};
        let text = ele.innerHTML;
        let copyText = ele.innerHTML;
        // 表情图片当做1个字符来处理
        text = text.replace(/[[[a-z]{2,20}]]/g, (match, pos) => {
            let replaceStr = match;
            for(let emoji of emojiList) {
                if(`[[${emoji.key}]]` === match) {
                    emojiMap[pos] = match;
                    replaceStr = "A";
                    break;
                }
            };
            return replaceStr
        })
        ele.innerHTML = text;
        const H = ele.offsetHeight;
        console.log(H, text, lineHeight, lineHeight*line)
        if (H > (lineHeight * line)) {
            for(let i = 0; i < text.length; i++) {
                let cText = ele.innerHTML = text.substr(0, i);  //表示在for循环中取出长度递增的文段
                if(ele.offsetHeight > lineHeight * line) { 
                    cText = cText.substr(0, i - 1);
                    //当前文本高度的内容的高度代表着刚好达到溢出的界限，
                    for(let j = 0; j < cText.length; j++) {
                        if (emojiMap[j]) {
                            cText = `${cText.slice(0, j)}${emojiMap[j]}${cText.slice(j+1)}`
                            j = j + emojiMap[j].length;
                        }
                    }
                    ele.innerHTML = createFace(cText) + '...';  //最后三个字
                    break;
            }
            }
        } else {
            ele.innerHTML = createFace(copyText)
        }
    })
}

// txt格式
const txtArr = ['txt','ini','log','dat'];
// doc格式
const docArr = ['doc','docx','wps'];
// xls格式
const xlsArr = ['xls','xlsx','et','ett','xlt'];
// ppt格式
const pptArr = ['ppt','pptx','pps'];
// img格式
const imgArr = ['gif','jpg','bmp','png','tif','ico', 'jpeg'];
// pdf格式
const pdfArr = ['pdf','caj'];
// zip格式
const zipArr = ['zip','rar','tar','jar'];
// 音频格式
const audioArr = ['audi','mp3'];
// 视频格式
const videoArr = ['mp4','flv','rmvb','mpg','avi','swf','rm'];

// 获取不同文件对应展示图
export const getImage = (suffix = "") => {
    const map = new Map();
    map.set(txtArr, 'txt.png');
    map.set(docArr, 'doc.png');
    map.set(xlsArr, 'xlsx.png');
    map.set(pptArr, 'pptx.png');
    map.set(imgArr, 'img.png');
    map.set(pdfArr, 'pdf.png');
    map.set(zipArr, 'zip.png');
    map.set(audioArr, 'audio.png');
    map.set(videoArr, 'video.png');
    const keys = map.keys();
    for(let i of keys) {
        if (i.indexOf(suffix.toLowerCase()) > -1) {
            return map.get(i)
        }
    }
    return "other.png"
}



    
    
