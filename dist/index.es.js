var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import Validator from "validatorjs";
class Errors {
  constructor(errors = {}) {
    this.record(errors);
  }
  all() {
    return this.errors;
  }
  has(field) {
    let hasError = this.errors.hasOwnProperty(field);
    if (!hasError) {
      const errors = Object.keys(this.errors).filter((e) => e.startsWith(`${field}.`) || e.startsWith(`${field}[`));
      hasError = errors.length > 0;
    }
    return hasError;
  }
  first(field) {
    return this.get(field)[0];
  }
  get(field) {
    return this.errors[field] || [];
  }
  any(keys = []) {
    if (keys.length === 0) {
      return Object.keys(this.errors).length > 0;
    }
    let errors = {};
    keys.forEach((key) => errors[key] = this.get(key));
    return errors;
  }
  record(errors = {}) {
    this.errors = errors;
  }
  clear(field) {
    if (!field) {
      this.errors = {};
      return;
    }
    let errors = Object.assign({}, this.errors);
    Object.keys(errors).filter((e) => e === field || e.startsWith(`${field}.`) || e.startsWith(`${field}[`)).forEach((e) => delete errors[e]);
    this.errors = errors;
  }
}
function isArray(object) {
  return Object.prototype.toString.call(object) === "[object Array]";
}
function isFile(object) {
  return object instanceof File || object instanceof FileList;
}
function merge(a, b) {
  for (const key in b) {
    a[key] = cloneDeep(b[key]);
  }
}
function cloneDeep(object) {
  if (object === null) {
    return null;
  }
  if (isFile(object)) {
    return object;
  }
  if (Array.isArray(object)) {
    const clone = [];
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        clone[key] = cloneDeep(object[key]);
      }
    }
    return clone;
  }
  if (typeof object === "object") {
    const clone = {};
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        clone[key] = cloneDeep(object[key]);
      }
    }
    return clone;
  }
  return object;
}
function objectToFormData(object, formData = new FormData(), parent = null) {
  if (object === null || object === "undefined" || object.length === 0) {
    return formData.append(parent, object);
  }
  for (const property in object) {
    if (object.hasOwnProperty(property)) {
      appendToFormData(formData, getKey(parent, property), object[property]);
    }
  }
  return formData;
}
function getKey(parent, property) {
  return parent ? parent + "[" + property + "]" : property;
}
function appendToFormData(formData, key, value) {
  if (value instanceof Date) {
    return formData.append(key, value.toISOString());
  }
  if (value instanceof File) {
    return formData.append(key, value, value.name);
  }
  if (typeof value === "boolean") {
    return formData.append(key, value ? "1" : "0");
  }
  if (value === null) {
    return formData.append(key, "");
  }
  if (typeof value !== "object") {
    return formData.append(key, value);
  }
  objectToFormData(value, formData, key);
}
const reservedFieldNames = [
  "__http",
  "__options",
  "__validateRequestType",
  "clear",
  "data",
  "delete",
  "errors",
  "getError",
  "getErrors",
  "hasError",
  "initial",
  "onFail",
  "only",
  "onSuccess",
  "patch",
  "populate",
  "post",
  "processing",
  "successful",
  "put",
  "reset",
  "submit",
  "withData",
  "withErrors",
  "withOptions"
];
function guardAgainstReservedFieldName(fieldName) {
  if (reservedFieldNames.indexOf(fieldName) !== -1) {
    throw new Error(`Field name ${fieldName} isn't allowed to be used in a Form or Errors instance.`);
  }
}
class Form {
  constructor(data = {}, options = {}) {
    __publicField(this, "__options");
    __publicField(this, "processing");
    __publicField(this, "successful");
    __publicField(this, "errors");
    __publicField(this, "initial");
    this.processing = false;
    this.successful = false;
    this.withData(data).withOptions(options).withErrors({});
  }
  withData(data) {
    if (isArray(data)) {
      data = data.reduce((carry, element) => {
        carry[element] = "";
        return carry;
      }, {});
    }
    this.setInitialValues(data);
    this.errors = new Errors();
    this.processing = false;
    this.successful = false;
    for (const field in data) {
      guardAgainstReservedFieldName(field);
      this[field] = data[field];
    }
    return this;
  }
  withErrors(errors) {
    this.errors = new Errors(errors);
    return this;
  }
  withOptions(options) {
    this.__options = {
      resetOnSuccess: true
    };
    if (options.hasOwnProperty("resetOnSuccess")) {
      this.__options.resetOnSuccess = options.resetOnSuccess;
    }
    if (options.hasOwnProperty("onSuccess")) {
      this.onSuccess = options.onSuccess;
    }
    if (options.hasOwnProperty("onFail")) {
      this.onFail = options.onFail;
    }
    const windowAxios = typeof window === "undefined" ? false : window.axios;
    this.__http = options.http || windowAxios || axios;
    if (!this.__http) {
      throw new Error("No http library provided. Either pass an http option, or install axios.");
    }
    return this;
  }
  data() {
    const data = {};
    for (const property in this.initial) {
      data[property] = this[property];
    }
    return data;
  }
  only(fields) {
    return fields.reduce((filtered, field) => {
      filtered[field] = this[field];
      return filtered;
    }, {});
  }
  reset() {
    merge(this, this.initial);
    this.errors.clear();
  }
  setInitialValues(values) {
    this.initial = {};
    merge(this.initial, values);
  }
  populate(data) {
    Object.keys(data).forEach((field) => {
      guardAgainstReservedFieldName(field);
      if (this.hasOwnProperty(field)) {
        merge(this, { [field]: data[field] });
      }
    });
    return this;
  }
  clear() {
    for (const field in this.initial) {
      this[field] = "";
    }
    this.errors.clear();
  }
  get(url) {
    return this.submit("get", url);
  }
  post(url) {
    return this.submit("post", url);
  }
  put(url) {
    return this.submit("put", url);
  }
  patch(url) {
    return this.submit("patch", url);
  }
  delete(url) {
    return this.submit("delete", url);
  }
  submit(requestType, url) {
    this.__validateRequestType(requestType);
    this.errors.clear();
    this.processing = true;
    this.successful = false;
    return new Promise((resolve, reject) => {
      this.__http[requestType](url, this.hasFiles() ? objectToFormData(this.data()) : this.data()).then((response) => {
        this.processing = false;
        this.onSuccess(response.data);
        resolve(response.data);
      }).catch((error) => {
        this.processing = false;
        this.onFail(error);
        reject(error);
      });
    });
  }
  hasFiles() {
    for (const property in this.initial) {
      if (this.hasFilesDeep(this[property])) {
        return true;
      }
    }
    return false;
  }
  hasFilesDeep(object) {
    if (object === null) {
      return false;
    }
    if (typeof object === "object") {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          if (this.hasFilesDeep(object[key])) {
            return true;
          }
        }
      }
    }
    if (Array.isArray(object)) {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          return this.hasFilesDeep(object[key]);
        }
      }
    }
    return isFile(object);
  }
  onSuccess(data) {
    this.successful = true;
    if (this.__options.resetOnSuccess) {
      this.reset();
    }
  }
  onFail(error) {
    this.successful = false;
    if (error.response && error.response.data.errors) {
      this.errors.record(error.response.data.errors);
    }
  }
  hasError(field) {
    return this.errors.has(field);
  }
  getError(field) {
    return this.errors.first(field);
  }
  getErrors(field) {
    return this.errors.get(field);
  }
  __validateRequestType(requestType) {
    const requestTypes = ["get", "delete", "head", "post", "put", "patch"];
    if (requestTypes.indexOf(requestType) === -1) {
      throw new Error(`\`${requestType}\` is not a valid request type, must be one of: \`${requestTypes.join("`, `")}\`.`);
    }
  }
  validate(rules, customErrorMessages) {
    this.errors.clear();
    this.processing = true;
    this.successful = false;
    let customMessages = customErrorMessages || {};
    let validation = new Validator(this.data(), rules, customMessages);
    if (validation.fails()) {
      this.successful = false;
      this.withErrors(validation.errors.all());
    } else {
      this.successful = true;
    }
  }
  static create(data = {}) {
    return new Form().withData(data);
  }
}
export { Errors, Form };
