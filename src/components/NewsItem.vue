<template>
    <div class="m-news-item">
			<!-- 无图片 -->
      <div class="m-plain-text" v-if="!config.pics.length">
        <div class="m-top-header">
					<span class="m-top-text" v-if="config.stick == 1">顶</span>
          <span class="m-new-text" v-if="config.isRead === 0">最新</span>
          <h3 class="m-news-title"> {{ config.name }} </h3>
        </div>
        <div class="m-top-footer">
          <span class="m-category" :style="randomColor()" v-if="config.categoryName">{{ config.categoryName }}</span>
          <span class="m-news-comments">{{ config.commentNum }}评论</span>
          <span class="m-news-thumbs">{{ config.zanNum }}赞</span>
        </div>
      </div>
			 <!-- 单张图片 -->
      <div class="m-single-img" v-if="config.pics.length === 1 && config.pics[0].type === 'image'">
        <div class="m-top-left">
          <div class="m-top-header">
            <span class="m-top-text" v-if="config.stick == 1">顶</span>
          	<span class="m-new-text" v-if="config.isRead === 0">最新</span>
            <h3 class="m-news-title"> {{ config.name }} </h3>
          </div>
          <div class="m-top-footer">
            <span class="m-category" :style="randomColor()" v-if="config.categoryName">{{ config.categoryName }}</span>
						<span class="m-news-comments">{{ config.commentNum }}评论</span>
						<span class="m-news-thumbs">{{ config.zanNum }}赞</span>
          </div>
        </div>
        <div class="m-top-right">
          <img v-lazy="config.pics[0].pictureUrl" />
        </div>
      </div>
      <!-- 单个视频 -->
      <div class="m-single-video" v-if="config.pics.length === 1 && config.pics[0].type === 'video'">
        <div class="m-top-img">
          <img v-lazy="config.pics[0].pictureUrl" />
        </div>
        <h3 class="m-news-title"> {{ config.name }} </h3>
        <div class="m-top-footer">
          <span class="m-category" :style="randomColor()" v-if="config.categoryName">{{ config.categoryName }}</span>
					<span class="m-news-comments">{{ config.commentNum }}评论</span>
					<span class="m-news-thumbs">{{ config.zanNum }}赞</span>
        </div>
      </div>
      <!-- 多图片或者多视频 -->
      <div class="m-many-img" v-if="config.pics.length > 1">
        <div class="m-top-header">
          <span class="m-top-text" v-if="config.stick == 1">顶</span>
          <span class="m-new-text" v-if="config.isRead === 0">最新</span>
          <h3 class="m-news-title"> {{ config.name }} </h3>
        </div>
        <div class="m-top-center">
          <div class="m-img-wrapper">
						<img v-lazy="item.pictureUrl" v-for="item in config.pics" :key="item.pictureId"/>
          </div>
        </div>
        <div class="m-top-footer">
          <span class="m-category" :style="randomColor()" v-if="config.categoryName">{{ config.categoryName }}</span>
					<span class="m-news-comments">{{ config.commentNum }}评论</span>
					<span class="m-news-thumbs">{{ config.zanNum }}赞</span>
        </div>
      </div>
		</div>
</template>

<style lang="scss" scoped>
  @import "@/style/mixin.scss";
	.m-top-text, .m-new-text, .m-category {
      padding: 2px 6px;
      color: #fff;
      background:#FFAE05;
      border-radius: 4px;
      margin-right: 8px;
      height:18px;
      line-height: 18px;
      font-size:13px;
  }
  .m-top-text {
    float: left;
  }
  .m-new-text {
    background:#FF4C4C;
  }
  .m-top-footer {
      .m-news-comments, .m-news-thumbs {
        font-size:13px;
        font-family:PingFangSC-Regular,PingFang SC;
        font-weight:400;
        color:#A1A5AC;
        line-height:18px;
        margin-right: 8px;
      }
  }
  .m-news-title {
      font-weight: 500;
      font-size:19px;
      line-height: 27px;
      font-family:PingFangSC-Medium,PingFang SC;
      color: #2E3033;
  }
   .m-many-img {
      .m-news-title {
        @include text-overflow;
      }
  }
  .m-plain-text, .m-single-video {
      .m-top-footer {
        margin-top: 10px;
      }
  }
  .m-single-video {
      .m-top-img {
        margin-bottom: 15px;
        img {
          width: 100%;
          height: 168px;
        }
      }
  }
  .m-plain-text, .m-single-img {
			.m-news-title {
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
			}
      .m-new-text {
        float: left;
        background: #FF4C4C;
      }
  }
  .m-single-img {
       display: flex;
       justify-content: space-between;
       .m-top-left {
        position: relative;
        width: 192px;
        .m-new-text {
          float: left;
        }
      }
      .m-top-footer {
        position: absolute;
        bottom: 0;
      }
      img {
        width: 128px;
        height: 83px;
      }
  }
  .m-many-img {
      .m-top-header {
        display: flex;
        align-items: center;
      }
      .m-top-left {
        width: 192px;
      }
  }
  .m-img-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      img {
        width: 100px;
      }
  }
</style>

<script>
export default {
	name: "newsItem",
	data(){
		return {
			publicPath: process.env.BASE_URL,
      colors: [
        {
          color: "#D4855A",
          bgColor: "#FFEDED",
        },
        {
          color: "#7380B6",
          bgColor: "#EBF0F7",
        },
        {
          color: "#7BB673",
          bgColor: "#EBF7EC",
        }
      ],
		}
	},
	props: {
		config: {
			type: Object,
			default(){
				return {}
			}
		}
	},
	methods: {
		randomColor(gender) {
      let i = Math.floor(Math.random() * this.colors.length);
      return `background-color: ${this.colors[i].bgColor}; color: ${this.colors[i].color}`;
    },
	}
}
</script>