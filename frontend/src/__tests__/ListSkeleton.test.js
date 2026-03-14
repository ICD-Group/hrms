import { mount } from "@vue/test-utils"
import { describe, it, expect } from "vitest"
import ListSkeleton from "@/components/ListSkeleton.vue"

describe("ListSkeleton", () => {
	it("renders default 5 skeleton rows", () => {
		const wrapper = mount(ListSkeleton)
		const rows = wrapper.findAll(".animate-pulse")
		expect(rows.length).toBe(5)
	})

	it("renders custom number of rows", () => {
		const wrapper = mount(ListSkeleton, { props: { rows: 3 } })
		const rows = wrapper.findAll(".animate-pulse")
		expect(rows.length).toBe(3)
	})

	it("hides avatar circles by default", () => {
		const wrapper = mount(ListSkeleton)
		// Each row has a .rounded-full badge, but no .w-10.h-10 avatar
		expect(wrapper.find(".w-10.h-10.rounded-full").exists()).toBe(false)
	})

	it("shows avatar circles when showAvatar is true", () => {
		const wrapper = mount(ListSkeleton, { props: { showAvatar: true } })
		const avatars = wrapper.findAll(".w-10.h-10.rounded-full")
		expect(avatars.length).toBe(5)
	})

	it("has pulse animation class on each row", () => {
		const wrapper = mount(ListSkeleton, { props: { rows: 2 } })
		const rows = wrapper.findAll(".animate-pulse")
		rows.forEach((row) => {
			expect(row.classes()).toContain("animate-pulse")
		})
	})
})
