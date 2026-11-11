import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAInstallButton = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA on device home screen, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="pwa-install-btn"
        title="Install this app on your phone or computer for offline access"
      >
        <i className="fas fa-download" style={{ marginRight: '6px' }}></i>
        Install App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="pwa-install-btn pwa-ios-btn"
          title="Install on iPhone / iPad"
        >
          <i className="fab fa-apple" style={{ marginRight: '6px' }}></i>
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="pwa-ios-modal-backdrop" onClick={() => setShowIOSGuide(false)}>
            <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pwa-ios-modal-header">
                <h3>
                  <i className="fab fa-apple" style={{ marginRight: '8px', color: '#0284c7' }}></i>
                  Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  className="pwa-modal-close"
                  onClick={() => setShowIOSGuide(false)}
                >
                  &times;
                </button>
              </div>
              <div className="pwa-ios-modal-body">
                <p>To use this app offline on your iPhone or iPad:</p>
                <ol>
                  <li>
                    Tap the <strong>Share</strong> button <i className="fas fa-arrow-up-from-bracket"></i> in the Safari toolbar.
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong> <i className="far fa-plus-square"></i>.
                  </li>
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
                <p className="pwa-offline-benefit">
                  <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: '6px' }}></i>
                  The app will work completely offline with full reminder tracking!
                </p>
              </div>
              <button
                type="button"
                className="pwa-modal-done-btn"
                onClick={() => setShowIOSGuide(false)}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that support manual install or PWA ready
  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className="pwa-install-btn pwa-generic-btn"
        title="How to install this app on your phone or desktop for offline access"
      >
        <i className="fas fa-mobile-alt" style={{ marginRight: '6px' }}></i>
        Install App
      </button>

      {showIOSGuide && (
        <div className="pwa-ios-modal-backdrop" onClick={() => setShowIOSGuide(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-ios-modal-header">
              <h3>
                <i className="fas fa-mobile-screen" style={{ marginRight: '8px', color: '#0284c7' }}></i>
                Install App on Your Device
              </h3>
              <button
                type="button"
                className="pwa-modal-close"
                onClick={() => setShowIOSGuide(false)}
              >
                &times;
              </button>
            </div>
            <div className="pwa-ios-modal-body">
              <p>To use this app offline on your phone or computer:</p>
              <ol>
                <li>Open your browser menu (tap the three dots <strong>⋮</strong> in Chrome/Edge, or <strong>Share</strong> in Safari).</li>
                <li>Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.</li>
                <li>Confirm to install.</li>
              </ol>
              <p className="pwa-offline-benefit">
                <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: '6px' }}></i>
                Once installed, the app opens full-screen and works 100% offline!
              </p>
            </div>
            <button
              type="button"
              className="pwa-modal-done-btn"
              onClick={() => setShowIOSGuide(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
