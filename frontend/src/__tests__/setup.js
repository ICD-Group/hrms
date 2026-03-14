/**
 * Vitest global setup
 * Mocks frappe globals and common dependencies for component testing.
 */

// Mock frappe global (used throughout the app)
globalThis.frappe = {
	call: vi.fn().mockResolvedValue({}),
	xcall: vi.fn().mockResolvedValue({}),
	session: { user: "test@example.com" },
	boot: { csrf_token: "test-token" },
	urls: { api: "/api" },
	_: (msg) => msg,
}

// Mock window.__ translation helper (used via inject)
globalThis.__ = (msg) => msg

// Mock matchMedia (jsdom doesn't implement it)
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
})

// Mock IntersectionObserver (jsdom doesn't implement it)
globalThis.IntersectionObserver = class {
	constructor() {}
	observe() {}
	unobserve() {}
	disconnect() {}
}

// Mock ResizeObserver (jsdom doesn't implement it)
globalThis.ResizeObserver = class {
	constructor() {}
	observe() {}
	unobserve() {}
	disconnect() {}
}
