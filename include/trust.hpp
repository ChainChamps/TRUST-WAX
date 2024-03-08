#include <eosio/eosio.hpp>
using namespace eosio;

CONTRACT trust : public contract {
  public:
  using contract::contract;

  // Table Definitions
  TABLE scores_s {
    eosio::name primary_key() const { return account; }

    eosio::name account;
    uint32_t trust;
    uint32_t activity;
    uint32_t bot;
  };
  using scores_t = eosio::multi_index<"scores"_n, scores_s>;

  // We do not score inactive accounts, remove them
  ACTION delaccount(eosio::name account);
  // Set scores for provided account
  ACTION setscores(eosio::name account, uint32_t trust, uint32_t activity, uint32_t bot);
};