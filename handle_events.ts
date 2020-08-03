'use strict';

const { ApiPromise, WsProvider } = require('@polkadot/api');

const config = require('./db_config');

const db = require('knex')({
    client: 'mysql',
    connection: {
        host: config.host,
        user: config.db_user,
        password: config.db_password,
        port: config.db_port,
        database: config.db_name
    }
});

const PROPOSALS_TABLE = 'proposals_offchain';

const CREATE_PROPOSAL_CHANGED = 1;
const UPDATE_PROPOSAL_CHANGED = 2;
const DEL_PROPOSAL_CHANGED = 3;

const types = {
    "ProposalId": "u32",
    "MarketType": {
        "_enum": [
            "Main",
            "Growth",
            "Off"
        ]
    },
    "TokenInfo": {
        "official_website_url": "Vec<u8>",
        "token_icon_url": "Vec<u8>",
        "token_symbol": "Vec<u8>",
        "total_issuance": "Balance",
        "total_circulation": "Balance",
        "current_board": "BoardType"
    },
    "ProposalChangedType":"u8",
};

type Proposal = {
    id: number,
    proposer: string,
    proposal_type: string,
    official_website_url: string,
    token_icon_url: string,
    token_name: string,
    token_symbol: string,
    max_supply: number,
    circulating_supply: number,
    current_market: string,
    target_market: string,
    state: string,
    review_goals: number[],
    vote_goals: number[],
    rewards_remainder:number,
    timestamp: number
};

type EventInfo = {
    ProposalChangedType: number,
    Proposal: Proposal
}

/**
 *
 * @returns {Promise<void>}
 */
async function main () {
    const provider = new WsProvider('ws://127.0.0.1:9944');

    const api = await ApiPromise.create({ provider, types  });

    while(true) {
        console.log("Listening events....");
        api.query.system.events((events) => {
            console.log(`\nReceived ${events.length} events:`);

            events.forEach((record) => {

                const { event, phase } = record;

                if (needHandleEvent(event.section, event.method)){
                    event.data.forEach((data, index) => {
                        const eventInfo = JSON.parse(data);
                        handleEvent(eventInfo)
                    });
                }else{
                    console.log("don't handle")
                }
            });
        });
        await sleep(3000)
    }
}

/**
 * section eq ibo AND method eq ProposalChanged
 * @param eventSection: string
 * @param eventMethod: string
 */
function needHandleEvent(eventSection: string, eventMethod: string) {
 return 'ibo' === eventSection && 'ProposalChanged' === eventMethod;
}

/**
 *
 * @param ms: number
 */
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 *
 * @param eventInfo
 */
async function handleEvent(eventInfo: EventInfo){

    let proposal = eventInfo.Proposal;
    const rowId = eventInfo.Proposal.id;

    proposal = handleReviewAndVoteGoals(proposal);

    if (isCreate(eventInfo.ProposalChangedType)){

        await db.table(PROPOSALS_TABLE).insert(proposal);

    }else if(isUpdate(eventInfo.ProposalChangedType)){

        await db.table(PROPOSALS_TABLE)
            .where({id: rowId})
            .update(proposal);

    }else if(isDel(eventInfo.ProposalChangedType)){

        await db.table(PROPOSALS_TABLE)
            .where({id: rowId})
            .del();

    }else {
        console.log('unknown ProposalChangedType')
    }
    return;
}

function isCreate(type: number) {
    return type === CREATE_PROPOSAL_CHANGED;
}

function isUpdate(type: number) {
    return type === UPDATE_PROPOSAL_CHANGED;
}

function isDel(type: number) {
    return type === DEL_PROPOSAL_CHANGED;
}

function handleReviewAndVoteGoals(proposal: Proposal) {
    proposal = appendReviewAndVoteGoalsItemsToProposal(proposal);
    proposal = unsetReviewAndVoteGoals(proposal);
    return proposal;
}

function appendReviewAndVoteGoalsItemsToProposal(proposal){
    proposal = {
        ...proposal,
        review_supporters_goals: proposal.review_goals[0],
        review_opponents_goals: proposal.review_goals[1],
        vote_supporters_goals: proposal.vote_goals[0],
        vote_opponents_goals: proposal.vote_goals[1],
    };
    return proposal;
}

function unsetReviewAndVoteGoals(proposal){
    delete proposal.review_goals;
    delete proposal.vote_goals;
    return proposal;
}

// prod
// main().catch(console.error).finally(() => process.exit());

// dev Fake Data
// console.log("Handle Fake Data");
// const data = "{\"ProposalChangedType\":1,\"Proposal\":{\"id\":555,\"proposer\":\"2test_proposer\",\"proposal_type\":\"test_proposal_type\",\"official_website_url\":\"https://www.google.com/\",\"token_icon_url\":\"https://www.google.com/\",\"token_name\":\"test\",\"token_symbol\":\"test\",\"max_supply\":128,\"circulating_supply\":128,\"current_market\":\"test_market\",\"target_market\":\"target_test_market\",\"state\":\"success\",\"review_goals\":[3,4],\"vote_goals\":[3,4],\"rewards_remainder\":128,\"timestamp\":129}}";
// const eventInfo = JSON.parse(data);
// handleEvent(eventInfo).then((res) =>{
//     console.log("Fake Data / END");
//     process.exit(1);
// });
