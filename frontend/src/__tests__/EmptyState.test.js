import { mount } from "@vue/test-utils"
import { describe, it, expect } from "vitest"
import EmptyState from "@/components/EmptyState.vue"

// Mock FeatherIcon since it's from frappe-ui
const FeatherIcon = { template: '<svg />', props: ["name", "class"] }

describe("EmptyState", () => {
	const mountOpts = {
		global: {
			provide: { $translate: (msg) => msg },
			stubs: { FeatherIcon },
		},
	}

	it("renders message text", () => {
		const wrapper = mount(EmptyState, {
			...mountOpts,
			props: { message: "No records found" },
		})
		expect(wrapper.text()).toContain("No records found")
	})

	it("renders description when provided", () => {
		const wrapper = mount(EmptyState, {
			...mountOpts,
			props: { message: "Empty", description: "Try adding something" },
		})
		expect(wrapper.text()).toContain("Try adding something")
	})

	it("hides description when not provided", () => {
		const wrapper = mount(EmptyState, {
			...mountOpts,
			props: { message: "Empty" },
		})
		const descEl = wrapper.findAll("p")
		expect(descEl.length).toBe(1) // only the message paragraph
	})

	it("has status role for accessibility", () => {
		const wrapper = mount(EmptyState, {
			...mountOpts,
			props: { message: "Empty" },
		})
		expect(wrapper.find("[role='status']").exists()).toBe(true)
	})

	it("applies table field styling when isTableField is true", () => {
		const wrapper = mount(EmptyState, {
			...mountOpts,
			props: { message: "Empty", isTableField: true },
		})
		expect(wrapper.find(".border-dashed").exists()).toBe(true)
	})

	it("applies glass-section styling when isTableField is false", () => {
		const wrapper = mount(EmptyState, {
			...mountOpts,
			props: { message: "Empty", isTableField: false },
		})
		expect(wrapper.find(".glass-section").exists()).toBe(true)
	})
})
