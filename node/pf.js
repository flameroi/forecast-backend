module.exports= function (res) {
    let real, other = [], tomorow = []
    for (const data of res) {
        for (const label of data.labels) {
            if (label.name === 'index') {
                if (label.value === '0') {
                    real = data
                } else if (label.value > 3) {
                    other.push(data)
                } else {
                    tomorow.push(data)
                }
                break
            }
        }
    }

    const items = []
    let forecast = []
    let lasterr = 1000;

    for (const {labels, data} of tomorow) {
        let valueSource
        for (const label of labels) {
            if (label.name === 'valueSource') {
                valueSource = label.value
                break
            }
        }

        let rms = 0
        let newforecast = []

        for (const [i, sample] of data.entries()) {
            newforecast.push(sample.value)
            if (newforecast.length > 4) {
                newforecast.shift()
            }
            if (real.data.length > i) {
                const realSample = real.data[i]
                rms = rms + Math.pow(realSample.value - sample.value, 2)
            } else {

            }
        }
        rms = rms / real.data.length
        if (rms < lasterr) {
            lasterr = rms;
            forecast = newforecast;
        }

    }
    for (let i = 0; i < 4; i++) {
        items.push(forecast[i])
    }


    lasterr = 1000;
    forecast = []

    for (const {labels, data} of other) {
        let valueSource
        for (const label of labels) {
            if (label.name === 'valueSource') {
                valueSource = label.value
                break
            }
        }

        let rms = 0
        let newforecast = []

        for (const [i, sample] of data.entries()) {

            newforecast.push(sample.value)
            if (newforecast.length > 4) {
                newforecast.shift()
            }

            if (real.data.length > i) {
                const realSample = real.data[i]
                rms = rms + Math.pow(realSample.value - sample.value, 2)
            } else {

            }
        }


        rms = rms / real.data.length

        if (rms < lasterr) {
            lasterr = rms;
            forecast = newforecast;
        }
    }

    for (let i = 0; i < 4; i++) {
        items.push(forecast[i])
    }

    return items
}