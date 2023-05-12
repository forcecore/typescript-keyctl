class KeyctlWrapperException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyctlWrapperException";
  }

  static getKeyDesc(keyid: string, keyname: string) {
    if (keyid && keyname) {
      return `('${keyid}' / '${keyname}')`;
    } else if (keyid) {
      return `('${keyid}')`;
    } else if (keyname) {
      return `('${keyname}')`;
    } else {
      return "(undef)";
    }
  }
}

class KeyNotExistError extends KeyctlWrapperException {
  constructor(message: string = "", keyid: string = "", keyname: string = "") {
    if (!message) {
      message = `Key ${KeyctlWrapperException.getKeyDesc(
        keyid,
        keyname
      )} does not exit in kernel keyring.`;
    }
    super(message);
    this.name = "KeyNotExistError";
  }
}

class KeyAlreadyExistError extends KeyctlWrapperException {
  constructor(message: string = "", keyid: string = "", keyname: string = "") {
    if (!message) {
      message = `Key ${KeyctlWrapperException.getKeyDesc(
        keyid,
        keyname
      )} already exists in kernel keyring.`;
    }
    super(message);
    this.name = "KeyAlreadyExistError";
  }
}

class KeyctlOperationError extends KeyctlWrapperException {
  constructor(
    message: string = "",
    keyid: string = "",
    keyname: string = "",
    errmsg: string = ""
  ) {
    if (!message) {
      message = `Operation on key ${KeyctlWrapperException.getKeyDesc(
        keyid,
        keyname
      )} failed. ErrorMsg:${errmsg}`;
    }
    super(message);
    this.name = "KeyctlOperationError";
  }
}

export { KeyNotExistError, KeyAlreadyExistError, KeyctlOperationError };
