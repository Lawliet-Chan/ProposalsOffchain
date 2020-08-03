#### 安装依赖
`npm install`
#### 启动http服务，端口号：8081
`node http_service.ts`
#### 编译监听服务ts代码
`tsc handle_events.ts`
#### 开启监听服务
`node handle_events.js`

#### doc:
```json
{
    "status_code": 200, //  200:查询正常 500:查询失败
    "items": [
        {
            "id": 1,
            "proposer": "2test_proposer", //  可筛选项
            "proposal_type": "test_proposal_type",
            "official_website_url": "https://www.google.com/",
            "token_icon_url": "https://www.google.com/",
            "token_name": "test",
            "token_symbol": "test",
            "max_supply": 128,
            "circulating_supply": 128,
            "current_market": "test_market",
            "target_market": "target_test_market",
            "state": "success", //  可筛选项
            "rewards_remainder": 128,
            "timestamp": 129,
            "review_supporters_goals": 3,
            "review_opponents_goals": 4,
            "vote_supporters_goals": 3,
            "vote_opponents_goals": 4
        }
    ],
    "error_msg": "" //  status_code为500时会返回`查询失败`，可直接抛出
}
