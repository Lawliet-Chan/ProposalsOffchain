'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    "ProposalChangedType": "u8",
};
/**
 *
 * @returns {Promise<void>}
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new WsProvider('ws://127.0.0.1:9944');
        const api = yield ApiPromise.create({ provider, types });
        while (true) {
            console.log("Listening events....");
            api.query.system.events((events) => {
                console.log(`\nReceived ${events.length} events:`);
                events.forEach((record) => {
                    const { event, phase } = record;
                    if (needHandleEvent(event.section, event.method)) {
                        event.data.forEach((data, index) => {
                            const eventInfo = JSON.parse(data);
                            handleEvent(eventInfo);
                        });
                    }
                    else {
                        console.log("don't handle");
                    }
                });
            });
            yield sleep(3000);
        }
    });
}
/**
 * section eq ibo AND method eq ProposalChanged
 * @param eventSection: string
 * @param eventMethod: string
 */
function needHandleEvent(eventSection, eventMethod) {
    return 'ibo' === eventSection && 'ProposalChanged' === eventMethod;
}
/**
 *
 * @param ms: number
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 *
 * @param eventInfo
 */
function handleEvent(eventInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        let proposal = eventInfo.Proposal;
        const rowId = eventInfo.Proposal.id;
        proposal = handleReviewAndVoteGoals(proposal);
        if (isCreate(eventInfo.ProposalChangedType)) {
            yield db.table(PROPOSALS_TABLE).insert(proposal);
        }
        else if (isUpdate(eventInfo.ProposalChangedType)) {
            yield db.table(PROPOSALS_TABLE)
                .where({ id: rowId })
                .update(proposal);
        }
        else if (isDel(eventInfo.ProposalChangedType)) {
            yield db.table(PROPOSALS_TABLE)
                .where({ id: rowId })
                .del();
        }
        else {
            console.log('unknown ProposalChangedType');
        }
        return;
    });
}
function isCreate(type) {
    return type === CREATE_PROPOSAL_CHANGED;
}
function isUpdate(type) {
    return type === UPDATE_PROPOSAL_CHANGED;
}
function isDel(type) {
    return type === DEL_PROPOSAL_CHANGED;
}
function handleReviewAndVoteGoals(proposal) {
    proposal = appendReviewAndVoteGoalsItemsToProposal(proposal);
    proposal = unsetReviewAndVoteGoals(proposal);
    return proposal;
}
function appendReviewAndVoteGoalsItemsToProposal(proposal) {
    proposal = Object.assign(Object.assign({}, proposal), { review_supporters_goals: proposal.review_goals[0], review_opponents_goals: proposal.review_goals[1], vote_supporters_goals: proposal.vote_goals[0], vote_opponents_goals: proposal.vote_goals[1] });
    return proposal;
}
function unsetReviewAndVoteGoals(proposal) {
    delete proposal.review_goals;
    delete proposal.vote_goals;
    return proposal;
}
// prod
main().catch(console.error).finally(() => process.exit());
//# sourceMappingURL=handle_events.js.map