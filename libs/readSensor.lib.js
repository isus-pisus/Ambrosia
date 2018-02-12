const sensorLib = require('node-dht-sensor');
const ds18b20 = require('ds18b20');
const rpiDhtSensor = require('rpi-dht-sensor');

/*
  sensorLib.read(sensorType, pin) takes two parameter, fist of which is the type/id of device and the
  number pin the sensor is connected to on the pi
*/

var readout = sensorLib.read(11, 6);

// getTemperature() measures the temperature and returns its value when called

export let getTemperature = () => {
  return ds18b20.temperatureSync('28-00000853833b')
}

// getHumidity() measures the  humidity and returns its value when called

export let getHumidity= () => {
  return readout.humidity.toFixed(0)
}
