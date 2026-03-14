import { mount } from "@vue/test-utils"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import OfflineBanner from "@/components/OfflineBanner.vue"

describe("OfflineBanner", () => {
	let onlineSpy

	beforeEach(() => {
		onlineSpy = vi.spyOn(navigator, "onLine", "get")
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("hides banner when online", () => {
		onlineSpy.mockReturnValue(true)
		const wrapper = mount(OfflineBanner)
		expect(wrapper.find(".offline-banner").exists()).toBe(false)
	})

	it("shows banner when offline", () => {
		onlineSpy.mockReturnValue(false)
		const wrapper = mount(OfflineBanner)
		expect(wrapper.find(".offline-banner").exists()).toBe(true)
		expect(wrapper.text()).toContain("You are offline")
	})

	it("has correct ARIA attributes", () => {
		onlineSpy.mockReturnValue(false)
		const wrapper = mount(OfflineBanner)
		const banner = wrapper.find(".offline-banner")
		expect(banner.attributes("role")).toBe("alert")
		expect(banner.attributes("aria-live")).toBe("assertive")
	})

	it("reacts to online/offline events", async () => {
		onlineSpy.mockReturnValue(true)
		const wrapper = mount(OfflineBanner)
		expect(wrapper.find(".offline-banner").exists()).toBe(false)

		// Go offline
		window.dispatchEvent(new Event("offline"))
		await wrapper.vm.$nextTick()
		expect(wrapper.find(".offline-banner").exists()).toBe(true)

		// Go back online
		window.dispatchEvent(new Event("online"))
		await wrapper.vm.$nextTick()
		expect(wrapper.find(".offline-banner").exists()).toBe(false)
	})

	it("cleans up event listeners on unmount", () => {
		onlineSpy.mockReturnValue(true)
		const removeSpy = vi.spyOn(window, "removeEventListener")
		const wrapper = mount(OfflineBanner)
		wrapper.unmount()
		expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function))
		expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function))
	})
})
