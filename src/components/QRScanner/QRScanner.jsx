import { useState, useEffect, useCallback, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { useBackClose } from '../../hooks/useBackClose'
import { Icon } from '../Icon/Icon'
import { decompressFromQr, getFocalInfo } from '../../utils/share'
import { detectConflicts, hasConflicts } from '../../utils/importConflicts'
import { ImportConflictReview } from '../ImportConflictReview/ImportConflictReview'

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000, padding: '24px',
    animation: 'fadeIn 150ms ease',
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    maxWidth: '380px',
    width: '100%',
    animation: 'scaleIn 200ms ease',
  },
  scannerWrap: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: '#000',
    display: 'flex', flexDirection: 'column',
  },
  scannerHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: '#111', color: '#fff',
  },
  scannerTitle: { fontSize: 'var(--text-sm)', fontWeight: 600 },
  closeBtn: {
    border: 'none', background: 'transparent', color: '#fff',
    fontSize: '20px', cursor: 'pointer', padding: '4px',
    display: 'flex', alignItems: 'center',
  },
  scannerBody: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  scannerRegion: { width: '100%', maxWidth: '560px', aspectRatio: '1', margin: '0 auto' },
  input: {
    width: '100%', padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    marginBottom: '12px',
    resize: 'none',
  },
  title: {
    fontSize: 'var(--text-lg)', fontWeight: 700,
    marginBottom: '8px', color: 'var(--color-text)',
  },
  message: {
    fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
    lineHeight: 1.6, marginBottom: '16px',
  },
  previewBox: {
    padding: '16px', borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg)', marginBottom: '16px',
    textAlign: 'center',
  },
  previewType: {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'var(--color-text-secondary)',
    marginBottom: '4px',
  },
  previewName: {
    fontSize: 'var(--text-base)', fontWeight: 700,
    color: 'var(--color-text)', marginBottom: '8px',
  },
  previewMeta: {
    fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
  },
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  primaryBtn: {
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    border: 'none', background: 'var(--color-primary)',
    color: 'white', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', background: 'transparent',
    color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
  },
  errorBox: {
    padding: '12px', borderRadius: 'var(--radius-md)',
    background: '#ef444422', color: '#ef4444',
    fontSize: 'var(--text-sm)', marginBottom: '12px',
  },
}

const TYPE_LABELS = { item: 'Article', kit: 'Kit', sac: 'Sac' }

const SCANNER_ELEMENT_ID = 'qr-scanner-live'

export function QRScanner({ onImport, onClose, items = [], categories = [], kits = [], sacs = [] }) {
  useBackClose(true, onClose)
  const initialPlatformState = Capacitor.isNativePlatform() ? 'scanning' : 'web-input'
  const [state, setState] = useState(initialPlatformState)
  const [error, setError] = useState(null)
  const [focalInfo, setFocalInfo] = useState(null)
  const [payload, setPayload] = useState(null)
  const [webInput, setWebInput] = useState('')
  const inputRef = useRef(null)
  const scannerRef = useRef(null)

  const existingState = { items, categories, kits, sacs }

  const processResult = useCallback((rawValue) => {
    try {
      const data = decompressFromQr(rawValue)
      if (data.op !== 'share') {
        setError('Ce QR code ne contient pas une ressource ExPack valide')
        setState('error')
        return
      }
      const info = getFocalInfo(data)
      setFocalInfo(info)
      setPayload(data)
      const found = detectConflicts(data, existingState)
      if (hasConflicts(found)) {
        setState('conflicts')
      } else {
        setState('preview')
      }
    } catch {
      setError('Impossible de décoder ce QR code')
      setState('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
  }, [])

  const ensureCameraPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true

    try {
      const status = await Camera.checkPermissions()
      if (status.camera === 'granted') return true

      const result = await Camera.requestPermissions({ permissions: ['camera'] })
      return result.camera === 'granted'
    } catch (err) {
      console.error('Camera permission error:', err)
      return false
    }
  }, [])

  useEffect(() => {
    if (state !== 'scanning') return

    let cancelled = false

    async function start() {
      const granted = await ensureCameraPermission()
      if (cancelled) return
      if (!granted) {
        setError("L'autorisation d'accès à la caméra est nécessaire pour scanner un QR code. Autorisez la caméra dans les réglages puis réessayez.")
        setState('error')
        return
      }

      if (Capacitor.getPlatform() === 'android') {
        startNativeScan(cancelled)
      } else {
        startWebScan(cancelled)
      }
    }

    async function startNativeScan(cancelled) {
      try {
        let available = true
        try {
          const res = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
          available = res.available
        } catch {
          available = false
        }
        if (!available) {
          try { await BarcodeScanner.installGoogleBarcodeScannerModule() } catch {}
        }

        const { barcodes } = await BarcodeScanner.scan({
          formats: ['QR_CODE'],
          autoZoom: true,
        })
        if (cancelled) return

        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          processResult(barcodes[0].rawValue)
        } else {
          setError("Aucun QR code détecté. Réessayez.")
          setState('error')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Native QR scan error:', err)
          setError(err.message || 'Erreur lors du scan du QR code')
          setState('error')
        }
      }
    }

    async function startWebScan(cancelled) {
      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7)
              return { width: size, height: size }
            },
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 2560 },
              height: { ideal: 1440 },
            },
          },
          (decodedText) => {
            if (!cancelled) {
              stopScanner()
              processResult(decodedText)
            }
          },
          () => {}
        )
      } catch (err) {
        if (!cancelled) {
          console.error('QR scanner start error:', err)
          setError(err.message || 'Erreur lors de l\'accès à la caméra')
          setState('error')
        }
      }
    }

    start()

    return () => { cancelled = true; stopScanner() }
  }, [state, processResult, stopScanner, ensureCameraPermission])

  const handleImport = useCallback(() => {
    if (payload && onImport) onImport(payload, undefined)
    onClose?.()
  }, [payload, onImport, onClose])

  const handleConflictImport = useCallback((decisions) => {
    if (payload && onImport) onImport(payload, decisions)
    onClose?.()
  }, [payload, onImport, onClose])

  const handleClose = useCallback(() => {
    stopScanner().then(() => onClose?.())
  }, [stopScanner, onClose])

  const handleScannerCancel = useCallback(() => {
    stopScanner().then(() => onClose?.())
  }, [stopScanner, onClose])

  if (state === 'scanning') {
    if (Capacitor.getPlatform() === 'android') {
      return (
        <div style={s.scannerWrap}>
          <div style={s.scannerHeader}>
            <span style={s.scannerTitle}>Scanner un QR code</span>
            <button style={s.closeBtn} onClick={handleScannerCancel} aria-label="Fermer">
              <Icon name="cross" />
            </button>
          </div>
          <div style={{ ...s.scannerBody, color: '#fff', fontSize: 'var(--text-sm)' }}>
            Lancement du scanner…
          </div>
        </div>
      )
    }
    return (
      <div style={s.scannerWrap}>
        <div style={s.scannerHeader}>
          <span style={s.scannerTitle}>Scanner un QR code</span>
          <button style={s.closeBtn} onClick={handleScannerCancel} aria-label="Fermer">
            <Icon name="cross" />
          </button>
        </div>
        <div style={s.scannerBody}>
          <div id={SCANNER_ELEMENT_ID} style={s.scannerRegion} />
        </div>
      </div>
    )
  }

  if (state === 'web-input') {
    return (
      <div style={s.overlay} onClick={handleClose} role="dialog" aria-modal="true">
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <div style={s.title}>Données QR</div>
          <div style={s.message}>
            Collez ici les données du QR code (mode développement web).
          </div>
          <textarea
            ref={inputRef}
            style={{ ...s.input, minHeight: '80px' }}
            value={webInput}
            onChange={e => setWebInput(e.target.value)}
            placeholder="Collez le contenu du QR code…"
          />
          <div style={s.actions}>
            <button style={s.secondaryBtn} onClick={handleClose}>Annuler</button>
            <button
              style={s.primaryBtn}
              onClick={() => { if (webInput.trim()) processResult(webInput.trim()) }}
              disabled={!webInput.trim()}
            >
              Décoder
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={s.overlay} onClick={handleClose} role="dialog" aria-modal="true">
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <div style={s.title}>Erreur</div>
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={s.actions}>
            <button style={s.secondaryBtn} onClick={handleClose}>Fermer</button>
            <button style={s.primaryBtn} onClick={() => { setState('scanning'); setError(null) }}>Réessayer</button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'preview' && focalInfo) {
    return (
      <div style={s.overlay} onClick={handleClose} role="dialog" aria-modal="true">
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <div style={s.title}>Aperçu</div>
          <div style={s.previewBox}>
            <div style={s.previewType}>{TYPE_LABELS[focalInfo.type] || 'Ressource'}</div>
            <div style={s.previewName}>{focalInfo.name}</div>
            <div style={s.previewMeta}>
              {focalInfo.itemCount} article{focalInfo.itemCount > 1 ? 's' : ''}
              {focalInfo.totalWeight > 0 && ` · ${focalInfo.totalWeight >= 1000
                ? `${(focalInfo.totalWeight / 1000).toFixed(1)} kg`
                : `${focalInfo.totalWeight} g`}`}
            </div>
          </div>
          <div style={s.message}>
            Cette ressource va être importée dans votre inventaire.
            Les articles seront ajoutés sans écraser vos données existantes.
          </div>
          <div style={s.actions}>
            <button style={s.secondaryBtn} onClick={handleClose}>Annuler</button>
            <button style={s.primaryBtn} onClick={handleImport}>
              <Icon name="import" size="xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Importer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'conflicts' && payload) {
    return (
      <ImportConflictReview
        payload={payload}
        existingState={existingState}
        onConfirm={handleConflictImport}
        onCancel={handleClose}
      />
    )
  }

  return null
}
