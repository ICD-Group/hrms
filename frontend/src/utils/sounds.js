/**
 * ICD3S Sound Manager - Web Audio API Synthesized Sounds
 * v5.4 - Premium Settings: separate toggles for check-in sounds, tap sounds,
 * haptic feedback, and confetti animations
 */

class ICD3SSoundManager {
	constructor() {
		this.ctx = null
		// Main sound toggle
		this.enabled = localStorage.getItem('icd-sounds') !== 'false'
		this.volume = parseFloat(localStorage.getItem('icd-sounds-volume') || '0.5')
		// Separate toggles
		this.tapSoundsEnabled = localStorage.getItem('icd-tap-sounds') !== 'false'
		this.hapticEnabled = localStorage.getItem('icd-haptic') !== 'false'
		this.confettiEnabled = localStorage.getItem('icd-confetti') !== 'false'
	}

	getContext() {
		if (!this.ctx || this.ctx.state === 'closed') {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)()
		}
		if (this.ctx.state === 'suspended') {
			this.ctx.resume()
		}
		return this.ctx
	}

	// Main sound toggle
	setEnabled(val) {
		this.enabled = val
		localStorage.setItem('icd-sounds', val ? 'true' : 'false')
	}

	setVolume(val) {
		this.volume = Math.max(0, Math.min(1, val))
		localStorage.setItem('icd-sounds-volume', this.volume.toString())
	}

	isEnabled() {
		return this.enabled
	}

	getVolume() {
		return this.volume
	}

	// Tap sounds toggle
	setTapSoundsEnabled(val) {
		this.tapSoundsEnabled = val
		localStorage.setItem('icd-tap-sounds', val ? 'true' : 'false')
	}

	isTapSoundsEnabled() {
		return this.tapSoundsEnabled
	}

	// Haptic feedback toggle
	setHapticEnabled(val) {
		this.hapticEnabled = val
		localStorage.setItem('icd-haptic', val ? 'true' : 'false')
	}

	isHapticEnabled() {
		return this.hapticEnabled
	}

	// Confetti toggle
	setConfettiEnabled(val) {
		this.confettiEnabled = val
		localStorage.setItem('icd-confetti', val ? 'true' : 'false')
	}

	isConfettiEnabled() {
		return this.confettiEnabled
	}

	// Haptic vibration
	vibrate(pattern) {
		if (!this.hapticEnabled) return
		if (navigator.vibrate) {
			navigator.vibrate(pattern)
		}
	}

	// Light tap haptic
	hapticTap() {
		this.vibrate(10)
	}

	// Medium haptic for check-in/out
	hapticSuccess() {
		this.vibrate([15, 50, 15])
	}

	// Strong haptic for milestones
	hapticMilestone() {
		this.vibrate([20, 40, 20, 40, 30])
	}

	// Play a note with envelope
	playNote(freq, duration, type = 'sine', delay = 0) {
		if (!this.enabled) return
		try {
			const ctx = this.getContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()

			osc.type = type
			osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
			gain.gain.setValueAtTime(0, ctx.currentTime + delay)
			gain.gain.linearRampToValueAtTime(this.volume * 0.3, ctx.currentTime + delay + 0.02)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

			osc.connect(gain)
			gain.connect(ctx.destination)

			osc.start(ctx.currentTime + delay)
			osc.stop(ctx.currentTime + delay + duration)
		} catch (e) {
			// Silently fail - sound is non-critical
		}
	}

	// Check-in success chime (ascending arpeggio)
	playCheckIn() {
		this.playNote(523.25, 0.15, 'sine', 0)      // C5
		this.playNote(659.25, 0.15, 'sine', 0.1)     // E5
		this.playNote(783.99, 0.25, 'sine', 0.2)     // G5
		this.playNote(1046.50, 0.35, 'sine', 0.3)    // C6
		this.hapticSuccess()
	}

	// Check-out tone (descending)
	playCheckOut() {
		this.playNote(783.99, 0.15, 'sine', 0)       // G5
		this.playNote(659.25, 0.15, 'sine', 0.1)     // E5
		this.playNote(523.25, 0.3, 'sine', 0.2)      // C5
		this.hapticSuccess()
	}

	// Achievement fanfare
	playAchievement() {
		this.playNote(523.25, 0.12, 'triangle', 0)
		this.playNote(659.25, 0.12, 'triangle', 0.08)
		this.playNote(783.99, 0.12, 'triangle', 0.16)
		this.playNote(1046.50, 0.12, 'triangle', 0.24)
		this.playNote(1318.51, 0.4, 'triangle', 0.32)
		this.hapticMilestone()
	}

	// Late warning beep
	playWarning() {
		this.playNote(440, 0.15, 'square', 0)
		this.playNote(440, 0.15, 'square', 0.25)
		this.vibrate([50, 100, 50])
	}

	// Subtle tap/click sound
	playTap() {
		if (!this.enabled || !this.tapSoundsEnabled) return
		try {
			const ctx = this.getContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()

			osc.type = 'sine'
			osc.frequency.setValueAtTime(1200, ctx.currentTime)
			gain.gain.setValueAtTime(this.volume * 0.08, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

			osc.connect(gain)
			gain.connect(ctx.destination)
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.05)
		} catch (e) {
			// Silently fail
		}
		this.hapticTap()
	}

	// Navigation sound (page change)
	playNavigate() {
		if (!this.enabled || !this.tapSoundsEnabled) return
		try {
			const ctx = this.getContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()

			osc.type = 'sine'
			osc.frequency.setValueAtTime(800, ctx.currentTime)
			osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.06)
			gain.gain.setValueAtTime(this.volume * 0.06, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

			osc.connect(gain)
			gain.connect(ctx.destination)
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.08)
		} catch (e) {
			// Silently fail
		}
	}

	// Streak milestone celebration
	playStreakMilestone() {
		const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51]
		notes.forEach((freq, i) => {
			this.playNote(freq, 0.15, 'triangle', i * 0.08)
		})
		this.hapticMilestone()
	}

	// Notification alert (gentle two-tone ping)
	playNotification() {
		this.playNote(880, 0.1, 'sine', 0)       // A5
		this.playNote(1108.73, 0.15, 'sine', 0.1) // C#6
		this.vibrate(15)
	}

	// Success sound (form submit, approval)
	playSuccess() {
		this.playNote(659.25, 0.1, 'sine', 0)     // E5
		this.playNote(783.99, 0.1, 'sine', 0.08)  // G5
		this.playNote(1046.50, 0.2, 'sine', 0.16) // C6
		this.hapticSuccess()
	}

	// Error sound (form validation fail)
	playError() {
		this.playNote(330, 0.15, 'square', 0)     // E4
		this.playNote(277.18, 0.2, 'square', 0.15) // C#4
		this.vibrate([30, 50, 30])
	}
}

// Singleton instance
const soundManager = new ICD3SSoundManager()
export default soundManager
