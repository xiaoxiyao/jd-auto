import { USER_AGENT } from './USER_AGENTS.js';
import { sendNotify } from './sendNotify.js';
import { wait } from './utils.js';
import cookiesArr from './jdCookie.js';
import shareCodesArr from './jdFruitShareCodes.js';

/*
东东水果:脚本更新地址 https://gitee.com/lxk0301/jd_scripts/raw/master/jd_fruit.js
更新时间：2021-8-20
活动入口：京东APP我的-更多工具-东东农场
东东农场活动链接：https://h5.m.jd.com/babelDiy/Zeus/3KSjXqQabiTuD1cJ28QskrpWoBKT/index.html
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
互助码shareCode请先手动运行脚本查看打印可看到
一天只能帮助3个人。多出的助力码无效

==========================Quantumultx=========================
[task_local]
#jd免费水果
5 6-18/6 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_fruit.js, tag=东东农场, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdnc.png, enabled=true
=========================Loon=============================
[Script]
cron "5 6-18/6 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_fruit.js,tag=东东农场

=========================Surge============================
东东农场 = type=cron,cronexp="5 6-18/6 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_fruit.js

=========================小火箭===========================
东东农场 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_fruit.js, cronexpr="5 6-18/6 * * *", timeout=3600, enable=true

jd免费水果 搬的https://github.com/liuxiaoyucc/jd-helper/blob/a6f275d9785748014fc6cca821e58427162e9336/fruit/fruit.js
*/
const $name = '东东农场';
let cookie = '', jdFruitShareArr: string[] = [], newShareCodes: string[];
//助力好友分享码(最多3个,否则后面的助力失败),原因:京东农场每人每天只有3次助力机会
//此此内容是IOS用户下载脚本到本地使用，填写互助码的地方，同一京东账号的好友互助码请使用@符号隔开。
//下面给出两个账号的填写示例（iOS只支持2个京东账号）
let shareCodes = [ // 这个列表填入你要助力的好友的shareCode
  //账号一的好友shareCode,不同好友的shareCode中间用@符号隔开
  '0a74407df5df4fa99672a037eec61f7e@dbb21614667246fabcfd9685b6f448f3@6fbd26cc27ac44d6a7fed34092453f77@61ff5c624949454aa88561f2cd721bf6@56db8e7bc5874668ba7d5195230d067a@b9d287c974cc498d94112f1b064cf934@23b49f5a106b4d61b2ea505d5a4e1056@8107cad4b82847a698ca7d7de9115f36@35fcfda6d3af48e7afe79f5e18a39e55@5a41b6db624346cdbe347b61279fda8f@3fa4d41fe66e47bd8a9549e33e3b9b54@5dc8a7b9f4544a8ca79f8cf62d0c7623@4918db5a466c4332843c75064a5a3880@b48561c90c8c45f5b355034629715a80@9b8419ddb29240468d06edfd61fa642e',
  //账号二的好友shareCode,不同好友的shareCode中间用@符号隔开
  'b1638a774d054a05a30a17d3b4d364b8@f92cb56c6a1349f5a35f0372aa041ea0@9c52670d52ad4e1a812f894563c746ea@8175509d82504e96828afc8b1bbb9cb3@2673c3777d4443829b2a635059953a28@d2d5d435675544679413cb9145577e0f@35fcfda6d3af48e7afe79f5e18a39e55@5a41b6db624346cdbe347b61279fda8f@3fa4d41fe66e47bd8a9549e33e3b9b54@5dc8a7b9f4544a8ca79f8cf62d0c7623@4918db5a466c4332843c75064a5a3880@b48561c90c8c45f5b355034629715a80@9b8419ddb29240468d06edfd61fa642e',
  //账号三的好友shareCode,不同好友的shareCode中间用@符号隔开
  '35fcfda6d3af48e7afe79f5e18a39e55@5a41b6db624346cdbe347b61279fda8f@3fa4d41fe66e47bd8a9549e33e3b9b54@5dc8a7b9f4544a8ca79f8cf62d0c7623@4918db5a466c4332843c75064a5a3880@b48561c90c8c45f5b355034629715a80',
]
let message = '', isFruitFinished = false;
let option: {
  'open-url'?: string
} = {};
const retainWater = parseInt(process.env.retainWater) ?? 100;//保留水滴大于多少g,默认100g;
let jdFruitBeanCard = false;//农场使用水滴换豆卡(如果出现限时活动时100g水换20豆,此时比浇水划算,推荐换豆),true表示换豆(不浇水),false表示不换豆(继续浇水),脚本默认是浇水
let randomCount = 20;
const JD_API_HOST = 'https://api.m.jd.com/client.action';
const urlSchema = `openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/3KSjXqQabiTuD1cJ28QskrpWoBKT/index.html%22%20%7D`;
let isLogin: boolean;
let $UserName: string, $index: number = 0, $nickName: string = '', $retry: number;
let farmInfo: {
  farmUserPro: {
    name: string,
    winTimes: number,
    totalEnergy: number,
    treeEnergy: number,
    treeTotalEnergy: number,
    shareCode: string
  },
  treeState: number,
  todayGotWaterGoalTask: {
    canPop: boolean
  },
  toFlowTimes: number,
  toFruitTimes: number,
};
let farmTask: {
  signInit: {
    todaySigned: boolean,
    totalSigned: number,
    signEnergyEachAmount: number
  },
  gotBrowseTaskAdInit: {
    f: boolean,
    userBrowseTaskAds: Array<{
      limit: number,
      hadFinishedTimes: number,
      mainTitle: string,
      advertId: string
    }>
  },
  gotThreeMealInit: {
    f: boolean
  },
  waterFriendTaskInit: {
    f: boolean,
    waterFriendCountKey: number,
    waterFriendMax: number,
    waterFriendSendWater: number,
    waterFriendGotAward: boolean
  },
  totalWaterTaskInit: {
    f: boolean,
    totalWaterTaskTimes: number;
    totalWaterTaskLimit: number;
  },
  firstWaterInit: {
    f: boolean,
    totalWaterTimes: number
  },
  waterRainInit: {
    f: boolean,
    lastTime: number,
    winTimes: number
  }
};
let signResult: {
  code: string,
  amount: number
};
let goalResult: {
  code: string,
  addEnergy: number
};
let browseResult: {
  code: string
};
let browseRwardResult: {
  code: string,
  amount: number
};
let threeMeal: {
  code: string,
  amount: number
};
let myCardInfoRes: {
  fastCard: number,
  doubleCard: number,
  beanCard: number,
  signCard: number
};
let waterResult: {
  code: string,
  totalEnergy: number,
  finished: boolean,
  waterStatus: number,
  treeEnergy: number
};
let firstWaterReward: {
  code: string,
  amount: number
};
let totalWaterReward: {
  code: string,
  totalWaterTaskEnergy: number
};
let userMyCardRes: {
  code: string,
  beanCount: number
};
let gotStageAwardForFarmRes: {
  code: string,
  addEnergy: number;
};
let initForTurntableFarmRes: {
  code: string,
  timingIntervalHours: number,
  timingLastSysTime: number,
  sysTime: number,
  timingGotStatus: boolean,
  remainLotteryTimes: number,
  turntableInfos: Array<{
    type: string,
    name: string
  }>,
  turntableBrowserAds: Array<{
    status: boolean,
    adId: string
  }>
};
let timingAwardRes: {};
let browserForTurntableFarmRes: {
  code: string,
  status: boolean
};
let lotteryMasterHelpRes: {
  helpResult: {
    code: string,
    masterUserInfo: {
      nickName: string
    }
  }
};
let lotteryRes: {
  code: string,
  type: string,
  remainLotteryTimes: number
};
let farmAssistResult: {
  code: string;
  assistFriendList: Array<{
    nickName: string,
    time: number
  }>,
  status: number,
  assistStageList: Array<{
    stageStaus: number
  }>,
};
let $receiveStageEnergy: {
  code: string,
  amount: number
};
let masterHelpResult: {
  code: string,
  masterHelpPeoples: Array<{
    nickName: string,
    time: number
  }>,
  masterGotFinal: boolean
};
let masterGotFinished: {
  code: string,
  amount: number,
};
let helpResult: {
  code: string,
  helpResult: {
    code: string,
    salveHelpAddWater: number,
    masterUserInfo: {
      nickName: string
    },
    remainTimes: number,
  }
};
let waterRain: {
  code: string,
  addEnergy: number
};
let clockInInit: {
  code: string,
  todaySigned: boolean,
  totalSigned: number,
  themes: Array<{
    hadGot: boolean,
    id: string,
    name: string
  }>,
  venderCoupons: Array<{
    hadGot: boolean,
    id: string,
    name: string
  }>
};
let clockInForFarmRes: {
  code: string,
  signDay: number,
  amount: number
};
let gotClockInGiftRes: {
  code: string,
  amount: number
};
let themeStep1: {
  code: string
};
let themeStep2: {
  code: string,
  amount: number
};
let venderCouponStep1: {
  code: string
};
let venderCouponStep2: {
  code: string,
  amount: number
};
let friendList: {
  inviteFriendCount: number,
  inviteFriendMax: number,
  friends: Array<{
    shareCode: string,
    friendState: number
  }>,
  inviteFriendGotAwardCount: number
};
let awardInviteFriendRes: {};
let waterFriendForFarmRes: {
  code: string,
  cardInfo: {
    type: string,
    rule: string
  }
};
let waterFriendGotAwardRes: {
  code: string,
  addWater: number
};
let inviteFriendRes: {
  helpResult: {
    code: string,
    masterUserInfo: {
      nickName: string
    }
  }
};
let duckRes: {
  code: string,
  hasLimit: boolean,
  title: string
};
!(async () => {
  if (!cookiesArr[0]) {
    console.log($name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  console.log('开始收集您的互助码，用于账号内部互助，请稍等...');
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $UserName = decodeURIComponent((cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)?.[1]) ?? '')
      $index = i + 1;
      isLogin = true;
      $nickName = '';
      await TotalBean();
      console.log(`\n开始【京东账号${$index}】${$nickName || $UserName}\n`);
      if (!isLogin) {
        console.log($name, `【提示】cookie已失效`, `京东账号${$index} ${$nickName || $UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
        await sendNotify(`${$name}cookie已失效 - ${$UserName}`, `京东账号${$index} ${$UserName}\n请重新登录获取cookie`);
        continue
      }
      message = '';
      option = {};
      $retry = 0;
      await collect();
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $UserName = decodeURIComponent((cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)?.[1]) ?? '')
      $index = i + 1;
      isLogin = true;
      $nickName = '';
      await TotalBean();
      console.log(`\n开始【京东账号${$index}】${$nickName || $UserName}\n`);
      if (!isLogin) {
        // cookie失效，前面已经通知了，这里不用重复通知
        continue
      }
      message = '';
      option = {};
      $retry = 0;
      await shareCodesFormat();
      await jdFruit();
    }
  }
})().catch((e) => {
  console.error(`❌ ${$name}, 失败! 原因: ${e}!`);
})
async function jdFruit() {
  try {
    await initForFarm();
    if (farmInfo.farmUserPro) {
      // option['media-url'] = farmInfo.farmUserPro.goodsImage;
      message = `【水果名称】${farmInfo.farmUserPro.name}\n`;
      // console.log(`\n【京东账号${$index}（${$UserName}）的${$name}好友互助码】${farmInfo.farmUserPro.shareCode}\n`);
      // jdFruitShareArr.push(farmInfo.farmUserPro.shareCode)
      console.log(`\n【已成功兑换水果】${farmInfo.farmUserPro.winTimes}次\n`);
      message += `【已兑换水果】${farmInfo.farmUserPro.winTimes}次\n`;
      await masterHelpShare();//助力好友
      if (farmInfo.treeState === 2 || farmInfo.treeState === 3) {
        option['open-url'] = urlSchema;
        console.log($name, ``, `【京东账号${$index}】${$nickName || $UserName}\n【提醒⏰】${farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);

        await sendNotify(`${$name} - 账号${$index} - ${$nickName}水果已可领取`, `【京东账号${$index}】${$nickName || $UserName}\n【提醒⏰】${farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看`);
        return
      } else if (farmInfo.treeState === 1) {
        console.log(`\n${farmInfo.farmUserPro.name}种植中...\n`)
      } else if (farmInfo.treeState === 0) {
        //已下单购买, 但未开始种植新的水果
        option['open-url'] = urlSchema;
        console.log($name, ``, `【京东账号${$index}】 ${$nickName || $UserName}\n【提醒⏰】您忘了种植新的水果\n请去京东APP或微信小程序选购并种植新的水果\n点击弹窗即达`, option);
        await sendNotify(`${$name} - 您忘了种植新的水果`, `京东账号${$index} ${$nickName}\n【提醒⏰】您忘了种植新的水果\n请去京东APP或微信小程序选购并种植新的水果`);
        return
      }
      await doDailyTask();
      await doTenWater();//浇水十次
      await getFirstWaterAward();//领取首次浇水奖励
      await getTenWaterAward();//领取10浇水奖励
      await getWaterFriendGotAward();//领取为2好友浇水奖励
      await duck();
      await doTenWaterAgain();//再次浇水
      await predictionFruit();//预测水果成熟时间
    } else {
      console.log(`初始化农场数据异常, 请登录京东 app查看农场0元水果功能是否正常,农场初始化数据: ${JSON.stringify(farmInfo)}`);
      if ($retry < 2) {
        $retry++
        console.log(`等待5秒后重试,第:${$retry}次`);
        await wait(5000);
        await jdFruit();
      } else {
        sendNotify('初始化农场数据异常', `农场初始化数据: ${JSON.stringify(farmInfo)}`);
      }
    }
  } catch (e) {
    console.log(`任务执行异常，请检查执行日志 ‼️‼️`);
  }
}

async function doDailyTask() {
  await taskInitForFarm();
  console.log(`开始签到`);
  if (!farmTask.signInit.todaySigned) {
    await signForFarm(); //签到
    if (signResult.code === "0") {
      console.log(`【签到成功】获得${signResult.amount}g💧\\n`)
      //message += `【签到成功】获得${signResult.amount}g💧\n`//连续签到${signResult.signDay}天
    } else {
      // message += `签到失败,详询日志\n`;
      console.log(`签到结果:  ${JSON.stringify(signResult)}`);
    }
  } else {
    console.log(`今天已签到,连续签到${farmTask.signInit.totalSigned},下次签到可得${farmTask.signInit.signEnergyEachAmount}g\n`);
  }
  // 被水滴砸中
  console.log(`被水滴砸中： ${farmInfo.todayGotWaterGoalTask.canPop ? '是' : '否'}`);
  if (farmInfo.todayGotWaterGoalTask.canPop) {
    await gotWaterGoalTaskForFarm();
    if (goalResult.code === '0') {
      console.log(`【被水滴砸中】获得${goalResult.addEnergy}g💧\\n`);
      // message += `【被水滴砸中】获得${goalResult.addEnergy}g💧\n`
    }
  }
  console.log(`签到结束,开始广告浏览任务`);
  if (farmTask.gotBrowseTaskAdInit.f) {
    console.log(`今天已经做过浏览广告任务\n`);
  } else {
    let adverts = farmTask.gotBrowseTaskAdInit.userBrowseTaskAds
    let browseReward = 0
    let browseSuccess = 0
    let browseFail = 0
    for (let advert of adverts) { //开始浏览广告
      if (advert.limit <= advert.hadFinishedTimes) {
        // browseReward+=advert.reward
        console.log(`${advert.mainTitle}+ ' 已完成`);//,获得${advert.reward}g
        continue;
      }
      console.log('正在进行广告浏览任务: ' + advert.mainTitle);
      await browseAdTaskForFarm(advert.advertId, 0);
      if (browseResult.code === '0') {
        console.log(`${advert.mainTitle}浏览任务完成`);
        //领取奖励
        await browseAdTaskForFarm(advert.advertId, 1);
        if (browseRwardResult.code === '0') {
          console.log(`领取浏览${advert.mainTitle}广告奖励成功,获得${browseRwardResult.amount}g`)
          browseReward += browseRwardResult.amount
          browseSuccess++
        } else {
          browseFail++
          console.log(`领取浏览广告奖励结果:  ${JSON.stringify(browseRwardResult)}`)
        }
      } else {
        browseFail++
        console.log(`广告浏览任务结果:   ${JSON.stringify(browseResult)}`);
      }
    }
    if (browseFail > 0) {
      console.log(`【广告浏览】完成${browseSuccess}个,失败${browseFail},获得${browseReward}g💧\\n`);
      // message += `【广告浏览】完成${browseSuccess}个,失败${browseFail},获得${browseReward}g💧\n`;
    } else {
      console.log(`【广告浏览】完成${browseSuccess}个,获得${browseReward}g💧\n`);
      // message += `【广告浏览】完成${browseSuccess}个,获得${browseReward}g💧\n`;
    }
  }
  //定时领水
  if (!farmTask.gotThreeMealInit.f) {
    //
    await gotThreeMealForFarm();
    if (threeMeal.code === "0") {
      console.log(`【定时领水】获得${threeMeal.amount}g💧\n`);
      // message += `【定时领水】获得${threeMeal.amount}g💧\n`;
    } else {
      // message += `【定时领水】失败,详询日志\n`;
      console.log(`定时领水成功结果:  ${JSON.stringify(threeMeal)}`);
    }
  } else {
    console.log('当前不在定时领水时间断或者已经领过\n')
  }
  //给好友浇水
  if (!farmTask.waterFriendTaskInit.f) {
    if (farmTask.waterFriendTaskInit.waterFriendCountKey < farmTask.waterFriendTaskInit.waterFriendMax) {
      await doFriendsWater();
    }
  } else {
    console.log(`给${farmTask.waterFriendTaskInit.waterFriendMax}个好友浇水任务已完成\n`)
  }
  // await Promise.all([
  //   clockInIn(),//打卡领水
  //   executeWaterRains(),//水滴雨
  //   masterHelpShare(),//助力好友
  //   getExtraAward(),//领取额外水滴奖励
  //   turntableFarm()//天天抽奖得好礼
  // ])
  await getAwardInviteFriend();
  await clockInIn();//打卡领水
  await executeWaterRains();//水滴雨
  await getExtraAward();//领取额外水滴奖励
  await turntableFarm()//天天抽奖得好礼
}
async function predictionFruit() {
  console.log('开始预测水果成熟时间\n');
  await initForFarm();
  await taskInitForFarm();
  let waterEveryDayT = farmTask.totalWaterTaskInit.totalWaterTaskTimes;//今天到到目前为止，浇了多少次水
  message += `【今日共浇水】${waterEveryDayT}次\n`;
  message += `【剩余 水滴】${farmInfo.farmUserPro.totalEnergy}g💧\n`;
  message += `【水果🍉进度】${((farmInfo.farmUserPro.treeEnergy / farmInfo.farmUserPro.treeTotalEnergy) * 100).toFixed(2)}%，已浇水${farmInfo.farmUserPro.treeEnergy / 10}次,还需${(farmInfo.farmUserPro.treeTotalEnergy - farmInfo.farmUserPro.treeEnergy) / 10}次\n`
  if (farmInfo.toFlowTimes > (farmInfo.farmUserPro.treeEnergy / 10)) {
    message += `【开花进度】再浇水${farmInfo.toFlowTimes - farmInfo.farmUserPro.treeEnergy / 10}次开花\n`
  } else if (farmInfo.toFruitTimes > (farmInfo.farmUserPro.treeEnergy / 10)) {
    message += `【结果进度】再浇水${farmInfo.toFruitTimes - farmInfo.farmUserPro.treeEnergy / 10}次结果\n`
  }
  // 预测n天后水果课可兑换功能
  let waterTotalT = (farmInfo.farmUserPro.treeTotalEnergy - farmInfo.farmUserPro.treeEnergy - farmInfo.farmUserPro.totalEnergy) / 10;//一共还需浇多少次水

  let waterD = Math.ceil(waterTotalT / waterEveryDayT);

  message += `【预测】${waterD === 1 ? '明天' : waterD === 2 ? '后天' : waterD + '天之后'}(${timeFormat(24 * 60 * 60 * 1000 * waterD + Date.now())}日)可兑换水果🍉`
}
//浇水十次
async function doTenWater() {
  if (process.env.FRUIT_BEAN_CARD) {
    jdFruitBeanCard = process.env.FRUIT_BEAN_CARD === 'true';
  }
  await myCardInfoForFarm();
  const { fastCard, doubleCard, beanCard, signCard } = myCardInfoRes;
  if (jdFruitBeanCard && JSON.stringify(myCardInfoRes).match(`限时翻倍`) && beanCard > 0) {
    console.log(`您设置的是使用水滴换豆卡，且背包有水滴换豆卡${beanCard}张, 跳过10次浇水任务`)
    return
  }
  if (farmTask.totalWaterTaskInit.totalWaterTaskTimes < farmTask.totalWaterTaskInit.totalWaterTaskLimit) {
    console.log(`\n准备浇水十次`);
    let waterCount = 0;
    isFruitFinished = false;
    for (; waterCount < farmTask.totalWaterTaskInit.totalWaterTaskLimit - farmTask.totalWaterTaskInit.totalWaterTaskTimes; waterCount++) {
      console.log(`第${waterCount + 1}次浇水`);
      await waterGoodForFarm();
      console.log(`本次浇水结果:   ${JSON.stringify(waterResult)}`);
      if (waterResult.code === '0') {
        console.log(`剩余水滴${waterResult.totalEnergy}g`);
        if (waterResult.finished) {
          // 已证实，waterResult.finished为true，表示水果可以去领取兑换了
          isFruitFinished = true;
          break
        } else {
          if (waterResult.totalEnergy < 10) {
            console.log(`水滴不够，结束浇水`)
            break
          }
          await gotStageAward();//领取阶段性水滴奖励
        }
      } else {
        console.log('浇水出现失败异常,跳出不在继续浇水')
        break;
      }
    }
    if (isFruitFinished) {
      option['open-url'] = urlSchema;
      console.log($name, ``, `【京东账号${$index}】${$nickName || $UserName}\n【提醒⏰】${farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
      await sendNotify(`${$name} - 账号${$index} - ${$nickName || $UserName}水果已可领取`, `京东账号${$index} ${$nickName}\n${farmInfo.farmUserPro.name}已可领取`);
    }
  } else {
    console.log('\n今日已完成10次浇水任务\n');
  }
}
//领取首次浇水奖励
async function getFirstWaterAward() {
  await taskInitForFarm();
  //领取首次浇水奖励
  if (!farmTask.firstWaterInit.f && farmTask.firstWaterInit.totalWaterTimes > 0) {
    await firstWaterTaskForFarm();
    if (firstWaterReward.code === '0') {
      console.log(`【首次浇水奖励】获得${firstWaterReward.amount}g💧\n`);
      // message += `【首次浇水奖励】获得${firstWaterReward.amount}g💧\n`;
    } else {
      // message += '【首次浇水奖励】领取奖励失败,详询日志\n';
      console.log(`领取首次浇水奖励结果:  ${JSON.stringify(firstWaterReward)}`);
    }
  } else {
    console.log('首次浇水奖励已领取\n')
  }
}
//领取十次浇水奖励
async function getTenWaterAward() {
  //领取10次浇水奖励
  if (!farmTask.totalWaterTaskInit.f && farmTask.totalWaterTaskInit.totalWaterTaskTimes >= farmTask.totalWaterTaskInit.totalWaterTaskLimit) {
    await totalWaterTaskForFarm();
    if (totalWaterReward.code === '0') {
      console.log(`【十次浇水奖励】获得${totalWaterReward.totalWaterTaskEnergy}g💧\n`);
      // message += `【十次浇水奖励】获得${totalWaterReward.totalWaterTaskEnergy}g💧\n`;
    } else {
      // message += '【十次浇水奖励】领取奖励失败,详询日志\n';
      console.log(`领取10次浇水奖励结果:  ${JSON.stringify(totalWaterReward)}`);
    }
  } else if (farmTask.totalWaterTaskInit.totalWaterTaskTimes < farmTask.totalWaterTaskInit.totalWaterTaskLimit) {
    // message += `【十次浇水奖励】任务未完成，今日浇水${farmTask.totalWaterTaskInit.totalWaterTaskTimes}次\n`;
    console.log(`【十次浇水奖励】任务未完成，今日浇水${farmTask.totalWaterTaskInit.totalWaterTaskTimes}次\n`);
  }
  console.log('finished 水果任务完成!');
}
//再次浇水
async function doTenWaterAgain() {
  console.log('开始检查剩余水滴能否再次浇水再次浇水\n');
  await initForFarm();
  let totalEnergy = farmInfo.farmUserPro.totalEnergy;
  console.log(`剩余水滴${totalEnergy}g\n`);
  await myCardInfoForFarm();
  const { fastCard, doubleCard, beanCard, signCard } = myCardInfoRes;
  console.log(`背包已有道具:\n快速浇水卡:${fastCard === -1 ? '未解锁' : fastCard + '张'}\n水滴翻倍卡:${doubleCard === -1 ? '未解锁' : doubleCard + '张'}\n水滴换京豆卡:${beanCard === -1 ? '未解锁' : beanCard + '张'}\n加签卡:${signCard === -1 ? '未解锁' : signCard + '张'}\n`)
  if (totalEnergy >= 100 && doubleCard > 0) {
    //使用翻倍水滴卡
    for (let i = 0; i < new Array(doubleCard).fill('').length; i++) {
      await userMyCardForFarm('doubleCard');
      console.log(`使用翻倍水滴卡结果:${JSON.stringify(userMyCardRes)}`);
    }
    await initForFarm();
    totalEnergy = farmInfo.farmUserPro.totalEnergy;
  }
  if (signCard > 0) {
    //使用加签卡
    for (let i = 0; i < new Array(signCard).fill('').length; i++) {
      await userMyCardForFarm('signCard');
      console.log(`使用加签卡结果:${JSON.stringify(userMyCardRes)}`);
    }
    await initForFarm();
    totalEnergy = farmInfo.farmUserPro.totalEnergy;
  }
  if (process.env.FRUIT_BEAN_CARD) {
    jdFruitBeanCard = process.env.FRUIT_BEAN_CARD === 'true';
  }
  if (`${jdFruitBeanCard}` === 'true' && JSON.stringify(myCardInfoRes).match('限时翻倍')) {
    console.log(`\n您设置的是水滴换豆功能,现在为您换豆`);
    if (totalEnergy >= 100 && myCardInfoRes.beanCard > 0) {
      //使用水滴换豆卡
      await userMyCardForFarm('beanCard');
      console.log(`使用水滴换豆卡结果:${JSON.stringify(userMyCardRes)}`);
      if (userMyCardRes.code === '0') {
        message += `【水滴换豆卡】获得${userMyCardRes.beanCount}个京豆\n`;
        return
      }
    } else {
      console.log(`您目前水滴:${totalEnergy}g,水滴换豆卡${myCardInfoRes.beanCard}张,暂不满足水滴换豆的条件,为您继续浇水`)
    }
  }
  // if (totalEnergy > 100 && myCardInfoRes.fastCard > 0) {
  //   //使用快速浇水卡
  //   await userMyCardForFarm('fastCard');
  //   console.log(`使用快速浇水卡结果:${JSON.stringify(userMyCardRes)}`);
  //   if (userMyCardRes.code === '0') {
  //     console.log(`已使用快速浇水卡浇水${userMyCardRes.waterEnergy}g`);
  //   }
  //   await initForFarm();
  //   totalEnergy  = farmInfo.farmUserPro.totalEnergy;
  // }
  // 所有的浇水(10次浇水)任务，获取水滴任务完成后，如果剩余水滴大于等于60g,则继续浇水(保留部分水滴是用于完成第二天的浇水10次的任务)
  if (totalEnergy < retainWater) {
    console.log('保留水滴不足,停止继续浇水')
    return
  }
  let overageEnergy = totalEnergy - retainWater;
  if (overageEnergy >= (farmInfo.farmUserPro.treeTotalEnergy - farmInfo.farmUserPro.treeEnergy)) {
    //如果现有的水滴，大于水果可兑换所需的对滴(也就是把水滴浇完，水果就能兑换了)
    isFruitFinished = false;
    for (let i = 0; i < (farmInfo.farmUserPro.treeTotalEnergy - farmInfo.farmUserPro.treeEnergy) / 10; i++) {
      await waterGoodForFarm();
      console.log(`本次浇水结果(水果马上就可兑换了):   ${JSON.stringify(waterResult)}`);
      if (waterResult.code === '0') {
        console.log('\n浇水10g成功\n');
        if (waterResult.finished) {
          // 已证实，waterResult.finished为true，表示水果可以去领取兑换了
          isFruitFinished = true;
          break
        } else {
          console.log(`目前水滴【${waterResult.totalEnergy}】g,继续浇水，水果马上就可以兑换了`)
        }
      } else {
        console.log('浇水出现失败异常,跳出不在继续浇水')
        break;
      }
    }
    if (isFruitFinished) {
      option['open-url'] = urlSchema;
      console.log($name, ``, `【京东账号${$index}】${$nickName || $UserName}\n【提醒⏰】${farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
      await sendNotify(`${$name} - 账号${$index} - ${$nickName}水果已可领取`, `京东账号${$index} ${$nickName}\n${farmInfo.farmUserPro.name}已可领取`);
    }
  } else if (overageEnergy >= 10) {
    console.log("目前剩余水滴：【" + totalEnergy + "】g，可继续浇水");
    isFruitFinished = false;
    for (let i = 0; i < overageEnergy / 10; i++) {
      await waterGoodForFarm();
      console.log(`本次浇水结果:   ${JSON.stringify(waterResult)}`);
      if (waterResult.code === '0') {
        console.log(`\n浇水10g成功,剩余${waterResult.totalEnergy}\n`)
        if (waterResult.finished) {
          // 已证实，waterResult.finished为true，表示水果可以去领取兑换了
          isFruitFinished = true;
          break
        } else {
          await gotStageAward()
        }
      } else {
        console.log('浇水出现失败异常,跳出不在继续浇水')
        break;
      }
    }
    if (isFruitFinished) {
      option['open-url'] = urlSchema;
      console.log($name, ``, `【京东账号${$index}】${$nickName || $UserName}\n【提醒⏰】${farmInfo.farmUserPro.name}已可领取\n请去京东APP或微信小程序查看\n点击弹窗即达`, option);
      await sendNotify(`${$name} - 账号${$index} - ${$nickName}水果已可领取`, `京东账号${$index} ${$nickName}\n${farmInfo.farmUserPro.name}已可领取`);
    }
  } else {
    console.log("目前剩余水滴：【" + totalEnergy + "】g,不再继续浇水,保留部分水滴用于完成第二天【十次浇水得水滴】任务")
  }
}
//领取阶段性水滴奖励
async function gotStageAward() {
  if (waterResult.waterStatus === 0 && waterResult.treeEnergy === 10) {
    console.log('果树发芽了,奖励30g水滴');
    await gotStageAwardForFarm('1');
    console.log(`浇水阶段奖励1领取结果 ${JSON.stringify(gotStageAwardForFarmRes)}`);
    if (gotStageAwardForFarmRes.code === '0') {
      // message += `【果树发芽了】奖励${gotStageAwardForFarmRes.addEnergy}\n`;
      console.log(`【果树发芽了】奖励${gotStageAwardForFarmRes.addEnergy}\n`);
    }
  } else if (waterResult.waterStatus === 1) {
    console.log('果树开花了,奖励40g水滴');
    await gotStageAwardForFarm('2');
    console.log(`浇水阶段奖励2领取结果 ${JSON.stringify(gotStageAwardForFarmRes)}`);
    if (gotStageAwardForFarmRes.code === '0') {
      // message += `【果树开花了】奖励${gotStageAwardForFarmRes.addEnergy}g💧\n`;
      console.log(`【果树开花了】奖励${gotStageAwardForFarmRes.addEnergy}g💧\n`);
    }
  } else if (waterResult.waterStatus === 2) {
    console.log('果树长出小果子啦, 奖励50g水滴');
    await gotStageAwardForFarm('3');
    console.log(`浇水阶段奖励3领取结果 ${JSON.stringify(gotStageAwardForFarmRes)}`)
    if (gotStageAwardForFarmRes.code === '0') {
      // message += `【果树结果了】奖励${gotStageAwardForFarmRes.addEnergy}g💧\n`;
      console.log(`【果树结果了】奖励${gotStageAwardForFarmRes.addEnergy}g💧\n`);
    }
  }
}
//天天抽奖活动
async function turntableFarm() {
  await initForTurntableFarm();
  if (initForTurntableFarmRes.code === '0') {
    //领取定时奖励 //4小时一次
    let { timingIntervalHours, timingLastSysTime, sysTime, timingGotStatus, remainLotteryTimes, turntableInfos } = initForTurntableFarmRes;

    if (!timingGotStatus) {
      console.log(`是否到了领取免费赠送的抽奖机会----${sysTime > (timingLastSysTime + 60 * 60 * timingIntervalHours * 1000)}`)
      if (sysTime > (timingLastSysTime + 60 * 60 * timingIntervalHours * 1000)) {
        await timingAwardForTurntableFarm();
        console.log(`领取定时奖励结果${JSON.stringify(timingAwardRes)}`);
        await initForTurntableFarm();
        remainLotteryTimes = initForTurntableFarmRes.remainLotteryTimes;
      } else {
        console.log(`免费赠送的抽奖机会未到时间`)
      }
    } else {
      console.log('4小时候免费赠送的抽奖机会已领取')
    }
    if (initForTurntableFarmRes.turntableBrowserAds && initForTurntableFarmRes.turntableBrowserAds.length > 0) {
      for (let index = 0; index < initForTurntableFarmRes.turntableBrowserAds.length; index++) {
        if (!initForTurntableFarmRes.turntableBrowserAds[index].status) {
          console.log(`开始浏览天天抽奖的第${index + 1}个逛会场任务`)
          await browserForTurntableFarm(1, initForTurntableFarmRes.turntableBrowserAds[index].adId);
          if (browserForTurntableFarmRes.code === '0' && browserForTurntableFarmRes.status) {
            console.log(`第${index + 1}个逛会场任务完成，开始领取水滴奖励\n`)
            await browserForTurntableFarm(2, initForTurntableFarmRes.turntableBrowserAds[index].adId);
            if (browserForTurntableFarmRes.code === '0') {
              console.log(`第${index + 1}个逛会场任务领取水滴奖励完成\n`)
              await initForTurntableFarm();
              remainLotteryTimes = initForTurntableFarmRes.remainLotteryTimes;
            }
          }
        } else {
          console.log(`浏览天天抽奖的第${index + 1}个逛会场任务已完成`)
        }
      }
    }
    //天天抽奖助力
    console.log('开始天天抽奖--好友助力--每人每天只有三次助力机会.')
    for (let code of newShareCodes) {
      if (code === farmInfo.farmUserPro.shareCode) {
        console.log('天天抽奖-不能自己给自己助力\n')
        continue
      }
      await lotteryMasterHelp();
      // console.log('天天抽奖助力结果',lotteryMasterHelpRes.helpResult)
      if (lotteryMasterHelpRes.helpResult.code === '0') {
        console.log(`天天抽奖-助力${lotteryMasterHelpRes.helpResult.masterUserInfo.nickName}成功\n`)
      } else if (lotteryMasterHelpRes.helpResult.code === '11') {
        console.log(`天天抽奖-不要重复助力${lotteryMasterHelpRes.helpResult.masterUserInfo.nickName}\n`)
      } else if (lotteryMasterHelpRes.helpResult.code === '13') {
        console.log(`天天抽奖-助力${lotteryMasterHelpRes.helpResult.masterUserInfo.nickName}失败,助力次数耗尽\n`);
        break;
      }
    }
    console.log(`---天天抽奖次数remainLotteryTimes----${remainLotteryTimes}次`)
    //抽奖
    if (remainLotteryTimes > 0) {
      console.log('开始抽奖')
      let lotteryResult = '';
      for (let i = 0; i < new Array(remainLotteryTimes).fill('').length; i++) {
        await lotteryForTurntableFarm()
        console.log(`第${i + 1}次抽奖结果${JSON.stringify(lotteryRes)}`);
        if (lotteryRes.code === '0') {
          turntableInfos.map((item) => {
            if (item.type === lotteryRes.type) {
              console.log(`lotteryRes.type${lotteryRes.type}`);
              if (lotteryRes.type.match(/bean/g) && lotteryRes.type.match(/bean/g)[0] === 'bean') {
                lotteryResult += `${item.name}个，`;
              } else if (lotteryRes.type.match(/water/g) && lotteryRes.type.match(/water/g)[0] === 'water') {
                lotteryResult += `${item.name}，`;
              } else {
                lotteryResult += `${item.name}，`;
              }
            }
          })
          //没有次数了
          if (lotteryRes.remainLotteryTimes === 0) {
            break
          }
        }
      }
      if (lotteryResult) {
        console.log(`【天天抽奖】${lotteryResult.substr(0, lotteryResult.length - 1)}\n`)
        // message += `【天天抽奖】${lotteryResult.substr(0, lotteryResult.length - 1)}\n`;
      }
    } else {
      console.log('天天抽奖--抽奖机会为0次')
    }
  } else {
    console.log('初始化天天抽奖得好礼失败')
  }
}
//领取额外奖励水滴
async function getExtraAward() {
  await farmAssistInit();
  if (farmAssistResult.code === "0") {
    if (farmAssistResult.assistFriendList && farmAssistResult.assistFriendList.length >= 2) {
      if (farmAssistResult.status === 2) {
        let num = 0;
        for (let key of Object.keys(farmAssistResult.assistStageList)) {
          let vo = farmAssistResult.assistStageList[key]
          if (vo.stageStaus === 2) {
            await receiveStageEnergy()
            if ($receiveStageEnergy.code === "0") {
              console.log(`已成功领取第${key + 1}阶段好友助力奖励：【${$receiveStageEnergy.amount}】g水`)
              num += $receiveStageEnergy.amount
            }
          }
        }
        message += `【额外奖励】${num}g水领取成功\n`;
      } else if (farmAssistResult.status === 3) {
        console.log("已经领取过8好友助力额外奖励");
        message += `【额外奖励】已被领取过\n`;
      }
    } else {
      console.log("助力好友未达到2个");
      message += `【额外奖励】领取失败,原因：给您助力的人未达2个\n`;
    }
    if (farmAssistResult.assistFriendList && farmAssistResult.assistFriendList.length > 0) {
      let str = '';
      farmAssistResult.assistFriendList.map((item, index) => {
        if (index === (farmAssistResult.assistFriendList.length - 1)) {
          str += item.nickName || "匿名用户";
        } else {
          str += (item.nickName || "匿名用户") + ',';
        }
        let date = new Date(item.time);
        let time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getMinutes();
        console.log(`\n京东昵称【${item.nickName || "匿名用户"}】 在 ${time} 给您助过力\n`);
      })
      message += `【助力您的好友】${str}\n`;
    }
    console.log('领取额外奖励水滴结束\n');
  } else {
    await masterHelpTaskInitForFarm();
    if (masterHelpResult.code === '0') {
      if (masterHelpResult.masterHelpPeoples && masterHelpResult.masterHelpPeoples.length >= 5) {
        // 已有五人助力。领取助力后的奖励
        if (!masterHelpResult.masterGotFinal) {
          await masterGotFinishedTaskForFarm();
          if (masterGotFinished.code === '0') {
            console.log(`已成功领取好友助力奖励：【${masterGotFinished.amount}】g水`);
            message += `【额外奖励】${masterGotFinished.amount}g水领取成功\n`;
          }
        } else {
          console.log("已经领取过5好友助力额外奖励");
          message += `【额外奖励】已被领取过\n`;
        }
      } else {
        console.log("助力好友未达到5个");
        message += `【额外奖励】领取失败,原因：给您助力的人未达5个\n`;
      }
      if (masterHelpResult.masterHelpPeoples && masterHelpResult.masterHelpPeoples.length > 0) {
        let str = '';
        masterHelpResult.masterHelpPeoples.map((item, index) => {
          if (index === (masterHelpResult.masterHelpPeoples.length - 1)) {
            str += item.nickName || "匿名用户";
          } else {
            str += (item.nickName || "匿名用户") + ',';
          }
          let date = new Date(item.time);
          let time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getMinutes();
          console.log(`\n京东昵称【${item.nickName || "匿名用户"}】 在 ${time} 给您助过力\n`);
        })
        message += `【助力您的好友】${str}\n`;
      }
      console.log('领取额外奖励水滴结束\n');
    }
  }
}
//助力好友
async function masterHelpShare() {
  console.log('开始助力好友')
  await initForFarm();
  let salveHelpAddWater = 0;
  let remainTimes = 3;//今日剩余助力次数,默认3次（京东农场每人每天3次助力机会）。
  let helpSuccessPeoples = '';//成功助力好友
  for (let code of newShareCodes) {
    console.log(`${$UserName}开始助力: ${code}`);
    if (!code) continue;
    if (!farmInfo.farmUserPro) {
      console.log('未种植,跳过助力\n')
      continue
    }
    if (code === farmInfo.farmUserPro.shareCode) {
      console.log('不能为自己助力哦，跳过自己的shareCode\n')
      continue
    }
    await masterHelp();
    if (helpResult.code === '0') {
      if (helpResult.helpResult.code === '0') {
        //助力成功
        salveHelpAddWater += helpResult.helpResult.salveHelpAddWater;
        console.log(`【助力好友结果】: 已成功给【${helpResult.helpResult.masterUserInfo.nickName}】助力`);
        console.log(`给好友【${helpResult.helpResult.masterUserInfo.nickName}】助力获得${helpResult.helpResult.salveHelpAddWater}g水滴`)
        helpSuccessPeoples += (helpResult.helpResult.masterUserInfo.nickName || '匿名用户') + ',';
      } else if (helpResult.helpResult.code === '8') {
        console.log(`【助力好友结果】: 助力【${helpResult.helpResult.masterUserInfo.nickName}】失败，您今天助力次数已耗尽`);
      } else if (helpResult.helpResult.code === '9') {
        console.log(`【助力好友结果】: 之前给【${helpResult.helpResult.masterUserInfo.nickName}】助力过了`);
      } else if (helpResult.helpResult.code === '10') {
        console.log(`【助力好友结果】: 好友【${helpResult.helpResult.masterUserInfo.nickName}】已满五人助力`);
      } else {
        console.log(`助力其他情况：${JSON.stringify(helpResult.helpResult)}`);
      }
      console.log(`【今日助力次数还剩】${helpResult.helpResult.remainTimes}次\n`);
      remainTimes = helpResult.helpResult.remainTimes;
      if (helpResult.helpResult.remainTimes === 0) {
        console.log(`您当前助力次数已耗尽，跳出助力`);
        break
      }
    } else {
      console.log(`助力失败::${JSON.stringify(helpResult)}`);
    }
  }
  if (helpSuccessPeoples && helpSuccessPeoples.length > 0) {
    message += `【您助力的好友👬】${helpSuccessPeoples.substr(0, helpSuccessPeoples.length - 1)}\n`;
  }
  if (salveHelpAddWater > 0) {
    // message += `【助力好友👬】获得${salveHelpAddWater}g💧\n`;
    console.log(`【助力好友👬】获得${salveHelpAddWater}g💧\n`);
  }
  message += `【今日剩余助力👬】${remainTimes}次\n`;
  console.log('助力好友结束，即将开始领取额外水滴奖励\n');
}
//水滴雨
async function executeWaterRains() {
  let executeWaterRain = !farmTask.waterRainInit.f;
  if (executeWaterRain) {
    console.log(`水滴雨任务，每天两次，最多可得10g水滴`);
    console.log(`两次水滴雨任务是否全部完成：${farmTask.waterRainInit.f ? '是' : '否'}`);
    if (farmTask.waterRainInit.lastTime) {
      if (Date.now() < (farmTask.waterRainInit.lastTime + 3 * 60 * 60 * 1000)) {
        executeWaterRain = false;
        // message += `【第${farmTask.waterRainInit.winTimes + 1}次水滴雨】未到时间，请${new Date(farmTask.waterRainInit.lastTime + 3 * 60 * 60 * 1000).toLocaleTimeString()}再试\n`;
        console.log(`\`【第${farmTask.waterRainInit.winTimes + 1}次水滴雨】未到时间，请${new Date(farmTask.waterRainInit.lastTime + 3 * 60 * 60 * 1000).toLocaleTimeString()}再试\n`);
      }
    }
    if (executeWaterRain) {
      console.log(`开始水滴雨任务,这是第${farmTask.waterRainInit.winTimes + 1}次，剩余${2 - (farmTask.waterRainInit.winTimes + 1)}次`);
      await waterRainForFarm();
      console.log('水滴雨waterRain');
      if (waterRain.code === '0') {
        console.log('水滴雨任务执行成功，获得水滴：' + waterRain.addEnergy + 'g');
        console.log(`【第${farmTask.waterRainInit.winTimes + 1}次水滴雨】获得${waterRain.addEnergy}g水滴\n`);
        // message += `【第${farmTask.waterRainInit.winTimes + 1}次水滴雨】获得${waterRain.addEnergy}g水滴\n`;
      }
    }
  } else {
    // message += `【水滴雨】已全部完成，获得20g💧\n`;
  }
}
//打卡领水活动
async function clockInIn() {
  console.log('开始打卡领水活动（签到，关注，领券）');
  await clockInInitForFarm();
  if (clockInInit.code === '0') {
    // 签到得水滴
    if (!clockInInit.todaySigned) {
      console.log('开始今日签到');
      await clockInForFarm();
      console.log(`打卡结果${JSON.stringify(clockInForFarmRes)}`);
      if (clockInForFarmRes.code === '0') {
        // message += `【第${clockInForFarmRes.signDay}天签到】获得${clockInForFarmRes.amount}g💧\n`;
        console.log(`【第${clockInForFarmRes.signDay}天签到】获得${clockInForFarmRes.amount}g💧\n`)
        if (clockInForFarmRes.signDay === 7) {
          //可以领取惊喜礼包
          console.log('开始领取--惊喜礼包38g水滴');
          await gotClockInGift();
          if (gotClockInGiftRes.code === '0') {
            // message += `【惊喜礼包】获得${gotClockInGiftRes.amount}g💧\n`;
            console.log(`【惊喜礼包】获得${gotClockInGiftRes.amount}g💧\n`);
          }
        }
      }
    }
    if (clockInInit.todaySigned && clockInInit.totalSigned === 7) {
      console.log('开始领取--惊喜礼包38g水滴');
      await gotClockInGift();
      if (gotClockInGiftRes.code === '0') {
        // message += `【惊喜礼包】获得${gotClockInGiftRes.amount}g💧\n`;
        console.log(`【惊喜礼包】获得${gotClockInGiftRes.amount}g💧\n`);
      }
    }
    // 限时关注得水滴
    if (clockInInit.themes && clockInInit.themes.length > 0) {
      for (let item of clockInInit.themes) {
        if (!item.hadGot) {
          console.log(`关注ID${item.id}`);
          await clockInFollowForFarm(item.id, "theme", "1");
          console.log(`themeStep1--结果${JSON.stringify(themeStep1)}`);
          if (themeStep1.code === '0') {
            await clockInFollowForFarm(item.id, "theme", "2");
            console.log(`themeStep2--结果${JSON.stringify(themeStep2)}`);
            if (themeStep2.code === '0') {
              console.log(`关注${item.name}，获得水滴${themeStep2.amount}g`);
            }
          }
        }
      }
    }
    // 限时领券得水滴
    if (clockInInit.venderCoupons && clockInInit.venderCoupons.length > 0) {
      for (let item of clockInInit.venderCoupons) {
        if (!item.hadGot) {
          console.log(`领券的ID${item.id}`);
          await clockInFollowForFarm(item.id, "venderCoupon", "1");
          console.log(`venderCouponStep1--结果${JSON.stringify(venderCouponStep1)}`);
          if (venderCouponStep1.code === '0') {
            await clockInFollowForFarm(item.id, "venderCoupon", "2");
            if (venderCouponStep2.code === '0') {
              console.log(`venderCouponStep2--结果${JSON.stringify(venderCouponStep2)}`);
              console.log(`从${item.name}领券，获得水滴${venderCouponStep2.amount}g`);
            }
          }
        }
      }
    }
  }
  console.log('开始打卡领水活动（签到，关注，领券）结束\n');
}
//
async function getAwardInviteFriend() {
  await friendListInitForFarm();//查询好友列表
  // console.log(`查询好友列表数据：${JSON.stringify(friendList)}\n`)
  if (friendList) {
    console.log(`\n今日已邀请好友${friendList.inviteFriendCount}个 / 每日邀请上限${friendList.inviteFriendMax}个`);
    console.log(`开始删除${friendList.friends && friendList.friends.length}个好友,可拿每天的邀请奖励`);
    if (friendList.friends && friendList.friends.length > 0) {
      for (let friend of friendList.friends) {
        console.log(`\n开始删除好友 [${friend.shareCode}]`);
        const deleteFriendForFarm = await request('deleteFriendForFarm', { "shareCode": `${friend.shareCode}`, "version": 8, "channel": 1 });
        if (deleteFriendForFarm && deleteFriendForFarm.code === '0') {
          console.log(`删除好友 [${friend.shareCode}] 成功\n`);
        }
      }
    }
    await receiveFriendInvite();//为他人助力,接受邀请成为别人的好友
    if (friendList.inviteFriendCount > 0) {
      if (friendList.inviteFriendCount > friendList.inviteFriendGotAwardCount) {
        console.log('开始领取邀请好友的奖励');
        await awardInviteFriendForFarm();
        console.log(`领取邀请好友的奖励结果：：${JSON.stringify(awardInviteFriendRes)}`);
      }
    } else {
      console.log('今日未邀请过好友')
    }
  } else {
    console.log(`查询好友列表失败\n`);
  }
}
//给好友浇水
async function doFriendsWater() {
  await friendListInitForFarm();
  console.log('开始给好友浇水...');
  await taskInitForFarm();
  const { waterFriendCountKey, waterFriendMax } = farmTask.waterFriendTaskInit;
  console.log(`今日已给${waterFriendCountKey}个好友浇水`);
  if (waterFriendCountKey < waterFriendMax) {
    let needWaterFriends = [];
    if (friendList.friends && friendList.friends.length > 0) {
      friendList.friends.map((item, index) => {
        if (item.friendState === 1) {
          if (needWaterFriends.length < (waterFriendMax - waterFriendCountKey)) {
            needWaterFriends.push(item.shareCode);
          }
        }
      });
      console.log(`需要浇水的好友列表shareCodes:${JSON.stringify(needWaterFriends)}`);
      let waterFriendsCount = 0, cardInfoStr = '';
      for (let index = 0; index < needWaterFriends.length; index++) {
        await waterFriendForFarm(needWaterFriends[index]);
        console.log(`为第${index + 1}个好友浇水结果:${JSON.stringify(waterFriendForFarmRes)}\n`)
        if (waterFriendForFarmRes.code === '0') {
          waterFriendsCount++;
          if (waterFriendForFarmRes.cardInfo) {
            console.log('为好友浇水获得道具了');
            if (waterFriendForFarmRes.cardInfo.type === 'beanCard') {
              console.log(`获取道具卡:${waterFriendForFarmRes.cardInfo.rule}`);
              cardInfoStr += `水滴换豆卡,`;
            } else if (waterFriendForFarmRes.cardInfo.type === 'fastCard') {
              console.log(`获取道具卡:${waterFriendForFarmRes.cardInfo.rule}`);
              cardInfoStr += `快速浇水卡,`;
            } else if (waterFriendForFarmRes.cardInfo.type === 'doubleCard') {
              console.log(`获取道具卡:${waterFriendForFarmRes.cardInfo.rule}`);
              cardInfoStr += `水滴翻倍卡,`;
            } else if (waterFriendForFarmRes.cardInfo.type === 'signCard') {
              console.log(`获取道具卡:${waterFriendForFarmRes.cardInfo.rule}`);
              cardInfoStr += `加签卡,`;
            }
          }
        } else if (waterFriendForFarmRes.code === '11') {
          console.log('水滴不够,跳出浇水')
        }
      }
      // message += `【好友浇水】已给${waterFriendsCount}个好友浇水,消耗${waterFriendsCount * 10}g水\n`;
      console.log(`【好友浇水】已给${waterFriendsCount}个好友浇水,消耗${waterFriendsCount * 10}g水\n`);
      if (cardInfoStr && cardInfoStr.length > 0) {
        // message += `【好友浇水奖励】${cardInfoStr.substr(0, cardInfoStr.length - 1)}\n`;
        console.log(`【好友浇水奖励】${cardInfoStr.substr(0, cardInfoStr.length - 1)}\n`);
      }
    } else {
      console.log('您的好友列表暂无好友,快去邀请您的好友吧!')
    }
  } else {
    console.log(`今日已为好友浇水量已达${waterFriendMax}个`)
  }
}
//领取给3个好友浇水后的奖励水滴
async function getWaterFriendGotAward() {
  await taskInitForFarm();
  const { waterFriendCountKey, waterFriendMax, waterFriendSendWater, waterFriendGotAward } = farmTask.waterFriendTaskInit
  if (waterFriendCountKey >= waterFriendMax) {
    if (!waterFriendGotAward) {
      await waterFriendGotAwardForFarm();
      console.log(`领取给${waterFriendMax}个好友浇水后的奖励水滴::${JSON.stringify(waterFriendGotAwardRes)}`)
      if (waterFriendGotAwardRes.code === '0') {
        // message += `【给${waterFriendMax}好友浇水】奖励${waterFriendGotAwardRes.addWater}g水滴\n`;
        console.log(`【给${waterFriendMax}好友浇水】奖励${waterFriendGotAwardRes.addWater}g水滴\n`);
      }
    } else {
      console.log(`给好友浇水的${waterFriendSendWater}g水滴奖励已领取\n`);
      // message += `【给${waterFriendMax}好友浇水】奖励${waterFriendSendWater}g水滴已领取\n`;
    }
  } else {
    console.log(`暂未给${waterFriendMax}个好友浇水\n`);
  }
}
//接收成为对方好友的邀请
async function receiveFriendInvite() {
  for (let code of newShareCodes) {
    if (code === farmInfo.farmUserPro.shareCode) {
      console.log('自己不能邀请自己成为好友噢\n')
      continue
    }
    await inviteFriend();
    // console.log(`接收邀请成为好友结果:${JSON.stringify(inviteFriendRes)}`)
    if (inviteFriendRes && inviteFriendRes.helpResult && inviteFriendRes.helpResult.code === '0') {
      console.log(`接收邀请成为好友结果成功,您已成为${inviteFriendRes.helpResult.masterUserInfo.nickName}的好友`)
    } else if (inviteFriendRes && inviteFriendRes.helpResult && inviteFriendRes.helpResult.code === '17') {
      console.log(`接收邀请成为好友结果失败,对方已是您的好友`)
    }
  }
  // console.log(`开始接受6fbd26cc27ac44d6a7fed34092453f77的邀请\n`)
  // await inviteFriend('6fbd26cc27ac44d6a7fed34092453f77');
  // console.log(`接收邀请成为好友结果:${JSON.stringify(inviteFriendRes.helpResult)}`)
  // if (inviteFriendRes.helpResult.code === '0') {
  //   console.log(`您已成为${inviteFriendRes.helpResult.masterUserInfo.nickName}的好友`)
  // } else if (inviteFriendRes.helpResult.code === '17') {
  //   console.log(`对方已是您的好友`)
  // }
}
async function duck() {
  for (let i = 0; i < 10; i++) {
    //这里循环十次
    await getFullCollectionReward();
    if (duckRes.code === '0') {
      if (!duckRes.hasLimit) {
        console.log(`小鸭子游戏:${duckRes.title}`);
        // if (duckRes.type !== 3) {
        //   console.log(`${duckRes.title}`);
        //   if (duckRes.type === 1) {
        //     message += `【小鸭子】为你带回了水滴\n`;
        //   } else if (duckRes.type === 2) {
        //     message += `【小鸭子】为你带回快速浇水卡\n`
        //   }
        // }
      } else {
        console.log(`${duckRes.title}`)
        break;
      }
    } else if (duckRes.code === '10') {
      console.log(`小鸭子游戏达到上限`)
      break;
    }
  }
}
async function collect() {
  try {
    await initForFarm();
    if (farmInfo.farmUserPro) {
      console.log(`\n【京东账号${$index}（${$UserName}）的${$name}好友互助码】${farmInfo.farmUserPro.shareCode}\n`);
      jdFruitShareArr.push(farmInfo.farmUserPro.shareCode)
    } else {
      console.log(`初始化农场数据异常, 请登录京东 app查看农场0元水果功能是否正常,农场初始化数据: ${JSON.stringify(farmInfo)}`);
    }
  } catch (e) {
    console.log(e);
  }
}
// ========================API调用接口========================
//鸭子，点我有惊喜
async function getFullCollectionReward() {
  const body = { "type": 2, "version": 6, "channel": 2 };
  return task("getFullCollectionReward", body, true).then(data => {
    duckRes = data;
  }).catch(e => {
    console.log('\n东东农场: API查询请求失败 ‼️‼️');
    console.log(JSON.stringify(e));
  });
}

/**
 * 领取10次浇水奖励API
 */
async function totalWaterTaskForFarm() {
  const functionId = arguments.callee.name.toString();
  totalWaterReward = await request(functionId);
}
//领取首次浇水奖励API
async function firstWaterTaskForFarm() {
  const functionId = arguments.callee.name.toString();
  firstWaterReward = await request(functionId);
}
//领取给3个好友浇水后的奖励水滴API
async function waterFriendGotAwardForFarm() {
  const functionId = arguments.callee.name.toString();
  waterFriendGotAwardRes = await request(functionId, { "version": 4, "channel": 1 });
}
// 查询背包道具卡API
async function myCardInfoForFarm() {
  const functionId = arguments.callee.name.toString();
  myCardInfoRes = await request(functionId, { "version": 5, "channel": 1 });
}
//使用道具卡API
async function userMyCardForFarm(cardType) {
  const functionId = arguments.callee.name.toString();
  userMyCardRes = await request(functionId, { "cardType": cardType });
}
/**
 * 领取浇水过程中的阶段性奖励
 * @param type
 * @returns {Promise<void>}
 */
async function gotStageAwardForFarm(type) {
  gotStageAwardForFarmRes = await request(arguments.callee.name.toString(), { 'type': type });
}
//浇水API
async function waterGoodForFarm() {
  await wait(1000);
  console.log('等待了1秒');

  const functionId = arguments.callee.name.toString();
  waterResult = await request(functionId);
}
// 初始化集卡抽奖活动数据API
async function initForTurntableFarm() {
  initForTurntableFarmRes = await request(arguments.callee.name.toString(), { version: 4, channel: 1 });
}
async function lotteryForTurntableFarm() {
  await wait(2000);
  console.log('等待了2秒');
  lotteryRes = await request(arguments.callee.name.toString(), { type: 1, version: 4, channel: 1 });
}

async function timingAwardForTurntableFarm() {
  timingAwardRes = await request(arguments.callee.name.toString(), { version: 4, channel: 1 });
}

async function browserForTurntableFarm(type: number, adId: string) {
  if (type === 1) {
    console.log('浏览爆品会场');
  }
  if (type === 2) {
    console.log('天天抽奖浏览任务领取水滴');
  }
  const body = { "type": type, "adId": adId, "version": 4, "channel": 1 };
  browserForTurntableFarmRes = await request(arguments.callee.name.toString(), body);
  // 浏览爆品会场8秒
}
/**
 * 天天抽奖拿好礼-助力API(每人每天三次助力机会)
 */
async function lotteryMasterHelp() {
  lotteryMasterHelpRes = await request(`initForFarm`, {
    imageUrl: "",
    nickName: "",
    shareCode: arguments[0] + '-3',
    babelChannel: "3",
    version: 4,
    channel: 1
  });
}

//领取5人助力后的额外奖励API
async function masterGotFinishedTaskForFarm() {
  const functionId = arguments.callee.name.toString();
  masterGotFinished = await request(functionId);
}
//助力好友信息API
async function masterHelpTaskInitForFarm() {
  const functionId = arguments.callee.name.toString();
  masterHelpResult = await request(functionId);
}
//新版助力好友信息API
async function farmAssistInit() {
  const functionId = arguments.callee.name.toString();
  farmAssistResult = await request(functionId, { "version": 14, "channel": 1, "babelChannel": "120" });
}
//新版领取助力奖励API
async function receiveStageEnergy() {
  const functionId = arguments.callee.name.toString();
  $receiveStageEnergy = await request(functionId, { "version": 14, "channel": 1, "babelChannel": "120" });
}
//接受对方邀请,成为对方好友的API
async function inviteFriend() {
  inviteFriendRes = await request(`initForFarm`, {
    imageUrl: "",
    nickName: "",
    shareCode: arguments[0] + '-inviteFriend',
    version: 4,
    channel: 2
  });
}
// 助力好友API
async function masterHelp() {
  helpResult = await request(`initForFarm`, {
    imageUrl: "",
    nickName: "",
    shareCode: arguments[0],
    babelChannel: "3",
    version: 2,
    channel: 1
  });
}
/**
 * 水滴雨API
 */
async function waterRainForFarm() {
  const functionId = arguments.callee.name.toString();
  const body = { "type": 1, "hongBaoTimes": 100, "version": 3 };
  waterRain = await request(functionId, body);
}
/**
 * 打卡领水API
 */
async function clockInInitForFarm() {
  const functionId = arguments.callee.name.toString();
  clockInInit = await request(functionId);
}

// 连续签到API
async function clockInForFarm() {
  const functionId = arguments.callee.name.toString();
  clockInForFarmRes = await request(functionId, { "type": 1 });
}

//关注，领券等API
async function clockInFollowForFarm(id, type, step) {
  const functionId = arguments.callee.name.toString();
  let body = {
    id,
    type,
    step
  }
  if (type === 'theme') {
    if (step === '1') {
      themeStep1 = await request(functionId, body);
    } else if (step === '2') {
      themeStep2 = await request(functionId, body);
    }
  } else if (type === 'venderCoupon') {
    if (step === '1') {
      venderCouponStep1 = await request(functionId, body);
    } else if (step === '2') {
      venderCouponStep2 = await request(functionId, body);
    }
  }
}

// 领取连续签到7天的惊喜礼包API
async function gotClockInGift() {
  gotClockInGiftRes = await request('clockInForFarm', { "type": 2 })
}

//定时领水API
async function gotThreeMealForFarm() {
  const functionId = arguments.callee.name.toString();
  threeMeal = await request(functionId);
}
/**
 * 浏览广告任务API
 * type为0时, 完成浏览任务
 * type为1时, 领取浏览任务奖励
 */
async function browseAdTaskForFarm(advertId, type) {
  const functionId = arguments.callee.name.toString();
  if (type === 0) {
    browseResult = await request(functionId, { advertId, type, "version": 14, "channel": 1, "babelChannel": "45" });
  } else if (type === 1) {
    browseRwardResult = await request(functionId, { advertId, type, "version": 14, "channel": 1, "babelChannel": "45" });
  }
}
// 被水滴砸中API
async function gotWaterGoalTaskForFarm() {
  goalResult = await request(arguments.callee.name.toString(), { type: 3 });
}
//签到API
async function signForFarm() {
  const functionId = arguments.callee.name.toString();
  signResult = await request(functionId);
}
/**
 * 初始化农场, 可获取果树及用户信息API
 */
async function initForFarm() {
  return fetch(`${JD_API_HOST}?functionId=initForFarm`, {
    method: 'POST',
    body: `body=${escape(JSON.stringify({ "version": 14 }))}&appid=wh5&clientVersion=9.1.0`,
    headers: {
      "accept": "*/*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "zh-CN,zh;q=0.9",
      "cache-control": "no-cache",
      "cookie": cookie,
      "origin": "https://home.m.jd.com",
      "pragma": "no-cache",
      "referer": "https://home.m.jd.com/myJd/newhome.action",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    signal: AbortSignal.timeout(10000)
  }).then(res => res.json()).then(data => {
    farmInfo = data;
  }).catch(e => {
    console.log('\n东东农场: API查询请求失败 ‼️‼️');
    console.log(JSON.stringify(e));
  });
}

// 初始化任务列表API
async function taskInitForFarm() {
  console.log('\n初始化任务列表')
  const functionId = arguments.callee.name.toString();
  farmTask = await request(functionId, { "version": 14, "channel": 1, "babelChannel": "45" });
}
//获取好友列表API
async function friendListInitForFarm() {
  friendList = await request('friendListInitForFarm', { "version": 4, "channel": 1 });
  // console.log('aa', aa);
}
// 领取邀请好友的奖励API
async function awardInviteFriendForFarm() {
  awardInviteFriendRes = await request('awardInviteFriendForFarm');
}
//为好友浇水API
async function waterFriendForFarm(shareCode) {
  const body = { "shareCode": shareCode, "version": 6, "channel": 1 }
  waterFriendForFarmRes = await request('waterFriendForFarm', body);
}

function timeFormat(time?: number) {
  let date;
  if (time) {
    date = new Date(time)
  } else {
    date = new Date();
  }
  return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}
//提交互助码
// function submitCode() {
//   return new Promise(async resolve => {
//   $.get({url: `http://www.helpu.cf/jdcodes/submit.php?code=${farmInfo.farmUserPro.shareCode}&type=farm`, timeout: 10000}, (err, resp, data) => {
//     try {
//       if (err) {
//         console.log(`${JSON.stringify(err)}`)
//         console.log(`${$name} API请求失败，请检查网路重试`)
//       } else {
//         if (data) {
//           //console.log(`随机取个${randomCount}码放到您固定的互助码后面(不影响已有固定互助)`)
//           data = JSON.parse(data);
//         }
//       }
//     } catch (e) {
//       $.logErr(e, resp)
//     } finally {
//       resolve(data);
//     }
//   })
//   await wait(15000);
//   resolve()
// })
// }
function shareCodesFormat() {
  console.log(`第${$index}个京东账号的助力码:::${shareCodesArr[$index - 1]}`)
  newShareCodes = [];
  if (shareCodesArr[$index - 1]) {
    newShareCodes = shareCodesArr[$index - 1].split('@');
  } else {
    const tempIndex = $index > shareCodes.length ? (shareCodes.length - 1) : ($index - 1);
    newShareCodes = shareCodes[tempIndex].split('@');
  }
  if (!process.env.FRUITSHARECODES) {
    console.log(`您未填写助力码变量，优先进行账号内互助`);
    newShareCodes = [...(jdFruitShareArr || []), ...(newShareCodes || [])]
  }
  console.log(`第${$index}个京东账号将要助力的好友${JSON.stringify(newShareCodes)}`)
}
function TotalBean() {
  return fetch('https://me-api.jd.com/user_new/info/GetJDUserInfoUnion', {
    method: 'GET',
    headers: {
      Host: "me-api.jd.com",
      Accept: "*/*",
      Connection: "keep-alive",
      Cookie: cookie,
      "User-Agent": USER_AGENT,
      "Accept-Language": "zh-cn",
      "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
      "Accept-Encoding": "gzip, deflate, br"
    }
  }).then(res => res.json()).then(data => {
    if (data['retcode'] === "1001") {
      isLogin = false; //cookie过期
      return;
    }
    if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
      $nickName = data.data.userInfo.baseInfo.nickname;
    }
  }).catch(e => {
    console.log(e);
  });
}
async function request(function_id, body = {}, timeout = 1000): Promise<any> {
  wait(timeout);
  return task(function_id, body).catch(e => {
    console.log('\n东东农场: API查询请求失败 ‼️‼️')
    console.log(JSON.stringify(e));
    console.log(`function_id:${function_id}`)
  });
}

async function task(function_id: string, body = {}, isPOST?: boolean) {
  return fetch(`${JD_API_HOST}?functionId=${function_id}&body=${encodeURIComponent(JSON.stringify(body))}&appid=wh5`, {
    method: isPOST ? 'POST' : 'GET',
    headers: {
      "Host": "api.m.jd.com",
      "Accept": "*/*",
      "Origin": "https://carry.m.jd.com",
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent": USER_AGENT,
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "Referer": "https://carry.m.jd.com/",
      "Cookie": cookie
    },
    signal: AbortSignal.timeout(10000)
  }).then(res => res.json());
}
