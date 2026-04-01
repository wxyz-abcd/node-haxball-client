// Singleton to persist FFI functions and avoid expensive reloads
function getWin32API() {
    if (typeof window === 'undefined' || typeof window.nw === 'undefined') return null;
    
    if (!window.__haxball_ffi) {
        try {
            const { User32, ffi, Def } = window.require('win32-api');
            // Load basic functions
            const user32 = User32.load(['ChangeDisplaySettingsExW']);
            const dlly = ffi.load('user32.dll');
            
            // Define EnumDisplaySettingsW manually using LPVOID for the buffer
            // This prevents registering complex structures in Koffi (preventing Duplicate type errors)
            let EnumDisplaySettingsW;
            try {
               EnumDisplaySettingsW = dlly.func('EnumDisplaySettingsW', Def.BOOL, [Def.WString, Def.DWORD, Def.LPVOID]);
            } catch (e) {
               EnumDisplaySettingsW = dlly.EnumDisplaySettingsW;
            }

            window.__haxball_ffi = { user32, ffi, Def, EnumDisplaySettingsW };
            console.log("[Resolution] FFI Local Singleton Initialized (Manual Mode)");
        } catch (err) {
            console.error("[Resolution] FFI Initialization failed:", err);
            return null;
        }
    }
    return window.__haxball_ffi;
}

/**
 * DEVMODEW Layout (Manual offsets for maximum stability):
 * dmSize: Offset 36 (2 bytes / WORD)
 * dmFields: Offset 40 (4 bytes / DWORD)
 * dmPelsWidth: Offset 172 (4 bytes / DWORD)
 * dmPelsHeight: Offset 176 (4 bytes / DWORD)
 * dmDisplayFrequency: Offset 184 (DWORD)
 * dmDisplayFixedOutput: Offset 188 (DWORD)
 */
const DM_BITSPERPEL = 0x00040000;
const DM_PELSWIDTH = 0x00080000;
const DM_PELSHEIGHT = 0x00100000;
const DM_DISPLAYFREQUENCY = 0x00400000;
const DM_DISPLAYFIXEDOUTPUT = 0x20000000;
const DMDFO_STRETCH = 1;
const CDS_FULLSCREEN = 4;
const CDS_TEST = 2;
function createDevModeBuffer() {
    const buf = Buffer.alloc(220); // Standard DEVMODEW size
    buf.writeUInt16LE(220, 36);    // Initialize dmSize
    return buf;
}

export async function setActualDisplayResolution(width, height, sync = false) {
  const isNw = typeof window.nw !== 'undefined';
  if (!isNw) return false;

  const process = window.require('process');
  const child_process = window.require('child_process');

  if (process.platform === 'win32') {
    const api = getWin32API();
    if (!api) throw new Error("Native API not available");

    try {
      const { user32, EnumDisplaySettingsW } = api;
      const dm = createDevModeBuffer();

      // 1. Verify current resolution (ENUM_CURRENT_SETTINGS = -1)
      if (EnumDisplaySettingsW(null, -1, dm)) {
        const currentWidth = dm.readUInt32LE(172);
        const currentHeight = dm.readUInt32LE(176);
        if (currentWidth === width && currentHeight === height) {
          console.log('[Resolution] Already at target resolution');
          return 'OK:ALREADY';
        }
      }

      // 2. Search for the maximum hertz (we still prefer the fastest native mode)
      let maxHz = 60;
      let i = 0;
      const tempDm = createDevModeBuffer();
      while (api.EnumDisplaySettingsW(null, i, tempDm)) {
        const w = tempDm.readUInt32LE(172);
        const h = tempDm.readUInt32LE(176);
        const hz = tempDm.readUInt32LE(184);

        if (w === width && h === height) {
          if (hz >= maxHz) maxHz = hz;
        }
        i++;
      }

      // 3. Create final buffer using the REGISTRY MODE (NATIVE) as a template
      // This inherits SpecVersion, BitDepth, and original system flags
      const finalDm = createDevModeBuffer();
      if (!api.EnumDisplaySettingsW(null, -2, finalDm)) {
        throw new Error("Could not capture native display settings template");
      }

      // Auto-Restore Verification (Native Detection)
      // If the requested resolution is the native registry one, we restore instead of changing (more reliable)
      const regWidth = finalDm.readUInt32LE(172);
      const regHeight = finalDm.readUInt32LE(176);
      if (regWidth === width && regHeight === height) {
        console.log(`[Resolution] Auto-Detect: ${width}x${height} is the native registry resolution. Using Restore instead.`);
        return restoreActualDisplayResolution(sync);
      }

      // 4. Apply changes to the template (for non-native resolutions)
      finalDm.writeUInt32LE(width, 172);  // dmPelsWidth
      finalDm.writeUInt32LE(height, 176); // dmPelsHeight
      finalDm.writeUInt32LE(maxHz, 184);  // dmDisplayFrequency
      
      // Ensure that the necessary fields are active
      let fields = finalDm.readUInt32LE(40); // dmFields
      fields |= DM_PELSWIDTH | DM_PELSHEIGHT | DM_DISPLAYFREQUENCY;
      
      // Attempt to force Stretch if possible
      finalDm.writeUInt32LE(DMDFO_STRETCH, 188); // dmDisplayFixedOutput
      finalDm.writeUInt32LE(fields | DM_DISPLAYFIXEDOUTPUT, 40);

      const testResult = api.user32.ChangeDisplaySettingsExW(null, finalDm, 0, CDS_TEST, 0);
      
      // If the driver rejects the Stretching flag (-2), we remove it and retry with basic Resolution
      if (testResult !== 0) {
        console.warn(`[Resolution] Driver rejected DMDFO_STRETCH (Code: ${testResult}). Fallback to basic mode.`);
        finalDm.writeUInt32LE(fields, 40); // Restore fields without the FixedOutput flag
      }

      const result = api.user32.ChangeDisplaySettingsExW(null, finalDm, 0, CDS_FULLSCREEN, 0);
      if (result === 0) {
        console.log(`[Resolution] Success! Applied ${width}x${height} at ${maxHz}Hz using Desktop Template`);
        return 'OK:APPLIED';
      } else {
        throw new Error(`Failed to apply mode (Result: ${result})`);
      }
    } catch (err) {
      console.error("[Resolution] Native Windows Error:", err.message);
      throw err;
    }
  } else if (process.platform === 'linux') {
    return new Promise((resolve, reject) => {
      child_process.exec('xrandr | grep " connected primary"', (error, stdout) => {
        const outputName = stdout.split(' ')[0] || 'eDP-1';
        const cmd = `xrandr --output ${outputName} --mode ${width}x${height}`;
        child_process.exec(cmd, (err) => {
          if (err) return reject(err);
          resolve('OK:APPLIED');
        });
      });
    });
  }
  return false;
}

export function setActualDisplayResolutionSync(width, height) {
  setActualDisplayResolution(width, height, true).catch(() => null);
}

export async function getSupportedResolutions() {
  const isNw = typeof window.nw !== 'undefined';
  if (!isNw) return [];

  const process = window.require('process');
  const child_process = window.require('child_process');

  if (process.platform === 'win32') {
    const api = getWin32API();
    if (!api) return [];

    try {
      const { EnumDisplaySettingsW } = api;
      const dm = createDevModeBuffer();

      const resolutions = new Set();
      let i = 0;
      while (EnumDisplaySettingsW(null, i, dm)) {
        const w = dm.readUInt32LE(172);
        const h = dm.readUInt32LE(176);
        resolutions.add(`${w}x${h}`);
        i++;
      }
      return Array.from(resolutions);
    } catch (err) {
      console.error("[Resolution] Failed to get native resolutions:", err);
      return [];
    }
  } else if (process.platform === 'linux') {
    return new Promise((resolve) => {
      child_process.exec('xrandr', (error, stdout) => {
        if (error) return resolve([]);
        const resolutions = new Set();
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const match = line.match(/^\s+(\d+x\d+)/);
          if (match) resolutions.add(match[1]);
        });
        resolve(Array.from(resolutions));
      });
    });
  }
  return [];
}

export async function restoreActualDisplayResolution(sync = false) {
  const isNw = typeof window.nw !== 'undefined';
  if (!isNw) return false;

  const process = window.require('process');
  const child_process = window.require('child_process');

  if (process.platform === 'win32') {
    try {
      const { user32 } = getWin32API();
      // CDS_RESET = 0, passing 0 (NULL) as DEVMODE restores the registry settings
      user32.ChangeDisplaySettingsExW(null, 0, 0, 0, 0);
      return true;
    } catch (err) {
      console.error("[Resolution] Restore Error:", err);
      return false;
    }
  } else if (process.platform === 'linux') {
    return new Promise((resolve) => {
      child_process.exec('xrandr --auto', () => resolve(true));
    });
  }

  return false;
}

export function restoreActualDisplayResolutionSync() {
  restoreActualDisplayResolution(true).catch(() => null);
}
