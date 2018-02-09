var GPIO = require('onoff').Gpio;
const dateFormat = require('dateformat');
import { devicePins } from '../config/pins';

class automate {
  constructor(device, onTime, offTime){
    this.deviceToAutomate = new GPIO(devicePins[`${device}`], 'out');
    this.onTime = onTime;
    this.offTime = offTime
    this.state = true
  }
  run = () => {
    this.deviceToAutomate.writeSync(1);
    var timeinterval = setInterval(()=>{
      if (timeinterval._called){
        if (this.onTime === this.offTime){
          this.state = !this.state;
          this.deviceToAutomate.writeSync(Number(!this.state));
        }
        if (timeinterval._repeat === this.offTime) {
          timeinterval._repeat = this.onTime;
          this.deviceToAutomate.writeSync(1);
        } else if (timeinterval._repeat === this.onTime) {
          timeinterval._repeat = this.offTime;
          this.deviceToAutomate.writeSync(0);
        }
      }
    }, this.onTime);
  }
}

export let automateDevice = (device, state, onTime, offTime) => {

  switch (device) {
    case 'led':
      var led = new automate(device, onTime, offTime)
      led.run();
      break;

    case 'idleLed':
      var idleLed = new automate(device, onTime, offTime)
      idleLed.run();
      break;

    case 'pump':
      var pump = new automate(device, onTime, offTime)
      pump.run();
      break;

    default:

  }
}

let killAllOutput = (state) =>{
  let toKill = Object.values(devicePins);
  for (var i = 0; i < toKill.length; i++) {
    toKill[i]
    let applySignal = new GPIO(toKill[i], 'out');
    applySignal.writeSync(Number(!state));
  }
}

export let startSequence = () => {
  killAllOutput(true);
}
