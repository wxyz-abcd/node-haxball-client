import child_process from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import stream from 'node:stream';

import fsp from 'node:fs/promises';
import { deleteSync } from 'del';
import semver from 'semver';
import axios from 'axios';
import AdmZip from 'adm-zip';

let platform = process.platform;
platform = /^win/.test(platform) ? 'win' : /^darwin/.test(platform) ? 'mac' : 'linux' + (process.arch == 'ia32' ? '32' : '64');

/**
 * @typedef {object} Platform
 * @property {string} url - The URL to the package
 * @property {string} execPath - The path to the executable
 */

/**
 * @typedef {object} Packages
 * @property {Platform} win - The Windows package
 * @property {Platform} mac - The macOS package
 * @property {Platform} linux32 - The Linux 32-bit package
 * @property {Platform} linux64 - The Linux 64-bit package
 */

/**
 * @typedef {object} Manifest
 * @property {string} name - The name of the application
 * @property {string} version - The current version of the application
 * @property {string} manifestUrl - The URL to the remote manifest file
 * @property {Packages} packages - The packages for the application
 */

/**
 * @typedef {object} UpdaterOptions
 * @property {string} temporaryDirectory - The path to a directory to download the updates to and unpack them in. Defaults to [`os.tmpdir()`](https://nodejs.org/api/os.html#os_os_tmpdir)
 */

class Updater {

  #manifest = {
    name: '',
    version: '',
    manifestUrl: '',
    packages: {}
  };

  /**
   * Creates new instance of Updater.
   * 
   * @constructor
   * @param {Manifest} manifest - See the [manifest schema](https://github.com/nwutils/updater?tab=readme-ov-file#manifest-schema).
   * @param {UpdaterOptions} options - Optional
   */
  constructor(manifest, options) {
    this.#manifest = manifest;
    this.options = {
      temporaryDirectory: options && options.temporaryDirectory || os.tmpdir()
    };
  }

  /**
  * Check the latest available version of the application by requesting the manifest specified in `manifestUrl`.
  *
  * @async
  * @method
  * @param {(error: Error|null, newerVersionExists: boolean, remoteManifest: object|null) => void} cb
  * @returns {void}
  */
  checkNewVersion(cb) {
    const currentVersion = this.#manifest.version;

    fetch(this.#manifest.manifestUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const latestVersion = data.version;

        cb(null, semver.gt(latestVersion, currentVersion), data);
      })
      .catch((error) => {
        cb(error, false, null);
      });
  }

  /**
   * Downloads the new app to a temorary folder.
   * 
   * @async
   * @method
   * @param {Manifest} newManifest - see [manifest schema](https://github.com/nwutils/updater?tab=readme-ov-file#manifest-schema) below
   * @returns {Promise.<string>}
   */
  async download(newManifest, onProgress) {
    const manifest = newManifest ?? this.#manifest;
    const url = manifest.packages[platform].url;
    const filename = decodeURI(path.basename(url))
    const destinationPath = path.resolve(this.options.temporaryDirectory, filename);

    const writeStream = fs.createWriteStream(destinationPath);

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      adapter: 'http'
    });
    const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
    let receivedBytes = 0;

    if (onProgress) {
      response.data.on('data', (chunk) => {
        receivedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.round((receivedBytes * 100) / totalBytes);
          onProgress(percent);
        }
      });
    }

    await stream.promises.pipeline(response.data, writeStream);

    return destinationPath;
  }

  /**
   * Returns executed application path.
   * 
   * @returns {string}
   */
  getAppPath() {
    let appPath = {
      mac: path.join(process.cwd(), '../../..'),
      win: path.dirname(process.execPath)
    };
    appPath.linux32 = appPath.win;
    appPath.linux64 = appPath.win;
    return appPath[platform];
  }

  /**
   * Returns current application executable.
   * 
   * @returns {string}
   */
  getAppExec() {
    return this.getAppExecAt(this.getAppPath());
  }

  /**
   * Returns the application executable path, assuming the app lives at `basePath`.
   * Useful after an install/copy, when the running process's own execPath
   * still points at the old (temp) location.
   *
   * @param {string} basePath
   * @returns {string}
   */
  getAppExecAt(basePath) {
    let exec = {
      mac: '',
      win: path.basename(process.execPath),
      linux32: path.basename(process.execPath),
      linux64: path.basename(process.execPath)
    };
    return path.join(basePath, exec[platform]);
  }

  /**
     * Will unpack the `filename` in temporary folder.
     * For Windows, [unzip](https://www.mkssoftware.com/docs/man1/unzip.1.asp) is used (which is [not signed](https://github.com/nwutils/updater/issues/68)).
     *
     * @param {string} filename
     * @param {function} cb - Callback arguments: error, unpacked directory
     * @param {object} manifest
     */
  unpack(filename, cb, manifest) {
    pUnpack[platform](filename, cb, manifest, this.options.temporaryDirectory);
  }
  /**
     * Runs installer
     * @param {string} appPath
     * @param {array} args - Arguments which will be passed when running the new app
     * @param {object} options - Optional
     * @returns {function}
     */
  runInstaller(appPath, args, options) {
    return pRun[platform].apply(this, arguments);
  }
  /**
     * Installs the app (copies current application to `copyPath`)
     * @param {string} copyPath
     * @param {function} cb - Callback arguments: error
     */
  install(copyPath, cb) {
    pInstall[platform].apply(this, arguments);
  }
  /**
     * Runs the app from original app executable path.
     * @param {string} execPath
     * @param {array} args - Arguments passed to the app being ran.
     * @param {object} options - Optional. See `spawn` from nodejs docs.
     *
     * Note: if this doesn't work, try `gui.Shell.openItem(execPath)` (see [node-webkit Shell](https://github.com/rogerwang/node-webkit/wiki/Shell)).
     */
  run(execPath, args, options) {
    var arg = arguments;
    if (platform.indexOf('linux') === 0) arg[0] = path.dirname(arg[0]);
    pRun[platform].apply(this, arg);
  }
}

/**
 * @private
 * @param {string} zipPath
 * @param {string} temporaryDirectory
 * @return {string}
 */
var getZipDestinationDirectory = function (zipPath, temporaryDirectory) {
  return path.join(temporaryDirectory, path.basename(zipPath, path.extname(zipPath)));
},

  /**
   * @private
   * @param {object} manifest
   * @return {string}
   */
  getExecPathRelativeToPackage = function (manifest) {
    var execPath = manifest.packages[platform] && manifest.packages[platform].execPath;

    if (execPath) {
      return execPath;
    }
    else {
      var suffix = {
        win: '.exe',
        mac: '.app'
      };
      return manifest.name + (suffix[platform] || '');
    }
  };


var pUnpack = {
  /**
   * @private
   */
  mac: function (filename, cb, manifest, temporaryDirectory) {
    var args = arguments,
      extension = path.extname(filename),
      destination = path.join(temporaryDirectory, path.basename(filename, extension));

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }

    if (extension === ".zip") {
      child_process.exec('unzip -xo "' + filename + '" >/dev/null', { cwd: destination }, function (err) {
        if (err) {
          console.log(err);
          return cb(err);
        }
        var appPath = path.join(destination, getExecPathRelativeToPackage(manifest));
        cb(null, appPath);
      })

    }
    else if (extension === ".dmg") {
      // just in case if something was wrong during previous mount
      child_process.exec('hdiutil unmount /Volumes/' + path.basename(filename, '.dmg'), function (err) {
        // create a CDR from the DMG to bypass any steps which require user interaction
        var cdrPath = filename.replace(/.dmg$/, '.cdr');
        child_process.exec('hdiutil convert "' + filename + '" -format UDTO -o "' + cdrPath + '"', function (err) {
          child_process.exec('hdiutil attach "' + cdrPath + '" -nobrowse', function (err) {
            if (err) {
              if (err.code == 1) {
                pUnpack.mac.apply(this, args);
              }
              return cb(err);
            }
            findMountPoint(path.basename(filename, '.dmg'), cb);
          });
        });
      });

      function findMountPoint(dmg_name, callback) {
        child_process.exec('hdiutil info', function (err, stdout) {
          if (err) return callback(err);
          var results = stdout.split("\n");
          var dmgExp = new RegExp(dmg_name + '$');
          for (var i = 0, l = results.length; i < l; i++) {
            if (results[i].match(dmgExp)) {
              var mountPoint = results[i].split("\t").pop();
              var fileToRun = path.join(mountPoint, dmg_name + ".app");
              return callback(null, fileToRun);
            }
          }
          callback(Error("Mount point not found"));
        })
      }
    }
  },
  /**
   * @private
   */
  win: function (filename, cb, manifest, temporaryDirectory) {
    var destinationDirectory = getZipDestinationDirectory(filename, temporaryDirectory)
    try {
      if (fs.existsSync(destinationDirectory)) {
        deleteSync(destinationDirectory, { force: true });
      }

      const zip = new AdmZip(filename);
      zip.extractAllTo(destinationDirectory, true);

      const execPath = path.join(destinationDirectory, getExecPathRelativeToPackage(manifest));
      cb(null, execPath);
    } catch (err) {
      cb(err);
    }
  },
  /**
   * @private
   */
  linux32: function (filename, cb, manifest, temporaryDirectory) {
    //filename fix
    child_process.exec('tar -zxvf "' + filename + '" >/dev/null', { cwd: temporaryDirectory }, function (err) {
      if (err) {
        console.log(err);
        return cb(err);
      }
      cb(null, path.join(temporaryDirectory, getExecPathRelativeToPackage(manifest)));
    })
  }
};
pUnpack.linux64 = pUnpack.linux32;



var pRun = {
  /**
   * @private
   */
  mac: function (appPath, args, options, cb) {
    //spawn
    if (args && args.length) {
      args = [appPath].concat('--args', args);
    } else {
      args = [appPath];
    }
    return run('open', args, options, cb);
  },
  /**
   * @private
   */
  win: function (appPath, args, options, cb) {
    // Windows-specific: retry on EBUSY, since this is commonly called
    // right after the exe was freshly copied by install().
    return runWithRetry(appPath, args, options, cb);
  },
  /**
   * @private
   */
  linux32: function (appPath, args, options, cb) {
    var appExec = path.join(appPath, path.basename(this.getAppExec()));
    fs.chmodSync(appExec, '0o755')
    if (!options) options = {};
    options.cwd = appPath;
    return run(appPath + "/" + path.basename(this.getAppExec()), args, options, cb);
  }
};

pRun.linux64 = pRun.linux32;

/**
 * @private
 */
function run(path, args, options, cb) {
  var opts = {
    detached: true
  };
  for (var key in options) {
    opts[key] = options[key];
  }

  // On Windows, spawn() can throw *synchronously* (instead of emitting
  // 'error') for errors like EBUSY/EACCES, e.g. right after a file was
  // just copied and is briefly locked by the OS/AV. Catch that too.
  var sp;
  try {
    sp = child_process.spawn(path, args, opts);
  } catch (err) {
    if (cb) cb(err);
    return null;
  }

  if (cb) {
    var called = false;
    sp.once('error', function (err) {
      if (called) return;
      called = true;
      cb(err);
    });
    // 'spawn' fires once the child process has actually started.
    sp.once('spawn', function () {
      if (called) return;
      called = true;
      cb(null, sp);
    });
  }

  sp.unref();
  return sp;
}

/**
 * Same as `run`, but retries on transient "file is busy" errors
 * (EBUSY/ETXTBSY), which commonly happen on Windows right after a
 * freshly-copied executable is spawned — the OS or an antivirus's
 * real-time scan of the new, unsigned binary can hold a lock on it
 * for several seconds before releasing it.
 *
 * Uses exponential backoff so it resolves quickly on fast machines
 * but still tolerates slow ones: starts at ~250ms between attempts,
 * grows up to a 2s cap, and keeps trying for up to `maxWaitMs`
 * (default 20s) of total elapsed wait time before giving up.
 *
 * @private
 */
function runWithRetry(path, args, options, cb, retryOpts) {
  retryOpts = retryOpts || {};
  var maxWaitMs = retryOpts.maxWaitMs !== undefined ? retryOpts.maxWaitMs : 20000;
  var delayMs = retryOpts.delayMs !== undefined ? retryOpts.delayMs : 250;
  var maxDelayMs = retryOpts.maxDelayMs !== undefined ? retryOpts.maxDelayMs : 2000;
  var elapsedMs = retryOpts.elapsedMs !== undefined ? retryOpts.elapsedMs : 0;

  run(path, args, options, function (err, sp) {
    if (err) {
      if ((err.code === 'EBUSY' || err.code === 'ETXTBSY') && elapsedMs < maxWaitMs) {
        setTimeout(function () {
          runWithRetry(path, args, options, cb, {
            maxWaitMs: maxWaitMs,
            delayMs: Math.min(Math.round(delayMs * 1.4), maxDelayMs),
            maxDelayMs: maxDelayMs,
            elapsedMs: elapsedMs + delayMs
          });
        }, delayMs);
        return;
      }
      if (cb) cb(err);
      return;
    }
    if (cb) cb(null, sp);
  });
}

/**
 * @private
 * Recursively copies `from` into `to`, resolving only once every file has
 * actually finished being written to disk (unlike the old `ncp`-based
 * implementation, which could invoke its callback before all copies
 * completed on directories with many files).
 *
 * @param {string} from
 * @param {string} to
 * @param {function} cb - Callback arguments: error
 */
function copyAppDir(from, to, cb) {
  fsp.cp(from, to, { recursive: true, force: true, errorOnExist: false })
    .then(() => cb())
    .catch((err) => cb(err));
}

var pInstall = {
  /**
   * @private
   */
  mac: function (to, cb) {
    copyAppDir(this.getAppPath(), to, cb);
  },
  /**
   * @private
   */
  win: function (to, cb) {
    var self = this;
    var errCounter = 50;
    deleteApp(appDeleted);

    function appDeleted(err) {
      if (err) {
        errCounter--;
        if (errCounter > 0) {
          setTimeout(function () {
            deleteApp(appDeleted);
          }, 100);
        } else {
          return cb(err);
        }
      }
      else {
        copyAppDir(self.getAppPath(), to, appCopied);
      }
    }
    function deleteApp(cb) {
      try {
        deleteSync(to + '/**/*', { force: true });
        cb(null);
      } catch (err) {
        cb(err);
      }
    }
    function appCopied(err) {
      if (err) {
        setTimeout(deleteApp, 100, appDeleted);
        return
      }
      cb();
    }
  },
  /**
   * @private
   */
  linux32: function (to, cb) {
    copyAppDir(this.getAppPath(), to, cb);
  }
};
pInstall.linux64 = pInstall.linux32;

export default Updater;