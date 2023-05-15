import { Key } from '../key';
import { KeyctlWrapper } from '../keyctlWrapper';
import { KeyNotExistError, KeyAlreadyExistError, KeyctlOperationError } from '../keyctlErrors';

// All tests that use keyctl must be put into one file,
// because keyctl is a system-wide (for each user) command
// and it's state is shared across all tests.

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

describe('Key', () => {
  let keyctl: KeyctlWrapper;

  beforeEach(async () => {
    keyctl = new KeyctlWrapper();
    await keyctl.clearKeyring();
  });

  afterEach(async () => {
    await keyctl.clearKeyring();
  });

  describe('constructor', () => {
    it('should initialize with empty values', async () => {
      const k = await Key.createInstance();
      expect(k.id).toBe(0);
      expect(k.name).toBe('');
      expect(k.data).toBe('');
    });

    it('should throw KeyNotExistError for non-existing key', async () => {
        await expect(Key.createInstance(999)).rejects.toThrow(KeyNotExistError);
    });

    it('should initialize with existing key values', async () => {
      const keyid = await keyctl.addKey('test key', 'content xyz');
      const k = await Key.createInstance(keyid);
      expect(k.name).toBe('test key');
      expect(k.data).toBe('content xyz');
    });
  });

  describe('list', () => {
    it('should return an empty list', async () => {
      const keyList = await Key.list();
      expect(keyList).toHaveLength(0);
    });

    it('should return a list of keys with correct properties', async () => {
      const keySrc = [
        { id: 0, name: 'test key 1', data: 'content 111' },
        { id: 0, name: 'test key 2', data: 'content 222' },
        { id: 0, name: 'test key 3', data: 'content 333' },
      ];

      for (const src of keySrc) {
        src['id'] = await keyctl.addKey(src.name, src.data);
      }

      const keyList = await Key.list();
      expect(keyList).toHaveLength(3);

      for (const key of keyList) {
        const src = keySrc.find((x) => x.id === key.id);
        if (src === undefined) throw new Error('key not found');
        expect(key.id).toBe(src.id);
        expect(key.name).toBe(src.name);
        expect(key.data).toBe(src.data);
      }
    });
  });

  describe('search', () => {
    it('should throw KeyNotExistError for non-existing key', async () => {
      await expect(Key.search('this key does not exist')).rejects.toThrow(KeyNotExistError);
    });

    it('should return the key with correct properties for an existing key', async () => {
      const keyid = await keyctl.addKey('test key', 'content xyz');
      const k = await Key.search('test key');
      expect(k.id).toBe(keyid);
      expect(k.name).toBe('test key');
      expect(k.data).toBe('content xyz');
    });
  });

  describe('add', () => {
    it('should add the key and return the key object for a new key', async () => {
      const k = await Key.add('test key 111', 'content 111');
      const keyid = await keyctl.getKeyIdFromName('test key 111');
      expect(k.id).toBe(keyid);
    });

    it('should throw KeyAlreadyExistError for an existing key', async () => {
      await keyctl.addKey('test key 111', 'content xyz');
      await expect(Key.add('test key 111', 'content xyz')).rejects.toThrow(KeyAlreadyExistError);
    });
  });

  describe('delete', () => {
    it('should delete the existing key', async () => {
      const keyid = await keyctl.addKey('test key', 'abc');
      const k = await Key.createInstance(keyid);
      expect(k.name).toBe('test key');
      await k.delete();
      await expect(keyctl.getKeyIdFromName('test key')).rejects.toThrow(KeyNotExistError);
    });

    it('should throw KeyctlOperationError for uninitialized key', async () => {
      const k = await Key.createInstance();
      await expect(k.delete()).rejects.toThrow(KeyctlOperationError);
    });

    it('should throw KeyNotExistError for non-existing key (delete called twice)', async () => {
      const keyid = await keyctl.addKey('test key', 'abc');
      const k = await Key.createInstance(keyid);
      await k.delete();
      await expect(k.delete()).rejects.toThrow(KeyNotExistError);
    });
  });
})

/*

class TestKey(object):
    # ---------------------------------------------------------------

    def test_delete(self, empty_keyring):
        keyctl = empty_keyring

        # existing key
        keyid = keyctl.add_key('test key', 'abc')
        k = Key(keyid)
        assert k.name == 'test key'
        k.delete()
        with pytest.raises(KeyNotExistError):
            keyctl.get_id_from_name('test key')

        # uninitialized key
        k = Key()
        with pytest.raises(KeyctlOperationError):
            k.delete()

        # not existing key (delete called twice)
        keyid = keyctl.add_key('test key', 'abc')
        k = Key(keyid)
        k.delete()
        with pytest.raises(KeyNotExistError):
            k.delete()

    # ---------------------------------------------------------------

    def test_update(self, empty_keyring):
        keyctl = empty_keyring

        # existing key
        keyid = keyctl.add_key('test key', 'abc')
        k1 = Key(keyid)
        assert k1.data == 'abc'

        k1.update('xyz')
        assert k1.data == 'xyz'
        k2 = Key(keyid)
        assert k1.id == k2.id
        assert k1.name == k2.name
        assert 'xyz' == k2.data

        # not existing key
        k1.delete()
        with pytest.raises(KeyNotExistError):
            k2.update('xxxx')


# -------------------------------------------------------------------
*/
