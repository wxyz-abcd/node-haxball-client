export async function setActualDisplayResolution(width, height, sync = false) {
  const promise = new Promise((resolve, reject) => {
    try {
      const isNw = typeof window.nw !== 'undefined';
      if (!isNw) return resolve(false);

      const process = window.require('process');
      const child_process = window.require('child_process');

      if (process.platform !== 'win32') {
        if (!sync) console.warn('Cambiar la resolución real de pantalla durante partida solo está soportado en Windows. (Ignorando petición debido a uso de Linux/Wayland)');
        return resolve(false);
      }

      // Script en PowerShell para invocar ChangeDisplaySettings de User32.dll
      const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ScreenRes {
    [StructLayout(LayoutKind.Sequential)]
    public struct DEVMODE {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
        public short dmSpecVersion;
        public short dmDriverVersion;
        public short dmSize;
        public short dmDriverExtra;
        public int dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public int dmDisplayOrientation;
        public int dmDisplayFixedOutput;
        public short dmColor;
        public short dmDuplex;
        public short dmYResolution;
        public short dmTTOption;
        public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmFormName;
        public short dmLogPixels;
        public int dmBitsPerPel;
        public int dmPelsWidth;
        public int dmPelsHeight;
        public int dmDisplayFlags;
        public int dmDisplayFrequency;
        public int dmICMMethod;
        public int dmICMIntent;
        public int dmMediaType;
        public int dmDitherType;
        public int dmReserved1;
        public int dmReserved2;
        public int dmPanningWidth;
        public int dmPanningHeight;
    }
    [DllImport("user32.dll")]
    public static extern int EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);
    [DllImport("user32.dll")]
    public static extern int ChangeDisplaySettings(ref DEVMODE devMode, int flags);

    public static void ChangeRes(int width, int height) {
        DEVMODE dm = new DEVMODE();
        dm.dmSize = (short)Marshal.SizeOf(typeof(DEVMODE));
        EnumDisplaySettings(null, -1, ref dm);
        
        // Si ya estamos en esa resolucion, no hacer nada
        if (dm.dmPelsWidth == width && dm.dmPelsHeight == height) {
            Console.WriteLine("OK:ALREADY");
            return;
        }
        
        dm.dmPelsWidth = width;
        dm.dmPelsHeight = height;
        dm.dmFields = 0x00080000 | 0x00100000; // DM_PELSWIDTH | DM_PELSHEIGHT

        // Test first (CDS_TEST = 2)
        int testResult = ChangeDisplaySettings(ref dm, 2);
        if (testResult != 0) {
            Console.WriteLine("FAIL:TEST:" + testResult);
            return;
        }

        int result = ChangeDisplaySettings(ref dm, 0);
        if (result == 0) {
            Console.WriteLine("OK:APPLIED");
        } else {
            Console.WriteLine("FAIL:APPLY:" + result);
        }
    }
}
"@;
[ScreenRes]::ChangeRes(${width}, ${height})
`;

      const Buffer = window.require('buffer').Buffer;
      const base64Script = Buffer.from(psScript, 'utf16le').toString('base64');
      const cmd = `powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -NoProfile -EncodedCommand ${base64Script}`;
      
      if (sync) {
        try {
          const output = child_process.execSync(cmd, { encoding: 'utf8' });
          console.log('[Resolution] Sync result:', output?.trim());
        } catch (e) {
          console.error('[Resolution] Sync error:', e.message);
        }
        resolve(true);
      } else {
        child_process.exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error("[Resolution] PowerShell error:", error.message);
            if (stderr) console.error("[Resolution] stderr:", stderr);
            return reject(new Error(`PowerShell execution failed: ${error.message}`));
          }
          const result = stdout?.toString().trim();
          if (result) {
            if (result.startsWith('FAIL')) {
              console.warn(`[Resolution] Failed to change to ${width}x${height}:`, result);
              return reject(new Error(result));
            } else {
              console.log(`[Resolution] ${width}x${height}:`, result);
            }
          }
          resolve(result || 'OK');
        });
      }
    } catch (err) {
      if (!sync) console.error("Fallo general al intentar ajustar la resolucion nativa", err);
      reject(err);
    }
  });

  if (sync) {
      // Dummy block to prevent unhandled rejections if used synchronously without await
      promise.catch(()=>null);
  }
  return promise;
}

export function setActualDisplayResolutionSync(width, height) {
    setActualDisplayResolution(width, height, true).catch(()=>null);
}

export async function getSupportedResolutions() {
  return new Promise((resolve) => {
    try {
      const isNw = typeof window.nw !== 'undefined';
      if (!isNw) return resolve([]);
      const process = window.require('process');
      const child_process = window.require('child_process');
      if (process.platform !== 'win32') return resolve([]);

      const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public class ScreenResList {
    [StructLayout(LayoutKind.Sequential)]
    public struct DEVMODE {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
        public short dmSpecVersion;
        public short dmDriverVersion;
        public short dmSize;
        public short dmDriverExtra;
        public int dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public int dmDisplayOrientation;
        public int dmDisplayFixedOutput;
        public short dmColor;
        public short dmDuplex;
        public short dmYResolution;
        public short dmTTOption;
        public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmFormName;
        public short dmLogPixels;
        public int dmBitsPerPel;
        public int dmPelsWidth;
        public int dmPelsHeight;
        public int dmDisplayFlags;
        public int dmDisplayFrequency;
        public int dmICMMethod;
        public int dmICMIntent;
        public int dmMediaType;
        public int dmDitherType;
        public int dmReserved1;
        public int dmReserved2;
        public int dmPanningWidth;
        public int dmPanningHeight;
    }
    [DllImport("user32.dll")]
    public static extern int EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);

    public static void GetRes() {
        DEVMODE dm = new DEVMODE();
        dm.dmSize = (short)Marshal.SizeOf(typeof(DEVMODE));
        int modeNum = 0;
        List<string> modes = new List<string>();
        while (EnumDisplaySettings(null, modeNum, ref dm) != 0) {
            string res = dm.dmPelsWidth.ToString() + "x" + dm.dmPelsHeight.ToString();
            if (!modes.Contains(res)) {
                modes.Add(res);
            }
            modeNum++;
        }
        Console.WriteLine(string.Join(",", modes.ToArray()));
    }
}
"@;
[ScreenResList]::GetRes()
`;
      const Buffer = window.require('buffer').Buffer;
      const base64Script = Buffer.from(psScript, 'utf16le').toString('base64');
      child_process.exec(`powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -NoProfile -EncodedCommand ${base64Script}`, (error, stdout) => {
        if (error || !stdout) return resolve([]);
        const str = stdout.toString().trim();
        const arr = str.split(',').map(s => s.trim()).filter(Boolean);
        resolve(arr);
      });
    } catch {
      resolve([]);
    }
  });
}

export async function restoreActualDisplayResolution(sync = false) {
  const promise = new Promise((resolve, reject) => {
    try {
      const isNw = typeof window.nw !== 'undefined';
      if (!isNw) return resolve(false);

      const process = window.require('process');
      const child_process = window.require('child_process');

      if (process.platform !== 'win32') {
        return resolve(false);
      }

      // Script in C# to trigger a blank ChangeDisplaySettings resetting everything
      const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ScreenResRestore {
    [DllImport("user32.dll")]
    public static extern int ChangeDisplaySettings(IntPtr devMode, int flags);

    public static void Restore() {
        ChangeDisplaySettings(IntPtr.Zero, 0); 
    }
}
"@;
[ScreenResRestore]::Restore()
`;

      const Buffer = window.require('buffer').Buffer;
      const base64Script = Buffer.from(psScript, 'utf16le').toString('base64');
      const cmd = `powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -NoProfile -EncodedCommand ${base64Script}`;
      
      if (sync) {
        child_process.execSync(cmd);
        resolve(true);
      } else {
        child_process.exec(cmd, (error) => {
          if (error) {
            console.error("Error restaurando resolucion desde PowerShell:", error);
            return reject(error);
          }
          resolve(true);
        });
      }
    } catch (err) {
      if (!sync) console.error("Fallo general al intentar restaurar la resolucion", err);
      reject(err);
    }
  });

  if (sync) {
      promise.catch(()=>null);
  }
  return promise;
}

export function restoreActualDisplayResolutionSync() {
    restoreActualDisplayResolution(true).catch(()=>null);
}
