'use strict';

const express = require('express');

const app = express();

const IBO_DB_TABLE = 'ibo';

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
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/proposals', async function (req, res) {
    const list = await findAll(req.query);
    res.json({items: list}).end();
});

async function findAll(query){
    return dbConnect.table(IBO_DB_TABLE).where(query).select();
}

app.listen(8081);