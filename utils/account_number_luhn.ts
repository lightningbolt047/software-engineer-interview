export default function checkCreditCardValid(cardNumber: string): boolean {
  let sum = 0;
  for (let index = 0; index < cardNumber.length; index++) {
    let digit = parseInt(cardNumber[index]);
    if (index % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function getAccountNumberChecksum(accountNumber: string): number {
  let sum = 0;
  const parity = accountNumber.length % 2;
  for (let index = 0; index < accountNumber.length; index++) {
    let digit = parseInt(accountNumber[index]);
    if (index % 2 === parity) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}
