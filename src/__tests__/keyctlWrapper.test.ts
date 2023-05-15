import { KeyctlWrapper } from '../keyctlWrapper';
import { KeyNotExistError, KeyAlreadyExistError } from '../keyctlErrors';

describe('KeyctlWrapper', () => {
  let keyctl: KeyctlWrapper;

  beforeEach(async () => {
    keyctl = new KeyctlWrapper();
    keyctl.clearKeyring();
  });

  afterEach(async () => {
    await keyctl.clearKeyring();
  });

  it('should return an empty list for an empty keyring', async () => {
    const keys = await keyctl.getAllKeyIds();
    console.log(`keys: ${keys}`);
    expect(keys.length).toBe(0);
  });

  it('should return the correct key IDs for a non-empty keyring', async () => {
    const keyids: number[] = [];

    // Add 1 key
    keyids.push(await keyctl.addKey('test1', 'abc'));

    let keys = await keyctl.getAllKeyIds();
    expect(keys.length).toBe(1);
    expect(keys[0]).toBe(keyids[0]);

    // Add 2 keys
    keyids.push(await keyctl.addKey('test2', 'abc'));

    keys = await keyctl.getAllKeyIds();
    expect(keys.length).toBe(2);
    expect(keys).toEqual(expect.arrayContaining(keyids));
  });

  describe('getKeyIdFromName', () => {
    it('should throw KeyNotExistError for non-existing keyname', async () => {
      await expect(keyctl.getKeyIdFromName('this key should not exist')).rejects.toThrow(
        KeyNotExistError
      );
    });

    it('should return the key ID for a matching keyname', async () => {
      const keyid1 = await keyctl.addKey('test key', 'content');
      const keyid = await keyctl.getKeyIdFromName('test key');
      expect(keyid).toBe(keyid1);
    });

    it('should throw KeyNotExistError for a deleted key', async () => {
      const keyid1 = await keyctl.addKey('test key', 'content');
      await keyctl.removeKey(keyid1);
      await expect(keyctl.getKeyIdFromName('test key')).rejects.toThrow(KeyNotExistError);
    });
  });

  describe('getNameFromId', () => {
    it('should throw KeyNotExistError for non-existing key ID', async () => {
      await expect(keyctl.getNameFromId(999)).rejects.toThrow(KeyNotExistError);
    });

    it('should return the key name for a valid key ID', async () => {
      const name1 = 'test key';
      const keyid1 = await keyctl.addKey(name1, 'content');
      const name = await keyctl.getNameFromId(keyid1);
      expect(name).toBe(name1);
    });
  });

  describe('getDataFromId', () => {
    it('should throw AttributeError for wrong mode', async () => {
      const keyid = 999;
      await expect(keyctl.getDataFromId(keyid, 'hexx')).rejects.toThrow(Error);
    });

    it('should throw KeyNotExistError for non-existing key ID', async () => {
      const keyid = 999;
      await expect(keyctl.getDataFromId(keyid)).rejects.toThrow(KeyNotExistError);
    });

    it('should return the raw content for a valid key ID', async () => {
      const content = 'content xyz';
      const keyid = await keyctl.addKey('test key', content);
      const data = await keyctl.getDataFromId(keyid);
      expect(data).toBe(content);
    });

    it('should return the content in hex mode for a valid key ID', async () => {
      const content = 'content xyz';
      const keyid = await keyctl.addKey('test key', content);
      const data = await keyctl.getDataFromId(keyid, 'hEx');
      expect(data).toBe(Buffer.from(content, 'utf8').toString('hex'));
    });
  });

  describe('addKey', () => {
    it('should add a key and return the correct content', async () => {
      const content = 'abc def ghi';
      const keyid = await keyctl.addKey('test key', content);
      const data = await keyctl.getDataFromId(keyid);
      expect(data).toBe(content);
    });

    it('should throw KeyAlreadyExistError when adding an existing key', async () => {
      await keyctl.addKey('test key', 'content');
      await expect(keyctl.addKey('test key', 'x')).rejects.toThrow(KeyAlreadyExistError);
    });
  });

  describe('updateKey', () => {
    it('should update the key content and return the updated content', async () => {
      const newContent = 'abc def ghi';
      const keyid = await keyctl.addKey('test key', 'xxx');
      let data = await keyctl.getDataFromId(keyid);
      expect(data).toBe('xxx');

      await keyctl.updateKey(keyid, newContent);
      data = await keyctl.getDataFromId(keyid);
      expect(data).toBe(newContent);
    });

    it('should throw KeyNotExistError for non-existing key ID', async () => {
      await expect(keyctl.updateKey(999, 'abc')).rejects.toThrow(KeyNotExistError);
    });
  });

  describe('removeKey', () => {
    it('should remove the key and throw KeyNotExistError when accessing the removed key', async () => {
      const keyid = await keyctl.addKey('test key', 'xxx');
      let data = await keyctl.getDataFromId(keyid);
      expect(data).toBe('xxx');

      await keyctl.removeKey(keyid);
      await expect(keyctl.getDataFromId(keyid)).rejects.toThrow(KeyNotExistError);
    });

    it('should throw KeyNotExistError for non-existing key ID', async () => {
      await expect(keyctl.removeKey(999)).rejects.toThrow(KeyNotExistError);
    });
  });

  describe('clear_keyring', () => {
    it('should clear the keyring and return an empty array when getting all key IDs', async () => {
      await keyctl.addKey('key1', 'abc');
      await keyctl.addKey('key2', 'abc');
      await keyctl.addKey('key3', 'abc');
      let keys = await keyctl.getAllKeyIds();
      expect(keys).toHaveLength(3);

      await keyctl.clearKeyring();
      keys = await keyctl.getAllKeyIds();
      expect(keys).toHaveLength(0);
    });
  });
});
