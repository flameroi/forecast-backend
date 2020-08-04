const App= require('koa')
const AppBody= require('koa-body')
const AppRouter= require('koa-router')
const AppStatic= require('koa-static')

const { RedisTimeSeriesFactory, Sample, Label, FilterBuilder, Aggregation, AggregationType }= require('redis-time-series-ts')
const { TimestampRange }= require('redis-time-series-ts/lib/entity/timestampRange')

const xlsx= require('node-xlsx').default

const PORT= 8000

const Redis= new RedisTimeSeriesFactory({
    host: 'roi.ntech.team',
    port: 6379
})

const redis= Redis.create()

const app= new App()
const api= new AppRouter()

api.get('/api/v1', function (ctx) {
    ctx.body= {
        version: 1,
    }
})

api.get('/api/v1/indications', async function (ctx) {
    const { key, timestampFrom, timestampTo }= ctx.request.query
    if (!key || !timestampFrom || !timestampTo) {
        ctx.status= 400
        ctx.body= {
            message: 'Wrong params'
        }
    } else {
        try {
            const range= new TimestampRange((new Date(timestampFrom)).getTime(), (new Date(timestampTo)).getTime())
            const filter= new FilterBuilder('valueType', key)
            const aggregation= new Aggregation(AggregationType.AVG, 1000 * 60 * 60 * 6)
            const res= await redis.multiRange(range, filter, undefined, aggregation, true)
            ctx.body= transformIndications(res)
        } catch (error) {
            console.error(error)
            ctx.status= 500
            ctx.body= {
                name: error.name,
                message: error.message,
            }
        }
    }
})

api.get('/api/v1/indications/analyze', async function (ctx) {
    const { key, timestampFrom, timestampTo }= ctx.request.query
    if (!key || !timestampFrom || !timestampTo) {
        ctx.status= 400
        ctx.body= {
            message: 'Wrong params'
        }
    } else {
        try {
            const range= new TimestampRange((new Date(timestampFrom)).getTime(), (new Date(timestampTo)).getTime())
            const filter= new FilterBuilder('valueType', key)
            const aggregation= new Aggregation(AggregationType.AVG, 1000 * 60 * 60 * 6)
            const res= await redis.multiRange(range, filter, undefined, aggregation, true)
            ctx.body= require('./analyze')(res)
        } catch (error) {
            console.error(error)
            ctx.status= 500
            ctx.body= {
                name: error.name,
                message: error.message,
            }
        }
    }
})

api.get('/api/v1/indications/pf', async function (ctx) {
    const { key, timestampFrom, timestampTo }= ctx.request.query
    if (!key || !timestampFrom || !timestampTo) {
        ctx.status= 400
        ctx.body= {
            message: 'Wrong params'
        }
    } else {
        try {
            const range= new TimestampRange((new Date(timestampFrom)).getTime(), (new Date(timestampTo)).getTime())
            const filter= new FilterBuilder('valueType', key)
            const aggregation= new Aggregation(AggregationType.AVG, 1000 * 60 * 60 * 6)
            const res= await redis.multiRange(range, filter, undefined, aggregation, true)
            ctx.body= require('./pf')(res)
        } catch (error) {
            console.error(error)
            ctx.status= 500
            ctx.body= {
                name: error.name,
                message: error.message,
            }
        }
    }
})






let upload= null

api.post('/api/v1/upload', AppBody({ formidable:{ uploadDir:'./uploads' }, multipart:true, urlencoded:true }), async function (ctx) {
    if (!ctx.request.files.file) {
        ctx.status = 400
        ctx.body = {
            message: 'Empty file'
        }
    } else if (ctx.request.files.file.name.slice(-5) !== '.xlsx') {
        ctx.status = 400
        ctx.body = {
            message: 'Wrong file'
        }
    } else {
        uploadData(ctx.request.files.file)
        ctx.status= 201
        ctx.body= {
            upload
        }
    }
})

api.get('/api/v1/upload', async function (ctx) {
    ctx.status= 200
    ctx.body= {
        upload
    }
})

api.delete('/api/v1/upload', async function (ctx) {
    if (upload && (upload.finished || upload.error)) {
        upload= null
        ctx.status= 200
        ctx.body= {
            upload
        }
    } else {
        ctx.status= 500
        ctx.body= {
            message: 'Cannot delete upload'
        }
    }
})

app.use(AppStatic('public'))
app.use(api.routes())

app.listen(PORT, () => {
    console.log('listening on port', PORT)
})

function transformIndications(res) {
    res.sort(function (a, b) {
        let aIndex
        for (const label of a.labels) {
            if (label.name === 'index') {
                aIndex= Number(label.value)
            }
        }
        let bIndex
        for (const label of b.labels) {
            if (label.name === 'index') {
                bIndex= Number(label.value)
            }
        }
        return aIndex - bIndex
    })
    return res
}

async function uploadData(file) {
    upload= {
        finished: false,
        error: null,
        progressTotal: 0,
        progressCurrent: 0,
    }
    try {

        await redis.deleteAll()
        const sheets= xlsx.parse(file.path, { cellDates:true })
        upload.progressTotal= sheets.reduce((total, sheet) => {
            return total + sheet.data.reduce((total, row) => {
                return total + 1
            }, 0)
        }, 0)
        upload.progressCurrent= 0
        for (const [i, sheet] of sheets.entries()) {
            const name= sheet.name
            const data= sheet.data.reverse()

            for (const [j, row] of data.entries()) {
                const timestamp= row[0]

                const temperature= row[1]
                const temperatureKey= [name, 'temperature'].join(':')
                const temperatureSample= new Sample(temperatureKey, temperature, timestamp)
                await redis.add(temperatureSample, [ new Label('index', i), new Label('valueSource', name), new Label('valueType', 'temperature') ], 0)

                const pressure= row[2]
                const pressureKey= [name, 'pressure'].join(':')
                const pressureSample= new Sample(pressureKey, pressure, timestamp)
                await redis.add(pressureSample, [ new Label('index', i), new Label('valueSource', name), new Label('valueType', 'pressure') ], 0)

                const humidity= row[3] / 100
                const humidityKey= [name, 'humidity'].join(':')
                const humiditySample= new Sample(humidityKey, humidity, timestamp)
                await redis.add(humiditySample, [ new Label('index', i), new Label('valueSource', name), new Label('valueType', 'humidity') ], 0)

                upload.progressCurrent++

                //console.log('row', timestamp, temperature, pressure, humidity)
            }
        }
        upload.finished= true

    } catch (error) {
        upload.error= {
            name: error.name,
            code: error.code,
            message: error.message,
        }
    }
}
