const INBOUND = "inbound";
const OUTBOUND = "outbound";

/**
 * A map of stop id to stop object
 * @type {Map<string, object>}
 * key is stop id (string), value is stop object
 */
let stopData = new Map();
initStopData();

let routesData;
fetch("https://data.etabus.gov.hk/v1/transport/kmb/route/")
  .then((res) => res.json())
  .then((obj) => {
    routesData = obj.data;
    console.log("routesData", routesData);
  });
console.log("routesData", routesData);

const inputRoute = document.getElementById("input-route");
const btnSearch = document.getElementById("btn-search");
const divRoutes = document.getElementById("routes");
const divRouteStop = document.getElementById("routeStops");
// console.log(inputRoute);
// console.log(btnSearch);

btnSearch.addEventListener("click", (event) => {
  console.log("inputRoute: ", inputRoute.value);
  let target = inputRoute.value.toUpperCase();

  // filter routes by user input
  let res = routesData.filter((el) => el.route === target);
  console.log("res", res);

  // print filtered routes
  clearRoutes();
  clearRouteStop();
  clearRouteStopETA();

  divRoutes.innerText = "請選擇路線:";
  res.forEach((routeObj) => {
    let str = `${routeObj.orig_tc} ➡️ ${routeObj.dest_tc}`;
    console.log(str);

    let btnRoute = document.createElement("button");
    btnRoute.innerText = str;
    divRoutes.append(btnRoute);

    // add on click handler to button
    btnRoute.addEventListener("click", (event) => {
      // call API
      // const api =  "https://data.etabus.gov.hk/v1/transport/kmb/route-stop/{route}/{direction}/{service_type}";
      let { route, bound, service_type } = routeObj;
      let boundShortForm = bound;
      let boundLongForm = getBoundLongForm(boundShortForm);

      fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/${boundLongForm}/${service_type}`
      )
        .then((res) => res.json())
        .then((routeStopObj) => {
          console.log("route-stop", routeStopObj);
          let routeStopArr = routeStopObj.data;

          clearRouteStop();
          clearRouteStopETA();

          // get route stop name and create html element, then append to the DOM
          routeStopArr.forEach((routeStop) => {
            let divStop = document.createElement("p");
            let stopId = routeStop.stop;
            let stopName = getStopNameById(stopId);
            divStop.classList.add("stop");

            let p_Seq = document.createElement("p");
            p_Seq.innerText = routeStop.seq;

            // divStop.innerText = `${routeStop.seq} ${stopName}`;
            divStop.append(p_Seq);
            divStop.innerHTML += stopName;

            // add click handler to route stop that
            // fetch and pop up a new window to show next bus time
            divStop.addEventListener("click", (e) => {
              clearRouteStopETA();
              fetch(
                `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${service_type} `
              )
                .then((res) => res.json())
                .then((ETA_Obj) => {
                  console.log("ETA_Obj", ETA_Obj);
                  // get eta time, create HTML elem then append to DOM
                  let dataArr = ETA_Obj.data;
                  // API give both bound ETA, have to filter to get our bound ETA
                  let etaArr = dataArr.filter(
                    (el) => el.dir === boundShortForm
                  );
                  console.log("filteredETA_Arr", etaArr);
                  let pTimeArr = etaArr.map((el, idx) => {
                    let datetime = new Date(el.eta);
                    let pStop = document.createElement("p");

                    if (el.eta === null) {
                      pStop.innerText = "未有班次資料";
                    } else {
                      pStop.innerText =
                        `(${idx})\t\t` + datetime.toTimeString().slice(0, 5);
                    }

                    return pStop;
                  });

                  renderRouteStopDiv(pTimeArr);
                });
            });

            divRouteStop.append(divStop);
          });
        });
    });
  });
});

const popUpDisabler = document.getElementById("popUpDisabler");
popUpDisabler.addEventListener("click", (e) => {
  function disablePopUp() {
    divRouteStopETA.style.display = "none";
    popUpDisabler.style.display = "none";
  }
  console.log("disable pop up");

  disablePopUp();
});

/**
 * re-render RouteStopDiv with given next bus time array
 * and pop it up
 * */
function renderRouteStopDiv(pTimeArr) {
  clearRouteStopETA();
  let div = createRouteStopETADiv();
  div.append(...pTimeArr);
  divRouteStopETA.append(div);
  divRouteStopETA.style.display = "block";
  divRouteStopETA.style.zIndex = 2;

  popUpDisabler.style.display = "block";
  popUpDisabler.style.zIndex = "1";
}

function createRouteStopETADiv() {
  let div = document.createElement("div");
  let title = document.createElement("h3");
  title.innerText = "下班車時間";
  div.append(title);
  return div;
}

/**
 * Recevie bound in short form, return bound in long form.
 * @param {("I" | "O")} bound bound in short form, either "I" or "O"
 * @returns long form of the bound
 */
function getBoundLongForm(bound) {
  if (bound !== "I" && bound !== "O")
    console.warn("Error boundShortToLong: char should be i or o");

  if (bound === "I") return INBOUND;
  if (bound === "O") return OUTBOUND;
}

/**
 * Fetch all stop information then store them in a map.
 * So stop name can be got from local instead of new API call.
 */
function initStopData() {
  fetch("https://data.etabus.gov.hk/v1/transport/kmb/stop")
    .then((res) => res.json())
    .then((json) => {
      console.log("Fetched stopData", json);
      json.data.forEach((stopObj) => {
        stopData.set(stopObj.stop, stopObj);
      });
    });
}

/**
 * @param {*} stopId
 * @returns {string} stop name in Traditional Chinese
 */
function getStopNameById(stopId) {
  return stopData.get(stopId).name_tc;
}

function clearRouteStop() {
  divRouteStop.replaceChildren();
}

function clearRoutes() {
  divRoutes.replaceChildren();
}

const divRouteStopETA = document.getElementById("routeStopETA");
function clearRouteStopETA() {
  divRouteStopETA.replaceChildren();
}

function clearAllBusContent() {
  clearRoutes();
  clearRouteStop();
  clearRouteStopETA();
}
