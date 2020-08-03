'use strict';

const express = require('express');

const app = express();

const TABLE = 'proposals_offchain';

const dbConfig = require('./db_config');

const dbConnect = require('knex')({
    client: 'mysql',
    connection: {
        host: dbConfig.host,
        user: dbConfig.db_user,
        password: dbConfig.db_password,
        port: dbConfig.db_port,
        database: dbConfig.db_name
    }
});

app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/proposals', async function (req, resp) {

    let error_msg = '';

    let status_code = 200;

    const list = await findAll(req.query).catch((e) => {
        console.log(e.message);
        status_code = 500;
        error_msg = '查询失败';
        return [];
    });
    resp.json({
        status_code,
        items: list,
        error_msg,
    }).end();
});

async function findAll(query){
    return dbConnect.table(TABLE).where(query).select();
}

app.listen(8081);
