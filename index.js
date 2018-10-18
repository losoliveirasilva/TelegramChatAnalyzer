const waitForCalls = (count, fn) => {
	let counter = 0
	return () => {
		counter += 1
		if (counter === count) {
			fn()
		}
	}
}


const messagesPerAuthor = peopleMsg => {
	let counter = new Map()
	for (const {author} of peopleMsg) {
		counter.set(author, (counter.get(author) || 0) + 1)
	}
	return counter
}

const countWords = peopleMsg => {
	let counter = new Map()
	for (let {text} of peopleMsg.filter(msg => msg.type === 'text')) {
		const words = text.normalize('NFKD').toLowerCase().match(/[a-z0-9]+/g) || []
		for (let word of words) {
			counter.set(word, (counter.get(word) || 0) + 1)
		}
	}
	return counter
}

document.addEventListener('DOMContentLoaded', () => {
	const upload = document.upload || document.querySelector('[name="upload"]')

	const fileInput = upload.querySelector('input[type="file"]')

	fileInput.addEventListener('change', event => {
		if (event.target.files.length > 0) {
		  const fileSubmit = upload.querySelector('input[type="submit"]')
		  fileSubmit.disabled = false
		}
	})

	upload.addEventListener('submit', event => {
		event.preventDefault()

		const peopleMsg = []
		const callback = waitForCalls(fileInput.files.length, () => {
			console.log(messagesPerAuthor(peopleMsg))

			console.log(Array.from(countWords(peopleMsg).entries()).sort((a, b) => {
				return a[1] < b[1]
			}))
		})

		for (let file of fileInput.files) {
			const reader = new FileReader();

			// Closure to capture the file information.
			reader.onload = e => {
				const {result} = reader
				const parser = new DOMParser()
				const doc = parser.parseFromString(result, "text/html")
				const messages = doc.querySelectorAll(".history .message.default")
				
				let name = null
				for (let message of messages) {
					if (!message.classList.contains("joined")) {
						const nameTag = message.querySelector(".from_name")
						name = nameTag.innerText.trim()
					}

					const id = +message.id.substr(7)  // cut off 'message'

					const metadata = {id, author: name}
					const msgMedia = message.querySelector('.media')
					const msgText = message.querySelector('.text')
					if (msgMedia !== null) {
						metadata.type = 'media'
						metadata.description = msgMedia.querySelector('.details').innerText.trim()
						metadata.title = msgMedia.querySelector('.title').innerText.trim()
					} else if (msgText !== null) {
						metadata.type = 'text'
						metadata.text = msgText.innerText.trim()
					} else {
						console.warning('Unrecognized message:', message)
					}

					const msgReplyTo = message.querySelector('.reply_to')
					if (msgReplyTo !== null) {
						reply_id = +msgReplyTo.querySelector('a').href.substr(14)  // cut off '#go_to_message'
						metadata.reply_to = reply_id
					}
					
					peopleMsg.push(metadata)
				}
				callback()

			}

			reader.readAsText(file)

		}

	}, false)

})
