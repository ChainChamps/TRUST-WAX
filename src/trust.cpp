#include <trust.hpp>

uint32_t max_score = 100'000'000;

ACTION trust::delaccount(eosio::name account) {
  require_auth(get_self());

  trust::scores_t scores{get_self(), get_self().value};
  auto score = scores.require_find(account, "Account does not exist");

  scores.erase(score);
}

ACTION trust::setscores(eosio::name account, uint32_t trust, uint32_t activity, uint32_t bot) {
  require_auth(get_self());

  eosio::check(trust >= 0 && trust <= max_score, "TRUST score must be between 0 - 100,000,000 (inclusive)");
  eosio::check(activity >= 0 && activity <= max_score, "Activity score must be between 0 - 100,000,000 (inclusive)");
  eosio::check(bot >= 0 && bot <= max_score, "Bot score must be between 0 - 100,000,000 (inclusive)");

  trust::scores_t scores{get_self(), get_self().value};
  auto score = scores.find(account);

  if (score == scores.end()) {
    scores.emplace(get_self(), [&](auto& element) {
      element.account = account;
      element.trust = trust;
      element.activity = activity;
      element.bot = bot;
    });
  }
  else {
    scores.modify(score, eosio::same_payer, [&](auto& element) {
      element.trust = trust;
      element.activity = activity;
      element.bot = bot;
    });
  }
}