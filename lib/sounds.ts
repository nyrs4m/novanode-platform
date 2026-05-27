function ctx() {
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
}

// ── KDS: New order — urgent double-beep ──
export function playNewOrder() {
  try {
    const c = ctx()
    ;[0, 0.18, 0.36].forEach((t) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'square'
      o.frequency.setValueAtTime(960, c.currentTime + t)
      o.frequency.setValueAtTime(1280, c.currentTime + t + 0.06)
      g.gain.setValueAtTime(0.35, c.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.14)
      o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.15)
    })
  } catch {}
}

// ── KDS: Waiter signal — soft triple chime ──
export function playSignalAlert() {
  try {
    const c = ctx()
    ;[523, 659, 784].forEach((freq, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.28, c.currentTime + i * 0.13)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.25)
      o.start(c.currentTime + i * 0.13)
      o.stop(c.currentTime + i * 0.13 + 0.26)
    })
  } catch {}
}

// ── KDS: Bill requested — cash register ding ──
export function playBillAlert() {
  try {
    const c = ctx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(1318, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.15)
    g.gain.setValueAtTime(0.4, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
    o.start(c.currentTime); o.stop(c.currentTime + 0.51)
  } catch {}
}

// ── Customer: Order confirmed — ascending chime ──
export function playOrderConfirmed() {
  try {
    const c = ctx()
    ;[523, 659, 784, 1047].forEach((freq, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.22, c.currentTime + i * 0.09)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.09 + 0.18)
      o.start(c.currentTime + i * 0.09)
      o.stop(c.currentTime + i * 0.09 + 0.19)
    })
  } catch {}
}

// ── Customer: Order ready — fanfare ──
export function playOrderReady() {
  try {
    const c = ctx()
    ;[784, 988, 1175, 988, 1175, 1568].forEach((freq, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.22, c.currentTime + i * 0.09)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.09 + 0.14)
      o.start(c.currentTime + i * 0.09)
      o.stop(c.currentTime + i * 0.09 + 0.15)
    })
  } catch {}
}

// ── Customer: Countdown expired — deep bell ──
export function playCountdownBell() {
  try {
    const c = ctx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(220, c.currentTime)
    g.gain.setValueAtTime(0.5, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.0)
    o.start(c.currentTime); o.stop(c.currentTime + 2.1)
  } catch {}
}

// ── Customer: Waiter call — doorbell ──
export function playWaiterCall() {
  try {
    const c = ctx()
    ;[[587, 494], [587, 494]].forEach(([f1, f2], i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(f1, c.currentTime + i * 0.35)
      o.frequency.setValueAtTime(f2, c.currentTime + i * 0.35 + 0.15)
      g.gain.setValueAtTime(0.35, c.currentTime + i * 0.35)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.35 + 0.3)
      o.start(c.currentTime + i * 0.35)
      o.stop(c.currentTime + i * 0.35 + 0.31)
    })
  } catch {}
}

// ── KDS: Starter order arrived — light pop ──
export function playStarterAlert() {
  try {
    const c = ctx()
    ;[0, 0.1].forEach((t) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sine'
      o.frequency.value = 1047
      g.gain.setValueAtTime(0.25, c.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.1)
      o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.11)
    })
  } catch {}
}