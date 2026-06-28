"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COIN_CONSTANTS = void 0;
exports.coinsToINR = coinsToINR;
exports.inrToCoins = inrToCoins;
exports.COIN_CONSTANTS = {
    COINS_PER_INR: 9,
    ATTEND_EVENT_REWARD: 50,
    REFER_FRIEND_REWARD: 100,
    REFERRED_JOIN_REWARD: 50,
};
function coinsToINR(coins) {
    return coins / exports.COIN_CONSTANTS.COINS_PER_INR;
}
function inrToCoins(inr) {
    return Math.floor(inr * exports.COIN_CONSTANTS.COINS_PER_INR);
}
//# sourceMappingURL=coin.constants.js.map