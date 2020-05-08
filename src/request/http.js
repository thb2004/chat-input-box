import axios from 'axios'; // 引入axios
import QS from 'qs'; // 引入qs模块，用来序列化post类型的数据，后面会提到

import { GLOBALCONFIG } from "@/define/consts/const";

axios.defaults.timeout = 1500000; // 请求超时时间

axios.defaults.baseURL = GLOBALCONFIG.baseUrl;


axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
// 封装请求方法
const http = ({
    url,
    method,
    params,
    timeout
}) => {
    /**
     * url: 地址
     * method: 请求方法
     * params: 参数
     * timeout: 超时时间
     */

    !params && (params = {});
    let config = {
        method,
        url
    };

    // 用来覆盖默认的超时时间
    if (timeout) {
        config.timeout = timeout;
    }

    method = method.toUpperCase();
    if (method == 'GET') {
        config.params = params;
    } else {
        config.data = params;
    }
    return axios(config);
}

export { http }