"use client";

import { useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement() {
  const fullscreenDocument = document as FullscreenDocument;
  return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null;
}

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(getFullscreenElement()));
    }

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
    };
  }, []);

  async function toggleFullscreen() {
    const fullscreenDocument = document as FullscreenDocument;
    const fullscreenRoot = document.documentElement as FullscreenElement;

    if (getFullscreenElement()) {
      await (document.exitFullscreen?.() ?? fullscreenDocument.webkitExitFullscreen?.());
      return;
    }

    await (fullscreenRoot.requestFullscreen?.() ?? fullscreenRoot.webkitRequestFullscreen?.() ?? undefined);
  }

  return (
    <button
      className={`fullscreen-button${isFullscreen ? " fullscreen-button-active" : ""}`}
      type="button"
      onClick={() => void toggleFullscreen()}
      aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
      title={isFullscreen ? "退出全屏" : "进入全屏"}
      aria-pressed={isFullscreen}
    >
      <span className="fullscreen-icon" aria-hidden="true" />
    </button>
  );
}
