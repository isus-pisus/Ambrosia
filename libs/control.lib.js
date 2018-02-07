var GPIO = require('onoff').Gpio;
const dateFormat = require('dateformat');
import { devicePins } from '../config/pins';

class automate {
  constructor(device, onTime, offTime){
    this.deviceToAutomate = new GPIO(devicePins[`${device}`], 'out');
    this.onTime = onTime;
    this.offTime = offTime;
  }
  run = () => {
    this.deviceToAutomate.writeSync(1);
    setInterval(()=>{
      this.deviceToAutomate.writeSync(0);
      setTimeout(()=> {
        this.deviceToAutomate.writeSync(1);
      }, this.offTime);
    }, this.onTime);
  }
}


let automateDevice = (device, state, onTime, offTime) => {

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
