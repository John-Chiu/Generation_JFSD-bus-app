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
const divRouteStop = document.getElementById('routeStops');
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
  clearRouteStopETA();

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
      direction = boundShortToLongForm(bound);

      fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/${direction}/${service_type}`
      )
        .then((res) => res.json())
        .then((routeStopObj) => {
          console.log('route-stop', routeStopObj);
          let routeStopArr = routeStopObj.data;

          clearRouteStop();
          clearRouteStopETA();

          // get route stop name and create html element, then append to the DOM
          routeStopArr.forEach((routeStop) => {
            let divStop = document.createElement('p');
            let stopId = routeStop.stop;
            let stopName = getStopNameById(stopId);
            divStop.classList.add('stop');

            let p_Seq = document.createElement('p');
            p_Seq.innerText = routeStop.seq;

            // divStop.innerText = `${routeStop.seq} ${stopName}`;
            divStop.append(p_Seq);
            divStop.innerHTML += stopName;

            divStop.addEventListener('click', (e) => {
              clearRouteStopETA();

              fetch(
                `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${service_type} `
              )
                .then((res) => res.json())
                .then((ETA_Obj) => {
                  console.log('ETA_Obj', ETA_Obj);
                  // get eta time, create HTML elem then append to DOM
                  let dataArr = ETA_Obj.data;
                  let pTimeArr = dataArr.map((el) => {
                    let datetime = new Date(el.eta);
                    let pStop = document.createElement('p');

                    if (el.eta === null) {
                      pStop.innerText = '未有班次資料';
                    } else {
                      pStop.innerText = datetime.toTimeString().slice(0, 5);
                    }

                    return pStop;
                  });

                  clearRouteStopETA();
                  let div = createRouteStopETADiv();
                  div.append(...pTimeArr);
                  divRouteStopETA.append(div);
                });
            });

            divRouteStop.append(divStop);
          });
        });
    });
  });
});

function createRouteStopETADiv() {
  let div = document.createElement('div');
  let title = document.createElement('h3');
  title.innerText = '下班車時間';
  div.append(title);
  return div;
}

function boundShortToLongForm(char) {
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

const divRouteStopETA = document.getElementById('routeStopETA');
function clearRouteStopETA() {
  divRouteStopETA.replaceChildren();
}

function clearAllBusContent() {
  clearRoutes();
  clearRouteStop();
  clearRouteStopETA();
}
