/**
 * Wrapper around system command keyctl
 */
import su = require('./sysUtils');
import { KeyAlreadyExistError, KeyNotExistError, KeyctlOperationError } from './keyctlErrors';


// Check keyctl command availability while importing the script
if (!su.isCommandAvailable('keyctl')) {
  throw new Error("keyctl command is not available, please install it");
}

class KeyctlWrapper {
    private static defaultKeyring: string = '@u';
    private static defaultKeytype: string = 'user';

    private keyring: string;
    private keytype: string;

    constructor(keyring: string = KeyctlWrapper.defaultKeyring, keytype: string = KeyctlWrapper.defaultKeytype) {
        this.keyring = keyring;
        this.keytype = keytype;
    }

    async getAllKeyIds(): Promise<number[]> {
        const out = (await su.system(['keyctl', 'rlist', this.keyring])).trimEnd();
        if (out === '')
            return [];

        const tokens = out.split(/\s+/);
        const result = tokens.map((token) => parseInt(token));
        return result;
    }

    async getKeyIdFromName(name: string): Promise<number> {
        const [ret, out, err] = await su.systemUnchecked(['keyctl', 'search', this.keyring, this.keytype, name]);
        if (ret !== 0) {
            throw new KeyNotExistError(name);
        }

        const keyid = parseInt(out.trim());
        return keyid;
    }

    async getNameFromId(keyid: number): Promise<string> {
        const [ret, out, _err] = await su.systemUnchecked(['keyctl', 'rdescribe', keyid.toString()]);
        if (ret !== 0) {
            throw new KeyNotExistError('', keyid);
        }

        const name = out.split(';').slice(4).join(';').trimEnd();
        return name;
    }

    async getDataFromId(keyid: number, mode='raw'): Promise<string> {
        let kmode = '';
        if (mode.toLowerCase() === 'raw') {
            kmode = 'pipe';
        } else if (mode.toLowerCase() === 'hex') {
            kmode = 'read';
        } else {
            throw new Error('mode must be one of [\'raw\', \'hex\'].');
        }

        const [ret, out, _err] = await su.systemUnchecked(['keyctl', kmode, keyid.toString()]);

        if (ret === 1)
            throw new KeyNotExistError('', keyid);

        if (mode === 'raw')
            return out;

        // connecting lines to a single line and remove first line
        const lines = out.split("\n").map((line) => line.trimEnd());
        const h = lines.slice(1).join('');
        // remove spaces
        return h.replace(/ /g, '')
    }

    async addKey(name: string, data: string): Promise<number> {
        try {
            const keyid = await this.getKeyIdFromName(name);
            throw new KeyAlreadyExistError(name, keyid);
        } catch (error) {
            if (error instanceof KeyNotExistError) {
                // we can proceed and add the key
            } else {
                throw error;
            }
        }

        const out = await su.system(['keyctl', 'padd', this.keytype, name, this.keyring], data);
        const keyid = parseInt(out);
        return keyid;
    }

    async updateKey(keyid: number, data: string) {
        const [ret, _out, err] = await su.systemUnchecked(['keyctl', 'pupdate', keyid.toString()], data);
        if (ret === 1) {
            throw new KeyNotExistError('', keyid);
        }
        else if (ret !== 0) {
            throw new KeyctlOperationError('', keyid, '', `(${ret})${err}`);
        }
    }

    async removeKey(keyid: number) {
        // revoke first, because unlinking is slow
        const [ret, _out, err] = await su.systemUnchecked(['keyctl', 'revoke', keyid.toString()]);
        if (ret === 1) {
            throw new KeyNotExistError('', keyid);
        }
        else if (ret !== 0) {
            throw new KeyctlOperationError('', keyid, '', `(${ret})${err}`);
        }

        await su.system(['keyctl', 'unlink', keyid.toString(), this.keyring]);
    }

    async clearKeyring() {
        await su.system(['keyctl', 'clear', this.keyring]);
    }
}

export { KeyctlWrapper };
