const GLOBALCONFIG = {
    //文件服务
    file_server_fastdfs:
    {
        baseUrl:"http://172.16.100.67:8097/",
        userInfo: {
            // 用户信息
            userName: "admin",
            userId: 111111,
            groupName: "CC",
        },
        picGroup: 'PIC', //缩略图的组
        imageType: 'image', //图片类型
        videoType: 'video', //视频类型
        downloadFileApi: 'upload/downFile', //获取完整路径的接口名称
        videoDownloadFileApi: 'upload/downFileRanges',
        download: {
            api: 'upload/downLoadSubFile', //接口名称
            chunkSize: 1048576 //每次向服务器请求的字节量
        },
        error_url: '172.16.100.60:18133'
    },
    baseUrl: "http://172.16.100.67:8302/",
    videoUrl: "http://172.16.100.67:8097/",
}

export {GLOBALCONFIG}