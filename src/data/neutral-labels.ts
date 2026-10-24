/**
 * English holiday names that name their own country. Shown as they are, they
 * would solve the round without reading the calendar at all, so the clue card
 * prints the neutral label from this table instead; the reveal still uses the
 * real name. Keyed by country code and the English name from
 * `holidays.json`; `tests/game.test.ts` fails when a label needs an entry here.
 */
export const NEUTRAL_LABELS: Record<string, string> = {
  "AM|Armenian Genocide Remembrance Day": "Genocide Remembrance Day",
  "BE|Belgian National Day": "National Day",
  "BW|Botswana Day holiday": "National Day",
  "CA|Canada Day": "National Day",
  "CR|Annexation of the Party of Nicoya to Costa Rica":
    "Annexation of the Party of Nicoya",
  "CY|Cyprus Independence Day": "Independence Day",
  "CZ|Independent Czechoslovak State Day": "Independent State Day",
  "CY|Cyprus National Day": "National Day",
  "DE|German Unity Day": "Unity Day",
  "ES|National Day of Spain": "National Day",
  "ET|Ethiopian Patriots' Victory Day": "Patriots' Victory Day",
  "GE|Saint George's Day": "Patron Saint's Day",
  "HR|Victory and Homeland Thanksgiving Day and the Day of Croatian defenders":
    "Victory and Homeland Thanksgiving Day and Defenders' Day",
  "IS|Icelandic National Day": "National Day",
  "KH|Cambodia Peace Day": "Peace Day",
  "KZ|Kazakhstan People's Unity Day": "People's Unity Day",
  "LT|Day of Restoration of Independence of Lithuania":
    "Day of Restoration of Independence",
  "LT|The Day of Restoration of the State of Lithuania":
    "The Day of Restoration of the State",
  "LV|Day of the Convocation of the Constitutional Assembly of the Republic of Latvia":
    "Day of the Convocation of the Constitutional Assembly",
  "LV|Day of the Proclamation of the Republic of Latvia":
    "Day of the Proclamation of the Republic",
  "LV|Day of the Restoration of Independence of the Republic of Latvia":
    "Day of the Restoration of Independence",
  "MD|Day of the Moldovan National Army": "Day of the National Army",
  "MD|Independence Day (Moldova)": "Independence Day",
  "MD|Labour Day (Moldova)": "Labour Day",
  "PY|Paraguayan Independence": "Independence Day",
  "RU|Russia Day": "National Day",
  "SE|National Day of Sweden": "National Day",
  "SM|The Feast of San Marino and the Republic": "The Feast of the Republic",
  "SK|Day of the Establishment of the Slovak Republic":
    "Day of the Establishment of the Republic",
  "SK|Slovak National Uprising anniversary": "National Uprising anniversary",
  "SY|Syrian Revolution Day": "Revolution Day",
  "TO|Birthday of the Heir to the Crown of Tonga":
    "Birthday of the Heir to the Crown",
  "TO|Birthday of the reigning Sovereign of Tonga":
    "Birthday of the reigning Sovereign",
  "TV|Tuvalu Day": "National Day",
  "TV|Tuvalu Day Holiday": "National Day Holiday",
  "UA|Defender of Ukraine Day": "Defenders Day",
};

/**
 * Country-name forms that no prefix rule catches: the adjective differs from
 * the name by more than its last two letters.
 */
export const DEMONYMS: Record<string, string[]> = {
  ES: ["spanish"],
  SE: ["swedish"],
};
