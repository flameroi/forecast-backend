module.exports= function (res) {
    let real, other=[], tomorow=[]
    for (const data of res) {
        for (const label of data.labels) {
            if (label.name === 'index') {
                if (label.value === '0') {
                    real = data
                } else if (label.value <= 3){
                    tomorow.push(data)
                }
                else {
                    other.push(data)
                }
                break
            }
        }
    }

    const items= []
    let mastomas= []
    let coherence = []

    for (const { labels, data } of tomorow) {
        let valueSource
        for (const label of labels) {
            if (label.name === 'valueSource') {
                valueSource= label.value
                break
            }
        }
        let valueMas= []
        let err= 0
        let rms= 0

        for (const [i, sample] of data.entries()) {
            valueMas.push(sample.value)
            if (real.data.length > i) {
                const realSample = real.data[i]
                err = err + (realSample.value - sample.value)
                rms = rms + Math.pow(realSample.value - sample.value, 2)
            }
            else {
                break
            }
        }

        err= err / real.data.length
        rms= rms / real.data.length


        const item= {
            valueSource,
            err,
            rms,
        }
        mastomas.push(valueMas)
        items.push(item)
    }

    coherence = massiveCoherence(mastomas)


    mastomas= []

    for (const { labels, data } of other) {
        let valueSource
        for (const label of labels) {
            if (label.name === 'valueSource') {
                valueSource= label.value
                break
            }
        }
        let valueMas= []
        let err= 0
        let rms= 0

        for (const [i, sample] of data.entries()) {
            valueMas.push(sample.value)
            if (real.data.length > i) {
                const realSample = real.data[i]
                err = err + (realSample.value - sample.value)
                rms = rms + Math.pow(realSample.value - sample.value, 2)
            }
            else {
                break
            }
        }

        err= err / real.data.length
        rms= rms / real.data.length


        const item= {
            valueSource,
            err,
            rms,
        }
        mastomas.push(valueMas)
        items.push(item)
    }

    coherence = coherence.concat(massiveCoherence(mastomas))
    console.log(coherence)
    for(let i = 0; items.length - i !=0; i++){
        let valueSource = items[i].valueSource, err = items[i].err, rms = items[i].rms, chnc = coherence[i];
        let item ={
            valueSource,
            err,
            rms,
            chnc
        }
        items.shift()
        items.push(item);

    }

    return items
}

function massiveCoherence(mas) {
    if (mas == null) {
        return 0;
    }
    let sqtrand = [];
    for (let j = 0; j < mas[0].length; j++) {
        let x = (mas[0][j]+mas[1][j]+mas[2][j]) / 3
        sqtrand.push(x)
    }



    //ряды тренда
    trandCoherence = [0, 0, 0];
    for (let i = 0; i < sqtrand.length; ++i) {
        trandCoherence[0] = trandCoherence[0] + Math.abs(sqtrand[i] - mas[0][i])
        trandCoherence[1] = trandCoherence[1] + Math.abs(sqtrand[i] - mas[1][i])
        trandCoherence[2] = trandCoherence[2] + Math.abs(sqtrand[i] - mas[2][i])
    }

    let result = [];
    console.log(trandCoherence[0],trandCoherence[1],trandCoherence[2])
    result.push(100 - Math.round((trandCoherence[0] / sqtrand.length) * 150)/100);
    result.push(100 - Math.round((trandCoherence[1] / sqtrand.length) * 150)/100);
    result.push(100 - Math.round((trandCoherence[2] / sqtrand.length) * 150)/100);

    return result
}

