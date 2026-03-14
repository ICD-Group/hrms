import { inject } from "vue"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export function useReportExport() {
	const dayjs = inject("$dayjs")

	function resolveValue(row, col, idx) {
		if (typeof col.field === "function") return col.field(row, idx)
		return row[col.field] ?? "-"
	}

	function exportExcel({ title, dateRange, department, summaryCards, columns, rows }) {
		if (!rows || !rows.length) return

		const wsData = []
		// Header rows
		wsData.push([title || "Report"])
		wsData.push([dateRange || "", department || ""])
		wsData.push(["Generated: " + dayjs().format("DD-MM-YYYY, h:mm A")])
		wsData.push([])

		// Summary
		if (summaryCards && summaryCards.length) {
			wsData.push(summaryCards.map(c => c.label))
			wsData.push(summaryCards.map(c => c.value))
			wsData.push([])
		}

		// Column headers
		wsData.push(columns.map(c => c.label))

		// Data rows
		for (let i = 0; i < rows.length; i++) {
			wsData.push(columns.map(c => resolveValue(rows[i], c, i)))
		}

		const wb = XLSX.utils.book_new()
		const ws = XLSX.utils.aoa_to_sheet(wsData)

		// Column widths
		ws["!cols"] = columns.map((c, i) => ({
			wch: Math.max(
				c.label.length + 2,
				...rows.slice(0, 20).map(r => String(resolveValue(r, c, 0)).length + 2)
			)
		}))

		XLSX.utils.book_append_sheet(wb, ws, "Report")
		const fileName = (title || "Report").replace(/\s+/g, "_") + "_" + dayjs().format("YYYYMMDD") + ".xlsx"
		XLSX.writeFile(wb, fileName)
	}

	function exportPDF({ title, dateRange, department, summaryCards, columns, rows }) {
		if (!rows || !rows.length) return

		const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
		const pageWidth = doc.internal.pageSize.getWidth()

		// ICD Purple header
		doc.setFillColor(123, 47, 175) // #7B2FAF
		doc.rect(0, 0, pageWidth, 24, "F")
		doc.setTextColor(255, 255, 255)
		doc.setFontSize(16)
		doc.setFont(undefined, "bold")
		doc.text("iCD   " + (title || "Report"), 14, 11)
		doc.setFontSize(9)
		doc.setFont(undefined, "normal")
		doc.text((dateRange || "") + "  |  " + (department || "All Departments"), 14, 18)
		doc.text("Generated: " + dayjs().format("DD-MM-YYYY, h:mm A"), pageWidth - 14, 18, { align: "right" })

		let yPos = 30

		// Summary cards
		if (summaryCards && summaryCards.length) {
			const cardWidth = (pageWidth - 28 - (summaryCards.length - 1) * 4) / summaryCards.length
			summaryCards.forEach((card, i) => {
				const x = 14 + i * (cardWidth + 4)
				doc.setFillColor(249, 250, 251)
				doc.roundedRect(x, yPos, cardWidth, 14, 2, 2, "F")
				doc.setTextColor(31, 41, 55)
				doc.setFontSize(12)
				doc.setFont(undefined, "bold")
				doc.text(String(card.value), x + cardWidth / 2, yPos + 6, { align: "center" })
				doc.setFontSize(7)
				doc.setFont(undefined, "normal")
				doc.setTextColor(107, 114, 128)
				doc.text(card.label, x + cardWidth / 2, yPos + 11, { align: "center" })
			})
			yPos += 20
		}

		// Data table
		const head = [columns.map(c => c.label)]
		const body = rows.map((r, i) => columns.map(c => String(resolveValue(r, c, i))))

		doc.autoTable({
			head,
			body,
			startY: yPos,
			margin: { left: 14, right: 14 },
			styles: { fontSize: 8, cellPadding: 2 },
			headStyles: {
				fillColor: [243, 244, 246],
				textColor: [55, 65, 81],
				fontStyle: "bold",
				fontSize: 7,
			},
			alternateRowStyles: { fillColor: [249, 250, 251] },
			didDrawPage: (data) => {
				const pageHeight = doc.internal.pageSize.getHeight()
				doc.setFontSize(7)
				doc.setTextColor(156, 163, 175)
				doc.text(
					"iCD - Servers. Scale. Support.  |  www.icloudist.com  |  GENIUS HR System",
					pageWidth / 2,
					pageHeight - 6,
					{ align: "center" }
				)
				doc.text(
					`Page ${data.pageNumber} of {totalPages}`,
					pageWidth - 14,
					pageHeight - 6,
					{ align: "right" }
				)
			}
		})

		// Second pass: replace placeholder with actual total
		const totalPages = doc.internal.getNumberOfPages()
		for (let i = 1; i <= totalPages; i++) {
			doc.setPage(i)
			// Overwrite the placeholder area
			const pageHeight = doc.internal.pageSize.getHeight()
			doc.setFillColor(255, 255, 255)
			doc.rect(pageWidth - 50, pageHeight - 9, 50, 6, "F")
			doc.setFontSize(7)
			doc.setTextColor(156, 163, 175)
			doc.text(
				`Page ${i} of ${totalPages}`,
				pageWidth - 14,
				pageHeight - 6,
				{ align: "right" }
			)
		}

		const fileName = (title || "Report").replace(/\s+/g, "_") + "_" + dayjs().format("YYYYMMDD") + ".pdf"
		doc.save(fileName)
	}

	return { exportExcel, exportPDF }
}
