/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(config|EXPORTED_SYMBOLS)" }]*/
const EXPORTED_SYMBOLS = ["config"];

const config = {
  addon: {
    id: "@min-vid-study",
    version: "0.4.5-study"
  },
  study: {
    studyName: "min-vid-study", // no spaces, for all the reasons
    variation: {
      name: "non-txp",
    },
    /** **endings**
     * - keys indicate the 'endStudy' even that opens these.
     * - urls should be static (data) or external, because they have to
     *   survive uninstall
     * - If there is no key for an endStudy reason, no url will open.
     * - usually surveys, orientations, explanations
     */
    endings: {
      expired: {
        baseUrl: "https://qsurvey.mozilla.com/s3/min-vid-study"
      },
      "user-disable": {
        baseUrl: "https://qsurvey.mozilla.com/s3/min-vid-study"
      }
    },
    telemetry: {
      send: true, // assumed false. Actually send pings?
      removeTestingFlag: true  // Marks pings as testing, set true for actual release
      // TODO "onInvalid": "throw"  // invalid packet for schema?  throw||log
    }
  },
  async isEligible() {
    // get whatever prefs, addons, telemetry, anything!
    // Cu.import can see 'firefox things', but not package things.
    // In order to import addon libraries, use chrome.manifest and "resource://" in order
    // to get the correct file location. Then it is necessary to use
    // XPCOMUtils.defineLazyModuleGetter() to import the library.
    return true;
  },
  addon: {
    id: '@min-vid-study',
    version: '0.4.5-study'
  },
  // addon-specific modules to load/unload during `startup`, `shutdown`
  modules: [
    // can use ${slug} here for example
  ],
  // sets the logging for BOTH the bootstrap file AND shield-study-utils
  log: {
    // Fatal: 70, Error: 60, Warn: 50, Info: 40, Config: 30, Debug: 20, Trace: 10, All: -1,
    bootstrap:  {
      level: "Warn",
    },
    studyUtils:  {
      level: "Warn",
    }
  }
};
