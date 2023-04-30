const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertStateTableToResponseData = (Obj) => {
  return {
    stateId: Obj.state_id,
    stateName: Obj.state_name,
    population: Obj.population,
  };
};

const convertDistrictDataToResponseData = (Obj) => {
  return {
    districtId: Obj.district_id,
    districtName: Obj.district_name,
    stateId: Obj.state_id,
    cases: Obj.cases,
    cured: Obj.cured,
    active: Obj.active,
    deaths: Obj.deaths,
  };
};

const convertTotalStatusToResponseStatus = (Obj) => {
  return {
    totalCases: Obj.total_cases,
    totalCured: Obj.total_cured,
    totalActive: Obj.total_active,
    totalDeaths: Obj.total_deaths,
  };
};

const convertSateNameByResponse = (name) => {
  return {
    stateName: name.state_name,
  };
};

//API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state ;
    `;
  const States = await db.all(getStatesQuery);
  response.send(
    States.map((eachState) => convertStateTableToResponseData(eachState))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT * FROM state WHERE state_id = ${stateId}
  `;
  const state = await db.get(getStateQuery);

  response.send(convertStateTableToResponseData(state));
});

//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictsQuery = `
    INSERT INTO district (district_name,state_id,cases, cured, active, deaths)
    VALUES ("${districtName}", ${stateId}, ${cases}, ${cured} , ${active}, ${deaths})
    `;
  await db.run(postDistrictsQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT * FROM district WHERE district_id = ${districtId}
  `;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDataToResponseData(district));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM district WHERE district_id = ${districtId}
  `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district
    SET district_name = "${districtName}", 
    state_id = "${stateId}", 
    cases = "${cases}", 
    cured = "${cured}" , 
    active = "${active}", 
    deaths = "${deaths}"
    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalStatusQuery = `
    SELECT SUM(cases) AS total_cases,
    SUM(cured) AS total_cured,
    SUM(active) AS total_active,
    SUM(deaths) AS total_deaths FROM district WHERE state_id = ${stateId}
  `;
  const result = await db.get(getTotalStatusQuery);
  response.send(convertTotalStatusToResponseStatus(result));
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameOfDistrictQuery = `
    SELECT state_name FROM state JOIN district ON state.state_id = district.state_id 
    WHERE district_id = ${districtId};
    `;
  const stateName = await db.get(getStateNameOfDistrictQuery);
  response.send(convertSateNameByResponse(stateName));
});
module.exports = app;
