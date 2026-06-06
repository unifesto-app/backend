export const COIN_CONSTANTS = {
  COINS_PER_INR: 9,
  ATTEND_EVENT_REWARD: 50,
  REFER_FRIEND_REWARD: 100,
  REFERRED_JOIN_REWARD: 50,
};

export function coinsToINR(coins: number): number {
  return coins / COIN_CONSTANTS.COINS_PER_INR;
}

export function inrToCoins(inr: number): number {
  return Math.floor(inr * COIN_CONSTANTS.COINS_PER_INR);
}
