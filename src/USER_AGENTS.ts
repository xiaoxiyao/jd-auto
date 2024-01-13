/**
 * 得到一个两数之间的随机整数，包括两个数在内
 * @param min
 * @param max
 * @returns {number}
 */
function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //含最大值，含最小值
}
/**
 * 生成随机 iPhoneID
 * @returns {string}
 */
function randPhoneId() {
    return Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10);
}

export const USER_AGENT = process.env.JD_USER_AGENT ?? `jdapp;iPhone;10.2.0;${Math.ceil(Math.random() * 4 + 10)}.${Math.ceil(Math.random() * 4)};${randPhoneId()};network/4g;model/iPhone11,8;addressid/1188016812;appBuild/167724;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS ${getRandomIntInclusive(11, 14)}_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
