module.exports= function (res) {
    let real, other=[]
    for (const data of res) {
        for (const label of data.labels) {
            if (label.name === 'index') {
                if (label.value === '0') {
                    real = data
                } else {
                    other.push(data)
                }
                break
            }
        }
    }

    const items= []
    const mastomas= []

    for (const { labels, data } of other) {

        let valueMas = []
        for (const [i, sample] of data.entries()) {
            //console.log(i,sample.value, sample)
            valueMas.push(sample.value)
        }
        mastomas.push(valueMas)
    }


    let coherence = massiveCoherence(mastomas)


    return coherence
}

function massiveCoherence(mas) {
    if (mas == null) {
        return 0;
    }
    let trand = [], trandCoherence = [];
    for (let i = 0; i < mas.length; ++i) {
        if (i == 0) {
            for (let j = 1; j < mas[i].length; ++j) {
                trandCoherence.push(true);
                if (mas[i][j - 1] < mas[i][j]) {
                    trand.push(1)
                } else if (mas[i][j - 1] < mas[i][j]) {
                    trand.push(-1)
                } else {
                    trand.push(0)
                }
            }
        } else {
            for (let j = 1; j < mas[i].length; ++j) {
                if (trandCoherence[j - 1]) {
                    console.log(mas[i][j - 1] < mas[i][j], trand[j - 1] != 1)
                    if ((mas[i][j - 1] < mas[i][j] && trand[j - 1] == 1) || (mas[i][j - 1] > mas[i][j] && trand[j - 1] == -1) || (mas[i][j - 1] == mas[i][j] && trand[j - 1] == 0)) {
                    } else {
                        trandCoherence[j - 1] = false;
                    }
                }
            }
        }
    }


    if (trandCoherence.length == 0) {
        return 0;
    }
    let result = 0;
    for (let i = 0; i < trandCoherence.length; ++i) {
        if (!trandCoherence[i]) {
            result++
        }
    }

    result = result / trandCoherence.length;
    return result;
}
