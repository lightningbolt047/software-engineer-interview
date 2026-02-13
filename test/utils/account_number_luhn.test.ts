import {describe, it} from "node:test";
import assert from "node:assert";
import checkCreditCardValid from "@/utils/account_number_luhn";


describe('Luhn\'s algorithm', () => {
    it("Verify valid card number is accepted", () => {
        const cardNumber = "4532015112830366";
        const isValid = checkCreditCardValid(cardNumber);
        assert.equal(isValid, true);
    });

    it("Verify invalid card number is not accepted", () => {
        const cardNumber = "1234567812345678";
        const isValid = checkCreditCardValid(cardNumber);
        assert.equal(isValid, false);
    });

});