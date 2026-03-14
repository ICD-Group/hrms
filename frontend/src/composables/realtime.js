import { reactive, getCurrentScope, onScopeDispose } from "vue"

const subscribed = reactive({})

export function useListUpdate(socket, doctype, callback) {
	subscribe(socket, doctype)
	const handler = (data) => {
		if (data.doctype == doctype) {
			callback(data.name)
		}
	}
	socket.on("list_update", handler)

	// Cleanup when the calling component's scope is disposed
	if (getCurrentScope()) {
		onScopeDispose(() => {
			socket.off("list_update", handler)
		})
	}
}

function subscribe(socket, doctype) {
	if (subscribed[doctype]) return

	socket.emit("doctype_subscribe", doctype)
	subscribed[doctype] = true
}
