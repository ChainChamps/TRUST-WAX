const { Chain } = require("qtest-js");
const { expectThrow } = require("qtest-js");

let chain;
let contract;
let trust, notTrust;

beforeAll(async () => {
  chain = await Chain.setupChain('WAX');
  // Create account and grant code permission 
  [trust, notTrust] = chain.accounts;
  
  await trust.addCode('active');
  contract = await trust.setContract({
    abi: "./build/trust/trust.abi",
    wasm: "./build/trust/trust.wasm",
  });
})

afterAll(async () => {
  await chain.clear()
})

function perm(acc) {
  return [{ actor: acc.name, permission: `active` }]
}

const goodScore = {
  account: "testaccount",
  trust: 100_000_000,
  activity: 99_890_321,
  bot: 0
}

test("trust setup sanity", async () => {
  await contract.action.setscores(goodScore, perm(trust));
  let rows = await contract.table.scores.getRows({
    scope: trust.name,
  });
  expect(rows[0]).toMatchObject(goodScore);

  await contract.action.setscores({ ...goodScore, bot: 50_000_000 }, perm(trust));
  rows = await contract.table.scores.getRows({
    scope: trust.name,
  });
  expect(rows[0]).toMatchObject({ ...goodScore, bot: 50_000_000});

  await contract.action.delaccount({ account: "testaccount" }, perm(trust));
  rows = await contract.table.scores.getRows({
    scope: trust.name,
  });
  expect(rows.length).toBe(0)
})

test("trust error scores", async () => {
  await expect(contract.action.setscores({
    account: "testaccount",
    trust: 1_000_000_000,
    activity: 0,
    bot: 0
  }, perm(trust))).rejects.toThrow('TRUST score must be between 0 - 100,000,000 (inclusive)');

  await expect(contract.action.setscores({
    account: "testaccount",
    trust: -1,
    activity: 0,
    bot: 0
  }, perm(trust))).rejects.toThrow('Number is out of range');

  await expect(contract.action.setscores({
    account: "testaccount",
    trust: 0,
    activity: 1_000_000_000,
    bot: 0
  }, perm(trust))).rejects.toThrow("Activity score must be between 0 - 100,000,000 (inclusive)");

  await expect(contract.action.setscores({
    account: "testaccount",
    trust: 0,
    activity: -1,
    bot: 0
  }, perm(trust))).rejects.toThrow("Number is out of range");

  await expect(contract.action.setscores({
    account: "testaccount",
    trust: 0,
    activity: 0,
    bot: 1_000_000_000
  }, perm(trust))).rejects.toThrow("Bot score must be between 0 - 100,000,000 (inclusive)");

  await expect(contract.action.setscores({
    account: "testaccount",
    trust: 500_000,
    activity: 120,
    bot: -1
  }, perm(trust))).rejects.toThrow("Number is out of range");
})

test("unauthorized user", async () => {
  await expectThrow(contract.action.setscores(goodScore, perm(notTrust)), "missing authority");
  rows = await contract.table.scores.getRows({
    scope: trust.name,
  });
  expect(rows.length).toBe(0);

  await expectThrow(contract.action.delaccount({ account: "testaccount"}, perm(notTrust)), "missing authority");
})

test("failed delete", async () => {
  await expectThrow(contract.action.delaccount({ account: "testaccount"}, perm(trust)), "Account does not exist");
})