'use strict';

// https://github.com/mozilla/shield-studies-addon-utils version 4.0.0

/*
TODO glind survey / urls & query args
TODO glind publish as v4
*/
const EXPORTED_SYMBOLS = ['studyUtils'];

const UTILS_VERSION = '4.0.0'
const PACKET_VERSION = 3;

const {utils: Cu} = Components;
Cu.import('resource://gre/modules/AddonManager.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.importGlobalProperties(['URL', 'crypto', 'URLSearchParams']);

let log;

// telemetry utils
const CID = Cu.import('resource://gre/modules/ClientID.jsm', null);
const { TelemetryController } = Cu.import('resource://gre/modules/TelemetryController.jsm', null);
const { TelemetryEnvironment } = Cu.import('resource://gre/modules/TelemetryEnvironment.jsm', null);

async function getTelemetryId() {
  const id = TelemetryController.clientID;
  /* istanbul ignore next */
  if (id === undefined) {
    return await CID.ClientIDImpl._doLoadClientID();
  }
  return id;
}

const schemas = require('./schemas.js');
const Ajv = require('ajv/dist/ajv.min.js');
const ajv = new Ajv();

var jsonschema = {
  validate(data, schema) {
    var valid = ajv.validate(schema, data);
    return {valid, errors:  ajv.errors || []};
  },
  validateOrThrow(data, schema) {
    const valid = ajv.validate(schema, data);
    if (!valid) { throw new Error(JSON.stringify((ajv.errors))); }
    return true;
  },
};

/**
 * Merges all the properties of all arguments into first argument. If two or
 * more argument objects have own properties with the same name, the property
 * is overridden, with precedence from right to left, implying, that properties
 * of the object on the left are overridden by a same named property of the
 * object on the right.
 *
 * Any argument given with 'falsy' value - commonly `null` and `undefined` in
 * case of objects - are skipped.
 *
 * @examples
 *    var a = { bar: 0, a: 'a' }
 *    var b = merge(a, { foo: 'foo', bar: 1 }, { foo: 'bar', name: 'b' });
 *    b === a   // true
 *    b.a       // 'a'
 *    b.foo     // 'bar'
 *    b.bar     // 1
 *    b.name    // 'b'
 *
 * from addon-sdk:sdk/util/object.js
 */
function merge(source) {
  // get object's own property Symbols and/or Names, including nonEnumerables by default
  function getOwnPropertyIdentifiers(object, options = { names: true, symbols: true, nonEnumerables: true }) {
    const symbols = !options.symbols ? [] :
      Object.getOwnPropertySymbols(object);

    // eslint-disable-next-line
    const names = !options.names ? [] :
      options.nonEnumerables ? Object.getOwnPropertyNames(object) :
        Object.keys(object);
    return [...names, ...symbols];
  }
  const descriptor = {};

  // `Boolean` converts the first parameter to a boolean value. Any object is
  // converted to `true` where `null` and `undefined` becames `false`. Therefore
  // the `filter` method will keep only objects that are defined and not null.
  Array.slice(arguments, 1).filter(Boolean).forEach(function onEach(properties) {
    getOwnPropertyIdentifiers(properties).forEach(function(name) {
      descriptor[name] = Object.getOwnPropertyDescriptor(properties, name);
    });
  });
  return Object.defineProperties(source, descriptor);
}

function mergeQueryArgs(url, ...args) {
  /* currently left to right*/
  // TODO, glind, decide order of merge here
  const U = new URL(url);
  let q = U.search || '?';
  q = new URLSearchParams(q);

  const merged = merge({}, ...args);

  // get user info.
  Object.keys(merged).forEach((k) => {
    log.debug(q.get(k), k, merged[k]);
    q.set(k, merged[k]);
  });

  U.search = q.toString();
  return U.toString();
}

// sampling utils
async function sha256(message) {
  const msgBuffer = new TextEncoder('utf-8').encode(message); // encode as UTF-8
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert ArrayBuffer to Array
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join(''); // convert bytes to hex string
  return hashHex;
}

function cumsum(arr) {
  return arr.reduce(function(r, c, i) { r.push((r[i - 1] || 0) + c); return r; }, [] );
}

function chooseWeighted(weightedVariations, fraction = Math.random()) {
  /*
   weightedVaiations, list of:
   {
    name: string of any length
    weight: float >= 0
   }
  */
  jsonschema.validateOrThrow(weightedVariations, schemas.weightedVariations);

  var weights = weightedVariations.map(x => x.weight || 1);
  const partial = cumsum(weights);
  const total = weights.reduce((a, b) => a + b);
  for (let ii = 0; ii < weightedVariations.length; ii++) {
    if (fraction <= partial[ii] / total) {
      return weightedVariations[ii];
    }
  }
  return null;
}

async function hashFraction(saltedString, bits = 12) {
  const hash = await sha256(saltedString);
  return parseInt(hash.substr(0, bits), 16) / Math.pow(16, bits);
}

class StudyUtils {
  constructor(config) {
    // TODO glind Answer: no.  see if you can merge the construtor and setup and export the class, rather than a singleton
    this.respondToWebExtensionMessage = function({shield, msg, data}, sender, sendResponse) {
      // shield: boolean, if present, request is for shield
      if (!shield) return true;
      const allowedMethods = ['endStudy', 'telemetry', 'info'];
      if (!allowedMethods.includes(msg)) {
        throw new Error(`respondToWebExtensionMessage: '${msg}' is not in allowed studyUtils methods: ${allowedMethods}`);
      }
      // handle async
      Promise.resolve(this[msg](data)).then(
        function(ans) {
          log.debug('respondingTo', msg, ans);
          sendResponse(ans);
        },
        // function error eventually
      );
      return true;
    }.bind(this);

    // expose the sample utilities
    this.sample = {
      sha256,
      cumsum,
      chooseWeighted,
      hashFraction,
    };
    // expose schemas
    this.schemas = schemas;

    // expose validation methods
    this.jsonschema = jsonschema;
  }
  throwIfNotSetup(name = 'unknown') {
    if (!this._isSetup) throw new Error(name + ": this method can't be used until `setup` is called");
  }
  setup(config) {
    log = createLog('shield-study-utils', config.log.studyUtils.level);

    log.debug('setting up!');
    jsonschema.validateOrThrow(config, schemas.studySetup);

    this.config = config;
    this._isSetup = true;
    return this;
  }
  reset() {
    this.config = {};
    delete this._variation;
    this._isSetup = false;
  }
  async openTab(url, params = {}) {
    this.throwIfNotSetup('openTab');
    log.debug(url, params);
    log.debug('opening this formatted tab', url, params);
    if (!Services.wm.getMostRecentWindow('navigator:browser').gBrowser) {
      // Wait for the window to be opened
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    Services.wm.getMostRecentWindow('navigator:browser').gBrowser.addTab(url, params);
  }
  async getTelemetryId() {
    return await getTelemetryId();
  }
  setVariation(variation) {
    this.throwIfNotSetup('setVariation');
    this._variation = variation;
    return this;
  }
  getVariation() {
    this.throwIfNotSetup('getvariation');
    return this._variation;
  }
  getShieldId() {
    const key = 'extensions.shield-recipe-client.user_id';
    return Services.prefs.getCharPref(key, '');
  }
  info() {
    log.debug('getting info');
    this.throwIfNotSetup('info');
    return {
      studyName: this.config.study.studyName,
      addon: this.config.addon,
      variation: this.getVariation(),
      shieldId: this.getShieldId(),
    };
  }
  // TODO glind, maybe this is getter / setter?
  get telemetryConfig() {
    this.throwIfNotSetup('telemetryConfig');
    return this.config.study.telemetry;
  }
  firstSeen() {
    log.debug(`firstSeen`);
    this.throwIfNotSetup('firstSeen');
    this._telemetry({study_state: 'enter'}, 'shield-study');
  }
  setActive() {
    this.throwIfNotSetup('setActive');
    const info = this.info();
    log.debug('marking TelemetryEnvironment', info.studyName, info.variation.name);
    TelemetryEnvironment.setExperimentActive(info.studyName, info.variation.name);
  }
  unsetActive() {
    this.throwIfNotSetup('unsetActive');
    const info = this.info();
    log.debug('unmarking TelemetryEnvironment', info.studyName, info.variation.name);
    TelemetryEnvironment.setExperimentInactive(info.studyName);
  }
  surveyUrl(urlTemplate) {
    // TODO glind, what is this?
    this.throwIfNotSetup('surveyUrl');
    log.debug(`survey: ${urlTemplate} filled with args`);
  }
  uninstall(id) {
    this.throwIfNotSetup('uninstall');
    if (!id) id = this.info().addon.id;
    log.debug(`about to uninstall ${id}`);
    AddonManager.getAddonByID(id, addon => addon.uninstall());
  }
  async startup({reason}) {
    this.throwIfNotSetup('startup');
    log.debug(`startup ${reason}`);
    this.setActive();
    if (reason === REASONS.ADDON_INSTALL) {
      this._telemetry({study_state: 'installed'}, 'shield-study');
    }
  }
  async endStudy({reason, fullname}) {
    this.throwIfNotSetup('endStudy');
    if (this._isEnding) {
      log.debug('endStudy, already ending!');
      return;
    }
    this._isEnding = true;
    log.debug(`endStudy ${reason}`);
    this.unsetActive();
    // TODO glind, think about reason vs fullname
    // TODO glind, think about race conditions for endings, ensure only one exit
    const ending = this.config.study.endings[reason];
    if (ending) {
      const {baseUrl, exactUrl} = ending;
      if (exactUrl) {
        this.openTab(exactUrl);
      } else if (baseUrl) {
        const qa = await this.endingQueryArgs();
        qa.reason = reason;
        qa.fullreason = fullname;
        const fullUrl = mergeQueryArgs(baseUrl, qa);
        log.debug(baseUrl, fullUrl);
        this.openTab(fullUrl);
      }
    }
    switch (reason) {
      case 'ineligible':
      case 'expired':
      case 'user-disable':
      case 'ended-positive':
      case 'ended-neutral':
      case 'ended-negative':
        this._telemetry({study_state: reason, fullname}, 'shield-study');
        break;
      default:
        this._telemetry({study_state: 'ended-neutral', study_state_fullname: reason}, 'shield-study');
        // unless we know better TODO grl
    }
    // these are all exits
    this._telemetry({study_state: 'exit'}, 'shield-study');
    this.uninstall(); // TODO glind. should be controllable by arg?
  }

  async endingQueryArgs() {
    // TODO glind, make this back breaking!
    this.throwIfNotSetup('endingQueryArgs');
    const info = this.info();
    const who = await getTelemetryId();
    const queryArgs = {
      shield: PACKET_VERSION,
      study: info.studyName,
      variation: info.variation.name,
      updateChannel: Services.appinfo.defaultUpdateChannel,
      fxVersion: Services.appinfo.version,
      addon: info.addon.version, // addon version
      who, // telemetry clientId
    };
    queryArgs.testing = Number(!this.telemetryConfig.removeTestingFlag);
    return queryArgs;
  }

  async _telemetry(data, bucket = 'shield-study-addon') {
    log.debug(`telemetry in:  ${bucket} ${JSON.stringify(data)}`);
    this.throwIfNotSetup('_telemetry');
    const info = this.info();
    const payload = {
      version:        PACKET_VERSION,
      study_name:     info.studyName,
      branch:         info.variation.name,
      addon_version:  info.addon.version,
      shield_version: UTILS_VERSION,
      type:           bucket,
      data,
      testing:        !this.telemetryConfig.removeTestingFlag,
    };

    let validation;
    /* istanbul ignore next */
    try {
      validation = jsonschema.validate(payload, schemas[bucket]);
    } catch (err) {
      // if validation broke, GIVE UP.
      log.error(err);
      return false;
    }

    if (validation.errors.length) {
      const errorReport = {
        'error_id': 'jsonschema-validation',
        'error_source': 'addon',
        'severity': 'fatal',
        'message': JSON.stringify(validation.errors),
      };
      if (bucket === 'shield-study-error') {
        // log: if it's a warn or error, it breaks jpm test
        log.warn('cannot validate shield-study-error', data, bucket);
        return false; // just die, maybe should have a super escape hatch?
      }
      return this.telemetryError(errorReport);
    }
    // emit(TelemetryWatcher, 'telemetry', [bucket, payload]);
    log.debug(`telemetry: ${JSON.stringify(payload)}`);
    // FIXME marcrowo: addClientId makes the ping not appear in test?
    // seems like a problem with Telemetry, not the shield-study-utils library
    const telOptions = {addClientId: true, addEnvironment: true};
    if (!this.telemetryConfig.send) {
      log.debug('NOT sending.  `telemetryConfig.send` is false');
      return false;
    }
    return TelemetryController.submitExternalPing(bucket, payload, telOptions);
  }

  // telemetry from addon, mostly from webExtension message.
  async telemetry(data) {
    log.debug(`telemetry ${JSON.stringify(data)}`);
    const toSubmit = {
      attributes: data,
    };
    // lets check early, and respond with something useful?
    return this._telemetry(toSubmit, 'shield-study-addon');
  }
  telemetryError(errorReport) {
    return this._telemetry(errorReport, 'shield-study-error');
  }
  setLoggingLevel(descriptor) {
    log.level = Log.Level[descriptor];
  }
}

function createLog(name, levelWord) {
  Cu.import('resource://gre/modules/Log.jsm');
  var L = Log.repository.getLogger(name);
  L.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));
  L.level = Log.Level[levelWord] || Log.Level.Debug; // should be a config / pref
  L.debug('log made', name, levelWord, Log.Level[levelWord]);
  return L;
}
/** addon state change reasons */
const REASONS = {
  APP_STARTUP: 1,      // The application is starting up.
  APP_SHUTDOWN: 2,     // The application is shutting down.
  ADDON_ENABLE: 3,     // The add-on is being enabled.
  ADDON_DISABLE: 4,    // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL: 5,    // The add-on is being installed.
  ADDON_UNINSTALL: 6,  // The add-on is being uninstalled.
  ADDON_UPGRADE: 7,    // The add-on is being upgraded.
  ADDON_DOWNGRADE: 8,  // The add-on is being downgraded.
};
for (const r in REASONS) { REASONS[REASONS[r]] = r; }

// Actually create the singleton.
var studyUtils = new StudyUtils();

// to make this work with webpack!
this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
this.studyUtils = studyUtils;
