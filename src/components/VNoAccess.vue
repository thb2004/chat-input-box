<template>
    <div class="m-no-access-wrapper">
        <div>
            <div class="m-no-access"></div>
            <div class="m-tips">Sorry，{{tip}}不存在～</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .m-no-access-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        height: calc(100% - 60px);
        .m-no-access {
            width: 192px;
            height: 226px;
            background: url('/noAccess.png') center center no-repeat;
            margin-bottom: 20px;
        }
        .m-tips {
            text-align: center;
            font-size: 13px;
            line-height:24px;
            font-family: "Microsoft YaHei";
            color: #8A8F99
        }
    }
    
</style>

<script>
    export default {
        name: "VNoAccess",
        props: {
            tip: {
                type: String,
                default: "公告",
            }
        }
    }
</script>