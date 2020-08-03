-- ----------------------------
-- Table structure for proposals_offchain
-- ----------------------------

CREATE TABLE IF NOT EXISTS `proposals_offchain` (
  `id` int(10) unsigned NOT NULL,
  `proposer` varchar(255) NOT NULL,
  `proposal_type` varchar(255) NOT NULL,
  `official_website_url` varchar(255) NOT NULL,
  `token_icon_url` varchar(255) NOT NULL,
  `token_name` varchar(255) NOT NULL,
  `token_symbol` varchar(255) NOT NULL,
  `max_supply` bigint(20) NOT NULL,
  `circulating_supply` bigint(20) NOT NULL,
  `current_market` varchar(255) NOT NULL,
  `target_market` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `rewards_remainder` bigint(20) NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `review_supporters_goals` bigint(20) NOT NULL,
  `review_opponents_goals` bigint(20) NOT NULL,
  `vote_supporters_goals` bigint(20) NOT NULL,
  `vote_opponents_goals` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
