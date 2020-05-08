<template>
  <div class="m-user-img">
    <div v-if="user.userHp" class="m-avatar">
      <img :src="user.userHp" @error="user.userHp=''" />
    </div>
    <div
      v-else
      class="m-avatar"
      :style="randomColor(user.sex)"
    >{{ (user.userName || '').substring(0, 1) }}</div>
  </div>
</template>
<style lang="scss" scoped>
	.m-user-img {
		.m-avatar {
      width: 32px;
      height: 32px;
      overflow: hidden;
      line-height: 32px;
      border-radius: 100%;
      text-align: center;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
    }
	}
</style>

<script>
export default {
	data(){
		return {
			colors: ["#F48FB1", "#00ACC1", "#F48FB1"],
		}
	},
	methods: {
    // 2代表女性，1代表男性
		randomColor(gender) {
      return `background-color: ${this.colors[gender || 0]}`;
    },
	},
	props: {
		user: {
			type: Object,
			default (){
				return {}
			}
		}
	}
}
</script>
    