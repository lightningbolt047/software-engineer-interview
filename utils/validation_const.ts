export const VALID_US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
];

export const INVALID_EMAIL_DOMAIN_ENDINGS = [".con", ".cm", ".coo", ".comm"];

export const INACTIVITY_THRESHOLD_MINUTES = 30;

export const REGEX_PASSWORD_AT_LEAST_ONE_DIGIT = /\d/;
export const REGEX_PASSWORD_AT_LEAST_ONE_UPPERCASE = /[A-Z]/;
export const REGEX_PASSWORD_AT_LEAST_ONE_LOWERCASE = /[a-z]/;
export const REGEX_PASSWORD_AT_LEAST_ONE_SPECIAL_CHAR = /[!@#$%^&*(),]/;

export const REGEX_PHONE_NUMBER = /^\+?\d{10,15}$/;

export const REGEX_DATE_OF_BIRTH =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

export const REGEX_SSN = /^\d{9}$/;

export const REGEX_ZIP_CODE = /^\d{5}$/;

export const REGEX_EMAIL = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const REGEX_CARD_VISA = /^4[0-9]{12}(?:[0-9]{3})?$/;
const REGEX_CARD_MASTERCARD = /^5[1-5][0-9]{14}$/;
const REGEX_CARD_AMEX = /^3[47][0-9]{13}$/;
const REGEX_CARD_DISCOVER = /^6(?:011|5[0-9]{2})[0-9]{12}$/;
const REGEX_CARD_JCB = /^(?:2131|1800|35\d{3})\d{11}$/;
const REGEX_CARD_DINERS = /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/;

export const REGEX_CARD_NUMBER = new RegExp(
  `${REGEX_CARD_VISA.source}|${REGEX_CARD_MASTERCARD.source}|${REGEX_CARD_AMEX.source}|${REGEX_CARD_DISCOVER.source}|${REGEX_CARD_JCB.source}|${REGEX_CARD_DINERS.source}`,
);
