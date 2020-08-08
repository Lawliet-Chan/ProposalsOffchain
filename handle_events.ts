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
    "ProposalChangedType": "u8",
    "ProposalId": "u32",
    "Proposal": {
        "id": "ProposalId",
        "proposer": "AccountId",
        "proposal_type": "ProposalType",
        "official_website_url": "Vec<u8>",
        "token_icon_url": "Vec<u8>",
        "token_name": "Vec<u8>",
        "token_symbol": "Vec<u8>",
        "max_supply": "Balance",
        "circulating_supply": "Balance",
        "current_market": "MarketType",
        "target_market": "MarketType",
        "state": "ProposalState",
        "review_goals": "(u64, u64)",
        "vote_goals": "(u64, u64)",
        "rewards_remainder": "Balance",
        "timestamp": "u64"
    },
    "MarketType": {
        "_enum": [
            "Main",
            "Growth",
            "Off"
        ]
    },
    "ProposalType": {
        "_enum": [
            "List",
            "Delist",
            "Rise",
            "Fall"
        ]
    },
    "ProposalState": {
        "_enum": [
            "Pending",
            "Reviewing",
            "Voting",
            "Approved",
            "Rejected",
            "ApprovedClosed",
            "RejectedClosed"
        ]
    },
    "TokenInfo": {
        "official_website_url": "Vec<u8>",
        "token_icon_url": "Vec<u8>",
        "token_symbol": "Vec<u8>",
        "total_issuance": "Balance",
        "total_circulation": "Balance",
        "current_board": "MarketType"
    }
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
    rewards_remainder: number,
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
        console.log('\n' + Date().toLocaleString() + "\nListening events...");
        api.query.system.events((events) => {
            console.log(`Received ${events.length} events:`);

            events.forEach((record) => {

                const { event, phase } = record;
                const types = event.typeDef;

                if (needHandleEvent(event.section, event.method)){
                    console.log("handle");
                    let eventInfo: EventInfo;

                    for(let typeKey in event.data){
                        if (aliveTypes(types, typeKey)){
                            if (['ProposalChangedType', 'Proposal'].includes(types[typeKey].type)){
                                const val = event.data[typeKey];
                                eventInfo = chooseTypePushValToEventInfo(types[typeKey].type, val, eventInfo);
                            }
                        }
                    }

                    handleEvent(eventInfo);
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
 * @param typeKey
 * @param typeList
 */
function aliveTypes(types, typeKey) {
    return types[typeKey];
}

/**
 *
 * @param type
 * @param val
 * @param eventInfo
 */
function chooseTypePushValToEventInfo(type, val, eventInfo) {
    switch (type) {
        case 'ProposalChangedType':
            eventInfo = {
                ...eventInfo,
                ProposalChangedType: JSON.parse(val),
            };
        case 'Proposal':
            eventInfo = {
                ...eventInfo,
                Proposal: JSON.parse(val),
            };
    }
    return eventInfo;
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
    if ('Proposal' in eventInfo && 'ProposalChangedType' in eventInfo){
        let proposal = eventInfo.Proposal;
        const rowId = eventInfo.Proposal.id;

        proposal = handleReviewAndVoteGoals(proposal);

        try {

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

        }catch(e){
            throw '-------' + e.sqlMessage + '-------\n';
        }

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
main().catch(console.error).finally(() => process.exit());