import { useEffect, useState, useRef } from "react";
import { setActualDisplayResolution, restoreActualDisplayResolution, restoreActualDisplayResolutionSync } from "../utils/screenResolution";

export function useWindowSettings(player) {
  const [nativeResolution, setNativeResolution] = useState(null);
  
  const lastSettingsRef = useRef({ resolution: null, fullscreen: null });
  const displayStateRef = useRef('game');
  const isChangingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    // Almacenar la resolución nativa en localStorage para evitar perderla tras un crash en baja resolución
    if (typeof window.nw !== "undefined") {
      window.nw.Screen.Init();
      const primary = window.nw.Screen.screens[0];
      const cachedNative = localStorage.getItem("hc_native_resolution");
      
      if (cachedNative) {
         const [w, h] = cachedNative.split("x").map(Number);
         setNativeResolution({ width: w, height: h });
      } else if (primary && primary.bounds) {
         setNativeResolution({ width: primary.bounds.width, height: primary.bounds.height });
         localStorage.setItem("hc_native_resolution", `${primary.bounds.width}x${primary.bounds.height}`);
      }
    } else {
        setNativeResolution({
            width: window.screen.width,
            height: window.screen.height
        });
    }
  }, []);

  useEffect(() => {
    if (typeof window.nw === "undefined") return;

    const win = window.nw.Window.get();
    const renderer = player?.renderer;
    if (!renderer || !nativeResolution) return;

    const currentRes = renderer.resolution;
    const currentFS = renderer.fullscreen;
    
    // Si no ha cambiado nada útil, salimos y evitamos espamear procesos
    if (lastSettingsRef.current.resolution === currentRes && lastSettingsRef.current.fullscreen === currentFS) {
      return;
    }
    
    // Actualizamos el tracking
    lastSettingsRef.current = { resolution: currentRes, fullscreen: currentFS };

    if (currentFS) {
      win.enterFullscreen();
    } else {
      win.leaveFullscreen();
    }

    if (currentRes && currentRes !== "native" && currentRes !== "custom") {
      const [width, height] = currentRes.split("x").map(Number);
      if (!isNaN(width) && !isNaN(height)) {
        if (!currentFS) {
          console.log(`[Resolution] Windowed mode: resizing to ${width}x${height}`);
          win.restore();
          win.resizeTo(width, height);
          win.setPosition("center");
          isChangingRef.current = true;
          displayStateRef.current = 'desktop';
          window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: `Window resized to ${width}x${height}` } }));
          restoreActualDisplayResolution().finally(()=> { setTimeout(() => { isChangingRef.current = false; }, 500); }).catch(()=>null);
        } else {
          console.log(`[Resolution] Fullscreen mode: changing display to ${width}x${height}`);
          isChangingRef.current = true;
          displayStateRef.current = 'game';
          setActualDisplayResolution(width, height)
            .then((result) => {
              console.log(`[Resolution] Display change result:`, result);
              window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: `Display changed to ${width}x${height}` } }));
            })
            .catch((err) => {
              console.error(`[Resolution] Display change failed:`, err.message);
              const failMsg = err.message.includes('FAIL:TEST') 
                ? `Resolution ${width}x${height} is not supported by your display`
                : `Failed to change resolution: ${err.message}`;
              window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: false, message: failMsg } }));
            })
            .finally(()=> { setTimeout(() => { isChangingRef.current = false; }, 500); });
        }
      } else {
        console.warn(`[Resolution] Invalid resolution string: "${currentRes}"`);
      }
    } else if (currentRes === "native") {
        console.log(`[Resolution] Restoring native resolution`);
        if (!currentFS) {
            win.restore();
            win.maximize();
        }
        isChangingRef.current = true;
        displayStateRef.current = 'desktop';
        window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: 'Restored native resolution' } }));
        restoreActualDisplayResolution().finally(()=> { setTimeout(() => { isChangingRef.current = false; }, 500); }).catch(()=>null);
    }
    
    // --- Manejo de Alt-Tab (Interceptando todo tipo de pérdida de foco)
    const onRestoreDesktop = () => {
       if (currentFS && currentRes && currentRes !== "native" && currentRes !== "custom") {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          
          debounceTimerRef.current = setTimeout(() => {
             if (document.hasFocus() && !document.hidden) return; // Fake blur
             
             if (isChangingRef.current || displayStateRef.current === 'desktop') return;
             isChangingRef.current = true;
             displayStateRef.current = 'desktop';

             restoreActualDisplayResolution().finally(() => {
                setTimeout(() => { isChangingRef.current = false; }, 1000); 
             }).catch(()=>null);
          }, 400);
       }
    };
    
    const onApplyGameResolution = () => {
       if (currentFS && currentRes && currentRes !== "native" && currentRes !== "custom") {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          
          debounceTimerRef.current = setTimeout(() => {
             if (!document.hasFocus() || document.hidden) return; // Fake focus
             
             if (isChangingRef.current || displayStateRef.current === 'game') return;
             const [width, height] = currentRes.split("x").map(Number);
             if (!isNaN(width) && !isNaN(height)) {
                isChangingRef.current = true;
                displayStateRef.current = 'game';

                setActualDisplayResolution(width, height).finally(() => {
                   setTimeout(() => { isChangingRef.current = false; }, 1000);
                }).catch(()=>null);
             }
          }, 400);
       }
    };

    win.on('blur', onRestoreDesktop);
    win.on('minimize', onRestoreDesktop);
    win.on('focus', onApplyGameResolution);
    win.on('restore', onApplyGameResolution);

    // Detección DOM super-agresiva para Fullscreen (Alt+Tab)
    window.addEventListener('blur', onRestoreDesktop);
    window.addEventListener('focus', onApplyGameResolution);
    const onVisChange = () => {
        if (document.hidden) {
            onRestoreDesktop();
        } else {
            onApplyGameResolution();
        }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
        win.removeListener('blur', onRestoreDesktop);
        win.removeListener('minimize', onRestoreDesktop);
        win.removeListener('focus', onApplyGameResolution);
        win.removeListener('restore', onApplyGameResolution);
        window.removeEventListener('blur', onRestoreDesktop);
        window.removeEventListener('focus', onApplyGameResolution);
        document.removeEventListener('visibilitychange', onVisChange);
    }

  }, [player?.renderer, nativeResolution]);

  useEffect(() => {
    if (typeof window.nw === "undefined" || !nativeResolution) return;
    const win = window.nw.Window.get();

    const handleClose = () => {
      // Bloquear cualquier intento de spawn extra
      lastSettingsRef.current = { resolution: "CLOSED", fullscreen: "CLOSED" };
      win.removeAllListeners('close');
      
      // Llamada síncrona/bloqueante a powershell para forzar reset de emergencia de Windows
      restoreActualDisplayResolutionSync();
      win.close(true);
    };

    win.on('close', handleClose);
    return () => {
      win.removeListener('close', handleClose);
    };
  }, [nativeResolution]);

  return { nativeResolution };
}
