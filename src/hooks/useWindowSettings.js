import { useEffect, useState, useRef } from "react";
import { setActualDisplayResolution, restoreActualDisplayResolution, restoreActualDisplayResolutionSync } from "../utils/screenResolution";

export function useWindowSettings(player) {
  const [nativeResolution, setNativeResolution] = useState(null);
  
  const lastSettingsRef = useRef({ resolution: null, fullscreen: null });
  const displayStateRef = useRef('game');
  const isChangingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    // Store native resolution in localStorage to avoid losing it after a crash in low resolution
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
    const currentMode = renderer.displayMode; // 'windowed', 'borderless', 'exclusive'
    const prevMode = lastSettingsRef.current.displayMode;
    
    if (lastSettingsRef.current.resolution === currentRes && prevMode === currentMode) {
      return;
    }
    
    lastSettingsRef.current = { resolution: currentRes, displayMode: currentMode };

    // 1. Fullscreen Handling (Differentiated Logic)
    if (currentMode === 'borderless') {
      if (prevMode === 'exclusive') {
        win.leaveFullscreen(); // Force NW.js out of fullscreen so it can recalculate bounds when OS restores
        win.restore();
      } else {
        win.enterFullscreen();
      }
    } else if (currentMode === 'windowed') {
      win.leaveFullscreen();
      win.restore();
    }
    // In 'exclusive', the Fullscreen entry is done after changing the resolution.

    // 2. Resolution Handling
    if (currentRes && currentRes !== "native" && currentRes !== "custom") {
      const [width, height] = currentRes.split("x").map(Number);
      if (!isNaN(width) && !isNaN(height)) {
        if (currentMode === 'windowed') {
          console.log(`[Resolution] Windowed mode: resizing to ${width}x${height}`);
          win.restore();
          win.resizeTo(width, height);
          win.setPosition("center");
          isChangingRef.current = true;
          displayStateRef.current = 'desktop';
          window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: `Window resized to ${width}x${height}` } }));
          restoreActualDisplayResolution().finally(()=> { setTimeout(() => { isChangingRef.current = false; }, 500); }).catch(()=>null);
        } else if (currentMode === 'exclusive') {
          console.log(`[Resolution] Exclusive mode: changing display to ${width}x${height}`);
          isChangingRef.current = true;
          displayStateRef.current = 'game';
          win.restore(); // Reset state before change
          
          setActualDisplayResolution(width, height)
            .then(() => {
              // Delay for OS/NW.js synchronization
              setTimeout(() => {
                win.resizeTo(width, height);
                win.enterFullscreen();
                window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: `Hardware resolution changed to ${width}x${height}` } }));
                isChangingRef.current = false;
              }, 150);
            })
            .catch((err) => {
              console.error(`[Resolution] Display change failed:`, err.message);
              window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: false, message: `Hardware mode failed: ${err.message}` } }));
              isChangingRef.current = false;
            });
        } else if (currentMode === 'borderless') {
          console.log(`[Resolution] Borderless mode: scaling internally to ${width}x${height}`);
          displayStateRef.current = 'game';
          isChangingRef.current = true;
          
          // Settle hardware switch before entering fullscreen
          restoreActualDisplayResolution().catch(()=>null).finally(() => {
            setTimeout(() => {
              win.enterFullscreen();
              window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: `Borderless Scaling set to ${width}x${height}` } }));
              isChangingRef.current = false;
            }, 250); // Settle delay
          });
        }
      }
    } else if (currentRes === "native") {
        console.log(`[Resolution] Restoring native resolution`);
        if (currentMode === 'windowed') {
            win.restore();
            win.maximize();
        } else if (currentMode === 'exclusive' || currentMode === 'borderless') {
            win.enterFullscreen();
        }
        isChangingRef.current = true;
        displayStateRef.current = 'desktop';
        window.dispatchEvent(new CustomEvent('resolution-result', { detail: { success: true, message: 'Restored native resolution' } }));
        restoreActualDisplayResolution().finally(()=> { setTimeout(() => { isChangingRef.current = false; }, 500); }).catch(()=>null);
    }
    
    // --- Alt-Tab Handling (Only necessary for EXCLUSIVE MODE)
    const onRestoreDesktop = () => {
       if (currentMode === 'exclusive' && currentRes && currentRes !== "native" && currentRes !== "custom") {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          
          debounceTimerRef.current = setTimeout(() => {
             if (document.hasFocus() && !document.hidden) return; 
             if (isChangingRef.current || displayStateRef.current === 'desktop') return;
             isChangingRef.current = true;
             displayStateRef.current = 'desktop';

             restoreActualDisplayResolution().finally(() => {
                setTimeout(() => { isChangingRef.current = false; }, 500); 
             }).catch(()=>null);
          }, 300);
       }
    };
    
    const onApplyGameResolution = () => {
       if (currentMode === 'exclusive' && currentRes && currentRes !== "native" && currentRes !== "custom") {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          
          debounceTimerRef.current = setTimeout(() => {
             if (!document.hasFocus() || document.hidden) return; 
             if (isChangingRef.current || displayStateRef.current === 'game') return;
             const [width, height] = currentRes.split("x").map(Number);
             if (!isNaN(width) && !isNaN(height)) {
                isChangingRef.current = true;
                displayStateRef.current = 'game';
                setActualDisplayResolution(width, height).finally(() => {
                   setTimeout(() => { isChangingRef.current = false; }, 500);
                }).catch(()=>null);
             }
          }, 300);
       }
    };

    win.on('blur', onRestoreDesktop);
    win.on('minimize', onRestoreDesktop);
    win.on('focus', onApplyGameResolution);
    win.on('restore', onApplyGameResolution);

    window.addEventListener('blur', onRestoreDesktop);
    window.addEventListener('focus', onApplyGameResolution);
    const onVisChange = () => {
      if (document.hidden) onRestoreDesktop(); 
      else onApplyGameResolution();
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
      lastSettingsRef.current = { resolution: "CLOSED", displayMode: "CLOSED" };
      win.removeAllListeners('close');
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
