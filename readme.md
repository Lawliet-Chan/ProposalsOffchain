#### 安装依赖

`npm install`

#### 开发，监听端口：8081

`npm run dev`

#### 编译到./dist

`npm run compile`

#### doc:

status_code - 200:查询正常 500:查询失败  
 error_msg - status_code 为 500 时会返回'查询失败'，可直接抛出  
 api(GET):  
 筛选 state: /proposals?state=xxx  
 筛选 proposer: /proposals?proposer=xxx

```json
{
  "status_code": 200,
  "items": [
    {
      "id": 1,
      "proposer": "2test_proposer",
      "proposal_type": "test_proposal_type",
      "official_website_url": "https://www.google.com/",
      "token_icon_url": "https://www.google.com/",
      "token_name": "test",
      "token_symbol": "test",
      "max_supply": 128,
      "circulating_supply": 128,
      "current_market": "test_market",
      "target_market": "target_test_market",
      "state": "success",
      "rewards_remainder": 128,
      "timestamp": 129,
      "review_supporters_goals": 3,
      "review_opponents_goals": 4,
      "vote_supporters_goals": 3,
      "vote_opponents_goals": 4
    }
  ],
  "error_msg": ""
}
```
