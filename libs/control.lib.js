var GPIO = require('onoff').Gpio;
const dateFormat = require('dateformat');
import { devicePins } from '../config/pins';

/*
  automate class takes three of four parameters passed through automateDevice() and
  creates an instance of the device to be automated.

  device => String (device name to comtrol, check config/pins.js for a list of devices that can be controlled)
  onTime => Seconds (amount of time to device should stay on)
  offTime => Seconds (amount of time device id to be turned off for)
  */

class automate {
  constructor(device, onTime, offTime){
    this.deviceToAutomate = new GPIO(devicePins[`${device}`], 'out');
    this.onTime = onTime;
    this.offTime = offTime
    this.state = true
  }

  /*
    run() is executed when the automateDevice function is called causing an instance
    of a device to be initiated. parameters this.onTime & this.offTime used to determine
    how long device is on and off. On and off action is achieved by comparing the
    '_repeat' value to both the 'this.onTime' and 'this.offTime' each time the setInterval
    function is called. If the 'timeinterval._repeat' === 'this.offTime', 'timeinterval._repeat' is
    set to the 'this.onTime' and 'timeinterval._repeat' is set to the 'this.offTime'
    if 'timeinterval._repeat' === 'this.onTime'. If both 'this.onTime' and 'this.offTime'
    are the same then the device will be in a toggle state.
  */

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

/*
  automateDevice() takes four parameters and creates a new instance of the class
  'automate'based on the 'device' parameter passed.
  automateDevice(device, state, onTime, offTime)

  device => String (device name to comtrol, check config/pins.js for a list of devices that can be controlled)
  state => Boolean (true/false, true turns the device on while false turns device off)
  onTime => Seconds (amount of time to device should stay on)
  offTime => Seconds (amount of time device id to be turned off for)
*/

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

/*
  killAllOutput() is called to allow the devices still turned on after script is
  terminated to be killed when script is called a socond time. NB this function
  MIGHT soon be deprecated

  killAllOutput(state)
  state => Boolean (true, false), setting to true kills all device on startup,

  false does nothing. For proper operation is is reccomendded to call This
  function on startup.

*/

let killAllOutput = (state) =>{
  let toKill = Object.values(devicePins);
  for (var i = 0; i < toKill.length; i++) {
    toKill[i]
    let applySignal = new GPIO(toKill[i], 'out');
    applySignal.writeSync(Number(!state));
  }
}

/*
  startInXTime() is meant to be used to call/start an automation process some time
  in the future. This function is to be called if a socket Listener 'startInXTime'
  is activated.
*/

// export let startInXTime = (startIn) => {
//     var timeinterval = setInterval(()=>{
//       if (timeinterval._called){
//
//
//         clearInterval(timeinterval);
//       }
//     }, startIn);
// }

/*
  startSequence() is contains a set of instructions to be called before any
  automation process takes place.
*/

export let startSequence = () => {
  killAllOutput(true);
}
