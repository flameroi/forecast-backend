const xlsx= require('node-xlsx').default
const { RedisTimeSeriesFactory, Label, Sample }= require('redis-time-series-ts')

const Redis= new RedisTimeSeriesFactory({
    host: 'roi.ntech.team',
    port: 6379
})

const redis= Redis.create()

async function main() {

    await redis.deleteAll()

    const sheets= xlsx.parse(`./input.xlsx`, { cellDates:true })
    const data= sheets[0].data.reverse()
    for (const [index, row] of data.entries()) {
        const timestamp= row[0]

        const temperature= row[1]
        const temperatureKey= 'temperature'
        const temperatureSample= new Sample(temperatureKey, temperature, timestamp)
        await redis.add(temperatureSample, undefined, )

        const pressure= row[2]
        const pressureKey= 'pressure'
        const pressureSample= new Sample(pressureKey, pressure, timestamp)
        await redis.add(pressureSample, undefined, )

        const humidity= row[3] / 100
        const humidityKey= 'humidity'
        const humiditySample= new Sample(humidityKey, humidity, timestamp)
        await redis.add(humiditySample, undefined, )

        console.log('row', timestamp, temperature, pressure, humidity)
    }

}

main()
