import { alertController } from "@ionic/vue"

export const showErrorAlert = async (message) => {
	const alert = await alertController.create({
		header: "Error",
		message,
		buttons: ["OK"],
	})

	await alert.present()
}
