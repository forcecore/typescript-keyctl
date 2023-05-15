import { KeyctlWrapper} from './keyctlWrapper';

class Key {

  id: number = 0;
  name: string = '';
  data: string = '';
  data_hex: string = '';
  _keyctl: KeyctlWrapper;

  private constructor(keyid: number = 0, keyring: string = '', keytype: string = '') {
    this.id = keyid;
    this._keyctl = new KeyctlWrapper(keyring, keytype);
  }

  /**
   * Must be called to "finalize" the object construction.
   */
  static async createInstance(keyid: number = 0, keyring: string = '', keytype: string = ''): Promise<Key> {
    const instance = new Key(keyid, keyring, keytype);
    if (keyid) {
      await instance._loadKey(keyid);
    }

    return instance;
  }

  async _loadKey(keyid: number) {
    this.name = await this._keyctl.getNameFromId(keyid);
    this.data = await this._keyctl.getDataFromId(keyid);
    this.data_hex = await this._keyctl.getDataFromId(keyid, 'hex');
  }

  static async list(keyring: string = '', keytype: string = ''): Promise<Key[]> {
    const keyctl = new KeyctlWrapper(keyring, keytype);
    const keyids = await keyctl.getAllKeyIds();

    const keylist: Key[] = [];
    for (const keyid of keyids) {
      const key = await Key.createInstance(keyid, keyring, keytype);
      keylist.push(key);
    }

    return keylist;
  }

  static async search(name: string, keyring: string = '', keytype: string = ''): Promise<Key> {
    const keyctl = new KeyctlWrapper(keyring, keytype);
    const keyid = await keyctl.getKeyIdFromName(name);
    return await Key.createInstance(keyid, keyring, keytype);
  }

  static async add(name: string, data: string, keyring: string = '', keytype: string = ''): Promise<Key> {
    const keyctl = new KeyctlWrapper(keyring, keytype);
    const keyid = await keyctl.addKey(name, data);
    return await Key.createInstance(keyid, keyring, keytype);
  }

  async update(data: string) {
    await this._keyctl.updateKey(this.id, data);
    await this._loadKey(this.id);
  }

  async delete() {
    await this._keyctl.removeKey(this.id);
  }

  toString(): string {
    return `<${this.constructor.name}(${this.id}, '${this.name}', '${this.data}')>`;
  }
}

export { Key };
