/** - get route list and store it routesData
 *
 *  - once user input route number and pressed enter (968),
 *      filter the route list in routesData (route === input),
 *      then show all result (元朗(西) => 銅鑼灣(天后))
 *
 *  - after user clicking the route, make route stop request,
 *      since stops in response is ID, get chinese name of stop,
 *      then show then
 */
const INBOUND = 'inbound';
const OUTBOUND = 'outbound';

let stopData = new Map();
initStopData();

let routesData;
fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/')
  .then((res) => res.json())
  .then((obj) => {
    routesData = obj.data;
    console.log('routesData', routesData);
  });
console.log('routesData', routesData);

const inputRoute = document.getElementById('input-route');
const btnSearch = document.getElementById('btn-search');
const divRoutes = document.getElementById('routes');
const divRouteStop = document.getElementById('routeStop');
// console.log(inputRoute);
// console.log(btnSearch);

btnSearch.addEventListener('click', (event) => {
  console.log('inputRoute: ', inputRoute.value);
  let target = inputRoute.value.toUpperCase();

  // filter routes by user input
  let res = routesData.filter((el) => el.route === target);
  console.log('res', res);

  // print filtered routes
  clearRoutes();
  clearRouteStop();

  res.forEach((routeObj) => {
    let str = `${routeObj.orig_tc} ➡️ ${routeObj.dest_tc}`;
    console.log(str);

    let btnRoute = document.createElement('button');
    btnRoute.innerText = str;
    divRoutes.append(btnRoute);

    // add on click handler to button
    btnRoute.addEventListener('click', (event) => {
      // call API
      // const api =  "https://data.etabus.gov.hk/v1/transport/kmb/route-stop/{route}/{direction}/{service_type}";
      let { route, bound, service_type } = routeObj;
      direction = boundShortToLong(bound);

      fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/${direction}/${service_type}`
      )
        .then((res) => res.json())
        .then((routeStopObj) => {
          console.log('route-stop', routeStopObj);
          let routeStopArr = routeStopObj.data;

          clearRouteStop();

          // get route stop name and print
          routeStopArr.forEach((stop) => {
            let pStop = document.createElement('p');
            let stopId = stop.stop;
            let stopName = getStopNameById(stopId);
            pStop.textContent = stopName;

            divRouteStop.append(pStop);
          });
        });
    });
  });
});

function boundShortToLong(char) {
  if (char !== 'I' && char !== 'O')
    console.warn('Error boundShortToLong: char should be i or o');

  if (char === 'I') return INBOUND;
  if (char === 'O') return OUTBOUND;
}

function initStopData() {
  fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop')
    .then((res) => res.json())
    .then((data) => {
      console.log('stopData:', data);
      data.data.forEach((stopObj) => {
        stopData.set(stopObj.stop, stopObj);
      });
    });
}

function getStopNameById(stopId) {
  return stopData.get(stopId).name_tc;
}

function clearRouteStop() {
  divRouteStop.replaceChildren();
}

function clearRoutes() {
  divRoutes.replaceChildren();
}
