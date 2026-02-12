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