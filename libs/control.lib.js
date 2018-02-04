var GPIO = require('onoff').Gpio;
import { devicePins } from '../config/pins';

// led beacon
export let beacon = () => {
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

export let automateDevice = (device, state, duration) => {

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
