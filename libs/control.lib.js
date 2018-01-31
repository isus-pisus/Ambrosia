var GPIO = require('onoff').Gpio;

var led = new GPIO(17, 'out');

export let automateDevice = (device, state, duration) => {
  if (device == 'led' && state == true){
    setTimeout(()=> {
      led.writeSync(1);
    }, duration);
  }else{
    led.writeSync(0);
  }
}
