const sensorLib = require('node-dht-sensor');
const ds18b20 = require('ds18b20');
const rpiDhtSensor = require('rpi-dht-sensor');

var readout = sensorLib.read(11, 6);

export let getTemperature = () => {
  return ds18b20.temperatureSync('28-00000853833b')

}
export let getHumidity= () => {
  return readout.humidity.toFixed(0)

}
