import {decryptString, encryptString} from "@/utils/crypt_utils";
import {SSN_KEY} from "@/utils/keys";
import assert from "node:assert";
import test from "node:test";
import {describe} from "node:test";

describe('SSN encryption', () => {
    test("Encrypt and decrypt string and decrypted string should match initial string", () => {
        const ssn = "123456789";
        const encryptedString = encryptString(ssn, SSN_KEY);
        const decryptedString = decryptString(encryptedString, SSN_KEY);
        assert.equal(ssn, decryptedString);
    })
});