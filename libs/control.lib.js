var GPIO = require('onoff').Gpio;
import { devicePins } from '../config/pins';

// led beacon
let beacon = () => {
  let idleLed = new GPIO(devicePins['idleLed'], 'out');
  setInterval(()=>{
    idleLed.writeSync(1);
    setTimeout(()=> {
      idleLed.writeSync(0);
    }, 100);

  }, 3000);
}


let run = (device, state, duration) => {
  let applySignal = new GPIO(devicePins[`${device}`], 'out');

  applySignal.writeSync(Number(state));
  setTimeout(()=> {
    applySignal.writeSync(Number(!state));
  }, duration);

}

let automateDevice = (device, state, duration) => {

  switch (device) {
    case 'led':

      run(device, state, duration);
      break;

    case 'fan':

      run(device, state, duration);
      break;

    case 'pump':
      run(device, state, duration);
      break;

    default:


  }
}

let killAllOutput = (state) =>{
  // console.log(devicePins);
  let toKill = Object.values(devicePins);
  for (var i = 0; i < toKill.length; i++) {
    toKill[i]
    let applySignal = new GPIO(toKill[i], 'out');
    applySignal.writeSync(Number(!state));

    // console.log();
  }
}

export let startSequence = () => {
  // TODO: write cleaner code for turning on devices
  // turn on pump every 20 min for 30 sec
  setInterval(()=>{
    automateDevice('pump', true, 3*1000);

  }, 3*1000);
  // }, 20*60*1000);

  // turn on pump every 12 hours for 12 hours
  setInterval(()=>{
    automateDevice('led', true, 12*60*60*1000);

  }, 12*60*60*1000);
  // flash signal led

  killAllOutput(true);

  beacon();
}
