'use strict';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a = require('@polkadot/api'), ApiPromise = _a.ApiPromise, WsProvider = _a.WsProvider;
var config = require('./db_config');
var db = require('knex')({
    client: 'mysql',
    connection: {
        host: config.host,
        user: config.db_user,
        password: config.db_password,
        port: config.db_port,
        database: config.db_name
    }
});
var IBO_TABLE = 'ibo'; //
var CREATE_PROPOSAL_CHANGED = 1;
var UPDATE_PROPOSAL_CHANGED = 2;
var DEL_PROPOSAL_CHANGED = 3;
var types = {
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
    "ProposalChangedType": "u8"
};
/**
 *
 * @returns {Promise<void>}
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var provider, api;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = new WsProvider('ws://127.0.0.1:9944');
                    return [4 /*yield*/, ApiPromise.create({ provider: provider, types: types })];
                case 1:
                    api = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 4];
                    console.log("Listening events....");
                    api.query.system.events(function (events) {
                        console.log("\nReceived " + events.length + " events:");
                        events.forEach(function (record) {
                            var event = record.event, phase = record.phase;
                            if (needHandleEvent(event.section, event.method)) {
                                event.data.forEach(function (data, index) {
                                    var eventInfo = JSON.parse(data);
                                    handleEvent(eventInfo);
                                });
                            }
                            else {
                                console.log("don't handle");
                            }
                        });
                    });
                    return [4 /*yield*/, sleep(3000)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 2];
                case 4: return [2 /*return*/];
            }
        });
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
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
/**
 *
 * @param eventInfo
 */
function handleEvent(eventInfo) {
    return __awaiter(this, void 0, void 0, function () {
        var proposal, rowId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    proposal = eventInfo.Proposal;
                    rowId = eventInfo.Proposal.id;
                    proposal = handleReviewAndVoteGoals(proposal);
                    if (!isCreate(eventInfo.ProposalChangedType)) return [3 /*break*/, 2];
                    return [4 /*yield*/, db.table(IBO_TABLE).insert(proposal)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 2:
                    if (!isUpdate(eventInfo.ProposalChangedType)) return [3 /*break*/, 4];
                    return [4 /*yield*/, db.table(IBO_TABLE)
                            .where({ id: rowId })
                            .update(proposal)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    if (!isDel(eventInfo.ProposalChangedType)) return [3 /*break*/, 6];
                    return [4 /*yield*/, db.table(IBO_TABLE)
                            .where({ id: rowId })
                            .del()];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    console.log('unknown ProposalChangedType');
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
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
    proposal = __assign(__assign({}, proposal), { review_supporters_goals: proposal.review_goals[0], review_opponents_goals: proposal.review_goals[1], vote_supporters_goals: proposal.vote_goals[0], vote_opponents_goals: proposal.vote_goals[1] });
    return proposal;
}
function unsetReviewAndVoteGoals(proposal) {
    delete proposal.review_goals;
    delete proposal.vote_goals;
    return proposal;
}
main()["catch"](console.error)["finally"](function () { return process.exit(); });
// Fake Data
console.log("Handle Fake Data");
var data = "{\"ProposalChangedType\":1,\"Proposal\":{\"id\":1234,\"proposer\":\"2test_proposer\",\"proposal_type\":\"test_proposal_type\",\"official_website_url\":\"https://www.google.com/\",\"token_icon_url\":\"https://www.google.com/\",\"token_name\":\"test\",\"token_symbol\":\"test\",\"max_supply\":128,\"circulating_supply\":128,\"current_market\":\"test_market\",\"target_market\":\"target_test_market\",\"state\":\"success\",\"review_goals\":[3,4],\"vote_goals\":[3,4],\"rewards_remainder\":128,\"timestamp\":129}}";
var eventInfo = JSON.parse(data);
handleEvent(eventInfo);
