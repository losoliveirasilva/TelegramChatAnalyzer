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
		const words = text.normalize('NFKD').toLowerCase().split(/([[:punct:]]|\s)+/) || []
		for (let word of words) {
			counter.set(word, (counter.get(word) || 0) + 1)
		}
	}
	return counter
}

const convertDurationToSeconds = duration => {
	durationArr = duration.split(",")
	durationArr = durationArr[0].split(":")
	return (+durationArr[0] * 60) + +durationArr[1]
}

const countVoice = peopleMsg => {
	let counter = new Map()
	for (const {author, duration} of peopleMsg.filter(msg => msg.type === 'voice')) {
		const [a, b] = counter.get(author) || [0, 0]
		counter.set(author, [a + 1, b + convertDurationToSeconds(duration)])
	}
	return counter
}

const countMsgPerHour = (peopleMsg, authorSelected) => {
	let counter = new Map()
	const msg = authorSelected === 'All' ? peopleMsg : peopleMsg.filter(msg => msg.author === authorSelected)
	for (const {date} of msg) {
		let dateTime = date.split(' ')
		let time = dateTime[1]
		let hour = time.split(':')
		counter.set(hour[0], (counter.get(hour[0]) || 0) + 1)
	}

	console.log(counter)
	let counterSorted = Array.from(counter.entries()).sort((a, b) => {
		return a[0] > b[0]
	})
	console.log(counterSorted)
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

			countMsgPerHour(peopleMsg, 'All')

			let wordsSort = Array.from(countWords(peopleMsg).entries()).sort((a, b) => {
				return a[1] < b[1]
			})

            const authorMsgSort = Array.from(messagesPerAuthor(peopleMsg).entries())
                .map(([name, value]) => ({name, value}))
                .sort((a, b) => a.value < b.value)

			let authorVoiceSort = Array.from(countVoice(peopleMsg).entries()).sort((a, b) => {
				return a[1] < b[1]
			})

			let body = document.querySelector(".output")
            while (body.firstChild) {
                body.removeChild(body.firstChild)
            }

			let tbl = document.createElement("table")
			let tblBody = document.createElement("tbody")

			for (let tableAuthor of authorVoiceSort) {
				let row = document.createElement("tr")

				tblBody.appendChild(row)

				let cellA = document.createElement("td");
				let cellAText = document.createTextNode(tableAuthor[0]);
				cellA.appendChild(cellAText);
				row.appendChild(cellA);

				let cellN = document.createElement("td");
				let cellNText = document.createTextNode(tableAuthor[1]);
				cellN.appendChild(cellNText);
				row.appendChild(cellN);
			}

			let tbl2 = document.createElement("table")
			let tblBody2 = document.createElement("tbody")

			let counter = 0
			for (let tableMsg of wordsSort) {
				if (counter === 2000)
					continue
				else
					counter += 1

				let row = document.createElement("tr")

				tblBody2.appendChild(row)

				let cellA = document.createElement("td");
				let cellAText = document.createTextNode(tableMsg[0]);
				cellA.appendChild(cellAText);
				row.appendChild(cellA);

				let cellN = document.createElement("td");
				let cellNText = document.createTextNode(tableMsg[1]);
				cellN.appendChild(cellNText);
				row.appendChild(cellN);
			}


			tbl.appendChild(tblBody)
			tbl2.appendChild(tblBody2)
			let br = document.createElement("br")
			body.appendChild(tbl)
			body.appendChild(br)
			body.appendChild(tbl2)
			tbl.setAttribute("border", "2")
			tbl2.setAttribute("border", "1")

            const canvas = document.createElement('canvas')
            canvas.width = 500
            canvas.height = 500

            const context = canvas.getContext('2d')
            body.appendChild(canvas)

            const {width, height} = canvas
            const radius = Math.min(width, height) / 2

            const arc = d3.arc()
                .outerRadius(radius - 10)
                .innerRadius(radius - 90)
                .context(context)

            const labelArc = d3.arc()
                .outerRadius(radius - 50)
                .innerRadius(radius - 50)
                .context(context)

            const pie = d3.pie().value(d => d.value)
            context.translate(width / 2, height / 2)

            const arcs = pie(authorMsgSort)
            const colors = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]
            arcs.forEach((d, i) => {
                context.beginPath()
                arc(d)
                context.fillStyle = colors[i % colors.length]
                context.fill()
            })

            context.beginPath()
            arcs.forEach(arc)
            context.strokeStyle = '#fff'
            context.stroke()

            context.font = '1em'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillStyle = '#000'
            arcs.forEach(d => {
                const c = labelArc.centroid(d)
                context.fillText(d.data.name, c[0], c[1])
            })

            const authorMsgSortbyName = authorMsgSort.sort((a, b) => a.name > b.name)
			let selectList = document.createElement("select");
			selectList.id = "mySelect";
			body.appendChild(selectList);

			let optionAll = document.createElement('option')
			optionAll.value = 'All'
			optionAll.text = 'All'
			selectList.appendChild(optionAll);
			for (const {name} of authorMsgSortbyName) {
				let option = document.createElement("option");
				option.value = name;
				option.text = name;
				selectList.appendChild(option);
			}

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
					metadata.date = message.querySelector('.date').title
					const msgMediaVoiceMessage = message.querySelector('.media_voice_message')
					const msgMediaPhoto = message.querySelector('.media')
					const msgText = message.querySelector('.text')
					if (msgMediaVoiceMessage !== null) {
						metadata.type = 'voice'
						metadata.duration = msgMediaVoiceMessage.querySelector('.details').innerText.trim()
						metadata.title = msgMediaVoiceMessage.querySelector('.title').innerText.trim()
					} else if (msgMediaPhoto !== null) {
						metadata.type = 'photo'
					} else if (msgText !== null) {
						metadata.type = 'text'
						metadata.text = msgText.innerText.trim()
					} else {
						console.log('Unrecognized message:', message)
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
